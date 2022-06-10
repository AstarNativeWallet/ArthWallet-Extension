"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFreeBalance = getFreeBalance;
exports.subscribeBalance = subscribeBalance;
exports.subscribeEVMBalance = subscribeEVMBalance;

require("@polkadot/api-augment");

var _ethers = require("ethers");

var _rxjs = require("rxjs");

var _web = _interopRequireDefault(require("web3"));

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _apiHelper = require("@polkadot/extension-koni-base/api/dotsama/api-helper");

var _registry = require("@polkadot/extension-koni-base/api/dotsama/registry");

var _balance = require("@polkadot/extension-koni-base/api/web3/balance");

var _web2 = require("@polkadot/extension-koni-base/api/web3/web3");

var _handlers = require("@polkadot/extension-koni-base/background/handlers");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _util = require("@polkadot/util");

var _utilCrypto = require("@polkadot/util-crypto");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line header/header
// import { useState } from 'react';
// import { MOONBEAM_REFRESH_BALANCE_INTERVAL } from '@polkadot/extension-koni-base/constants';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
function subscribeWithDerive(addresses, networkKey, networkAPI, callback) {
  const freeMap = {};
  const reservedMap = {};
  const miscFrozenMap = {};
  const feeFrozenMap = {};
  const unsubProms = addresses.map(address => {
    var _networkAPI$api$deriv;

    return (_networkAPI$api$deriv = networkAPI.api.derive.balances) === null || _networkAPI$api$deriv === void 0 ? void 0 : _networkAPI$api$deriv.all(address, balance => {
      var _balance$freeBalance, _balance$reservedBala, _balance$frozenMisc, _balance$frozenFee;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      freeMap[address] = ((_balance$freeBalance = balance.freeBalance) === null || _balance$freeBalance === void 0 ? void 0 : _balance$freeBalance.toBn()) || new _util.BN(0);
      reservedMap[address] = ((_balance$reservedBala = balance.reservedBalance) === null || _balance$reservedBala === void 0 ? void 0 : _balance$reservedBala.toBn()) || new _util.BN(0);
      miscFrozenMap[address] = ((_balance$frozenMisc = balance.frozenMisc) === null || _balance$frozenMisc === void 0 ? void 0 : _balance$frozenMisc.toBn()) || new _util.BN(0);
      feeFrozenMap[address] = ((_balance$frozenFee = balance.frozenFee) === null || _balance$frozenFee === void 0 ? void 0 : _balance$frozenFee.toBn()) || new _util.BN(0);
      const balanceItem = {
        state: _KoniTypes.APIItemState.READY,
        free: (0, _utils.sumBN)(Object.values(freeMap)).toString(),
        reserved: (0, _utils.sumBN)(Object.values(reservedMap)).toString(),
        miscFrozen: (0, _utils.sumBN)(Object.values(miscFrozenMap)).toString(),
        feeFrozen: (0, _utils.sumBN)(Object.values(feeFrozenMap)).toString()
      };
      callback(networkKey, balanceItem);
    });
  });
  return async () => {
    const unsubs = await Promise.all(unsubProms);
    unsubs.forEach(unsub => {
      unsub && unsub();
    });
  };
}

function subscribeERC20Interval(addresses, networkKey, api, originBalanceItem, callback) {
  let tokenList = {};
  const ERC20ContractMap = {};
  const tokenBalanceMap = {};

  const getTokenBalances = () => {
    Object.values(tokenList).map(async _ref => {
      let {
        decimals,
        symbol
      } = _ref;
      let free = new _util.BN(0);

      try {
        const contract = ERC20ContractMap[symbol];
        const bals = await Promise.all(addresses.map(address => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          return contract.methods.balanceOf(address).call();
        }));
        free = (0, _utils.sumBN)(bals.map(bal => new _util.BN(bal || 0)));
        tokenBalanceMap[symbol] = {
          reserved: '0',
          frozen: '0',
          free: free.toString(),
          decimals
        };
      } catch (err) {// console.log('There is problem when fetching ' + symbol + ' token balance', err);
      }
    });
    originBalanceItem.children = tokenBalanceMap;
    callback && callback(networkKey, originBalanceItem);
  };

  (0, _registry.getRegistry)(networkKey, api).then(_ref2 => {
    let {
      tokenMap
    } = _ref2;
    tokenList = Object.values(tokenMap).filter(_ref3 => {
      let {
        erc20Address
      } = _ref3;
      return !!erc20Address;
    });
    tokenList.forEach(_ref4 => {
      let {
        erc20Address,
        symbol
      } = _ref4;

      if (erc20Address) {
        ERC20ContractMap[symbol] = (0, _web2.getERC20Contract)(networkKey, erc20Address);
      }
    });
    getTokenBalances();
  }).catch(console.error); // const interval = setInterval(getTokenBalances, MOONBEAM_REFRESH_BALANCE_INTERVAL);
  // const rusult = getRegistry();
  // return () => {
  //   clearInterval(interval);
  // };

  return getTokenBalances;
}

function subscribeTokensBalance(addresses, networkKey, api, originBalanceItem, callback, includeMainToken) {
  let forceStop = false;

  let unsubAll = () => {
    forceStop = true;
  };

  originBalanceItem.children = originBalanceItem.children || {};
  (0, _registry.getRegistry)(networkKey, api).then(_ref5 => {
    let {
      tokenMap
    } = _ref5;

    if (forceStop) {
      return;
    }

    let tokenList = Object.values(tokenMap);

    if (!includeMainToken) {
      tokenList = tokenList.filter(t => !t.isMainToken);
    } // if (tokenList.length > 0) {
    //   console.log('Get tokens balance of', networkKey, tokenList);
    // }


    const unsubList = tokenList.map(_ref6 => {
      let {
        decimals,
        specialOption,
        symbol
      } = _ref6;
      const observable = new _rxjs.Observable(subscriber => {
        // Get Token Balance
        // @ts-ignore
        const apiCall = api.query.tokens.accounts.multi(addresses.map(address => [address, options]), balances => {
          const tokenBalance = {
            reserved: (0, _utils.sumBN)(balances.map(b => b.reserved || new _util.BN(0))).toString(),
            frozen: (0, _utils.sumBN)(balances.map(b => b.frozen || new _util.BN(0))).toString(),
            free: (0, _utils.sumBN)(balances.map(b => b.free || new _util.BN(0))).toString(),
            decimals
          };
          subscriber.next(tokenBalance);
        });
      });
      const options = specialOption || {
        Token: symbol
      };
      return observable.subscribe({
        next: childBalance => {
          if (includeMainToken && tokenMap[symbol].isMainToken) {
            originBalanceItem.state = _KoniTypes.APIItemState.READY;
            originBalanceItem.free = childBalance.free;
            originBalanceItem.reserved = childBalance.reserved;
            originBalanceItem.feeFrozen = childBalance.frozen;
          } else {
            // @ts-ignore
            originBalanceItem.children[symbol] = childBalance;
          }

          callback(originBalanceItem);
        }
      });
    });

    unsubAll = () => {
      unsubList.forEach(unsub => {
        unsub && unsub.unsubscribe();
      });
    };
  }).catch(console.error);
  return unsubAll;
}

const addressBalances = {};

function subscribeWithAccountAstar(address, networkKey, networkAPI) {
  // console.log('Arth subscribeWithAccountAstar addresses: ', address);
  if (networkKey === 'astar' || networkKey === 'shibuya' || networkKey === 'astarTest') {
    async function getNativeBalance() {
      // let balance = new BN(previousFree).toString();
      const {
        data: {
          free: previousFree
        }
      } = await networkAPI.api.query.system.account(address);
      const balance = new _util.BN(previousFree).toString();

      const astarBalance = _web.default.utils.fromWei(balance, 'ether').substring(0, 5);

      addressBalances[address] = astarBalance; // console.log('Arth subscribeWithAccountAstar astarBalance: ', address, ' / ', astarBalance);

      chrome.storage.local.set({
        addressBalances
      }, function () {}); // console.log('Arth subscribeWithAccountAstar addressBalances: ', addressBalances);
    }

    getNativeBalance().catch(console.error).finally(() => process.exit());
  } else if (networkKey === 'astarEvm') {
    async function getBalanceAstarEvm(networkKey, address) {
      let wssURL = '';
      wssURL = 'wss://astar.api.onfinality.io/public-ws';
      let astarBalance = '0';
      const web3 = new _web.default(new _web.default.providers.WebsocketProvider(wssURL));
      const balance = await web3.eth.getBalance(address);
      astarBalance = web3.utils.fromWei(balance, 'ether').substring(0, 5);
      addressBalances[address] = astarBalance; // console.log('Arth subscribeWithAccountAstar: ' + networkKey + ', ' + address + ', ' + astarBalance);

      chrome.storage.local.set({
        addressBalances
      }, function () {}); // console.log('Arth subscribeWithAccountAstar addressBalances: ', addressBalances);
    }

    getBalanceAstarEvm('astarEvm', address);
  } else if (networkKey === 'shibuyaEvm') {
    async function getBalanceAstarEvm(networkKey, address) {
      let wssURL = '';
      wssURL = 'wss://rpc.shibuya.astar.network';
      let astarBalance = '0';
      const web3 = new _web.default(new _web.default.providers.WebsocketProvider(wssURL));
      const balance = await web3.eth.getBalance(address);
      astarBalance = web3.utils.fromWei(balance, 'ether').substring(0, 5);
      addressBalances[address] = astarBalance; // console.log('Arth subscribeWithAccountAstar: ' + networkKey + ', ' + address + ', ' + astarBalance);

      chrome.storage.local.set({
        addressBalances
      }, function () {}); // console.log('Arth subscribeWithAccountAstar addressBalances: ', addressBalances);
    }

    getBalanceAstarEvm('shibuyaEvm', address);
  } else if (networkKey === 'astarTestEvm') {
    async function getBalanceAstarEvm(networkKey, address) {
      let wssURL = '';
      wssURL = 'wss://astar-collator.cielo.works:11443';
      let astarBalance = '0';
      const web3 = new _web.default(new _web.default.providers.WebsocketProvider(wssURL));
      const balance = await web3.eth.getBalance(address);
      astarBalance = web3.utils.fromWei(balance, 'ether').substring(0, 5);
      addressBalances[address] = astarBalance; // console.log('Arth subscribeWithAccountAstar: ' + networkKey + ', ' + address + ', ' + astarBalance);

      chrome.storage.local.set({
        addressBalances
      }, function () {}); // console.log('Arth subscribeWithAccountAstar addressBalances: ', addressBalances);
    }

    getBalanceAstarEvm('astarTestEvm', address);
  }
}

async function subscribeWithAccountMulti(addresses, networkKey, networkAPI, callback) {
  const balanceJson = _handlers.state.getBalance(); // eslint-disable-next-line react-hooks/rules-of-hooks
  // console.log('WatchTest useSelector is: ', useSelector((state: RootState) => state.balance));


  const balanceItem = {
    state: _handlers.state.getBalance().details[networkKey].state || _KoniTypes.APIItemState.PENDING,
    free: _handlers.state.getBalance().details[networkKey].free || '0',
    reserved: _handlers.state.getBalance().details[networkKey].reserved || '0',
    miscFrozen: _handlers.state.getBalance().details[networkKey].miscFrozen || '0',
    feeFrozen: _handlers.state.getBalance().details[networkKey].feeFrozen || '0',
    children: _handlers.state.getBalance().details[networkKey].children || undefined
  };
  let unsub;
  let unsub2;

  async function getBalanceAstar(networkKey) {
    let wssURL = '';

    switch (networkKey) {
      case 'astar':
        wssURL = 'wss://astar.api.onfinality.io/public-ws';
        break;

      case 'shiden':
        wssURL = 'wss://shiden.api.onfinality.io/public-ws';
        break;

      case 'shibuya':
        wssURL = 'wss://rpc.shibuya.astar.network';
        break;

      case 'astarTest':
        wssURL = 'wss://astar-collator.cielo.works:11443';
        break;

      default:
        break;
    }

    const ss58Address = addresses[0];
    const address = (0, _util.u8aToHex)((0, _utilCrypto.addressToEvm)(ss58Address));
    const web3 = new _web.default(new _web.default.providers.WebsocketProvider(wssURL));
    const deposit = await web3.eth.getBalance(address);
    const displayEvmDepositAmount = Number(_ethers.ethers.utils.formatEther(deposit.toString()));
    const evmDepositAmount = deposit; // eslint-disable-next-line @typescript-eslint/no-floating-promises

    chrome.storage.local.set({
      displayEvmDepositAmount: displayEvmDepositAmount
    }); // eslint-disable-next-line @typescript-eslint/no-floating-promises

    chrome.storage.local.set({
      evmDepositAmount: evmDepositAmount
    });

    if (parseFloat(deposit) > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      chrome.storage.local.set({
        isEvmDeposit: true
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      chrome.storage.local.set({
        isEvmDeposit: false
      });
    }

    return deposit;
  } // if (!['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {


  if (networkKey) {
    if (['bifrost', 'acala', 'karura'].includes(networkKey)) {
      unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, balanceItem => {
        callback(networkKey, balanceItem);
      });
    } else if (['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
      unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, balanceItem => {
        callback(networkKey, balanceItem);
      }, true);
    } else if (['astarEvm', 'shidenEvm', 'shibuyaEvm', 'astarTestEvm'].includes(networkKey)) {
      const {
        feeFrozen,
        free,
        miscFrozen,
        reserved,
        state: balanceItemState
      } = await subscribeEVMBalance(balanceJson, networkKey, networkAPI.api, addresses);

      for (const address of addresses) {
        subscribeWithAccountAstar(address, networkKey, networkAPI);
      }

      balanceItem.state = balanceItemState;
      balanceItem.free = free;
      balanceItem.reserved = reserved;
      balanceItem.miscFrozen = miscFrozen;
      balanceItem.feeFrozen = feeFrozen; // console.log('WatchTest unsub2 astarBalanceItem is: ', balanceItem);
      // console.log('WatchTest balanceItem.free !== "0" is: ', balanceItem.free !== '0');

      if (balanceItem.free !== '0') {
        // state.setBalanceItem(networkKey, balanceItem);
        unsub2 = subscribeERC20Interval(addresses, networkKey, networkAPI.api, balanceItem, callback);
        return;
      } // console.log('WatchTest balanceItem.free === "0"');
      // console.log('WatchTest after return astarBalanceItem is: ', balanceItem);


      unsub2 = () => {// console.log('WatchTest unsub2 balanceItem.free === "0"');
      };
    } else if (_apiHelper.moonbeamBaseChains.indexOf(networkKey) > -1) {
      unsub2 = subscribeERC20Interval(addresses, networkKey, networkAPI.api, balanceItem, callback);
    } else {
      unsub = networkAPI.api.query.system.account.multi(addresses, async balances => {
        let [free, reserved, miscFrozen, feeFrozen] = [new _util.BN(0), new _util.BN(0), new _util.BN(0), new _util.BN(0)];
        balances.forEach(balance => {
          var _balance$data, _balance$data$free, _balance$data2, _balance$data2$reserv, _balance$data3, _balance$data3$miscFr, _balance$data4, _balance$data4$feeFro;

          free = free.add(((_balance$data = balance.data) === null || _balance$data === void 0 ? void 0 : (_balance$data$free = _balance$data.free) === null || _balance$data$free === void 0 ? void 0 : _balance$data$free.toBn()) || new _util.BN(0));
          reserved = reserved.add(((_balance$data2 = balance.data) === null || _balance$data2 === void 0 ? void 0 : (_balance$data2$reserv = _balance$data2.reserved) === null || _balance$data2$reserv === void 0 ? void 0 : _balance$data2$reserv.toBn()) || new _util.BN(0));
          miscFrozen = miscFrozen.add(((_balance$data3 = balance.data) === null || _balance$data3 === void 0 ? void 0 : (_balance$data3$miscFr = _balance$data3.miscFrozen) === null || _balance$data3$miscFr === void 0 ? void 0 : _balance$data3$miscFr.toBn()) || new _util.BN(0));
          feeFrozen = feeFrozen.add(((_balance$data4 = balance.data) === null || _balance$data4 === void 0 ? void 0 : (_balance$data4$feeFro = _balance$data4.feeFrozen) === null || _balance$data4$feeFro === void 0 ? void 0 : _balance$data4$feeFro.toBn()) || new _util.BN(0));
        });

        for (const address of addresses) {
          subscribeWithAccountAstar(address, networkKey, networkAPI);
        }

        switch (networkKey) {
          case 'astar':
            feeFrozen = new _util.BN(await getBalanceAstar('astar'));
            break;

          case 'shiden':
            feeFrozen = new _util.BN(await getBalanceAstar('shiden'));
            break;

          case 'shibuya':
            feeFrozen = new _util.BN(await getBalanceAstar('shibuya'));
            break;

          case 'astarTest':
            feeFrozen = new _util.BN(await getBalanceAstar('astarTest'));
            break;

          default:
        }

        balanceItem.state = _KoniTypes.APIItemState.READY;
        balanceItem.free = free.toString();
        balanceItem.reserved = reserved.toString();
        balanceItem.miscFrozen = miscFrozen.toString();
        balanceItem.feeFrozen = feeFrozen.toString();
        balanceItem.children = (balanceItem === null || balanceItem === void 0 ? void 0 : balanceItem.children) || undefined;
        callback(networkKey, balanceItem);
      });
    }
  }

  return async () => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    unsub && (await unsub)();
    unsub2 && unsub2();
  }; // });
}

async function subscribeEVMBalance(balanceJson, networkKey, api, addresses) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  // console.log(`balanceJson.details[${networkKey}]: `, balanceJson.details[networkKey]);
  const balanceItem = {
    state: balanceJson.details[networkKey].state || _KoniTypes.APIItemState.PENDING,
    free: balanceJson.details[networkKey].free || '0',
    reserved: balanceJson.details[networkKey].reserved || '0',
    miscFrozen: balanceJson.details[networkKey].miscFrozen || '0',
    feeFrozen: balanceJson.details[networkKey].feeFrozen || '0'
  };
  await (0, _balance.getEVMBalance)(networkKey, addresses).then(balances => {
    balanceItem.free = (0, _utils.sumBN)(balances.map(b => new _util.BN(b || '0'))).toString();
    balanceItem.state = _KoniTypes.APIItemState.READY;
  }).catch(console.error);
  return balanceItem;
}

function subscribeBalance(addresses, dotSamaAPIMap, callback) {
  const [substrateAddresses, evmAddresses] = (0, _utils.categoryAddresses)(addresses);
  return Object.entries(dotSamaAPIMap).map(async _ref7 => {
    let [networkKey, apiProps] = _ref7;
    const networkAPI = await apiProps.isReady;
    const useAddresses = _apiHelper.ethereumChains.indexOf(networkKey) > -1 ? evmAddresses : substrateAddresses; // console.log('WatchTest useAddresses: ', useAddresses);

    if (!useAddresses || useAddresses.length === 0) {
      // Return zero balance if not have any address
      const zeroBalance = {
        state: _KoniTypes.APIItemState.PENDING,
        free: '0',
        reserved: '0',
        miscFrozen: '0',
        feeFrozen: '0'
      };
      callback(networkKey, zeroBalance);
      return undefined;
    } // eslint-disable-next-line @typescript-eslint/no-misused-promises


    return subscribeWithAccountMulti(useAddresses, networkKey, networkAPI, callback);
  });
}

async function getFreeBalance(networkKey, address, token) {
  const apiProps = await _handlers.dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;

  if (token) {
    const tokenInfo = await (0, _registry.getTokenInfo)(networkKey, api, token);

    if (!(tokenInfo !== null && tokenInfo !== void 0 && tokenInfo.isMainToken)) {
      if (_apiHelper.moonbeamBaseChains.indexOf(networkKey) > -1 && tokenInfo !== null && tokenInfo !== void 0 && tokenInfo.erc20Address) {
        const contract = (0, _web2.getERC20Contract)(networkKey, tokenInfo.erc20Address); // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access

        const free = await contract.methods.balanceOf(address).call(); // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return

        return (free === null || free === void 0 ? void 0 : free.toString()) || '0';
      } else {
        var _balance$free;

        // @ts-ignore
        const balance = await api.query.tokens.accounts(address, (tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.specialOption) || {
          Token: token
        });
        return ((_balance$free = balance.free) === null || _balance$free === void 0 ? void 0 : _balance$free.toString()) || '0';
      }
    }
  }

  if (networkKey === 'kintsugi') {
    var _api$derive$balances, _balance$freeBalance2;

    const balance = await ((_api$derive$balances = api.derive.balances) === null || _api$derive$balances === void 0 ? void 0 : _api$derive$balances.all(address));
    return ((_balance$freeBalance2 = balance.freeBalance) === null || _balance$freeBalance2 === void 0 ? void 0 : _balance$freeBalance2.toString()) || '0';
  } else {
    var _balance$data5, _balance$data5$free;

    const balance = await api.query.system.account(address);
    return ((_balance$data5 = balance.data) === null || _balance$data5 === void 0 ? void 0 : (_balance$data5$free = _balance$data5.free) === null || _balance$data5$free === void 0 ? void 0 : _balance$data5$free.toString()) || '0';
  }
}