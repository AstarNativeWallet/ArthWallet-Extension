// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SignerOptions } from '@polkadot/api/submittable/types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import Web3 from 'web3';
import { TransactionConfig } from 'web3-core';

import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BackgroundWindow } from '@polkadot/extension-base/background/KoniTypes';
import { getWeb3Api } from '@polkadot/extension-koni-base/api/web3/web3';
import { Button } from '@polkadot/extension-koni-ui/components';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import Output from '@polkadot/extension-koni-ui/components/Output';
import { useToggle } from '@polkadot/extension-koni-ui/hooks/useToggle';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Address from '@polkadot/extension-koni-ui/Popup/Sending/old/parts/Address';
import Tip from '@polkadot/extension-koni-ui/Popup/Sending/old/parts/Tip';
import Transaction from '@polkadot/extension-koni-ui/Popup/Sending/old/parts/Transaction';
import AccountSigner from '@polkadot/extension-koni-ui/Popup/Sending/old/signers/AccountSigner';
import { AddressProxy, TxHandler } from '@polkadot/extension-koni-ui/Popup/Sending/old/types';
import { cacheUnlock } from '@polkadot/extension-koni-ui/Popup/Sending/old/util';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { decodePair } from '@polkadot/keyring/pair/decode';
import { KeyringPair } from '@polkadot/keyring/types';
import { assert, BN, BN_ZERO, u8aToHex } from '@polkadot/util';
import { addressEq, base64Decode } from '@polkadot/util-crypto';

// import { RequestAccountExportPrivateKey, ResponseAccountExportPrivateKey } from '@polkadot/extension-base/background/KoniTypes';

// import { addressToEvm } from '@polkadot/util-crypto';

/*
import { exportAccountPrivateKey } from '../../messaging';

import { getId } from '@polkadot/extension-base/utils/getId';

function sendMessage<TMessageType extends MessageTypesWithNullRequest> (message: TMessageType): Promise<ResponseTypes[TMessageType]>;
function sendMessage<TMessageType extends MessageTypesWithNoSubscriptions> (message: TMessageType, request: RequestTypes[TMessageType]): Promise<ResponseTypes[TMessageType]>;
function sendMessage<TMessageType extends MessageTypesWithSubscriptions> (message: TMessageType, request: RequestTypes[TMessageType], subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void): Promise<ResponseTypes[TMessageType]>;
function sendMessage<TMessageType extends MessageTypes> (message: TMessageType, request?: RequestTypes[TMessageType], subscriber?: (data: unknown) => void): Promise<ResponseTypes[TMessageType]> {
  return new Promise((resolve, reject): void => {
    const id = getId();

    handlers[id] = { reject, resolve, subscriber };

    port.postMessage({ id, message, request: request || {} });
  });
}

export async function exportAccountPrivateKey (address: string, password: string): Promise<{ privateKey: string }> {
  return sendMessage('pri(accounts.exportPrivateKey)', { address, password });
}
*/

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const { keyring } = bWindow.pdotApi;

interface Props extends ThemeProps {
  amount: BigInt;
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

export function handleTxResults (tx: SubmittableExtrinsic<'promise'>,
  { onTxFail, onTxSuccess, onTxUpdate }: TxHandler,
  unsubscribe: () => void): (result: SubmittableResult) => void {
  return (result: SubmittableResult): void => {
    if (!result || !result.status) {
      return;
    }

    console.log(`Arth : status :: ${JSON.stringify(result)}`);
    console.log('Arth result============', result);
    console.log('Arth tx.toHash()', tx.hash.toHex());

    onTxUpdate && onTxUpdate(result);

    if (result.status.isFinalized || result.status.isInBlock) {
      result.events
        .filter(({ event: { section } }) => section === 'system')
        .forEach(({ event: { method } }): void => {
          const extrinsicHash = tx.hash.toHex();

          if (method === 'ExtrinsicFailed') {
            onTxFail && onTxFail(result, null, extrinsicHash);
          } else if (method === 'ExtrinsicSuccess') {
            onTxSuccess && onTxSuccess(result, extrinsicHash);
          }
        });
    } else if (result.isError) {
      onTxFail && onTxFail(result, null);
    }

    if (result.isCompleted) {
      unsubscribe();
    }
  };
}

async function evmSignAndSend (txHandler: TxHandler, fromAddress: string, password: string, address: string, amount: BigInt): Promise<void> {
  txHandler.onTxStart && txHandler.onTxStart();

  try {
    // const fromAddress: string = pairOrAddress.toString();

    console.log('Arth Call sendEvm');
    keyring.getPair(fromAddress);

    const accounts = keyring.getAccounts();

    accounts.forEach(({ address, meta, publicKey }) =>
      console.log('Arth address: ', address, JSON.stringify(meta), u8aToHex(publicKey))
    );

    const exportedJson = keyring.backupAccount(keyring.getPair(fromAddress), password);
    const decoded = decodePair(password, base64Decode(exportedJson.encoded), exportedJson.encoding.type);

    const privateKey = u8aToHex(decoded.secretKey);

    const web3Api = getWeb3Api('astarEvm');

    console.log('Arth web3Api: ', web3Api);
    // const erc20Contract = getERC20Contract(networkKey, assetAddress);
    const gasPrice = await web3Api.eth.getGasPrice();

    console.log('Arth gasPrice: ', gasPrice);
    // let value = new BN(1000000000);  //1000 ** 18;
    // const value = web3Api.utils.toBN(amount * (10 ** 18)); // new BN(10000000000);  //1000 ** 18;
    const value = amount.toString();

    console.log('Arth BN value: ', value);
    const transactionObject = {
      gasPrice: gasPrice,
      to: address,
      value: value
    } as TransactionConfig;
    const gasLimit = await web3Api.eth.estimateGas(transactionObject);

    transactionObject.gas = gasLimit;
    console.log('Arth gasLimit: ', gasPrice);
    const estimateFee = parseInt(gasPrice) * gasLimit;

    console.log('Arth estimateFee: ', estimateFee);
    const signedTransaction = await web3Api.eth.accounts.signTransaction(transactionObject, privateKey);

    console.log('Arth signedTransaction: ', signedTransaction);
    const sendSignedTransaction = await web3Api.eth.sendSignedTransaction(signedTransaction.rawTransaction);

    console.log('Arth sendSignedTransaction: ', sendSignedTransaction);
  } catch (error) {
    console.error('Arth sendEVM: error:', error);

    txHandler.onTxFail && txHandler.onTxFail(null, error as Error);
  }
}

// async function signAndSend (txHandler: TxHandler, tx: SubmittableExtrinsic<'promise'>, pairOrAddress: KeyringPair | string, options: Partial<SignerOptions>): Promise<void> {
//   txHandler.onTxStart && txHandler.onTxStart();

//   try {
//     const address = '0x96cbef157358b7c90b0481ba8b3db8f58e014116'; // pairOrAddress;
//     const password = '123456';
//     const fromAddress: string = pairOrAddress.toString();

//     console.info('Arth signAndSend txHandler: ', txHandler);
//     console.info('Arth signAndSend tx: ', tx);
//     console.info('Arth signAndSend pairOrAddress: ', pairOrAddress);
//     console.info('Arth signAndSend options: ', options);

//     alert('Hello TypeScript');
//     keyring.getPair(fromAddress);

//     const accounts = keyring.getAccounts();

//     accounts.forEach(({ address, meta, publicKey }) =>
//       console.log('Arth address: ', address, JSON.stringify(meta), u8aToHex(publicKey))
//     );

//     const exportedJson = keyring.backupAccount(keyring.getPair(fromAddress), password);
//     const decoded = decodePair(password, base64Decode(exportedJson.encoded), exportedJson.encoding.type);

//     const privateKey = u8aToHex(decoded.secretKey);

//     console.log('Arth privateKey: ', privateKey);

//     sendEvm();

//     // await tx.signAsync(pairOrAddress, options);

//     // const unsubscribe = await tx.send(handleTxResults(tx, txHandler, (): void => {
//     //  unsubscribe();
//     // }));
//   } catch (error) {
//     console.error('Arth signAndSend: error:', error);

//     txHandler.onTxFail && txHandler.onTxFail(null, error as Error);
//   }
// }

// eslint-disable-next-line @typescript-eslint/require-await
// async function extractParams (api: ApiPromise, address: string, options: Partial<SignerOptions>): Promise<[string, Partial<SignerOptions>]> {
//   const pair = keyring.getPair(address);

//   assert(addressEq(address, pair.address), `Arth Unable to retrieve keypair for ${address}`);

//   return [address, { ...options, signer: new AccountSigner(api.registry, pair) }];
// }

function EvmAuthTransaction ({ amount, api, apiUrl, className, extrinsic, onCancel, recipientId, requestAddress, txHandler }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [error, setError] = useState<Error | null>(null);
  const [isBusy, setBusy] = useState(false);
  const [isRenderError, toggleRenderError] = useToggle();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [senderInfo, setSenderInfo] = useState<AddressProxy>(() => ({ isUnlockCached: false, signAddress: requestAddress, signPassword: '' }));
  const [callHash, setCallHash] = useState<string | null>(null);
  const [tip, setTip] = useState(BN_ZERO);

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

  // const _onSend = useCallback(
  //   async (txHandler: TxHandler, extrinsic: SubmittableExtrinsic<'promise'>, senderInfo: AddressProxy): Promise<void> => {
  //     console.error('Arth Auth _onSend');

  //     if (senderInfo.signAddress) {
  //       const [tx, [pairOrAddress, options]] = await Promise.all([
  //         extrinsic,
  //         extractParams(api, senderInfo.signAddress, { nonce: -1, tip })
  //       ]);

  //       await signAndSend(txHandler, tx, pairOrAddress, options);
  //     }
  //   },
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [api, tip, extrinsic]
  // );

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
              /*
              export async function exportAccountPrivateKey (address: string, password: string): Promise<{ privateKey: string }> {
                return sendMessage('pri(accounts.exportPrivateKey)', { address, password });
              }

              exportAccountPrivateKey('0x96cbef157358b7c90b0481ba8b3db8f58e014116', '123456')
              .then(({ privateKey }) => {
                setPrivateKey(privateKey);
                setIsBusy(false);
              })
              .catch((error: Error) => {
                console.error(error);
                setError(error.message);
                setIsBusy(false);
              });
      */

              _onSend(txHandler, senderInfo.signAddress, senderInfo.signPassword, recipientId, amount).catch(errorHandler);
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
          <div className='kn-l-header__part-1' />
          <div className='kn-l-header__part-2'>
            {t<string>('Authorize Transaction')}
          </div>
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
          </div>
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

          <Address
            onChange={setSenderInfo}
            onEnter={_doStart}
            passwordError={passwordError}
            requestAddress={requestAddress}
          />

          <Tip
            className={'kn-l-tip-block'}
            onChange={setTip}
            registry={api.registry}
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
              className={'kn-l-submit-btn'}
              isBusy={isBusy}
              isDisabled={!senderInfo.signAddress || isRenderError}
              onClick={_doStart}
            >
              {t<string>('Sign and Submit TEST')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default React.memo(styled(EvmAuthTransaction)(({ theme }: ThemeProps) => `
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
    display: flex;
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

  .kn-l-header__part-1 {
    flex: 1;
  }

  .kn-l-header__part-2 {
    color: ${theme.textColor};
    font-size: 20px;
    font-weight: 500;
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
    position: sticky;
    bottom: -15px;
    padding: 15px;
    margin-left: -15px;
    margin-bottom: -15px;
    margin-right: -15px;
    background-color: ${theme.background};
  }
`));
