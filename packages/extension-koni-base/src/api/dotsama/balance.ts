// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Observable } from 'rxjs';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api/types';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { APIItemState, ApiProps, BalanceChildItem, BalanceItem, TokenBalanceRaw, TokenInfo } from '@polkadot/extension-base/background/KoniTypes';
import { ethereumChains, moonbeamBaseChains } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { getRegistry, getTokenInfo } from '@polkadot/extension-koni-base/api/dotsama/registry';
import { getEVMBalance } from '@polkadot/extension-koni-base/api/web3/balance';
import { getERC20Contract } from '@polkadot/extension-koni-base/api/web3/web3';
import { dotSamaAPIMap } from '@polkadot/extension-koni-base/background/handlers';
import { ASTAR_REFRESH_BALANCE_INTERVAL, IGNORE_GET_SUBSTRATE_FEATURES_LIST, MOONBEAM_REFRESH_BALANCE_INTERVAL } from '@polkadot/extension-koni-base/constants';
import { categoryAddresses, sumBN } from '@polkadot/extension-koni-base/utils/utils';
import { AccountInfo } from '@polkadot/types/interfaces';
import { BN, u8aToHex } from '@polkadot/util';
import { addressToEvm } from '@polkadot/util-crypto';

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

async function getBalanceAstarEvm (networkKey: string) {
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
  const address = u8aToHex(addressToEvm(ss58Address));
  const web3 = new Web3(new Web3.providers.WebsocketProvider(wssURL));
  const balance = await web3.eth.getBalance(address);

  web3.eth.accounts.signTransaction

  console.log('Arth await balance: ' + networkKey + ', SS58:' + ss58Address + ' -> H160:' + address + ', ' + balance);

  //-----------------------------------
//  const gasPrice = await web3.eth.getGasPrice();
  //web3.eth.signTransaction
//  console.log('Arth gasPrice: ', gasPrice, web3.utils.toHex(gasPrice));
//  console.log('Arth estimateGas: ', await web3.eth.estimateGas({
//    to: '0x46ebddef8cd9bb167dc30878d7113b7e168e6f06'
//  }));

//console.log('Arth getTransaction: ', await web3.eth.getTransaction('0x46e006cc388aae098d403f8f404ba0193468f986a857301856c914a72762a8b3'));

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
}

// @ts-ignore
getBalanceAstarEvm('astarEvm');
// @ts-ignore
getBalanceAstarEvm('shibuyaEvm');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
function subscribeWithDerive (addresses: string[], networkKey: string, networkAPI: ApiProps, callback: (networkKey: string, rs: BalanceItem) => void) {
  const freeMap: Record<string, BN> = {};
  const reservedMap: Record<string, BN> = {};
  const miscFrozenMap: Record<string, BN> = {};
  const feeFrozenMap: Record<string, BN> = {};

  const unsubProms = addresses.map((address) => {
    return networkAPI.api.derive.balances?.all(address, (balance: DeriveBalancesAll) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      freeMap[address] = balance.freeBalance?.toBn() || new BN(0);
      reservedMap[address] = balance.reservedBalance?.toBn() || new BN(0);
      miscFrozenMap[address] = balance.frozenMisc?.toBn() || new BN(0);
      feeFrozenMap[address] = balance.frozenFee?.toBn() || new BN(0);

      const balanceItem = {
        state: APIItemState.READY,
        free: sumBN(Object.values(freeMap)).toString(),
        reserved: sumBN(Object.values(reservedMap)).toString(),
        miscFrozen: sumBN(Object.values(miscFrozenMap)).toString(),
        feeFrozen: sumBN(Object.values(feeFrozenMap)).toString()
      } as BalanceItem;

      callback(networkKey, balanceItem);
    });
  });

  return async () => {
    const unsubs = await Promise.all(unsubProms);

    unsubs.forEach((unsub) => {
      unsub && unsub();
    });
  };
}

function subscribeERC20Interval (addresses: string[], networkKey: string, api: ApiPromise, originBalanceItem: BalanceItem, callback: (networkKey: string, rs: BalanceItem) => void): () => void {
  let tokenList = {} as TokenInfo[];
  const ERC20ContractMap = {} as Record<string, Contract>;
  const tokenBalanceMap = {} as Record<string, BalanceChildItem>;

  const getTokenBalances = () => {
    Object.values(tokenList).map(async ({ decimals, symbol }) => {
      let free = new BN(0);

      try {
        const contract = ERC20ContractMap[symbol];
        const bals = await Promise.all(addresses.map((address): Promise<string> => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          return contract.methods.balanceOf(address).call();
        }));

        free = sumBN(bals.map((bal) => new BN(bal || 0)));
        // console.log('TokenBals', symbol, addresses, bals, free);

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

  getRegistry(networkKey, api).then(({ tokenMap }) => {
    tokenList = Object.values(tokenMap).filter(({ erc20Address }) => (!!erc20Address));
    tokenList.forEach(({ erc20Address, symbol }) => {
      if (erc20Address) {
        ERC20ContractMap[symbol] = getERC20Contract(networkKey, erc20Address);
      }
    });
    getTokenBalances();
  }).catch(console.error);

  const interval = setInterval(getTokenBalances, MOONBEAM_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

function subscribeTokensBalance (addresses: string[], networkKey: string, api: ApiPromise, originBalanceItem: BalanceItem, callback: (rs: BalanceItem) => void, includeMainToken?: boolean) {
  let forceStop = false;

  let unsubAll = () => {
    forceStop = true;
  };

  originBalanceItem.children = originBalanceItem.children || {};

  getRegistry(networkKey, api)
    .then(({ tokenMap }) => {
      if (forceStop) {
        return;
      }

      let tokenList = Object.values(tokenMap);

      if (!includeMainToken) {
        tokenList = tokenList.filter((t) => !t.isMainToken);
      }

      if (tokenList.length > 0) {
        console.log('Get tokens balance of', networkKey, tokenList);
      }

      const unsubList = tokenList.map(({ decimals, specialOption, symbol }) => {
        const observable = new Observable<BalanceChildItem>((subscriber) => {
          // Get Token Balance
          // @ts-ignore
          const apiCall = api.query.tokens.accounts.multi(addresses.map((address) => [address, options]), (balances: TokenBalanceRaw[]) => {
            const tokenBalance = {
              reserved: sumBN(balances.map((b) => (b.reserved || new BN(0)))).toString(),
              frozen: sumBN(balances.map((b) => (b.frozen || new BN(0)))).toString(),
              free: sumBN(balances.map((b) => (b.free || new BN(0)))).toString(),
              decimals
            };

            subscriber.next(tokenBalance);
          });
        });
        const options = specialOption || { Token: symbol };

        return observable.subscribe({
          next: (childBalance) => {
            if (includeMainToken && tokenMap[symbol].isMainToken) {
              originBalanceItem.state = APIItemState.READY;
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
        unsubList.forEach((unsub) => {
          unsub && unsub.unsubscribe();
        });
      };
    })
    .catch(console.error);

  return unsubAll;
}

function subscribeWithAccountMulti (addresses: string[], networkKey: string, networkAPI: ApiProps, callback: (networkKey: string, rs: BalanceItem) => void) {
  const balanceItem: BalanceItem = {
    state: APIItemState.PENDING,
    free: '0',
    reserved: '0',
    miscFrozen: '0',
    feeFrozen: '0',
    children: undefined
  };

  // @ts-ignore
  let unsub: UnsubscribePromise;

  if (!['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
    unsub = networkAPI.api.query.system.account.multi(addresses, (balances: AccountInfo[]) => {
      let [free, reserved, miscFrozen, feeFrozen] = [new BN(0), new BN(0), new BN(0), new BN(0)];

      balances.forEach((balance: AccountInfo) => {
        free = free.add(balance.data?.free?.toBn() || new BN(0));
        reserved = reserved.add(balance.data?.reserved?.toBn() || new BN(0));
        miscFrozen = miscFrozen.add(balance.data?.miscFrozen?.toBn() || new BN(0));
        feeFrozen = feeFrozen.add(balance.data?.feeFrozen?.toBn() || new BN(0));
      });

      if (networkKey === 'astar') {

        async function getBalanceAstarEvm (networkKey: string) {
          const wssURL = 'wss://rpc.astar.network';
          const ss58Address = addresses[0]; // 'ZM24FujhBK3XaDsdkpYBf4QQAvRkoMq42aqrUQnxFo3qrAw'; // test address
          const address = u8aToHex(addressToEvm(ss58Address));
          const web3 = new Web3(new Web3.providers.WebsocketProvider(wssURL));

          balanceItem.feeFrozen = await web3.eth.getBalance(address);
          console.log('Arth subscribeWithAccountMulti');
        }

        getBalanceAstarEvm('astar');

      } else {
        balanceItem.feeFrozen = feeFrozen.toString();
      }

      balanceItem.state = APIItemState.READY;
      balanceItem.free = free.toString();
      balanceItem.reserved = reserved.toString();
      balanceItem.miscFrozen = miscFrozen.toString();

      callback(networkKey, balanceItem);
    });
  }

  let unsub2: () => void;

  if (['bifrost', 'acala', 'karura'].includes(networkKey)) {
    unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, (balanceItem) => {
      callback(networkKey, balanceItem);
    });
  } else if (['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
    unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, (balanceItem) => {
      callback(networkKey, balanceItem);
    }, true);
  } else if (moonbeamBaseChains.indexOf(networkKey) > -1) {
    unsub2 = subscribeERC20Interval(addresses, networkKey, networkAPI.api, balanceItem, callback);
  }

  return async () => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    unsub && (await unsub)();
    unsub2 && unsub2();
  };
}

export function subscribeEVMBalance (networkKey: string, api: ApiPromise, addresses: string[], callback: (networkKey: string, rs: BalanceItem) => void) {
  const balanceItem = {
    state: APIItemState.PENDING,
    free: '0',
    reserved: '0',
    miscFrozen: '0',
    feeFrozen: '0'
  } as BalanceItem;

  function getBalance () {
    getEVMBalance(networkKey, addresses)
      .then((balances) => {
        balanceItem.free = sumBN(balances.map((b) => (new BN(b || '0')))).toString();
        balanceItem.state = APIItemState.READY;
        callback(networkKey, balanceItem);
      })
      .catch(console.error);
  }

  getBalance();
  const interval = setInterval(getBalance, ASTAR_REFRESH_BALANCE_INTERVAL);
  const unsub2 = subscribeERC20Interval(addresses, networkKey, api, balanceItem, callback);

  return () => {
    clearInterval(interval);
    unsub2 && unsub2();
  };
}

export function subscribeBalance (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: BalanceItem) => void) {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  return Object.entries(dotSamaAPIMap).map(async ([networkKey, apiProps]) => {
    const networkAPI = await apiProps.isReady;
    const useAddresses = ethereumChains.indexOf(networkKey) > -1 ? evmAddresses : substrateAddresses;

    if (networkKey === 'astarEvm' || networkKey === 'shidenEvm') {
      return subscribeEVMBalance(networkKey, networkAPI.api, useAddresses, callback);
    }

    if (!useAddresses || useAddresses.length === 0 || IGNORE_GET_SUBSTRATE_FEATURES_LIST.indexOf(networkKey) > -1) {
      // Return zero balance if not have any address
      const zeroBalance = {
        state: APIItemState.READY,
        free: '0',
        reserved: '0',
        miscFrozen: '0',
        feeFrozen: '0'
      } as BalanceItem;

      callback(networkKey, zeroBalance);

      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return subscribeWithAccountMulti(useAddresses, networkKey, networkAPI, callback);
  });
}

export async function getFreeBalance (networkKey: string, address: string, token?: string): Promise<string> {
  const apiProps = await dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;

  if (token) {
    const tokenInfo = await getTokenInfo(networkKey, api, token);

    if (!(tokenInfo?.isMainToken)) {
      if (moonbeamBaseChains.indexOf(networkKey) > -1 && tokenInfo?.erc20Address) {
        const contract = getERC20Contract(networkKey, tokenInfo.erc20Address);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const free = await contract.methods.balanceOf(address).call();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
        return free?.toString() || '0';
      } else {
        // @ts-ignore
        const balance = await api.query.tokens.accounts(address, tokenInfo?.specialOption || { Token: token }) as TokenBalanceRaw;

        return balance.free?.toString() || '0';
      }
    }
  }

  if (networkKey === 'kintsugi') {
    const balance = await api.derive.balances?.all(address);

    return balance.freeBalance?.toString() || '0';
  } else {
    const balance = await api.query.system.account(address) as AccountInfo;

    return balance.data?.free?.toString() || '0';
  }
}
