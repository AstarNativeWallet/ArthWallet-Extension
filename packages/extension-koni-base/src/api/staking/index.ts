// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, ApiProps, NetworkJson, StakingItem } from '@subwallet/extension-base/background/KoniTypes';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { IGNORE_GET_SUBSTRATE_FEATURES_LIST } from '@subwallet/extension-koni-base/constants';
import { categoryAddresses, parseRawNumber, toUnit } from '@subwallet/extension-koni-base/utils/utils';

interface LedgerData {
  active: string,
  claimedRewards: string[],
  stash: string,
  total: string,
  unlocking: Record<string, string>[]
}

export const DEFAULT_STAKING_NETWORKS = {
  polkadot: PREDEFINED_NETWORKS.polkadot,
  kusama: PREDEFINED_NETWORKS.kusama,
  aleph: PREDEFINED_NETWORKS.aleph,
  moonbeam: PREDEFINED_NETWORKS.moonbeam,
  moonbase: PREDEFINED_NETWORKS.moonbase,
  darwinia: PREDEFINED_NETWORKS.darwinia,
  pangolin: PREDEFINED_NETWORKS.pangolin,
  crab: PREDEFINED_NETWORKS.crab,
  polkadex: PREDEFINED_NETWORKS.polkadex,
  turing: PREDEFINED_NETWORKS.turing,
  turingStaging: PREDEFINED_NETWORKS.turingStaging,
  astar: PREDEFINED_NETWORKS.astar,
  shibuya: PREDEFINED_NETWORKS.shibuya,
  shiden: PREDEFINED_NETWORKS.shiden,
  bifrost: PREDEFINED_NETWORKS.bifrost,
  bifrost_testnet: PREDEFINED_NETWORKS.bifrost_testnet
  // acala: PREDEFINED_NETWORKS.acala,
};

interface PromiseMapping {
  api: ApiProps,
  chain: string
}

function parseStakingBalance (balance: number, chain: string, network: Record<string, NetworkJson>): number {
  return toUnit(balance, network[chain].decimals as number);
}

export async function stakingOnChainApi (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: StakingItem) => void, networks: Record<string, NetworkJson> = DEFAULT_STAKING_NETWORKS) {
  const allApiPromise: PromiseMapping[] = [];
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  Object.entries(networks).forEach(([networkKey, networkInfo]) => {
    if (IGNORE_GET_SUBSTRATE_FEATURES_LIST.indexOf(networkKey) < 0 && (networkInfo.getStakingOnChain && networkInfo.getStakingOnChain) && networkInfo.active) {
      allApiPromise.push({ chain: networkKey, api: dotSamaAPIMap[networkKey] });
    }
  });

  return await Promise.all(allApiPromise.map(async ({ api: apiPromise, chain }) => {
    const parentApi = await apiPromise.isReady;
    const useAddresses = apiPromise.isEthereum ? evmAddresses : substrateAddresses;

    if (['astar', 'shiden', 'shibuya'].includes(chain)) {
      return getAstarStakingOnChain(parentApi, useAddresses, networks, chain, callback);
    } else if (['darwinia', 'crab', 'pangolin'].includes(chain)) {
      return getDarwiniaStakingOnChain(parentApi, useAddresses, networks, chain, callback);
    } else if (['moonbeam', 'moonriver', 'moonbase', 'turing', 'turingStaging', 'bifrost', 'bifrost_testnet'].includes(chain)) {
      return getParaStakingOnChain(parentApi, useAddresses, networks, chain, callback);
    }

    return getRelayStakingOnChain(parentApi, useAddresses, networks, chain, callback);
  }));
}

function getParaStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.parachainStaking.delegatorState.multi(useAddresses, (ledgers: any) => {
    let totalBalance = 0;
    let activeBalance = 0;
    let unlockingBalance = 0;
    let stakingItem: StakingItem;

    if (ledgers) {
      for (const ledger of ledgers) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const data = ledger.toHuman() as Record<string, any> | null;

        if (data !== null) {
          let _totalBalance = data.total as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          let _unlockingBalance = data.lessTotal ? data.lessTotal as string : data.requests.lessTotal as string;

          _totalBalance = _totalBalance.replaceAll(',', '');
          _unlockingBalance = _unlockingBalance.replaceAll(',', '');

          totalBalance += parseFloat(_totalBalance);
          unlockingBalance += parseFloat(_unlockingBalance);
          activeBalance = totalBalance - unlockingBalance;
        }
      }

      const parsedTotalBalance = parseStakingBalance(totalBalance, chain, networks);
      const parsedUnlockingBalance = parseStakingBalance(unlockingBalance, chain, networks);
      const parsedActiveBalance = parseStakingBalance(activeBalance, chain, networks);

      if (totalBalance > 0) {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY
        } as StakingItem;
      } else {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY
        } as StakingItem;
      }

      // eslint-disable-next-line node/no-callback-literal
      callback(chain, stakingItem);
    }
  });
}

function getRelayStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.staking?.ledger.multi(useAddresses, (ledgers: any[]) => {
    let totalBalance = 0;
    let activeBalance = 0;
    let unlockingBalance = 0;
    let unit = '';
    let stakingItem: StakingItem;

    if (ledgers) {
      for (const ledger of ledgers) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const data = ledger.toHuman() as unknown as LedgerData;

        if (data && data.active) {
          const _totalBalance = data.total;
          const _activeBalance = data.active;

          data.unlocking.forEach(({ value }) => {
            value = value.split(' ')[0];
            const _unlockingBalance = value.replaceAll(',', '');

            unlockingBalance += parseFloat(_unlockingBalance);
          });

          let amount = _totalBalance ? _totalBalance.split(' ')[0] : '';

          amount = amount.replaceAll(',', '');
          unit = _totalBalance ? _totalBalance.split(' ')[1] : '';
          totalBalance += parseFloat(amount);

          amount = _activeBalance ? _activeBalance.split(' ')[0] : '';
          amount = amount.replaceAll(',', '');
          unit = _activeBalance ? _activeBalance.split(' ')[1] : '';
          activeBalance += parseFloat(amount);
        }
      }

      const parsedActiveBalance = parseStakingBalance(activeBalance, chain, networks);
      const parsedUnlockingBalance = parseStakingBalance(unlockingBalance, chain, networks);
      const parsedTotal = parseStakingBalance(totalBalance, chain, networks);

      if (totalBalance > 0) {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotal.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: unit || networks[chain].nativeToken,
          state: APIItemState.READY
        } as StakingItem;
      } else {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotal.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: unit || networks[chain].nativeToken,
          state: APIItemState.READY
        } as StakingItem;
      }

      // eslint-disable-next-line node/no-callback-literal
      callback(chain, stakingItem);
    }
  });
}

function getDarwiniaStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.staking?.ledger.multi(useAddresses, (ledgers: any[]) => {
    let totalBalance = 0;
    let activeBalance = 0;
    let unlockingBalance = 0;
    const unit = '';
    let stakingItem: StakingItem;
    // TODO: get unstakable amount based on timestamp
    // const timestamp = new Date().getTime();

    if (ledgers) {
      for (const ledger of ledgers) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const data = ledger.toHuman() as unknown as Record<string, any>;

        if (data && data.active) {
          // locked balance
          const _ringLockStaking = data.ringStakingLock as Record<string, any>;
          const unbondingLockBalance = _ringLockStaking.unbondings as Record<string, string>[];
          let _totalActive = data.active as string;

          unbondingLockBalance.forEach((item) => {
            const _unlockingBalance = item.amount.replaceAll(',', '');

            unlockingBalance += parseFloat(_unlockingBalance);
          });

          _totalActive = _totalActive.replaceAll(',', '');
          activeBalance += parseFloat(_totalActive);

          const _totalBalance = activeBalance + unlockingBalance;

          totalBalance += _totalBalance;
        }
      }

      const parsedActiveBalance = parseStakingBalance(activeBalance, chain, networks);
      const parsedUnlockingBalance = parseStakingBalance(unlockingBalance, chain, networks);
      const parsedTotal = parseStakingBalance(totalBalance, chain, networks);

      if (totalBalance > 0) {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotal.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: unit || networks[chain].nativeToken,
          state: APIItemState.READY
        } as StakingItem;
      } else {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotal.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: unit || networks[chain].nativeToken,
          state: APIItemState.READY
        } as StakingItem;
      }

      // eslint-disable-next-line node/no-callback-literal
      callback(chain, stakingItem);
    }
  });
}

function getAstarStakingOnChain (parentApi: ApiProps, useAddresses: string[], networks: Record<string, NetworkJson>, chain: string, callback: (networkKey: string, rs: StakingItem) => void) {
  return parentApi.api.query.dappsStaking.ledger.multi(useAddresses, (ledgers: any[]) => {
    let totalBalance = 0;
    let unlockingBalance = 0;
    let stakingItem: StakingItem;

    if (ledgers) {
      for (const ledger of ledgers) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const data = ledger.toHuman() as Record<string, any>;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const unlockingChunks = data.unbondingInfo.unlockingChunks as Record<string, string>[];
        const _totalStake = data.locked as string;

        for (const chunk of unlockingChunks) {
          unlockingBalance += parseRawNumber(chunk.amount);
        }

        totalBalance += parseRawNumber(_totalStake);
      }

      const parsedTotalBalance = parseStakingBalance(totalBalance, chain, networks);
      const parsedActiveBalance = parseStakingBalance(totalBalance - unlockingBalance, chain, networks);
      const parsedUnlockingBalance = parseStakingBalance(unlockingBalance, chain, networks);

      if (totalBalance > 0) {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY
        } as StakingItem;
      } else {
        stakingItem = {
          name: networks[chain].chain,
          chainId: chain,
          balance: parsedTotalBalance.toString(),
          activeBalance: parsedActiveBalance.toString(),
          unlockingBalance: parsedUnlockingBalance.toString(),
          nativeToken: networks[chain].nativeToken,
          unit: networks[chain].nativeToken,
          state: APIItemState.READY
        } as StakingItem;
      }

      // eslint-disable-next-line node/no-callback-literal
      callback(chain, stakingItem);
    }
  });
}
