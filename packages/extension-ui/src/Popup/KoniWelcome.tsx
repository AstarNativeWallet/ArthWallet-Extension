// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';
import { ActionContext} from '../components';
import useTranslation from '../hooks/useTranslation';
import KoniHeader from "@polkadot/extension-ui/partials/KoniHeader";
import logo from '../assets/KoniverseLogo.svg'
import KoniButtonArea from "@polkadot/extension-ui/components/KoniButtonArea";
import KoniButton from "@polkadot/extension-ui/components/KoniButton";

interface Props extends ThemeProps {
  className?: string;
}

function KoniWelcome ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _onClick = useCallback(
    (): void => {
      window.localStorage.setItem('welcome_read', 'ok');
      onAction();
    },
    [onAction]
  );

  return (
    <>
      <KoniHeader isNotHaveAccount isWelcomeScreen/>
      <div className={className}>
        <div className='welcome-container'>
          <img src={logo} alt="logo" className='welcome-logo'/>
          <span className='welcome-title'>
            Welcome to Koniverse
          </span>
          <span className='welcome-subtitle'>
            The decentralized web awaits
          </span>
          <KoniButtonArea className='welcome-button-wrapper'>
            <KoniButton onClick={_onClick}>{t<string>('Get started')}</KoniButton>
          </KoniButtonArea>
        </div>
      </div>
    </>
  );
};

export default styled(KoniWelcome)(({ theme }: Props) => `
  .welcome-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 47px;
  }

  .welcome-logo {
    margin: 15px 0 30px 0;
    width: 118px;
    height: 118px;
  }

  .welcome-title {
    font-size: 32px;
    line-height: 44px;
    color: ${theme.textColor};
    font-weight: 700;
  }

  .welcome-subtitle {
    margin-top: 3px;
    font-size: 18px;
    line-height: 30px;
    color: ${theme.textColor2};
  }

  .welcome-button-wrapper {
    width: 100%;
    margin-top: 98px;
  }

  p {
    color: ${theme.subTextColor};
    margin-bottom: 6px;
    margin-top: 0;
  }
`);
