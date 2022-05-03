// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from 'styled-components';

import failStatus from '@polkadot/extension-koni-ui/assets/fail-status.svg';
import successStatus from '@polkadot/extension-koni-ui/assets/success-status.svg';
import { ActionContext, Button } from '@polkadot/extension-koni-ui/components';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { TxResult } from '@polkadot/extension-koni-ui/Popup/Sending/old/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { getScanExplorerTransactionHistoryUrl, isSupportSubscan, toShort } from '@polkadot/extension-koni-ui/util';

import cloneLogo from '../../../assets/clone.svg';
// /Users/noda/ArthWallet-Extension/ArthWallet-Extension/packages/extension-koni-ui/src/assets/clone.svg
// /Users/noda/ArthWallet-Extension/ArthWallet-Extension/packages/extension-koni-ui/src/Popup/Sending/old/SendEvmFundResult.tsx

export interface Props extends ThemeProps {
  className?: string;
  txResult: TxResult;
  networkKey: string;
  onResend: () => void;
  successResultText?: string;
  failResultText?: string;
}

function getErrorMessage (txError?: Error | null): string | null {
  if (!txError) {
    return null;
  }

  if (txError.message) {
    return txError.message;
  }

  return null;
}

function SendEvmFundResult ({ className = '', failResultText = 'Send Fund Fail', networkKey, onResend, successResultText = 'Send Fund Successful', txResult: { extrinsicHash, isTxSuccess, txError } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();
  const navigate = useContext(ActionContext);
  const [isReadySubscan, setisReadySubscan] = useState(false);
  const _backToHome = useCallback(
    () => {
      window.localStorage.setItem('popupNavigation', '/');
      navigate('/');
    },
    [navigate]
  );

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const viewTransactionBtn = (networkKey: string, extrinsicHash: string) => {
    console.log('isReadySubscan: ', isReadySubscan);
    const waitingTime = 60000;
    const waitingTimeView: number = waitingTime / 1000;

    setTimeout(() => {
      setisReadySubscan(true);
      console.log('isReadySubscan: ', isReadySubscan);
    }, waitingTime);

    return isSupportSubscan(networkKey) && isReadySubscan
    // return isSupportSubscan(networkKey)
      ? <div className='view-transaction'>
        <CopyToClipboard text={extrinsicHash || ''}>
          <div
            // className='account-qr-modal__address'
            onClick={_onCopy}
          >
            <div className='account-qr-modal__address-text'>
              <a className = 'tx-hash-title'>{t<string>('Txhash: ')}</a>
              {toShort(extrinsicHash, 13, 13)}
              <img
                alt='clone'
                className='account-qr-modal__clone-logo'
                src={cloneLogo}
              />
            </div>
          </div>
        </CopyToClipboard>
        <a
          className='kn-send-fund-stt-btn kn-view-history-btn'
          href={getScanExplorerTransactionHistoryUrl(networkKey, extrinsicHash)}
          // href='https://astar.subscan.io/'
          rel='noreferrer'
          target={'_blank'}
        >
          {t<string>('View Transaction')}
          {/* {t<string>('Jump to subscan')} */}
        </a>
      </div>
      : <div className='view-transaction'>
        {extrinsicHash &&
        <CopyToClipboard text={extrinsicHash || ''}>
          <div
          // className='account-qr-modal__address'
            onClick={_onCopy}
          >
            <div className='account-qr-modal__address-text'>
              <a className = 'tx-hash-title'>{t<string>('Txhash: ')}</a>
              {toShort(extrinsicHash, 13, 13)}
              <img
                alt='clone'
                className='account-qr-modal__clone-logo'
                src={cloneLogo}
              />
            </div>
          </div>
        </CopyToClipboard>
        }
        <span className='kn-send-fund-stt-btn kn-view-history-btn -disabled'>
          {t<string>(`View Transaction available in ${waitingTimeView.toString()} s`)}
          {/* {t<string>('View Transaction')} */}
        </span>
      </div>;
  };

  const errorMessage = getErrorMessage(txError);

  return (
    <div className={`kn-send-fund-result-wrapper ${className}`}>
      {isTxSuccess
        ? <div className='kn-send-fund-result'>
          <img
            alt='success'
            className='kn-status-img'
            src={successStatus}
          />
          <div className='kn-stt-text'>{t<string>(successResultText)}</div>
          <div
            className='kn-stt-subtext'
          >{t<string>('Your request has been confirmed. You can track its progress on the Transaction History page.')}</div>
          <Button
            className='kn-send-fund-stt-btn'
            onClick={_backToHome}
          >
            {t<string>('Back To Home')}
          </Button>
          {extrinsicHash && viewTransactionBtn(networkKey, extrinsicHash)}
        </div>
        : <div className='kn-send-fund-result'>
          <img
            alt='fail'
            className='kn-status-img'
            src={failStatus}
          />
          <div className='kn-stt-text'>{t<string>(failResultText)}</div>
          <div className='kn-stt-subtext'>
            {extrinsicHash
              ? (t<string>('There was a problem with your request. You can track its progress on the Transaction History page.'))
              : (t<string>('There was a problem with your request.'))
            }
            {errorMessage && (
              <div className={'kn-l-text-danger'}>{errorMessage}</div>
            )}
          </div>
          <Button
            className='kn-send-fund-stt-btn'
            onClick={onResend}
          >
            {t<string>('Resend')}
          </Button>
          {extrinsicHash && viewTransactionBtn(networkKey, extrinsicHash)}
        </div>
      }
    </div>
  );
}

export default React.memo(styled(SendEvmFundResult)(({ theme }: ThemeProps) => `
  margin: 20px 45px 0;

  .tx-hash-title {
    width: 70px;
    text-align: left;
    color: white;
    background-color: rgb(170 170 170);
    padding: 2px 10px 2px 5px;
    margin: 0px 5px 0px 0px;
    border-radius: 4px;
  }

  .view-transaction {
    width: 100%;
  }

  .account-qr-modal__address {
    border-radius: 8px;
    background-color: ${theme.backgroundAccountAddress};
    width: 100%;
    margin-bottom: 15px;
    cursor: pointer;
  }

  .account-qr-modal__address-text {
    font-size: 15px;
    line-height: 26px;
    color: black;
    max-width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    padding: 10px;
    display: flex;
    -webkit-box-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    align-items: center;
    margin-bottom: 12px;
    margin-left: 0px;
    box-sizing: border-box;
    border: none;
    border-radius: 8px;
    background-color: rgb(249, 249, 249);
  }

  .account-qr-modal__clone-logo {
    padding-left: 10px;
    cursor : pointer;
  }

  .kn-send-fund-result {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .kn-status-img {
    width: 120px;
    margin-top: 10px;
    margin-bottom: 32px;
  }

  .kn-stt-text {
    font-size: 20px;
    line-height: 36px;
    color: ${theme.textColor};
    font-weight: 500;
  }

  .kn-stt-subtext {
    color: ${theme.textColor};
    margin-bottom: 30px;
    text-align: center;
    font-size: 14px;
  }

  .kn-send-fund-stt-btn {
    margin-bottom: 10px;
  }

  .kn-l-text-danger {
    color: ${theme.iconDangerColor};
  }

  .kn-send-fund-stt-btn > .children {
    font-weight: 500;
  }

  .kn-view-history-btn {
    background-color: ${theme.buttonBackground2};
    color: ${theme.buttonTextColor3};
    cursor: pointer;
    display: flex;
    width: 100%;
    height: 48px;
    box-sizing: border-box;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    line-height: 26px;
    padding: 0 1rem;
    position: relative;
    text-align: center;
    text-decoration: none;
    align-items: center;
    justify-content: center;
    font-weight: 500;

    &.-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  .kn-view-history-btn-transaction {
    background-color: ${theme.buttonBackground2};
    color: ${theme.buttonTextColor3};
    cursor: pointer;
    display: flex;
    width: 100%;
    height: 100px;
    box-sizing: border-box;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    line-height: 26px;
    padding: 0 1rem;
    position: relative;
    text-align: center;
    text-decoration: none;
    align-items: center;
    justify-content: center;
    font-weight: 500;

    &.-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
`));
