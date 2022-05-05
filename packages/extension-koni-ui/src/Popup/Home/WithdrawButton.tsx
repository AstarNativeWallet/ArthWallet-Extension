// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import styled from 'styled-components';

import Tooltip from '@polkadot/extension-koni-ui/components/Tooltip';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

let tooltipId = 10;

interface Props extends ThemeProps {
  className?: string;
  onClick?: () => void;
  tooltipContent?: string;
  iconSrc?: string;
  isDisabled?: boolean;
}

function getContainerClassName (isDisabled: boolean, extraClassName = ''): string {
  let className = `home-action-button action-button ${extraClassName}`;

  if (isDisabled) {
    className += ' -disabled ';
  }

  return className;
}

function HomeActionButton ({ className, isDisabled = false, onClick, tooltipContent }: Props): React.ReactElement {
  const [trigger] = useState(() => `home-action-button-${++tooltipId}`);

  return (
    <>
      <div
        className={getContainerClassName(isDisabled, className)}
        data-for={trigger}
        data-tip={true}
        onClick={onClick}
      >
        <a>EVM Withdraw</a>
        {/* <img
          alt='Icon'
          src={iconSrc}
        /> */}
      </div>
      {tooltipContent && (
        <Tooltip
          offset={{ top: 8 }}
          text={tooltipContent}
          trigger={trigger}
        />
      )}
    </>
  );
}

export default styled(HomeActionButton)(({ theme }: Props) => `
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 40%;
    background-color: ${theme.buttonBackground};
    cursor: pointer;

    img {
      width: 24px;
      height: 24px;
    }

    &.-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
`);
