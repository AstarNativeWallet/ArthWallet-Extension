"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFreeBalance = getFreeBalance;
exports.subscribeBalance = subscribeBalance;
exports.subscribeEVMBalance = subscribeEVMBalance;

var _ethers = require("ethers");

var _rxjs = require("rxjs");

var _web = _interopRequireDefault(require("web3"));

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _apiHelper = require("@polkadot/extension-koni-base/api/dotsama/api-helper");

var _registry = require("@polkadot/extension-koni-base/api/dotsama/registry");

var _balance = require("@polkadot/extension-koni-base/api/web3/balance");

var _web2 = require("@polkadot/extension-koni-base/api/web3/web3");

var _handlers = require("@polkadot/extension-koni-base/background/handlers");

var _constants = require("@polkadot/extension-koni-base/constants");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _util = require("@polkadot/util");

var _utilCrypto = require("@polkadot/util-crypto");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
console.log('ethereumChains: ');
console.log(_apiHelper.ethereumChains);
console.log('moonbeamBaseChains: ');
console.log(_apiHelper.moonbeamBaseChains); // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        free = (0, _utils.sumBN)(bals.map(bal => new _util.BN(bal || 0))); // console.log('TokenBals', symbol, addresses, bals, free);

        tokenBalanceMap[symbol] = {
          reserved: '0',
          frozen: '0',
          free: free.toString(),
          decimals
        };
      } catch (err) {
        console.log('There is problem when fetching ' + symbol + ' token balance', err);
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
  }).catch(console.error);
  const interval = setInterval(getTokenBalances, _constants.MOONBEAM_REFRESH_BALANCE_INTERVAL);
  return () => {
    clearInterval(interval);
  };
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
    }

    if (tokenList.length > 0) {
      console.log('Get tokens balance of', networkKey, tokenList);
    }

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

function subscribeWithAccountMulti(addresses, networkKey, networkAPI, callback) {
  // @ts-ignore
  let unsub;
  let unsub2;

  const balanceJson = _handlers.state.getBalance();

  console.log('balanceJson networkKey: ', networkKey);
  console.log('balanceJson.details[networkKey]: ', balanceJson.details[networkKey]);
  const balanceItem = {
    state: balanceJson.details[networkKey].state || _KoniTypes.APIItemState.PENDING,
    free: balanceJson.details[networkKey].free || '0',
    reserved: balanceJson.details[networkKey].reserved || '0',
    miscFrozen: balanceJson.details[networkKey].miscFrozen || '0',
    feeFrozen: balanceJson.details[networkKey].feeFrozen || '0',
    children: balanceJson.details[networkKey].children || undefined
  };

  async function getBalanceAstarEvm(networkKey) {
    let wssURL = '';

    switch (networkKey) {
      case 'astarEvm':
        wssURL = 'wss://rpc.astar.network';
        break;

      case 'shidenEvm':
        wssURL = 'wss://rpc.shiden.astar.network';
        break;

      case 'shibuyaEvm':
        wssURL = 'wss://rpc.shibuya.astar.network';
        break;

      case 'astar':
        wssURL = 'wss://rpc.astar.network';
        break;

      default:
        break;
    }

    const ss58Address = addresses[0];
    const address = (0, _util.u8aToHex)((0, _utilCrypto.addressToEvm)(ss58Address));
    const web3 = new _web.default(new _web.default.providers.WebsocketProvider(wssURL));
    const deposit = await web3.eth.getBalance(address);
    const displayEvmDepositAmount = Number(_ethers.ethers.utils.formatEther(deposit.toString()));
    const evmDepositAmount = deposit; // const evmDepositAmount = '100000000000000000';
    // eslint-disable-next-line @typescript-eslint/no-floating-promises

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
  }

  if (!['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
    unsub = networkAPI.api.query.system.account.multi(addresses, async balances => {
      let [free, reserved, miscFrozen, feeFrozen] = [new _util.BN(0), new _util.BN(0), new _util.BN(0), new _util.BN(0)];
      balances.forEach(balance => {
        var _balance$data, _balance$data$free, _balance$data2, _balance$data2$reserv, _balance$data3, _balance$data3$miscFr, _balance$data4, _balance$data4$feeFro;

        free = free.add(((_balance$data = balance.data) === null || _balance$data === void 0 ? void 0 : (_balance$data$free = _balance$data.free) === null || _balance$data$free === void 0 ? void 0 : _balance$data$free.toBn()) || new _util.BN(0));
        reserved = reserved.add(((_balance$data2 = balance.data) === null || _balance$data2 === void 0 ? void 0 : (_balance$data2$reserv = _balance$data2.reserved) === null || _balance$data2$reserv === void 0 ? void 0 : _balance$data2$reserv.toBn()) || new _util.BN(0));
        miscFrozen = miscFrozen.add(((_balance$data3 = balance.data) === null || _balance$data3 === void 0 ? void 0 : (_balance$data3$miscFr = _balance$data3.miscFrozen) === null || _balance$data3$miscFr === void 0 ? void 0 : _balance$data3$miscFr.toBn()) || new _util.BN(0));
        feeFrozen = feeFrozen.add(((_balance$data4 = balance.data) === null || _balance$data4 === void 0 ? void 0 : (_balance$data4$feeFro = _balance$data4.feeFrozen) === null || _balance$data4$feeFro === void 0 ? void 0 : _balance$data4$feeFro.toBn()) || new _util.BN(0));
      }); // console.log('networkKey: ', networkKey);

      switch (networkKey) {
        // case 'astarEVM':
        //   feeFrozen = new BN(await getBalanceAstarEvm('astarEvm'));
        //   break;
        // case 'shidenEVM':
        //   feeFrozen = new BN(await getBalanceAstarEvm('shidenEvm'));
        //   break;
        // case 'shibuyaEVM':
        //   feeFrozen = new BN(await getBalanceAstarEvm('shibuyaEvm'));
        //   break;
        case 'astar':
          feeFrozen = new _util.BN(await getBalanceAstarEvm('astar'));
          break;

        default:
          break;
      }

      balanceItem.state = _KoniTypes.APIItemState.READY;
      balanceItem.free = free.toString();
      balanceItem.reserved = reserved.toString();
      balanceItem.miscFrozen = miscFrozen.toString();
      balanceItem.feeFrozen = feeFrozen.toString(); // eslint-disable-next-line @typescript-eslint/no-floating-promises
      // chrome.storage.local.set({ balanceItem: balanceItem });

      callback(networkKey, balanceItem);
    }); // });
  }

  if (['bifrost', 'acala', 'karura'].includes(networkKey)) {
    unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, balanceItem => {
      callback(networkKey, balanceItem);
    });
  } else if (['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
    unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, balanceItem => {
      callback(networkKey, balanceItem);
    }, true);
  } else if (_apiHelper.moonbeamBaseChains.indexOf(networkKey) > -1) {
    unsub2 = subscribeERC20Interval(addresses, networkKey, networkAPI.api, balanceItem, callback);
  }

  return async () => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    unsub && (await unsub)();
    unsub2 && unsub2();
  }; // });
}

function subscribeEVMBalance(networkKey, api, addresses, callback) {
  const balanceJson = _handlers.state.getBalance();

  console.log('balanceJsonEVM networkKey: ', networkKey);
  console.log('balanceJsonEVM.details[networkKey]: ', balanceJson.details[networkKey]);
  const balanceItemEVM = {
    state: _KoniTypes.APIItemState.PENDING,
    free: balanceJson.details[networkKey].free || '0',
    reserved: balanceJson.details[networkKey].reserved || '0',
    miscFrozen: balanceJson.details[networkKey].miscFrozen || '0',
    feeFrozen: balanceJson.details[networkKey].feeFrozen || '0'
  };

  function getBalance() {
    (0, _balance.getEVMBalance)(networkKey, addresses).then(balances => {
      balanceItemEVM.free = (0, _utils.sumBN)(balances.map(b => new _util.BN(b || '0'))).toString();
      balanceItemEVM.state = _KoniTypes.APIItemState.READY;
      callback(networkKey, balanceItemEVM);
    }).catch(console.error);
  }

  getBalance();
  const interval = setInterval(getBalance, _constants.ASTAR_REFRESH_BALANCE_INTERVAL);
  const unsub2 = subscribeERC20Interval(addresses, networkKey, api, balanceItemEVM, callback); // console.log(balanceItemEVM);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises

  return () => {
    clearInterval(interval);
    unsub2 && unsub2();
  };
}

function subscribeBalance(addresses, dotSamaAPIMap, callback) {
  const [substrateAddresses, evmAddresses] = (0, _utils.categoryAddresses)(addresses);
  return Object.entries(dotSamaAPIMap).map(async _ref7 => {
    let [networkKey, apiProps] = _ref7;
    const networkAPI = await apiProps.isReady;
    const useAddresses = _apiHelper.ethereumChains.indexOf(networkKey) > -1 ? evmAddresses : substrateAddresses;

    if (networkKey === 'astarEvm' || networkKey === 'shidenEvm' || networkKey === 'shibuyaEvm') {
      return subscribeEVMBalance(networkKey, networkAPI.api, useAddresses, callback);
    }

    if (!useAddresses || useAddresses.length === 0 || _constants.IGNORE_GET_SUBSTRATE_FEATURES_LIST.indexOf(networkKey) > -1) {
      // Return zero balance if not have any address
      const zeroBalance = {
        state: _KoniTypes.APIItemState.READY,
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