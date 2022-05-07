// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountId, AccountIndex, Address } from '@polkadot/types/interfaces';

import React, { useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { getEVMBalance } from '@polkadot/extension-koni-base/api/web3/balance';
import { state } from '@polkadot/extension-koni-base/background/handlers';

import FormatBalance from './FormatBalance';

interface Props {
  networkKey: string;
  children?: React.ReactNode;
  className?: string;
  label?: React.ReactNode;
  params?: AccountId | AccountIndex | Address | string | Uint8Array | null;
  api: ApiPromise
  apiUrl: string
}

function AvailableDisplay ({ api, children, className = '', label, networkKey }: Props): React.ReactElement<Props> {
  const [EVMBalance, setEVMBalance] = useState<string | undefined>(undefined);

  const getEVMValue = async (networkKey: string): Promise<string> => {
    const address = String(await state.getAccountAddress());

    try {
      const EVMBalances = await getEVMBalance(networkKey, [address]);

      return EVMBalances[0];
    } catch (err) {
      console.log('err is: ', err);

      return '0';
    }
  };

  getEVMValue(networkKey).then((resolve) => {
    setEVMBalance(resolve);
  }).catch(console.error);

  console.log('WatchTest EVMBalance is: ', EVMBalance);

  return (
    <FormatBalance
      className={className}
      label={label}
      registry={api.registry}
      value={EVMBalance}
    >
      {children}
    </FormatBalance>
  );
}

export default React.memo(AvailableDisplay);
