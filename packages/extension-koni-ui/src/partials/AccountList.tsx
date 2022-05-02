// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0
// modified AccountMenuSettings.tsx

import type { ThemeProps } from '../types';

// import { faUsb } from '@fortawesome/free-brands-svg-icons';
// import { faCog, faFileUpload, faKey, faPlusCircle, faQrcode, faSeedling } from '@fortawesome/free-solid-svg-icons';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext, useState } from 'react';
import styled from 'styled-components';

// import logo from '@polkadot/extension-koni-ui/assets/sub-wallet-logo.svg';
// import InputFilter from '@polkadot/extension-koni-ui/components/InputFilter';
// import Link from '@polkadot/extension-koni-ui/components/Link';
// import Menu from '@polkadot/extension-koni-ui/components/Menu';
// import MenuSettingItem from '@polkadot/extension-koni-ui/components/MenuSettingItem';
// import useIsPopup from '@polkadot/extension-koni-ui/hooks/useIsPopup';
// import { useLedger } from '@polkadot/extension-koni-ui/hooks/useLedger';
// import { windowOpen } from '@polkadot/extension-koni-ui/messaging';
// import AccountsTree from '@polkadot/extension-koni-ui/Popup/Accounts/AccountsTree';
import HomeAccountsTree from '@polkadot/extension-koni-ui/Popup/Accounts/HomeAccountTree';

import { AccountContext, Svg } from '../components';
// import useTranslation from '../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
  onFilter?: (filter: string) => void;
  closeSetting?: () => void;
  changeAccountCallback?: (address: string) => void;
}

// const jsonPath = '/account/restore-json';
// const createAccountPath = '/account/create';
// const ledgerPath = '/account/import-ledger';

function AccountMenuLists ({ changeAccountCallback, className, closeSetting, onFilter, reference }: Props): React.ReactElement<Props> {
//  const { t } = useTranslation();
  const [filter] = useState('');
  // const { isLedgerCapable, isLedgerEnabled } = useLedger();
  const { hierarchy } = useContext(AccountContext);
  const filteredAccount = filter
    ? hierarchy.filter((account) =>
      account.name?.toLowerCase().includes(filter.toLowerCase())
    )
    : hierarchy;

  // const { master } = useContext(AccountContext);
  //  const mediaAllowed = useContext(MediaContext);
  //  const isPopup = useIsPopup();
  //  const isFirefox = window.localStorage.getItem('browserInfo') === 'Firefox';
  //  const isLinux = window.localStorage.getItem('osInfo') === 'Linux';

  /*  const _openJson = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', jsonPath);
      windowOpen(jsonPath).catch((e) => console.log('error', e));
    }, []
  );

  const _onOpenLedgerConnect = useCallback(
    (): void => {
      window.localStorage.setItem('popupNavigation', ledgerPath);
      windowOpen(ledgerPath).catch(console.error);
    }, []
  );

  const _openCreateAccount = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', createAccountPath);
      windowOpen(createAccountPath).catch((e) => console.log('error', e));
    }, []
  );

  const _onChangeFilter = useCallback((filter: string) => {
    setFilter(filter);
    onFilter && onFilter(filter);
  }, [onFilter]); */

  return (
    /*
    <Menu
      className={className}
      reference={reference}
    > */
    <div className='account-menu-lists'>
      {filteredAccount.map((json, index): React.ReactNode => (
        <HomeAccountsTree
          closeSetting={closeSetting}
          {...json}
          changeAccountCallback={changeAccountCallback}
          key={`${index}:${json.address}`}
        />
      ))}
    </div>

  // </Menu>
  );
}

export default React.memo(styled(AccountMenuLists)(({ theme }: Props) => `
  right: 5px;
  user-select: none;

  .account-menu-lists {
    margin-top : 10px;
    background-color: #FFFFF;

  }

  .account-menu-settings__logo-text {
    font-size: 20px;
    line-height: 32px;
    font-weight: 500;
    color: ${theme.textColor};
  }

  .account-menu-settings__branding {
      display: flex;
      justify-content: center;
      align-items: center;
      color: ${theme.labelColor};
      font-family: ${theme.fontFamily};
      text-align: center;
      margin-right: 15px;

      .logo {
        height: 32px;
        width: 32px;
        margin-right: 10px;
      }
  }

  .account-menu-settings-header {
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    border-bottom:2px solid ${theme.menuItemsBorder};
  }

  .openWindow, .manageWebsiteAccess{
    span {
      color: ${theme.textColor};
      font-size: ${theme.fontSize};
      line-height: ${theme.lineHeight};
      text-decoration: none;
      vertical-align: middle;
    }

    ${Svg} {
      background: ${theme.textColor};
      height: 20px;
      top: 4px;
      width: 20px;
    }
  }

  > .setting {
    > .checkbox {
      color: ${theme.textColor};
      line-height: 20px;
      font-size: 15px;
      margin-bottom: 0;

      &.ledger {
        margin-top: 0.2rem;
      }

      label {
        color: ${theme.textColor};
      }
    }

    > .dropdown {
      background: ${theme.background};
      margin-bottom: 0;
      margin-top: 9px;
      margin-right: 0;
      width: 100%;
    }
  }

  .account-menu-settings__menu-item {
    padding: 0;

    .svg-inline--fa {
      color: ${theme.iconNeutralColor};
      margin-right: 0.3rem;
      width: 0.875em;
    }
  }

  .account-menu-settings__menu-item-text {
    font-size: 15px;
    line-height: 30px;
    color: ${theme.textColor2};
    > span {
      font-weight: 400;
    }
  }

  .account-menu-settings__menu-item:hover {
    .menuItem__text {
      color: ${theme.textColor};
    }

    .svg-inline--fa {
      color: ${theme.iconHoverColor};
    }
  }

  .koni-menu-items-container {
    padding: 0 15px;

    &:last-child {
      padding: 0 27px;
      margin: 8px 0
    }
  }

  .account-menu-settings-items-wrapper {
    border-radius: 8px;
    border: 2px solid ${theme.menuItemsBorder};
    padding: 8px 12px;
    margin-bottom: 8px;
  }

  .account-menu-settings-items-wrapper:last-child {
    margin-bottom: 0;
  }

  .account-menu-settings__input-filter {
    width: 218px;
  }

  .account-menu-settings__input-filter > input {
    height: 40px;
  }
  .account-menu-settings {
	z-index: 1;
	test-align: center;
  }
`));
