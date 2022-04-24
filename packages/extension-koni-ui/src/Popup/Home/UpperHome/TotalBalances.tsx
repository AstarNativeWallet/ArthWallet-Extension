// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
}

function TotalBalances (): React.ReactElement<Props> {
  return (
    <div className='total-balance'>
      Test
    </div>
  );
}

export default React.memo(styled(TotalBalances)(({ theme }: Props) => `
  .total-balance {
    background-color: ${theme.headerBackground};
    width: 400px;
    height: 200px;
    color: #000000;
  }
`));
