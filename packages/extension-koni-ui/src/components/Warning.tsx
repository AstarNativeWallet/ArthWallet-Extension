// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import danger from '@polkadot/extension-koni-ui/assets/danger.svg';
import warning from '@polkadot/extension-koni-ui/assets/warning.svg';

interface Props extends ThemeProps {
  children: React.ReactNode;
  className?: string;
  isBelowInput?: boolean;
  isDanger?: boolean;
  // _onClick?: () => void;
}

function Warning ({ children, className = '', isBelowInput, isDanger }: Props): React.ReactElement<Props> {
  return (
    <div className={`${className} ${isDanger ? 'danger' : ''} ${isBelowInput ? 'belowInput' : ''}`}>
      {isDanger
        ? (<img
          alt='danger'
          className='warning-image'
          src={danger}
          // eslint-disable-next-line @typescript-eslint/indent
           />)
        : (<img
          alt='warning'
          className='warning-image'
          src={warning}
          // eslint-disable-next-line @typescript-eslint/indent
           />)
      }
      <div className='warning-message'>{children}</div>
      {/* {_onClick ? <button onClick={_onClick}>Press button for reset warning</button> : <></>} */}
    </div>
  );
}

export default React.memo(styled(Warning)<Props>(({ isDanger, theme }: Props) => `
  display: flex;
  flex-direction: row;
  color: ${theme.subTextColor};
  background-color: ${theme.warningBackgroundColor};
  border-radius: 8px;
  padding: 12px 15px;

  &.danger {
    background-color: ${theme.dangerBackgroundColor};
  }

  .warning-message {
    display: flex;
    font-size: 14px;
    line-height: 24px;
    align-items: center;
    font-weight: 400;
    color: ${theme.textColor};
  }

  .warning-image {
    margin-right: 10px;
    align-self: flex-start;
  }
`));
