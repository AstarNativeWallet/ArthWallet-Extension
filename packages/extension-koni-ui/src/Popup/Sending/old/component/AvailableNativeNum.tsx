// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import type { AccountId, AccountIndex, Address } from '@polkadot/types/interfaces';

import React from 'react';

import { ApiPromise } from '@polkadot/api';
import { useCall } from '@polkadot/extension-koni-ui/Popup/Sending/old/hook/useCall';

import FormatBalance from './getFormatBalanceNum';

interface Props {
  children?: React.ReactNode;
  className?: string;
  label?: React.ReactNode;
  params?: AccountId | AccountIndex | Address | string | Uint8Array | null;
  api: ApiPromise
  apiUrl: string
}

function AvailableDisplay ({ api, apiUrl, children, className = '', label, params }: Props): React.ReactElement<Props> {
  const allBalances = useCall<DeriveBalancesAll>(api.derive.balances?.all, [params], undefined, apiUrl);

  //console.log('Atrh 5 AvailableDisplay params: ', params);
  //console.log('Atrh 5 AvailableDisplay allBalances: ', allBalances);
  //console.log('Atrh 5 AvailableDisplay allBalances.availableBalance: ', allBalances?.availableBalance);

  return (
    <FormatBalance
      className={className}
      label={label}
      registry={api.registry}
      value={params ? allBalances?.availableBalance : undefined}
    >
      {children}
    </FormatBalance>
  );
}

export default React.memo(AvailableDisplay);
