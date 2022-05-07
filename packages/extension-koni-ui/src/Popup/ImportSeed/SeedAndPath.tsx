/* eslint-disable react-hooks/exhaustive-deps */
// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import RadioStatus from '@polkadot/extension-koni-ui/components/RadioStatus';
import { validateSeedV2 } from '@polkadot/extension-koni-ui/messaging';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@polkadot/extension-koni-ui/Popup/CreateAccount';
import { getGenesisOptionsByAddressType } from '@polkadot/extension-koni-ui/util';
import { objectSpread } from '@polkadot/util';

import { AccountContext, AccountInfoEl, ButtonArea, Dropdown, NextStepButton, TextAreaWithLabel, Warning } from '../../components';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useTranslation from '../../hooks/useTranslation';
import { Theme } from '../../types';

interface Props {
  className?: string;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
  onEvmAccountChange: (evmAccount: AccountInfo | null) => void;
  keyTypes: KeypairType[];
  onSelectAccountImported?: (keyTypes: KeypairType[]) => void
  type: KeypairType;
  account: AccountInfo | null;
  evmAccount: AccountInfo | null;
  name: string | null;
  evmName: string | null;
  setSelectedGenesis: (genesis: string) => void;
}

function SeedAndPath ({ account, className, evmAccount, evmName, keyTypes, name, onAccountChange, onEvmAccountChange, onNextStep, onSelectAccountImported, setSelectedGenesis, type }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const [address, setAddress] = useState('');
  const [evmAddress, setEvmAddress] = useState<null | string>(null);
  const options = useGenesisHashOptions();
  const [genesisHashOption, setGenesisHashOption] = useState(options);
  const [seed, setSeed] = useState<string | null>(null);
  // const [advanced, setAdvances] = useState(false);
  const [error, setError] = useState('');
  const [genesis, setGenesis] = useState('');
  const [evmGenesis, setEvmGenesis] = useState('');
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const [isNormalAccountSelected, setNormalAccountSelected] = useState(false);
  const [isEvmAccountSelected, setEvmAccountSelected] = useState(false);
  const networkRef = useRef(null);
  const evmNetworkRef = useRef(null);
  const dep = keyTypes.toString();

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    if (!seed) {
      onAccountChange(null);
      onEvmAccountChange(null);

      return;
    }

    const suri = `${seed || ''}`;

    validateSeedV2(seed, keyTypes)
      .then(({ addressMap, seed }) => {
        const address = addressMap[SUBSTRATE_ACCOUNT_TYPE];
        const evmAddress = addressMap[EVM_ACCOUNT_TYPE];

        if (evmAddress) {
          setGenesisHashOption(getGenesisOptionsByAddressType(evmAddress, accounts, options));
        } else {
          setGenesisHashOption(getGenesisOptionsByAddressType(null, accounts, options));
        }

        if (address) {
          setAddress(address);
          setSelectedGenesis(genesis);
        }

        if (evmAddress) {
          setEvmAddress(evmAddress);
          setSelectedGenesis(evmGenesis);
        }

        onAccountChange(
          objectSpread<AccountInfo>({}, { address, suri, genesis, type })
        );

        onEvmAccountChange(
          objectSpread<AccountInfo>({}, { address: evmAddress, suri, genesis: evmGenesis, type: EVM_ACCOUNT_TYPE })
        );

        setError('');
      })
      .catch(() => {
        setAddress('');
        setEvmAddress('');
        onAccountChange(null);
        onEvmAccountChange(null);
        setError(t<string>('Invalid mnemonic seed'));
      });
  }, [t, genesis, seed, onAccountChange, onEvmAccountChange, type, dep, evmGenesis]);

  const _onSelectNormalAccount = useCallback(() => {
    if (!isNormalAccountSelected) {
      setGenesisHashOption(getGenesisOptionsByAddressType(null, accounts, options));
      onSelectAccountImported && onSelectAccountImported([SUBSTRATE_ACCOUNT_TYPE]);
      setNormalAccountSelected(true);
      setEvmAccountSelected(false);
      setEvmGenesis('');
    } else {
      onSelectAccountImported && onSelectAccountImported([]);
      setNormalAccountSelected(false);
      setGenesis('');
    }
  }, [isEvmAccountSelected, isNormalAccountSelected, onSelectAccountImported]);

  const _onSelectEvmAccount = useCallback(() => {
    if (!isEvmAccountSelected) {
      setGenesisHashOption(getGenesisOptionsByAddressType(evmAddress, accounts, options));
      onSelectAccountImported && onSelectAccountImported([EVM_ACCOUNT_TYPE]);
      setNormalAccountSelected(false);
      setEvmAccountSelected(true);
      setGenesis('');
    } else {
      onSelectAccountImported && onSelectAccountImported([]);
      setEvmAccountSelected(false);
      setEvmGenesis('');
    }
  }, [isEvmAccountSelected, isNormalAccountSelected, onSelectAccountImported]);

  const onChangeAccountGenesis = useCallback((genesis: string) => {
    setGenesis(genesis);
    setSelectedGenesis(genesis);
  }, [setSelectedGenesis]);

  const onChangeEvmAccountGenesis = useCallback((genesis: string) => {
    setEvmGenesis(genesis);
    setSelectedGenesis(genesis);
  }, [setSelectedGenesis]);

  return (
    <div className={className}>
      <div className='account-info-wrapper'>
        <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} seed-and-path-wrapper`}>
          <div className='account-info-item'>
            <RadioStatus
              checked={isNormalAccountSelected}
              className='account-info-item__radio-btn'
              onChange={_onSelectNormalAccount}
            />
            <AccountInfoEl
              address={address}
              className='account-info'
              genesisHash={account?.genesis}
              name={name}
            />
          </div>
          <div className='account-info-item'>
            <RadioStatus
              checked={isEvmAccountSelected}
              className='account-info-item__radio-btn'
              onChange={_onSelectEvmAccount}
            />
            <AccountInfoEl
              address={evmAddress}
              className='account-info'
              genesisHash={evmAccount?.genesis}
              name={evmName}
              type={EVM_ACCOUNT_TYPE}
            />
          </div>
          <TextAreaWithLabel
            className='seed-and-path__seed-input'
            isError={!!error}
            isFocused
            label={t<string>('existing 12 or 24-word mnemonic seed')}
            onChange={setSeed}
            rowsCount={2}
            value={seed || ''}
          />
          {!!error && !seed && (
            <Warning
              className='seed-and-path__error'
              isBelowInput
              isDanger
            >
              {t<string>('Mnemonic needs to contain 12, 15, 18, 21, 24 words')}
            </Warning>
          )}
          {isNormalAccountSelected && seed &&
            <Dropdown
              className='seed-and-path__genesis-selection'
              label={t<string>('Network')}
              onChange={onChangeAccountGenesis}
              options={genesisHashOption}
              reference={networkRef}
              value={genesis}
            />
          }
          {isEvmAccountSelected && seed &&
            <Dropdown
              className='seed-and-path__genesis-selection'
              label={t<string>('Network')}
              onChange={onChangeEvmAccountGenesis}
              options={genesisHashOption}
              reference={evmNetworkRef}
              value={evmGenesis}
            />
          }
          {!!error && !!seed && (
            <Warning
              className='seed-and-path__error'
              isDanger
            >
              {error}
            </Warning>
          )}
        </div>
      </div>
      <ButtonArea>
        <NextStepButton
          className='next-step-btn'
          isDisabled={(!address && !evmAddress) || !!error || !seed || (!isNormalAccountSelected && !isEvmAccountSelected)}
          onClick={onNextStep}
        >
          {t<string>('Next Step')}
        </NextStepButton>
      </ButtonArea>
    </div>
  );
}

export default styled(SeedAndPath)(({ theme }: ThemeProps) => `
  padding: 25px 15px 15px;
  flex: 1;
  overflow-y: auto;

  .seed-and-path__advanced-toggle {
    color: ${theme.textColor};
    cursor: pointer;
    line-height: ${theme.lineHeight};
    letter-spacing: 0.04em;
    opacity: 0.65;
    text-transform: uppercase;
    margin-top: 13px;

    > span {
      font-size: ${theme.inputLabelFontSize};
      line-height: 26px;
      margin-left: .5rem;
      vertical-align: middle;
      color: ${theme.textColor2};
      font-weight: 500;
    }
  }

  .seed-and-path-wrapper {
    padding-bottom: 5px;
  }

  .next-step-btn {
    > .children {
      display: flex;
      align-items: center;
      position: relative;
      justify-content: center;
    }
  }

  .seed-and-path__genesis-selection {
    line-height: 26px;
    margin-bottom: 10px;
    label {
      color: ${theme.textColor2};
    }
  }

  .seed-and-path__seed-input {
    margin-bottom: 10px;
    color: ${theme.textColor2};
    textarea {
      height: 80px;
      margin-top: 4px;
    }
  }

  .account-info-item__radio-btn {
    padding-right: 10px;
  }

  .seed-and-path__error {
    margin-bottom: 10px;
  }

  .account-info-item {
    display: flex;
    align-items: center;
    position: relative;

    .account-info-banner.account-info-chain {
      right: 0;
    }
  }

  .account-info {
    width: 100%;
  }
`);
