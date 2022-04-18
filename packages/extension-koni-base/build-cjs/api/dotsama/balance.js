"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFreeBalance = getFreeBalance;
exports.subscribeBalance = subscribeBalance;
exports.subscribeEVMBalance = subscribeEVMBalance;

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

/*
import { ethers } from 'ethers';
export const ABI = require('erc20.abi.json');

//import { ABI } from '/home/cielo/Web3Wallet/ArthWallet-Extension/packages/extension-koni-base/src/api/dotsama/erc20.abi.json';
//const ABI = require('erc20.abi.json');  //from './erc20.abi.json';
console.log('Arth TEST 220418!!!!!!');

console.log('Arth ethers.version', ethers.version);

async function sendEvm () {

  let contractAddress = '0x1326BF7D66858662B0897f500C45F55E8D0691ab';
  console.log('Arth Call sendEvm');
  const web3 = new Web3('wss://rpc.astar.network');
  const contract = new web3.eth.Contract(ABI as AbiItem[], contractAddress);

  const gasPrice = await web3.eth.getGasPrice();
  console.log('Arth gasPrice: ', gasPrice);

};

sendEvm();
*/

/*
let private_key = "dcd825c5b20e7f317ad644746b76cb5938234d2c65f29a9a61079571ef488d50";
let ethersProvider = new ethers.providers.InfuraProvider("ropsten");
let wallet = new ethers.Wallet(private_key);
let walletSigner = wallet.connect(ethersProvider);
console.log('Arth ethersProvider.getGasPrice', ethersProvider.getGasPrice());
*/

/*
let wallet = new ethers.Wallet.createRandom();

// ウォレットのアドレスを取得
let address = wallet.address;
console.log("Arth address:", address);

// ウォレットのニーモニックを取得
let mnemonic = wallet.mnemonic;
console.log("Arth mnemonic:", mnemonic);

// ウォレットの秘密鍵を取得
let privateKey = wallet.privateKey;
console.log("Arth privateKey:", privateKey);
*/

/*

//const Tx = require("ethereumjs-tx");
//const ethers = require("ethers");

const sendEths = async ({
  to,
  from,
  fromPrivateKey,
  value,
  gasPrice,
  gasLimit = ethers.utils.hexlify(21000),
}) => {
  const txCount = await provider.getTransactionCount(from);
  // build the transaction
  const tx = new Tx({
    nonce: ethers.utils.hexlify(txCount),
    to,
    value: ethers.utils.parseEther(value).toHexString(),
    gasLimit,
    gasPrice,
  });
  // sign the transaction
  tx.sign(Buffer.from(fromPrivateKey, "hex"));
  // send the transaction
  const { hash } = await provider.sendTransaction(
    "0x" + tx.serialize().toString("hex")
  );
  await provider.waitForTransaction(hash);
};

sendEths();

async function sendEvm () {

let network = 'ropsten';
let provider = ethers.getDefaultProvider(network);
let privateKey = "dcd825c5b20e7f317ad644746b76cb5938234d2c65f29a9a61079571ef488d50";
//let privateKey = "dcd825c5b20e7f317ad644746b76cb5938234d2c65f29a9a61079571ef488d59";
let wallet = new ethers.Wallet(privateKey, provider);
let receiverAddress = "0xAfD2BdD18063455fFC53b4b35Ca09dD9C68c3970";
let amountInEther = '0.01';
let tx = {
  to: receiverAddress,
  // 単位 ether を、単位 wei に変換
  value: ethers.utils.parseEther(amountInEther)
}
console.log('Arth ethers.utils.parseEther: ', ethers.utils.parseEther(amountInEther));

await wallet.sendTransaction(tx)
.then((txObj) => {
    console.log('Arth ethers: ', txObj)
});

};

sendEvm();

*/
//console.log('ethereumChains: '); console.log(ethereumChains);
//console.log('moonbeamBaseChains: '); console.log(moonbeamBaseChains);
async function getBalanceAstarEvm(networkKey) {
  //  let address: string = '0x3908f5b9f831c1e74C0B1312D0f06126a58f4Ac0';
  // let address: string = '0x46ebddef8cd9bb167dc30878d7113b7e168e6f06';
  let wssURL = '';

  if (networkKey === 'astarEvm') {
    wssURL = 'wss://rpc.astar.network';
  } else if (networkKey === 'shidenEvm') {
    wssURL = 'wss://rpc.shiden.astar.network';
  } else if (networkKey === 'shibuyaEvm') {
    wssURL = 'wss://rpc.shibuya.astar.network';
  }

  const ss58Address = 'ZM24FujhBK3XaDsdkpYBf4QQAvRkoMq42aqrUQnxFo3qrAw'; // test address

  const address = (0, _util.u8aToHex)((0, _utilCrypto.addressToEvm)(ss58Address));
  const web3 = new _web.default(new _web.default.providers.WebsocketProvider(wssURL));
  const balance = await web3.eth.getBalance(address);
  web3.eth.accounts.signTransaction;
  console.log('Arth await balance: ' + networkKey + ', SS58:' + ss58Address + ' -> H160:' + address + ', ' + balance); //-----------------------------------

  const gasPrice = await web3.eth.getGasPrice(); //web3.eth.signTransaction

  console.log('Arth gasPrice: ', gasPrice, web3.utils.toHex(gasPrice));
  console.log('Arth estimateGas: ', await web3.eth.estimateGas({
    to: '0x46ebddef8cd9bb167dc30878d7113b7e168e6f06'
  }));
  console.log('Arth getTransaction: ', await web3.eth.getTransaction('0x46e006cc388aae098d403f8f404ba0193468f986a857301856c914a72762a8b3'));
  /*
  await web3.eth.sendTransaction({
    gasPrice: web3.utils.toHex(gasPrice),
    from: '0x741b69c425a140290a638cb1f9b3ca79c29f98c0',
    to: '0x96cbef157358b7c90b0481ba8b3db8f58e014116',
    value: '0x0',
    gas: '1000'
  });
  */

  /*
  const rawTx: TransactionConfig = {
    nonce: await web3.eth.getTransactionCount(fromAddress),
    gasPrice: web3.utils.toHex(gasPrice),
    from: fromAddress,
    to: contractAddress,
    value: '0x0',
    data: contract.methods.transfer(toAddress, value).encodeABI(),
  };
  const estimatedGas = await web3.eth.estimateGas(rawTx);
  */

  /*
  await web3.eth.sendTransaction({
      gasPrice: web3.utils.toHex(gasPrice),
      from: '0x741b69c425a140290a638cb1f9b3ca79c29f98c0',
      to: '0x96cbef157358b7c90b0481ba8b3db8f58e014116',
      value: '0x0',
      gas: '1000'
    });
  */
  //-----------------------------------
  // return balance;
} // @ts-ignore


getBalanceAstarEvm('astarEvm'); // @ts-ignore

getBalanceAstarEvm('shibuyaEvm'); // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const balanceItem = {
    state: _KoniTypes.APIItemState.PENDING,
    free: '0',
    reserved: '0',
    miscFrozen: '0',
    feeFrozen: '0',
    children: undefined
  }; // @ts-ignore

  let unsub;

  if (!['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
    unsub = networkAPI.api.query.system.account.multi(addresses, balances => {
      let [free, reserved, miscFrozen, feeFrozen] = [new _util.BN(0), new _util.BN(0), new _util.BN(0), new _util.BN(0)];
      balances.forEach(balance => {
        var _balance$data, _balance$data$free, _balance$data2, _balance$data2$reserv, _balance$data3, _balance$data3$miscFr, _balance$data4, _balance$data4$feeFro;

        free = free.add(((_balance$data = balance.data) === null || _balance$data === void 0 ? void 0 : (_balance$data$free = _balance$data.free) === null || _balance$data$free === void 0 ? void 0 : _balance$data$free.toBn()) || new _util.BN(0));
        reserved = reserved.add(((_balance$data2 = balance.data) === null || _balance$data2 === void 0 ? void 0 : (_balance$data2$reserv = _balance$data2.reserved) === null || _balance$data2$reserv === void 0 ? void 0 : _balance$data2$reserv.toBn()) || new _util.BN(0));
        miscFrozen = miscFrozen.add(((_balance$data3 = balance.data) === null || _balance$data3 === void 0 ? void 0 : (_balance$data3$miscFr = _balance$data3.miscFrozen) === null || _balance$data3$miscFr === void 0 ? void 0 : _balance$data3$miscFr.toBn()) || new _util.BN(0));
        feeFrozen = feeFrozen.add(((_balance$data4 = balance.data) === null || _balance$data4 === void 0 ? void 0 : (_balance$data4$feeFro = _balance$data4.feeFrozen) === null || _balance$data4$feeFro === void 0 ? void 0 : _balance$data4$feeFro.toBn()) || new _util.BN(0));
      });

      if (networkKey === 'astar') {
        async function getBalanceAstarEvm(networkKey) {
          const wssURL = 'wss://rpc.astar.network';
          const ss58Address = addresses[0]; // 'ZM24FujhBK3XaDsdkpYBf4QQAvRkoMq42aqrUQnxFo3qrAw'; // test address

          const address = (0, _util.u8aToHex)((0, _utilCrypto.addressToEvm)(ss58Address));
          const web3 = new _web.default(new _web.default.providers.WebsocketProvider(wssURL));
          balanceItem.feeFrozen = await web3.eth.getBalance(address);
          console.log('Arth subscribeWithAccountMulti');
        }

        getBalanceAstarEvm('astar');
      } else {
        balanceItem.feeFrozen = feeFrozen.toString();
      }

      balanceItem.state = _KoniTypes.APIItemState.READY;
      balanceItem.free = free.toString();
      balanceItem.reserved = reserved.toString();
      balanceItem.miscFrozen = miscFrozen.toString();
      callback(networkKey, balanceItem);
    });
  }

  let unsub2;

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
  };
}

function subscribeEVMBalance(networkKey, api, addresses, callback) {
  const balanceItem = {
    state: _KoniTypes.APIItemState.PENDING,
    free: '0',
    reserved: '0',
    miscFrozen: '0',
    feeFrozen: '0'
  };

  function getBalance() {
    (0, _balance.getEVMBalance)(networkKey, addresses).then(balances => {
      balanceItem.free = (0, _utils.sumBN)(balances.map(b => new _util.BN(b || '0'))).toString();
      balanceItem.state = _KoniTypes.APIItemState.READY;
      callback(networkKey, balanceItem);
    }).catch(console.error);
  }

  getBalance();
  const interval = setInterval(getBalance, _constants.ASTAR_REFRESH_BALANCE_INTERVAL);
  const unsub2 = subscribeERC20Interval(addresses, networkKey, api, balanceItem, callback);
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

    if (networkKey === 'astarEvm' || networkKey === 'shidenEvm') {
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