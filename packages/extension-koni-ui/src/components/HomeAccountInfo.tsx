// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IconTheme } from '@polkadot/react-identicon/types';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { Recoded, ThemeProps } from '../types';

import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { faCodeBranch, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import allAccountLogoDefault from '@polkadot/extension-koni-ui/assets/all-account-icon.svg';
import cloneLogo from '@polkadot/extension-koni-ui/assets/clone.svg';
//import { BalanceVal } from '@polkadot/extension-koni-ui/components/balance';
import Identicon from '@polkadot/extension-koni-ui/components/Identicon';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { accountAllRecoded, defaultRecoded, isAccountAll, recodeAddress } from '@polkadot/extension-koni-ui/util';
import getNetworkInfoByGenesisHash from '@polkadot/extension-koni-ui/util/getNetworkInfoByGenesisHash';

import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import getParentNameSuri from '../util/getParentNameSuri';
import { AccountContext } from './contexts';

//import AvailableNativeNum from '../Popup/Sending/old/component/AvailableNativeNum';
//import { getWeb3Api } from '@polkadot/extension-koni-base/api/web3/web3';


import Web3 from 'web3';
//import { BN, u8aToHex } from '@polkadot/util';
//import { addressToEvm } from '@polkadot/util-crypto';
//import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { useCall } from '@polkadot/extension-koni-ui/Popup/Sending/old/hook/useCall';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { BN } from '@polkadot/util';

export interface Props {
  address?: string | null;
  className?: string;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHardware?: boolean | null;
  name?: string | null;
  parentName?: string | null;
  suri?: string;
  showCopyBtn?: boolean
  type?: KeypairType;
  isShowAddress?: boolean;
  isShowBanner?: boolean;
  iconSize?: number;

  api: ApiPromise;
  apiUrl: string;
  currentAccount?: AccountJson | null;
  isEthereum: boolean;
  networkKey: string;

}

function HomeAccountInfo ({ api, apiUrl, address, className, genesisHash, iconSize = 32, isExternal, isHardware, isShowAddress = true, isShowBanner = true, name, parentName, showCopyBtn = true, suri, type: givenType }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const [{ account,
    formatted,
    genesisHash: recodedGenesis,
    isEthereum,
    prefix }, setRecoded] = useState<Recoded>(defaultRecoded);
  const networkInfo = getNetworkInfoByGenesisHash(genesisHash || recodedGenesis);
  const { show } = useToast();
  const accountName = name || account?.name;
  const displayName = accountName || t('<unknown>');
  const allAccountLogo = useSelector((state: RootState) => state.allAccount.allAccountLogo);

  const _isAccountAll = address && isAccountAll(address);



  if (formatted && formatted !== 'ALL') {

    console.log('Arth HomeAccountInfo formatted: ', formatted);

    async function getNativeBalance () {
      const provider = new WsProvider('wss://rpc.astar.network');
      const api = await ApiPromise.create({ provider });
      let { data: { free: previousFree } } = await api.query.system.account(formatted);

      let balance = new BN(previousFree).toString();
      let astarBalance = Web3.utils.fromWei(balance, 'ether').substring(0, 5);
      console.log('Arth has a astarBalance: ', formatted, ' / ', astarBalance);

    }
    getNativeBalance().catch(console.error).finally(() => process.exit());

  }

  useEffect((): void => {
    if (!address) {
      setRecoded(defaultRecoded);

      return;
    }

    if (_isAccountAll) {
      setRecoded(accountAllRecoded);

      return;
    }

    setRecoded(recodeAddress(address, accounts, networkInfo, givenType));
  }, [accounts, _isAccountAll, address, networkInfo, givenType]);

  const iconTheme = (
    isEthereum
      ? 'ethereum'
      : (networkInfo?.icon || 'polkadot')
  ) as IconTheme;

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const toShortAddress = (_address: string | null, halfLength?: number) => {
    const address = (_address || '').toString();

    const addressLength = halfLength || 7;

    return address.length > 13 ? `${address.slice(0, addressLength)}…${address.slice(-addressLength)}` : address;
  };

  const Name = () => {
    return (
      <>
        {!!accountName && (account?.isExternal || isExternal) && (
          (account?.isHardware || isHardware)
            ? (
              <FontAwesomeIcon
                className='hardwareIcon'
                // @ts-ignore
                icon={faUsb}
                rotation={270}
                title={t('hardware wallet account')}
              />
            )
            : (
              <FontAwesomeIcon
                className='externalIcon'
                // @ts-ignore
                icon={faQrcode}
                title={t('external account')}
              />
            )
        )}
        <span title={displayName}>{_isAccountAll ? t<string>('All Accounts') : displayName}</span>
      </>);
  };

  const parentNameSuri = getParentNameSuri(parentName, suri);

  const [availableNativeBalance, setAvailableNativeBalance] = useState<string | null>(null);
  const [availableEVMBalance, setAvailableEVMBalance] = useState<string | null>(null);

  async function getBalanceAstarEvm (networkKey: string, address: string) {

    let wssURL = '';
  
    if (networkKey === 'astarEvm' || networkKey === 'astar') {
      wssURL = 'wss://rpc.astar.network';
    } else if (networkKey === 'shidenEvm') {
      wssURL = 'wss://rpc.shiden.astar.network';
    } else if (networkKey === 'shibuyaEvm') {
      wssURL = 'wss://rpc.shibuya.astar.network';
    }

    let astarBalance = '0';

    if (networkKey === 'astar') {
      const web3 = new Web3(new Web3.providers.WebsocketProvider(wssURL));
      const balance = await web3.eth.getBalance(address);   
      astarBalance = web3.utils.fromWei(balance, 'ether').substring(0, 5);
    } else if (networkKey === 'astarEvm') {
      const web3 = new Web3(new Web3.providers.WebsocketProvider(wssURL));
      const balance = await web3.eth.getBalance(address);   
      astarBalance = web3.utils.fromWei(balance, 'ether').substring(0, 5);
    }
    console.log('Arth await balance: ' + networkKey + ', SS58:' + address + ' -> H160:' + address + ', ' + astarBalance);

    chrome.storage.local.set({
      'availableEVMBalance': (address + '_' + astarBalance)
    }, function () {});
  }

  console.log('Arth networkInfo: ', networkInfo?.chain);

  if (networkInfo?.chain === 'Astar') {
    //getBalanceAstarEvm('astar', (address || '').toString());
  } else if (networkInfo?.chain === 'Astar - EVM') {
    getBalanceAstarEvm('astarEvm', (address || '').toString());
  }

/*  
  chrome.storage.local.get(['availableNativeBalance'], function (result) {
    if (typeof result.availableNativeBalance === 'string') {
      setAvailableNativeBalance(result.availableNativeBalance);
      console.log('Arth value_data: ', availableNativeBalance);
    } else {
      setAvailableNativeBalance('0');
    }
  });
  chrome.storage.local.get(['availableEVMBalance'], function (result) {
    if (typeof result.availableEVMBalance === 'string') {
      setAvailableEVMBalance(result.availableEVMBalance);
      console.log('Arth value_data: ', availableEVMBalance);
    } else {
      setAvailableEVMBalance('0');
    }
  });
*/


/*
  type AddressBalances = {
    [address: string]: string;
  }

  let addreeBalances: AddressBalances = {};
  //addreeBalances['5FURcxweuwfwJkC39TNR9zu8K8DJnaf62q5hcmCw5to6Febh']    = '1000';
  //addreeBalances['5FC4kKBg4sgowvA4uQmSaqLaVpRJC8mJaJ6W3Y8C2xYtWazQ']    = '2000';
  //addreeBalances['0x3908f5b9f831c1e74C0B1312D0f06126a58f4Ac0']    = '3000';
    if (formatted) {
      addreeBalances[formatted]    = '3000';
      chrome.storage.local.set({addreeBalances}, function(){
      });
    // ここにset終わったあとの処理
  }

  const [addressBalances, setAddressBalances] = useState<AddressBalances>();
  chrome.storage.local.get(['addressBalances'], function (result) {
    setAddressBalances(result.addressBalances);
    console.log('Arth result.addressBalances: ', result.addressBalances);
  });

  console.log('Arth formatted: ', formatted);
  console.log('Arth addreeBalances: ', addreeBalances);

  if (addressBalances?.address) {
    console.log('Arth addressBalances.address: ', addressBalances.address);
  }
*/




/*
chrome.storage.local.get(['addressBalances'], function (result) {
//    if (typeof result.addreeBalances === 'string') {
    setAddressBalances(result.addressBalances);
//    console.log('Arth addreeBalances: ', result.addreeBalances);
//    } else {
//      setAvailableEVMBalance('0');
//    }
  });
*/

  //console.log('Arth addreeBalances 2: ', addreeBalances[(address || '').toString()]);

  

/*
  chrome.storage.local.get(function(allresult){
    console.log('Arth chrome: ', allresult);
  });
*/

  return (
    <div className={className}>
      <div className='account-info-row'>
        {_isAccountAll
          ? allAccountLogo
            ? <img
              alt='all-account-icon'
              className='account-info__all-account-icon'
              src={allAccountLogo}
            />
            : <img
              alt='all-account-icon'
              className='account-info__all-account-icon'
              src={allAccountLogoDefault}
            />
          : <Identicon
            className='account-info-identity-icon'
            iconTheme={iconTheme}
            isExternal={isExternal}
            prefix={prefix}
            size={iconSize}
            value={formatted || address}
          />}
        <div className='account-info'>
          {parentName
            ? (
              <>
                <div className='account-info-derive-name'>
                  <FontAwesomeIcon
                    className='account-info-derive-icon'
                    // @ts-ignore
                    icon={faCodeBranch}
                  />
                  <div
                    className='account-info-parent-name'
                    data-field='parent'
                    title={parentNameSuri}
                  >
                    {parentNameSuri}
                  </div>
                </div>
                <div className='account-info__name displaced'>
                  <Name />
                </div>
              </>
            )
            : (
              <div
                className='account-info__name'
                data-field='name'
              >
                <Name />
              </div>
            )
          }
          {/**
          {networkInfo?.genesisHash && isShowBanner && (
            <div
              className='account-info-banner account-info-chain'
              data-field='chain'
            >
              {networkInfo.chain.replace(' Relay Chain', '')}
            </div>
          )} */}
          <div
            className='account-info-banner account-info-chain'
          >

          { /*(availableNativeBalance !== null && (address || '').toString() === (availableNativeBalance.split('_')[0]))
            ? <p className='symbol'>{availableNativeBalance.split('_')[1]} ASTR</p>
              : (availableEVMBalance !== null && (address || '').toString() === (availableEVMBalance.split('_')[0]))
                ? <p className='symbol'>{availableEVMBalance.split('_')[1]} ASTR</p>
                  : <p className='symbol'>0 ASTR</p> */
          }

            { /*<BalanceVal
              startWithSymbol
              symbol={'$'}
              value ={'x'}
                      /> */}

          { /*(address || '').toString()*/ }
          { /*addressBalances[(address || '').toString()]*/ }

          </div>
          <div className='account-info-address-display'>
            {isShowAddress && <div
              className='account-info-full-address'
              data-field='address'
            >
              {_isAccountAll ? t<string>('All Accounts') : toShortAddress(formatted || address || t('<unknown>'), 10)}
            </div>}
            {showCopyBtn && <CopyToClipboard text={(formatted && formatted) || ''}>
              <img
                alt='copy'
                className='account-info-copy-icon'
                onClick={_onCopy}
                src={cloneLogo}
              />
            </CopyToClipboard>}
          </div>
        </div>
      </div>
    </div>

  );
}

export default styled(HomeAccountInfo)(({ theme }: ThemeProps) => `
  .account-info-banner {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 10px;

    &.account-info-chain {
      background: ${theme.chainBackgroundColor};
      border-radius: 4px;
      color: ${theme.chainTextColor};
      font-size: 15px;
      line-height: 24px;
      padding: 0 8px;
      right: 15px;
      z-index: 1;
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: 100px;
      white-space: nowrap;
    }
  }

  .account-info-derive-name {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 0;
  }

  .account-info-address-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
  }

  .account-info__all-account-icon {
    width: 40px;
    min-width: 40px;
    height: 40px;
    border: 2px solid ${theme.checkDotColor};
    margin-right: 10px;
    padding: 2px;
    border-radius: 50%;
  }

  .account-info-address-display .svg-inline--fa {
    width: 14px;
    height: 14px;
    margin-right: 10px;
    color: ${theme.accountDotsIconColor};
    &:hover {
      color: ${theme.labelColor};
      cursor: pointer;
    }
  }

  .account-info-identity-icon {
    border: 2px solid ${theme.checkDotColor};
    margin-right: 10px;
  }

  .account-info {
    width: 100%;
  }

  .account-info-row {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 72px;
    border-radius: 4px;
  }

  .account-info__name {
    font-size: 15px;
    line-height: 24px;
    font-weight: 500;
    color: ${theme.textColor};
    margin: 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
    white-space: nowrap;

    &.displaced {
      padding-top: 10px;
    }
  }

  .account-info-parent-name {
    position: absolute;
    color: ${theme.labelColor};
    overflow: hidden;
    padding: 2px 0 0 0.8rem;
    text-overflow: ellipsis;
    width: 270px;
    white-space: nowrap;
  }

  .account-info-full-address {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 225px;
    color: ${theme.textColor2};
    font-size: 14px;
    line-height: 24px;
    font-weight: 400;
  }

  .account-info-copy-icon {
    cursor: pointer;
  }

  .account-info-derive-icon {
    color: ${theme.labelColor};
    position: absolute;
    top: 5px;
    width: 9px;
    height: 9px;
  }

  .externalIcon, .hardwareIcon {
    margin-right: 0.3rem;
    color: ${theme.labelColor};
    width: 0.875em;
  }
`);
