// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Button, Warning } from '@polkadot/extension-koni-ui/components';
import LoadingContainer from '@polkadot/extension-koni-ui/components/LoadingContainer';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { updateTransactionHistory } from '@polkadot/extension-koni-ui/messaging';
import { Header } from '@polkadot/extension-koni-ui/partials';
import AuthTransaction from '@polkadot/extension-koni-ui/Popup/Sending/old/AuthTransaction';
import useApi from '@polkadot/extension-koni-ui/Popup/Sending/old/hook/useApi';
import { TxResult } from '@polkadot/extension-koni-ui/Popup/Sending/old/types';
import WithdrawEvmDepositResult from '@polkadot/extension-koni-ui/Popup/Sending/old/WithdrawEvmDepositResult';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { isAccountAll } from '@polkadot/extension-koni-ui/util';
import { BN, isFunction } from '@polkadot/util';

import { buildEvmAddress } from './convert';

interface Props extends ThemeProps {
  className?: string;
}

interface ContentProps extends ThemeProps {
  className?: string;
  setWrapperClass: (classname: string) => void;
  api: ApiPromise;
  apiUrl: string;
  currentAccount?: AccountJson | null;
  isEthereum: boolean;
  networkKey: string;
}

type ExtractTxResultType = {
  change: string;
  fee?: string;
}

function extractTxResult (result: SubmittableResult): ExtractTxResultType {
  let change = '0';
  let fee;

  const { events } = result;

  const transferEvent = events.find((e) =>
    e.event.section === 'evm' &&
    e.event.method.toLowerCase() === 'withdraw'
  );

  if (transferEvent) {
    change = transferEvent.event.data[2]?.toString() || '0';
  }

  const withdrawEvent = events.find((e) =>
    e.event.section === 'balances' &&
    e.event.method.toLowerCase() === 'withdraw');

  if (withdrawEvent) {
    fee = withdrawEvent.event.data[1]?.toString();
  }

  return {
    change,
    fee
  };
}

type SupportType = 'NETWORK' | 'ACCOUNT';

function Wrapper ({ className = '', theme }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { currentAccount: { account: currentAccount },
    currentNetwork: { isEthereum, networkKey } } = useSelector((state: RootState) => state);
  const [wrapperClass, setWrapperClass] = useState<string>('');
  const { api, apiUrl, isApiReady, isNotSupport } = useApi(networkKey);

  const isProviderSupportSendFund = !!api && !!api.tx && !!api.tx.balances;

  const notSupportSendFund = (supportType: SupportType = 'NETWORK') => {
    return (
      <div className={'kn-l-screen-content'}>
        <Warning>
          { supportType === 'NETWORK' &&
            t<string>('The action is not supported for the current network. Please switch to another network.')
          }
          { supportType === 'ACCOUNT' &&
            t<string>('The action is not supported for the current account. Please switch to another account.')
          }
        </Warning>
      </div>
    );
  };

  const renderContent = () => {
    console.log('Arth WithdrawEvmDeposit content rendering.');

    if (currentAccount && isAccountAll(currentAccount.address)) {
      return notSupportSendFund('ACCOUNT');
    }

    return (
      isApiReady
        ? isProviderSupportSendFund
          ? (
            <WithdrawEvmDeposit
              api={api}
              apiUrl={apiUrl}
              className={'send-fund-container'}
              currentAccount={currentAccount}
              isEthereum={isEthereum}
              networkKey={networkKey}
              setWrapperClass={setWrapperClass}
              theme={theme}
            />
          )
          : notSupportSendFund()
        : isNotSupport
          ? notSupportSendFund()
          : (<LoadingContainer />)
    );
  };

  return (
    <div className={`-wrapper ${className} ${wrapperClass}`}>
      <Header
        showAdd
        showSearch
        showSettings
        showSubHeader
        subHeaderName={t<string>('Withdraw EVM Deposit')}
      />
      {renderContent()}
    </div>
  );
}

function WithdrawEvmDeposit ({ api, apiUrl, currentAccount, networkKey, setWrapperClass }: ContentProps): React.ReactElement {
  const { t } = useTranslation();

  const propSenderId = currentAccount?.address;

  const senderId = propSenderId;
  const [extrinsic, setExtrinsic] = useState<SubmittableExtrinsic<'promise'> | null>(null);
  const [isShowTxModal, setShowTxModal] = useState<boolean>(false);
  const [txResult, setTxResult] = useState<TxResult>({ isShowTxResult: false, isTxSuccess: false });
  const [evmDepositAmount, setEvmDepositAmount] = useState<BN | null>(null);
  const [displayEvmDepositAmount, setDisplayEvmDepositAmount] = useState<number | null>(null);
  const { isShowTxResult } = txResult;

  setTimeout((): void => {
    chrome.storage.local.get(['displayEvmDepositAmount'], function (result) {
      if (typeof result.displayEvmDepositAmount === 'number') {
        setDisplayEvmDepositAmount(result.displayEvmDepositAmount);
      } else {
        setDisplayEvmDepositAmount(0);
      }
    });
  }, 500);

  const txParams: unknown[] | (() => unknown[]) | null =
    useMemo(() => {
      if (typeof propSenderId !== 'undefined') {
        const h160address = buildEvmAddress(propSenderId);

        setTimeout((): void => {
          chrome.storage.local.get(['evmDepositAmount'], function (result) {
            if (typeof result.evmDepositAmount === 'string') {
              const withdrawEvmDepositAmount: BN = new BN(result.evmDepositAmount);

              setEvmDepositAmount(withdrawEvmDepositAmount);
            } else {
              console.log('evmDepositAmount is not valid type.', result.evmDepositAmount);
            }
          });
        }, 500);

        setTimeout((): void => {
          chrome.storage.local.get(['evmTransferbleAmount'], function (result) {
            if (typeof result.evmTransferbleAmount === 'string') {
              const evmTransferbleAmount: BN = new BN(result.evmTransferbleAmount);

              console.log('Arth evmTransferbleAmount is not valid type.', evmTransferbleAmount);

              // setEvmDepositAmount(withdrawEvmDepositAmount);
            } else {
              console.log('Arth evmTransferbleAmount is not valid type.', result.evmDepositAmount);
            }
          });
        }, 500);

        return isFunction(api.tx.evm.withdraw) ? [h160address, evmDepositAmount] : null;
      }

      return null;
    }, [api.tx.evm.withdraw, evmDepositAmount, propSenderId]);

  const tx: ((...args: any[]) => SubmittableExtrinsic<'promise'>) | null =
    isFunction(api.tx.evm.withdraw)
      ? api.tx.evm.withdraw
      : null;

  const _onSend = useCallback(() => {
    if (tx) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setExtrinsic(tx(...(
        isFunction(txParams)
          ? txParams()
          : (txParams || [])
      )));

      setShowTxModal(true);
    }
  }, [tx, txParams]);

  const _onCancelTx = useCallback(() => {
    setExtrinsic(null);
    setShowTxModal(true);
  }, []);

  const onGetTxResult = useCallback((isTxSuccess: boolean, extrinsicHash?: string, txError?: Error | null) => {
    setWrapperClass('-disable-header-action');

    setTxResult({
      isShowTxResult: true,
      isTxSuccess,
      txError,
      extrinsicHash
    });

    _onCancelTx();
  }, [_onCancelTx, setWrapperClass]);

  const _onTxSuccess = useCallback((result: SubmittableResult, extrinsicHash?: string) => {
    if (!senderId) {
      return;
    }

    if (result && extrinsicHash) {
      const { change, fee } = extractTxResult(result);

      const item: TransactionHistoryItemType = {
        action: 'send',
        change,
        extrinsicHash,
        fee,
        isSuccess: true,
        networkKey,
        time: Date.now()
      };

      updateTransactionHistory(senderId, networkKey, item, () => {
        onGetTxResult(true, extrinsicHash);
      }).catch((e) => console.log('Error when update Transaction History', e));

      chrome.runtime.sendMessage({ withdrawEvmDeposit: 'success' }, function () {
        console.log('withdraw EVM deposit success');
      });
    } else {
      onGetTxResult(true);
    }
  }, [senderId, networkKey, onGetTxResult]);

  const _onTxFail = useCallback((result: SubmittableResult | null, error: Error | null, extrinsicHash?: string) => {
    if (!senderId) {
      return;
    }

    if (result && extrinsicHash) {
      const { change, fee } = extractTxResult(result);

      const item: TransactionHistoryItemType = {
        action: 'send',
        change,
        extrinsicHash,
        fee,
        isSuccess: false,
        networkKey,
        time: Date.now()
      };

      updateTransactionHistory(senderId, networkKey, item, () => {
        onGetTxResult(false, extrinsicHash, error);
      }).catch((e) => console.log('Error when update Transaction History', e));
    } else {
      onGetTxResult(false, undefined, error);
    }
  }, [senderId, networkKey, onGetTxResult]);

  const _onResend = useCallback(() => {
    setTxResult({
      isTxSuccess: false,
      isShowTxResult: false,
      txError: undefined
    });

    setWrapperClass('');
  }, [setWrapperClass]);

  interface AddressBalances {
    [address: string]: string;
  }
  const [addressBalances, setAddressBalances] = useState<AddressBalances>({});

  setTimeout((): void => {
    chrome.storage.local.get(['addressBalances'], function (result) {
      setAddressBalances(result.addressBalances);
      // console.log('Arth result.addressBalances: ', result.addressBalances);
    });
  }, 500);

  return (
    <>
      {!isShowTxResult
        ? (
          <div className='withdraw-balance-wrapper'>
            <a>Your withdrawable EVM Deposit Amount is</a>
            {displayEvmDepositAmount !== null && displayEvmDepositAmount > 0
              ? <p className='amount'>{displayEvmDepositAmount} ASTR</p>
              : <p className='amount'>0 ASTR</p>
            }
            <div className='info'>
              <h3>Attention</h3>
              {(addressBalances && senderId && addressBalances[senderId] === '0')
                ? (
                  <><p>Make sure you are not trying
                to send your assets to an exchange.
                If you transfer funds from this address
                to an exchange, your funds will be lost.</p><Button
                    className={'faucet-btn'}
                    href={'https://portal.astar.network/#/'}
                  >
                    {t<string>('Faucet')}
                  </Button></>
                )
                : (
                  <p></p>
                )}
              <h4>What is 'EVM Deposit'</h4>
              <p>'EVM Deposit' is an EVM address converted from a Native address,
             which must be passed through once when sending funds from EVM to Native.
              <p className='see-more'><a
                href='https://medium.com/astar-network/using-astar-network-account-between-substrate-and-evm-656643df22a0'
                rel='noreferrer'
                target='_blank'
              >See more</a></p>
              </p>

            </div>

          </div>
        )
        : (<div></div>)}
      {!isShowTxResult
        ? (
          <div className={'kn-l-submit-wrapper'}>
            <Button
              className={'cancel-btn'}
              to='/'
            >
              {t<string>('cancel')}
            </Button>
            <Button
              className={'kn-submit-btn'}
              onClick={_onSend}
            >
              {t<string>('Withdraw')}
            </Button>
          </div>
        )
        : (
          <WithdrawEvmDepositResult
            networkKey={networkKey}
            onResend={_onResend}
            txResult={txResult}
          />
        )}
      {extrinsic && isShowTxModal && (
        <AuthTransaction
          api={api}
          apiUrl={apiUrl}
          extrinsic={extrinsic}
          onCancel={_onCancelTx}
          requestAddress={senderId}
          txHandler={{
            onTxSuccess: _onTxSuccess,
            onTxFail: _onTxFail
          }}
        />
      )}
    </>
  );
}

export default React.memo(styled(Wrapper)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100vh;

  &.-disable-header-action {
    .koni-header-right-content .kn-l-expand-btn,
    .network-select-item,
    .setting-icon-wrapper {
      cursor: not-allowed;
      opacity: 0.5;
      pointer-events: none !important;
    }

    .subheader-container__part-3 .kn-l-cancel-btn {
      display: none;
    }
  }

  .send-fund-container {
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    flex: 1;
    padding-top: 25px;
    overflow-y: auto;

    // &::-webkit-scrollbar {
    //   display: none;
    // }
  }

  .kn-l-screen-content {
    flex: 1;
    padding: 25px 15px 15px;
  }

  .kn-field {
    margin-bottom: 10px;

    &.-field-1 {
      z-index: 5;
    }

    &.-field-2 {
      z-index: 4;
      margin-bottom: 10px;
    }

    &.-field-3 {
      margin-top: 20px;
      z-index: 3;
    }

    &.-field-4 {
      z-index: 2;
    }

    &.-toggle {
      margin-top: 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: flex-end;
    }

    &.-field-4, &.-toggle-1 {
        display: none !important;
    }
  }

  .kn-l-warning {
    margin-top: 10px;
    margin-bottom: 10px;
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

  .kn-l-submit-wrapper {
    z-index:10;
    position: sticky;
    bottom: -15px;
    padding: 15px 0px;
    margin: 0;
    background-color: ${theme.background};
  }
  .kn-submit-btn {
    display: inline-block;
    height: 48px;
    width: 256px;
    border-radius: 6px;
    background-color: #b1384e;
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
  .faucet-btn {
    display: block;
    margin: 16px auto;
    height: 48px;
    width: 144px;
    background-color: #284EA9;
    border-radius: 6px;
  }

  .withdraw-balance-wrapper {
    text-align: center;
    width: 398px;
    margin: 36px auto 16px;
  }
  .withdraw-balance-wrapper .amount {
    margin: 20px auto 24px;
    font-size: 22px;
    font-weight: 700;
  }
  .withdraw-balance-wrapper .info {
    padding: 0 10px 0px;
    background: #050b2e;
    border-radius: 6px;
    border: 1px solid #2c3673;
  }
  .withdraw-balance-wrapper h4 {
    margin: 32px auto 6px;
  }
  .withdraw-balance-wrapper .see-more {
    margin: 10px auto 0;
  }
  .withdraw-balance-wrapper .see-more a {
    color: #909090;
  }
  .withdraw-balance-wrapper .see-more a:hover {
    color: #fff;
  }

  `));
