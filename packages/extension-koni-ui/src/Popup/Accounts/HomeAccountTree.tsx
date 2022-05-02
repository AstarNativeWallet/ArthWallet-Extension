// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountWithChildren } from '@polkadot/extension-base/background/types';

import React from 'react';

// import Account from '@polkadot/extension-koni-ui/Popup/Accounts/Account';
import HomeAccountList from '@polkadot/extension-koni-ui/Popup/Accounts/HomeAccountList';

interface Props extends AccountWithChildren {
  parentName?: string;
  closeSetting?: () => void;
  changeAccountCallback?: (address: string) => void;
}

export default function HomeAccountsTree ({ changeAccountCallback, closeSetting, parentName, suri, ...account }: Props): React.ReactElement<Props> {
  return (
    <>
      <HomeAccountList
        {...account}
        changeAccountCallback={changeAccountCallback}
        closeSetting={closeSetting}
        parentName={parentName}
        suri={suri}
      />
      {account?.children?.map((child, index) => (
        <HomeAccountsTree
          closeSetting={closeSetting}
          key={`${index}:${child.address}`}
          {...child}
          parentName={account.name}
        />
      ))}
    </>
  );
}
