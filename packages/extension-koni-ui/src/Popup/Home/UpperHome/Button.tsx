// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  className?: string;
}

function Button (): React.ReactElement<Props> {
  return (
    <div className='upper-home-button'>
    </div>
  );
}

export default React.memo(styled(Button)(({ theme }: Props) => `
  .upper-home-button {
    color: #000000;
  }
`));
