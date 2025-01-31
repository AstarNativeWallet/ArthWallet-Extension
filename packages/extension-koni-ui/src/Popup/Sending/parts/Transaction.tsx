// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import PaymentInfo from '@polkadot/extension-koni-ui/Popup/Sending/parts/PaymentInfo';
import { BN } from '@polkadot/util';

interface Props {
  accountId: string | null;
  className?: string;
  extrinsic: never; // TODO: change type when do logic
  isSendable: boolean;
  tip?: BN;
}

function Transaction ({ accountId, className, extrinsic, isSendable, tip }: Props): React.ReactElement<Props> | null {
  return (
    <div className={className}>
      <PaymentInfo
        accountId={accountId}
        className='tx-details'
        extrinsic={extrinsic}
        isSendable={isSendable}
        tip={tip}
      />
    </div>
  );
}

export default React.memo(styled(Transaction)`

`);
