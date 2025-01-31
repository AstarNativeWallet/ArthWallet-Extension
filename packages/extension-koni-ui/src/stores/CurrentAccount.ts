// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AccountJson } from '@polkadot/extension-base/background/types';
import { CurrentAccountType } from '@polkadot/extension-koni-ui/stores/types';

const initialState = {} as CurrentAccountType;

const currentAccountSlice = createSlice({
  initialState,
  name: 'currentAccount',
  reducers: {
    update (state, action: PayloadAction<AccountJson>) {
      state.account = action.payload;
    }
  }
});

export const { update: updateCurrentAccount } = currentAccountSlice.actions;
export default currentAccountSlice.reducer;
