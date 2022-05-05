// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { TransactionConfig, TransactionReceipt } from 'web3-core';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BackgroundWindow } from '@polkadot/extension-base/background/KoniTypes';
import { getWeb3Api } from '@polkadot/extension-koni-base/api/web3/web3';
import { Button } from '@polkadot/extension-koni-ui/components';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import Output from '@polkadot/extension-koni-ui/components/Output';
import { useToggle } from '@polkadot/extension-koni-ui/hooks/useToggle';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Address from '@polkadot/extension-koni-ui/Popup/Sending/old/parts/Address';
import Transaction from '@polkadot/extension-koni-ui/Popup/Sending/old/parts/Transaction';
import { AddressProxy, TxHandler } from '@polkadot/extension-koni-ui/Popup/Sending/old/types';
import { cacheUnlock } from '@polkadot/extension-koni-ui/Popup/Sending/old/util';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { decodePair } from '@polkadot/keyring/pair/decode';
import { BN, u8aToHex } from '@polkadot/util';
import { addressToEvm, base64Decode } from '@polkadot/util-crypto';

import { isValidAddressPolkadotAddress, isValidEvmAddress } from './convert';

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const { keyring } = bWindow.pdotApi;

interface Props extends ThemeProps {
  amount: BN;
  className?: string;
  extrinsic: SubmittableExtrinsic<'promise'>;
  requestAddress: string;
  recipientId: string;
  onCancel: () => void;
  txHandler: TxHandler;
  api: ApiPromise;
  apiUrl: string
}

function unlockAccount ({ isUnlockCached, signAddress, signPassword }: AddressProxy): string | null {
  let publicKey;

  try {
    publicKey = keyring.decodeAddress(signAddress as string);
  } catch (error) {
    console.error(error);

    return 'unable to decode address';
  }

  const pair = keyring.getPair(publicKey);

  try {
    pair.decodePkcs8(signPassword);
    isUnlockCached && cacheUnlock(pair);
  } catch (error) {
    console.error(error);

    return (error as Error).message;
  }

  return null;
}

export function handleTxResults (result: TransactionReceipt,
  { onTxSuccess, onTxUpdate }: TxHandler): (result: TransactionReceipt) => void {
  return (result: TransactionReceipt): void => {
    console.log(`Arth : status :: ${JSON.stringify(result)}`);
    console.log('Arth result============', result);

    onTxUpdate && onTxUpdate(result);

    if (onTxSuccess && result.status) {
      onTxSuccess(result, result.transactionHash);
    }

    console.log('result.status: ', result.status);
    console.log('result.events: ', result.events);
  };
}

async function evmSignAndSend (txHandler: TxHandler, fromAddress: string, password: string, address: string, amount: BN): Promise<void> {
  txHandler.onTxStart && txHandler.onTxStart();

  const { onTxSuccess, onTxUpdate } = txHandler;

  try {
    let toAddress: string;

    if (isValidAddressPolkadotAddress(address)) {
      toAddress = u8aToHex(addressToEvm(address));
    } else {
      if (isValidEvmAddress(address)) {
        toAddress = u8aToHex(addressToEvm(address));
      } else {
        throw Error('Not valid toAddress.');
      }
    }

    console.log('Arth Call sendEvm');
    keyring.getPair(fromAddress);

    const accounts = keyring.getAccounts();

    accounts.forEach(({ meta, publicKey }) =>
      console.log('Arth toAddress: ', toAddress, JSON.stringify(meta), u8aToHex(publicKey))
    );

    const exportedJson = keyring.backupAccount(keyring.getPair(fromAddress), password);
    const decoded = decodePair(password, base64Decode(exportedJson.encoded), exportedJson.encoding.type);

    const privateKey = u8aToHex(decoded.secretKey);

    const web3Api = getWeb3Api('astarEvm');

    console.log('Arth web3Api: ', web3Api);

    const gasPriceMultiplier = 3;
    const gasPrice = gasPriceMultiplier * Number(await web3Api.eth.getGasPrice());

    console.log('Arth gasPrice: ', gasPrice);
    const value = amount;

    console.log('Arth BN value: ', value);
    const transactionObject = {
      gasPrice: gasPrice,
      to: toAddress,
      value: value
    } as TransactionConfig;

    const gasLimit = await web3Api.eth.estimateGas(transactionObject);

    transactionObject.gas = gasLimit;
    console.log('Arth gasLimit: ', gasLimit);
    const estimateFee = gasPrice * gasLimit;

    console.log('Arth estimateFee: ', estimateFee);
    const signedTransaction = await web3Api.eth.accounts.signTransaction(transactionObject, privateKey);

    console.log('Arth signedTransaction: ', signedTransaction);

    if (typeof signedTransaction.rawTransaction !== 'undefined') {
      const sendSignedTransaction = await web3Api.eth.sendSignedTransaction(signedTransaction.rawTransaction);

      console.log('Arth sendSignedTransaction: ', sendSignedTransaction);

      const result = sendSignedTransaction;

      onTxUpdate && onTxUpdate(result);

      const extrinsicHash: string = result.transactionHash;

      if (onTxSuccess && result.status) {
        onTxSuccess(result, extrinsicHash);
      }
    }
  } catch (error) {
    console.error('Arth sendEVM: error:', error);

    txHandler.onTxFail && txHandler.onTxFail(null, error as Error);
  }
}

function EvmAuthTransactionEvmToEvmDeposit ({ amount, api, apiUrl, className, extrinsic, onCancel, recipientId, requestAddress, txHandler }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [error, setError] = useState<Error | null>(null);
  const [isBusy, setBusy] = useState(false);
  const [isRenderError, toggleRenderError] = useToggle();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [senderInfo, setSenderInfo] = useState<AddressProxy>(() => ({ isUnlockCached: false, signAddress: requestAddress, signPassword: '' }));
  const [callHash, setCallHash] = useState<string | null>(null);

  useEffect((): void => {
    setPasswordError(null);
  }, [senderInfo]);

  // when we are sending the hash only, get the wrapped call for display (proxies if required)
  useEffect((): void => {
    const method = extrinsic.method;

    setCallHash((method && method.hash.toHex()) || null);
  }, [api, extrinsic, senderInfo]);

  const _unlock = useCallback(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (): Promise<boolean> => {
      let passwordError: string | null = null;

      if (senderInfo.signAddress) {
        passwordError = unlockAccount(senderInfo);
      }

      setPasswordError(passwordError);

      return !passwordError;
    },
    [senderInfo]
  );

  const _onSend = useCallback(
    async (txHandler: TxHandler, fromAddress: string, password: string, address: string, amount: BN): Promise<void> => {
      await evmSignAndSend(txHandler, fromAddress, password, address, amount);
    }, []
  );

  const _doStart = useCallback(
    (): void => {
      setBusy(true);

      setTimeout((): void => {
        const errorHandler = (error: Error): void => {
          console.error(error);

          setBusy(false);
          setError(error);
        };

        _unlock()
          .then((isUnlocked): void => {
            if (isUnlocked) {
              if (senderInfo.signAddress !== null) {
                _onSend(txHandler, senderInfo.signAddress, senderInfo.signPassword, recipientId, amount).catch(errorHandler);
              }
            } else {
              setBusy(false);
            }
          })
          .catch((error): void => {
            errorHandler(error as Error);
          });
      }, 0);
    },
    [_onSend, _unlock, txHandler, senderInfo, recipientId, amount]
  );

  const _onCancel = useCallback(() => {
    onCancel();
  },
  [onCancel]
  );

  if (error) {
    console.log('error in Auth::', error);
  }

  return (
    <div className={className}>
      <Modal className={'kn-signer-modal'}>
        <div className='kn-l-header'>
          <div className='kn-l-header__part-2'>
            {t<string>('Authorize Transaction')}
          </div>
          {/**
          <div className='kn-l-header__part-3'>
            {isBusy
              ? (
                <span className={'kn-l-close-btn -disabled'}>{t('Cancel')}</span>
              )
              : (
                <span
                  className={'kn-l-close-btn'}
                  onClick={_onCancel}
                >{t('Cancel')}</span>
              )
            }
          </div> */}
        </div>
        <div className='kn-l-body'>
          <div className={'kn-l-transaction-info-block'}>
            <Transaction
              accountId={senderInfo.signAddress}
              api={api}
              apiUrl={apiUrl}
              extrinsic={extrinsic}
              isBusy={isBusy}
              onError={toggleRenderError}
            />
          </div>
          <a className='address-text'>
            {t<string>('Send from address')}
          </a>
          <Address
            onChange={setSenderInfo}
            onEnter={_doStart}
            passwordError={passwordError}
            requestAddress={requestAddress}
          />
          <Output
            className={'kn-l-call-hash'}
            isDisabled
            isTrimmed
            label={t<string>('Call hash')}
            value={callHash}
            withCopy
          />
          <div className='kn-l-submit-wrapper'>
            <Button
              className={'cancel-btn'}
              onClick={_onCancel}
            >
              {t<string>('cancel')}
            </Button>
            <Button
              className={'kn-l-submit-btn'}
              isBusy={isBusy}
              isDisabled={!senderInfo.signAddress || isRenderError}
              onClick={_doStart}
            >
              {t<string>('Sign and Submit')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default React.memo(styled(EvmAuthTransactionEvmToEvmDeposit)(({ theme }: ThemeProps) => `
  .subwallet-modal {
    max-width: 460px;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid ${theme.extensionBorder};
  }

  .kn-l-header {
    display: block;
    align-items: center;
    height: 72px;
    box-shadow: ${theme.headerBoxShadow};
  }

  .kn-l-body {
    flex: 1;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 25px;
    overflow-y: auto;
  }
  .kn-l-header__part-2 {
    color: ${theme.textColor};
    font-size: 20px;
    font-weight: 500;
    text-align:center;
    align-items:center;
    margin: 20px 0;
  }

  .kn-l-header__part-3 {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .kn-l-close-btn {
    padding-left: 16px;
    padding-right: 16px;
    height: 40px;
    display: flex;
    align-items: center;
    color: #04C1B7;
    font-weight: 500;
    cursor: pointer;

    &.-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  .kn-l-transaction-info-block {
    margin-bottom: 20px;
  }

  .kn-l-tip-block {
    margin-top: 10px;
  }

  .kn-l-call-hash {
    margin-top: 20px;
  }
  .kn-l-submit-wrapper {
    z-index:10;
    position: sticky;
    bottom: -15px;
    padding: 15px 0px;
    margin-left: -15px;
    margin-bottom: -15px;
    margin-right: -15px;
    background-color: ${theme.background};
  }
  .cancel-btn {
    display: inline-block;
    margin-right: 28px;
    margin-left: 15px;
    height: 48px;
    width: 144px;
    background: rgba(48, 59, 87, 1);
    border-radius: 6px;
}
  .kn-l-submit-btn {
    display: inline-block;
    height: 48px;
    width: 256px;
    border-radius: 6px;
    background: rgba(40, 78, 169, 1);
  }
`));
