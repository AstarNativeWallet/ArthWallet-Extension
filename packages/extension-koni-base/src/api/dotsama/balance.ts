// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line header/header
import { ethers } from 'ethers';
// import { useState } from 'react';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api/types';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { APIItemState, ApiProps, BalanceChildItem, BalanceItem, BalanceJson, TokenBalanceRaw, TokenInfo } from '@polkadot/extension-base/background/KoniTypes';
import { ethereumChains, moonbeamBaseChains } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { getRegistry, getTokenInfo } from '@polkadot/extension-koni-base/api/dotsama/registry';
import { getEVMBalance } from '@polkadot/extension-koni-base/api/web3/balance';
import { getERC20Contract } from '@polkadot/extension-koni-base/api/web3/web3';
import { dotSamaAPIMap, state } from '@polkadot/extension-koni-base/background/handlers';
// import { MOONBEAM_REFRESH_BALANCE_INTERVAL } from '@polkadot/extension-koni-base/constants';
import { categoryAddresses, sumBN } from '@polkadot/extension-koni-base/utils/utils';
// import { RootState } from '@polkadot/extension-koni-ui/stores';
import { AccountInfo } from '@polkadot/types/interfaces';
import { BN, u8aToHex } from '@polkadot/util';
import { addressToEvm } from '@polkadot/util-crypto';

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

        tokenBalanceMap[symbol] = {
          reserved: '0',
          frozen: '0',
          free: free.toString(),
          decimals
        };
      } catch (err) {
        // console.log('There is problem when fetching ' + symbol + ' token balance', err);
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

  // const interval = setInterval(getTokenBalances, MOONBEAM_REFRESH_BALANCE_INTERVAL);
  // const rusult = getRegistry();

  // return () => {
  //   clearInterval(interval);
  // };
  return (getTokenBalances);
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

      // if (tokenList.length > 0) {
      //   console.log('Get tokens balance of', networkKey, tokenList);
      // }

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

async function subscribeWithAccountMulti (addresses: string[], networkKey: string, networkAPI: ApiProps, callback: (networkKey: string, rs: BalanceItem) => void) {
  const balanceJson = state.getBalance();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  // console.log('WatchTest useSelector is: ', useSelector((state: RootState) => state.balance));

  const balanceItem: BalanceItem = {
    state: state.getBalance().details[networkKey].state || APIItemState.PENDING,
    free: state.getBalance().details[networkKey].free || '0',
    reserved: state.getBalance().details[networkKey].reserved || '0',
    miscFrozen: state.getBalance().details[networkKey].miscFrozen || '0',
    feeFrozen: state.getBalance().details[networkKey].feeFrozen || '0',
    children: state.getBalance().details[networkKey].children || undefined
  };


  // console.log('WatchTest balanceItem is: ', balanceItem);

  // @ts-ignore
  // console.log('WatchTest networkKey is: ', networkKey);

  let unsub: UnsubscribePromise;
  let unsub2: () => void;

  // if (networkKey === 'astarEvm') {
  //   console.log(`WatchTest balanceJson.details[${networkKey}]: `, balanceJson.details[networkKey]);
  // }

  async function getBalanceAstar (networkKey: string) {
  {/*
  // console.log('Arth subscribeWithAccountMulti addresses: ', addresses[0]);
  if (networkKey === 'astar') {
    console.log('Arth subscribeWithAccountMulti networkKey: ', networkKey);
    console.log('Arth subscribeWithAccountMulti addresses: ', addresses[0]);
    const astarBalance = Web3.utils.fromWei(balanceJson.details[networkKey].free, 'ether').substring(0, 5);

    console.log('Arth subscribeWithAccountMulti free: ', astarBalance);

    if (astarBalance !== '0') {
      chrome.storage.local.set({
        availableNativeBalance: (addresses[0] + '_' + astarBalance)
      }, function () {});
    }
  }

  async function getBalanceAstarEvm (networkKey: string) {
  */}
    let wssURL = '';

    switch (networkKey) {
      case 'astar':
        wssURL = 'wss://rpc.astar.network';
        break;
      case 'shiden':
        wssURL = 'wss://rpc.shiden.network';
        break;
      case 'shibuya':
        wssURL = 'wss://rpc.shibuya.network';
        break;
      default:
        break;
    }

    const ss58Address = addresses[0];
    const address = u8aToHex(addressToEvm(ss58Address));
    const web3 = new Web3(new Web3.providers.WebsocketProvider(wssURL));
    const deposit: string = await web3.eth.getBalance(address);

    const displayEvmDepositAmount = Number(ethers.utils.formatEther(deposit.toString()));

    const evmDepositAmount = deposit;

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    chrome.storage.local.set({ displayEvmDepositAmount: displayEvmDepositAmount });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    chrome.storage.local.set({ evmDepositAmount: evmDepositAmount });

    if (parseFloat(deposit) > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      chrome.storage.local.set({ isEvmDeposit: true });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      chrome.storage.local.set({ isEvmDeposit: false });
    }

    return deposit;
  }

  // if (!['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
  if (networkKey) {
    if (['bifrost', 'acala', 'karura'].includes(networkKey)) {
      unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, (balanceItem) => {
        callback(networkKey, balanceItem);
      });
    } else if (['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
      unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, (balanceItem) => {
        callback(networkKey, balanceItem);
      }, true);
    } else if (['astarEvm', 'shidenEvm', 'shibuyaEvm'].includes(networkKey)) {
      const { feeFrozen, free, miscFrozen, reserved, state: balanceItemState } = await subscribeEVMBalance(balanceJson, networkKey, networkAPI.api, addresses);

      balanceItem.state = balanceItemState;
      balanceItem.free = free;
      balanceItem.reserved = reserved;
      balanceItem.miscFrozen = miscFrozen;
      balanceItem.feeFrozen = feeFrozen;

      // console.log('WatchTest unsub2 astarBalanceItem is: ', balanceItem);
      // console.log('WatchTest balanceItem.free !== "0" is: ', balanceItem.free !== '0');

      if (balanceItem.free !== '0') {
        // state.setBalanceItem(networkKey, balanceItem);
        unsub2 = subscribeERC20Interval(addresses, networkKey, networkAPI.api, balanceItem, callback);

        return;
      }

      // console.log('WatchTest balanceItem.free === "0"');
      // console.log('WatchTest after return astarBalanceItem is: ', balanceItem);

      unsub2 = () => {
        // console.log('WatchTest unsub2 balanceItem.free === "0"');
      };
    } else if (moonbeamBaseChains.indexOf(networkKey) > -1) {
      unsub2 = subscribeERC20Interval(addresses, networkKey, networkAPI.api, balanceItem, callback);
    } else {
      unsub = networkAPI.api.query.system.account.multi(addresses, async (balances: AccountInfo[]) => {
        let [free, reserved, miscFrozen, feeFrozen] = [new BN(0), new BN(0), new BN(0), new BN(0)];

        balances.forEach((balance: AccountInfo) => {
          free = free.add(balance.data?.free?.toBn() || new BN(0));
          reserved = reserved.add(balance.data?.reserved?.toBn() || new BN(0));
          miscFrozen = miscFrozen.add(balance.data?.miscFrozen?.toBn() || new BN(0));
          feeFrozen = feeFrozen.add(balance.data?.feeFrozen?.toBn() || new BN(0));
        });

        switch (networkKey) {
          case 'astar':
            feeFrozen = new BN(await getBalanceAstar('astar'));
            break;
          case 'shiden':
            feeFrozen = new BN(await getBalanceAstar('shiden'));
            break;
          case 'shibuya':
            feeFrozen = new BN(await getBalanceAstar('shibuya'));
            break;
          default:
        }

        balanceItem.state = APIItemState.READY;
        balanceItem.free = free.toString();
        balanceItem.reserved = reserved.toString();
        balanceItem.miscFrozen = miscFrozen.toString();
        balanceItem.feeFrozen = feeFrozen.toString();
        balanceItem.children = balanceItem?.children || undefined;

        callback(networkKey, balanceItem);
      });
    }
  }

  return async () => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    unsub && (await unsub)();
    unsub2 && unsub2();
  };
  // });
}

export async function subscribeEVMBalance (balanceJson: BalanceJson, networkKey: string, api: ApiPromise, addresses: string[]): Promise<BalanceItem> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  // console.log(`balanceJson.details[${networkKey}]: `, balanceJson.details[networkKey]);

  const balanceItem: BalanceItem = {
    state: balanceJson.details[networkKey].state || APIItemState.PENDING,
    free: balanceJson.details[networkKey].free || '0',
    reserved: balanceJson.details[networkKey].reserved || '0',
    miscFrozen: balanceJson.details[networkKey].miscFrozen || '0',
    feeFrozen: balanceJson.details[networkKey].feeFrozen || '0'
  };

  await getEVMBalance(networkKey, addresses)
    .then((balances) => {
      balanceItem.free = sumBN(balances.map((b) => (new BN(b || '0')))).toString();
      balanceItem.state = APIItemState.READY;
    })
    .catch(console.error);

  return balanceItem;
}

export function subscribeBalance (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: BalanceItem) => void) {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  return Object.entries(dotSamaAPIMap).map(async ([networkKey, apiProps]) => {
    const networkAPI = await apiProps.isReady;
    const useAddresses = ethereumChains.indexOf(networkKey) > -1 ? evmAddresses : substrateAddresses;

    // console.log('WatchTest useAddresses: ', useAddresses);

    if (!useAddresses || useAddresses.length === 0) {
      // Return zero balance if not have any address
      const zeroBalance = {
        state: APIItemState.PENDING,
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
