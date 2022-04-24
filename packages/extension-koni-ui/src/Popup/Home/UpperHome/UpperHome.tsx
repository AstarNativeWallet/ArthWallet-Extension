// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../../types';

import React from 'react';
import styled from 'styled-components';

import TotalBalances from './TotalBalances';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
}

function UpperHome (): React.ReactElement<Props> {
  return (
    <div className='upper-home'>
      <TotalBalances />
    </div>
  );
}

export default React.memo(styled(UpperHome)(({ theme }: Props) => `
  .upper-home {
    justify-content: center;
    display: flex;
  }
`));
