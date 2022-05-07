// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson } from '@polkadot/extension-base/background/types';

import React, { useCallback, useContext, useEffect, /* useRef , */ useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { CurrentAccountInfo } from '@polkadot/extension-base/background/KoniTypes';
import { AccountContext, ActionContext } from '@polkadot/extension-koni-ui/components';
// import useIsPopup from '@polkadot/extension-koni-ui/hooks/useIsPopup';
// import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
// import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { saveCurrentAccountAddress, triggerAccountsSubscription } from '@polkadot/extension-koni-ui/messaging';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { findAccountByAddress /*, isAccountAll */ } from '@polkadot/extension-koni-ui/util';

import HomeAccountInfo from '../../components/HomeAccountInfo';

interface Props extends AccountJson {
  className?: string;
  parentName?: string;
  closeSetting?: () => void;
  changeAccountCallback?: (address: string) => void;
}

function HomeAccountList ({ address, changeAccountCallback, className, closeSetting, genesisHash, name, parentName, suri, type }: Props): React.ReactElement<Props> {
  const [isSelected, setSelected] = useState(false);
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const currentAccount = useSelector((state: RootState) => state.currentAccount.account);
  // const _isAllAccount = isAccountAll(address);
  // const { t } = useTranslation();

  useEffect((): void => {
    if (currentAccount?.address === address) {
      setSelected(true);
    } else {
      setSelected(false);
    }
  }, [address, currentAccount?.address]);

  const _changeAccount = useCallback(
    () => {
      setSelected(true);

      if (address) {
        const accountByAddress = findAccountByAddress(accounts, address);

        if (accountByAddress) {
          const accountInfo = {
            address: address
          } as CurrentAccountInfo;

          saveCurrentAccountAddress(accountInfo, () => {
            window.localStorage.removeItem('accountAllNetworkGenesisHash');
            triggerAccountsSubscription().catch((e) => {
              console.error('There is a problem when trigger Accounts Subscription', e);
            });

            changeAccountCallback && changeAccountCallback(address);
          }).catch((e) => {
            console.error('There is a problem when set Current Account', e);
          });
        } else {
          console.error('There is a problem when change account');
        }
      }

      closeSetting && closeSetting();
      onAction('/');
    }, [accounts, address, changeAccountCallback, closeSetting, onAction]);

  return (
    <div
      className={className}
      onClick={_changeAccount}
    >

      {isSelected
      /**
        ? (
          <img
            alt='check'
            src={check}
          />
        )
        : (
          <div className='account-unchecked-item' />
        )
      } */}
      <HomeAccountInfo
        address={address}
        className='account__account-item'
        genesisHash={genesisHash}
        name={name}
        parentName={parentName}
        showCopyBtn={true}
        suri={suri}
        type={type}
      />
    </div>
  );
}

export default styled(HomeAccountList)(({ theme }: ThemeProps) => `
  position: relative;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  &:hover {
    background-color: ${theme.accountHoverBackground};
    border: 0.1px solid rgba(79, 88, 127, 1);
    cursor: pointer;
  }

  .account__account-item {
    margin-left: 5px;
  }

  .account-unchecked-item {
    width: 19px;
  }

  .account__change-avatar {
    display: flex;
    position: absolute;
    align-items: center;
    right: 15px;
    height: 100%;
  }

  .account__change-avatar-is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .account__change-avatar-icon-btn {
    border-radius: 8px;
    padding: 6px;
    background-color: ${theme.accountHoverBackground};
    width: 32px;
    height: 32px;
  }
`);
