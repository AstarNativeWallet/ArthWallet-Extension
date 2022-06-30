// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, BasicTxInfo, NetworkJson, UnlockingStakeInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { ERA_LENGTH_MAP, parseRawNumber } from '@subwallet/extension-koni-base/api/bonding/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { isUrl } from '@subwallet/extension-koni-base/utils/utils';
import fetch from 'cross-fetch';
import Web3 from 'web3';

import { BN } from '@polkadot/util';

export async function getAstarBondingBasics (networkKey: string) {
  const allDappsReq = new Promise(function (resolve) {
    fetch(`https://api.astar.network/api/v1/${networkKey}/dapps-staking/apr`, {
      method: 'GET'
    }).then((resp) => {
      resolve(resp.json());
    }).catch(console.error);
  });
  const timeout = new Promise((resolve) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      resolve(null);
    }, 5000);
  });

  const resp = await Promise.race([
    timeout,
    allDappsReq
  ]); // need race because of API often timeout

  if (resp !== null) {
    return {
      isMaxNominators: false,
      stakedReturn: resp as number
    };
  }

  return {
    isMaxNominators: false,
    stakedReturn: 0
  };
}

export async function getAstarDappsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
  const apiProps = await dotSamaApi.isReady;
  const rawMaxStakerPerContract = (apiProps.api.consts.dappsStaking.maxNumberOfStakersPerContract).toHuman() as string;
  const rawMinStake = (apiProps.api.consts.dappsStaking.minimumStakingAmount).toHuman() as string;

  const allDappsInfo: ValidatorInfo[] = [];
  const minStake = parseRawNumber(rawMinStake);
  const maxStakerPerContract = parseRawNumber(rawMaxStakerPerContract);

  const allDappsReq = new Promise(function (resolve) {
    fetch('https://api.astar.network/api/v1/shibuya/dapps-staking/dapps', {
      method: 'GET'
    }).then((resp) => {
      resolve(resp.json());
    }).catch(console.error);
  });

  const [_stakedDapps, _era, _allDapps] = await Promise.all([
    apiProps.api.query.dappsStaking.generalStakerInfo.entries(address),
    apiProps.api.query.dappsStaking.currentEra(),
    allDappsReq
  ]);

  const stakedDappsList: string[] = [];

  for (const item of _stakedDapps) {
    const data = item[0].toHuman() as any[];
    const stakedDapp = data[1] as Record<string, string>;

    stakedDappsList.push((stakedDapp.Evm).toLowerCase());
  }

  const era = parseRawNumber(_era.toHuman() as string);
  const allDapps = _allDapps as Record<string, any>[];

  await Promise.all(allDapps.map(async (dapp) => {
    const dappName = dapp.name as string;
    const dappAddress = dapp.address as string;
    const dappIcon = isUrl(dapp.iconUrl as string) ? dapp.iconUrl as string : undefined;
    const _contractInfo = await apiProps.api.query.dappsStaking.contractEraStake({ Evm: dappAddress }, era);
    const contractInfo = _contractInfo.toHuman() as Record<string, any>;
    let totalStake = 0;
    let stakerCount = 0;

    if (contractInfo !== null) {
      totalStake = parseRawNumber(contractInfo.total as string);
      stakerCount = parseRawNumber(contractInfo.numberOfStakers as string);
    }

    allDappsInfo.push({
      commission: 0,
      expectedReturn: 0,
      address: dappAddress,
      totalStake: totalStake / 10 ** decimals,
      ownStake: 0,
      otherStake: totalStake / 10 ** decimals,
      nominatorCount: stakerCount,
      blocked: false,
      isVerified: false,
      minBond: (minStake / 10 ** decimals),
      isNominated: stakedDappsList.includes(dappAddress.toLowerCase()),
      icon: dappIcon,
      identity: dappName
    });
  }));

  return {
    maxNominatorPerValidator: maxStakerPerContract,
    era: -1,
    validatorsInfo: allDappsInfo,
    isBondedBefore: false, // No need for this on astar
    bondedValidators: stakedDappsList,
    maxNominations: 100
  };
}

export async function getAstarBondingTxInfo (networkJson: NetworkJson, dotSamaApi: ApiProps, stakerAddress: string, amount: number, dappInfo: ValidatorInfo) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  const extrinsic = apiPromise.api.tx.dappsStaking.bondAndStake({ Evm: dappInfo.address }, binaryAmount);

  return extrinsic.paymentInfo(stakerAddress);
}

export async function handleAstarBondingTxInfo (networkJson: NetworkJson, amount: number, networkKey: string, stakerAddress: string, dappInfo: ValidatorInfo, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>) {
  const [txInfo, balance] = await Promise.all([
    getAstarBondingTxInfo(networkJson, dotSamaApiMap[networkKey], stakerAddress, amount, dappInfo),
    getFreeBalance(networkKey, stakerAddress, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = txInfo.partialFee.toHuman();
  const binaryBalance = new BN(balance);

  const sumAmount = txInfo.partialFee.addn(amount);
  const balanceError = sumAmount.gt(binaryBalance);

  return {
    fee: feeString,
    balanceError
  } as BasicTxInfo;
}

export async function getAstarBondingExtrinsic (dotSamaApi: ApiProps, networkJson: NetworkJson, amount: number, networkKey: string, stakerAddress: string, dappInfo: ValidatorInfo) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  return apiPromise.api.tx.dappsStaking.bondAndStake({ Evm: dappInfo.address }, binaryAmount);
}

export async function getAstarUnbondingTxInfo (networkJson: NetworkJson, dotSamaApi: ApiProps, stakerAddress: string, amount: number, dappAddress: string) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  const extrinsic = apiPromise.api.tx.dappsStaking.unbondAndUnstake({ Evm: dappAddress }, binaryAmount);

  return extrinsic.paymentInfo(stakerAddress);
}

export async function handleAstarUnbondingTxInfo (networkJson: NetworkJson, amount: number, networkKey: string, stakerAddress: string, dappAddress: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>) {
  const [txInfo, balance] = await Promise.all([
    getAstarUnbondingTxInfo(networkJson, dotSamaApiMap[networkKey], stakerAddress, amount, dappAddress),
    getFreeBalance(networkKey, stakerAddress, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = txInfo.partialFee.toHuman();
  const binaryBalance = new BN(balance);

  const sumAmount = txInfo.partialFee.addn(amount);
  const balanceError = sumAmount.gt(binaryBalance);

  return {
    fee: feeString,
    balanceError
  } as BasicTxInfo;
}

export async function getAstarUnbondingExtrinsic (dotSamaApi: ApiProps, networkJson: NetworkJson, amount: number, networkKey: string, stakerAddress: string, dappAddress: string) {
  const apiPromise = await dotSamaApi.isReady;
  const parsedAmount = amount * (10 ** (networkJson.decimals as number));
  const binaryAmount = new BN(parsedAmount.toString());

  return apiPromise.api.tx.dappsStaking.unbondAndUnstake({ Evm: dappAddress }, binaryAmount);
}

async function getAstarUnlockingInfo (dotSamaApi: ApiProps, address: string, networkKey: string) {
  const apiPromise = await dotSamaApi.isReady;

  const [_stakingInfo, _era] = await Promise.all([
    apiPromise.api.query.dappsStaking.ledger(address),
    apiPromise.api.query.dappsStaking.currentEra()
  ]);

  const currentEra = parseRawNumber(_era.toHuman() as string);
  const stakingInfo = _stakingInfo.toHuman() as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const unlockingChunks = stakingInfo.unbondingInfo.unlockingChunks as Record<string, string>[];

  let nextWithdrawalEra = -1;
  let nextWithdrawalAmount = 0;
  let redeemable = 0;

  for (const chunk of unlockingChunks) {
    const unlockEra = parseRawNumber(chunk.unlockEra);
    const amount = parseRawNumber(chunk.amount);

    // Find next withdrawal
    if (nextWithdrawalEra === -1) {
      nextWithdrawalEra = unlockEra;
      nextWithdrawalAmount = amount;
    } else if (unlockEra <= nextWithdrawalEra) {
      nextWithdrawalEra = unlockEra;
      nextWithdrawalAmount += amount;
    }

    // Find redeemable
    if (unlockEra - currentEra <= 0) {
      redeemable += amount;
    }
  }

  const nextWithdrawal = (nextWithdrawalEra - currentEra) * ERA_LENGTH_MAP[networkKey];

  return {
    nextWithdrawal,
    nextWithdrawalAmount,
    redeemable
  };
}

export async function handleAstarUnlockingInfo (dotSamaApi: ApiProps, networkJson: NetworkJson, networkKey: string, address: string) {
  const { nextWithdrawal, nextWithdrawalAmount, redeemable } = await getAstarUnlockingInfo(dotSamaApi, address, networkKey);

  const parsedRedeemable = redeemable / (10 ** (networkJson.decimals as number));
  const parsedNextWithdrawalAmount = nextWithdrawalAmount / (10 ** (networkJson.decimals as number));

  return {
    nextWithdrawal: nextWithdrawal,
    redeemable: parsedRedeemable,
    nextWithdrawalAmount: parsedNextWithdrawalAmount
  } as UnlockingStakeInfo;
}

export async function getAstarWithdrawalTxInfo (dotSamaApi: ApiProps, address: string) {
  const apiPromise = await dotSamaApi.isReady;

  const extrinsic = apiPromise.api.tx.dappsStaking.withdrawUnbonded();

  return extrinsic.paymentInfo(address);
}

export async function handleAstarWithdrawalTxInfo (networkKey: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, address: string) {
  const [txInfo, balance] = await Promise.all([
    getAstarWithdrawalTxInfo(dotSamaApiMap[networkKey], address),
    getFreeBalance(networkKey, address, dotSamaApiMap, web3ApiMap)
  ]);

  const feeString = txInfo.partialFee.toHuman();
  const binaryBalance = new BN(balance);
  const balanceError = txInfo.partialFee.gt(binaryBalance);

  return {
    fee: feeString,
    balanceError
  } as BasicTxInfo;
}

export async function getAstarWithdrawalExtrinsic (dotSamaApi: ApiProps) {
  const apiPromise = await dotSamaApi.isReady;

  return apiPromise.api.tx.dappsStaking.withdrawUnbonded();
}
