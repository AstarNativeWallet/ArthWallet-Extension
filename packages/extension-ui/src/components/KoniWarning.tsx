// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';
import React from 'react';
import styled from 'styled-components';
import warning from "@polkadot/extension-ui/assets/warning.svg";
import danger from "@polkadot/extension-ui/assets/danger.svg";

interface Props extends ThemeProps {
  children: React.ReactNode;
  className?: string;
  isBelowInput?: boolean;
  isDanger?: boolean;
}

function KoniWarning ({ children, className = '', isBelowInput, isDanger }: Props): React.ReactElement<Props> {
  return (
    <div className={`${className} ${isDanger ? 'danger' : ''} ${isBelowInput ? 'belowInput' : ''}`}>
      {isDanger
        ? (<img src={danger} alt="danger" className='warningImage'/>)
        : (<img src={warning} alt="warning" className='warningImage'/>)
      }
      <div className='warning-message'>{children}</div>
    </div>
  );
}

export default React.memo(styled(KoniWarning)<Props>(({ isDanger, theme }: Props) => `
  display: flex;
  flex-direction: row;
  color: ${theme.subTextColor};
  background-color: ${theme.warningBackgroundColor};
  border-radius: 8px;
  padding: 12px 15px;

  // &.belowInput {
  //   font-size: ${theme.labelFontSize};
  //   line-height: ${theme.labelLineHeight};
  //
  //   &.danger {
  //     margin-top: 10px;
  //   }
  // }

  &.danger {
    background-color: ${theme.dangerBackgroundColor};
  }

  .warning-message {
    display: flex;
    font-size: 15px;
    line-height: 24px;
    align-items: center;
    font-weight: 400;
    color: ${theme.textColor};
  }

  .warningImage {
    margin-right: 10px;
    align-self: flex-start;
  }
`));
