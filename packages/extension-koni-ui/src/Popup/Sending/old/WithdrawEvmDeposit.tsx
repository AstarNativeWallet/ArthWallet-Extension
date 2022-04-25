// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
// import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';
// import { getWeb3Api } from '@polkadot/extension-koni-base/api/web3/web3';
// import { web3Accounts, web3Enable, web3FromAddress, web3ListRpcProviders, web3UseRpcProvider } from '@polkadot/extension-dapp';
import { Button, Warning } from '@polkadot/extension-koni-ui/components';
import LoadingContainer from '@polkadot/extension-koni-ui/components/LoadingContainer';
// import Toggle from '@polkadot/extension-koni-ui/components/Toggle';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { updateTransactionHistory } from '@polkadot/extension-koni-ui/messaging';
import { Header } from '@polkadot/extension-koni-ui/partials';
import AuthTransaction from '@polkadot/extension-koni-ui/Popup/Sending/old/AuthTransaction';
// import InputBalance from '@polkadot/extension-koni-ui/Popup/Sending/old/component/InputBalance';
import useApi from '@polkadot/extension-koni-ui/Popup/Sending/old/hook/useApi';
// import { useCall } from '@polkadot/extension-koni-ui/Popup/Sending/old/hook/useCall';
//import SendFundResult from '@polkadot/extension-koni-ui/Popup/Sending/old/SendFundResult';
import { TxResult } from '@polkadot/extension-koni-ui/Popup/Sending/old/types';
import WithdrawEvmDepositResult from '@polkadot/extension-koni-ui/Popup/Sending/old/WithdrawEvmDepositResult';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { isAccountAll } from '@polkadot/extension-koni-ui/util';
// import { checkAddress } from '@polkadot/phishing';
// import { AccountInfoWithProviders, AccountInfoWithRefCount } from '@polkadot/types/interfaces';
// import { BN, BN_HUNDRED, BN_ZERO, isFunction } from '@polkadot/util';
import { isFunction } from '@polkadot/util';

// import Available from './component/Available';
// import InputAddress from './component/InputAddress';
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

// function isRefcount (accountInfo: AccountInfoWithProviders | AccountInfoWithRefCount): accountInfo is AccountInfoWithRefCount {
//   return !!(accountInfo as AccountInfoWithRefCount).refcount;
// }

type ExtractTxResultType = {
  change: string;
  fee?: string;
}

function extractTxResult (result: SubmittableResult): ExtractTxResultType {
  let change = '0';
  let fee;

  const { events } = result;

  const transferEvent = events.find((e) =>
    //    e.event.section === 'balances' &&
    //    e.event.method.toLowerCase() === 'transfer'
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

// async function checkPhishing (_senderId: string | null, recipientId: string | null): Promise<[string | null, string | null]> {
//   return [
//     // not being checked atm
//     // senderId
//     //   ? await checkAddress(senderId)
//     //   : null,
//     null,
//     recipientId
//       ? await checkAddress(recipientId)
//       : null
//   ];
// }

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
    console.log('ArthSwap WithdrawEvmDeposit content rendering.');

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
        showCancelButton
        showSearch
        showSettings
        showSubHeader
        subHeaderName={t<string>('Withdraw EVM Deposit')}
      />
      {renderContent()}
    </div>
  );
}

function WithdrawEvmDeposit ({ api, apiUrl, className = '', currentAccount, isEthereum, networkKey, setWrapperClass }: ContentProps): React.ReactElement {
  const { t } = useTranslation();
  
  const propSenderId = currentAccount?.address;
/*
  if (typeof propSenderId !== undefined) {
    propSenderId = currentAccount?.address;
  }  
*/

  const senderId = propSenderId;
  // const [amount, setAmount] = useState<BN | undefined>(BN_ZERO);
  // const [hasAvailable] = useState(true);
  // const [isProtected, setIsProtected] = useState(false);
  // const [isAll, setIsAll] = useState(false);
  // const [[maxTransfer, noFees], setMaxTransfer] = useState<[BN | null, boolean]>([null, false]);
  // const [recipientId, setRecipientId] = useState<string | null>(null);
  // const [senderId, setSenderId] = useState<string | null>(null);
  // const [[, recipientPhish], setPhishing] = useState<[string | null, string | null]>([null, null]);
  // const balances = useCall<DeriveBalancesAll>(api.derive.balances?.all, [senderId], undefined, apiUrl);
  // const accountInfo = useCall<AccountInfoWithProviders | AccountInfoWithRefCount>(api.query.system.account, [senderId], undefined, apiUrl);
  const [extrinsic, setExtrinsic] = useState<SubmittableExtrinsic<'promise'> | null>(null);
  const [isShowTxModal, setShowTxModal] = useState<boolean>(false);
  const [txResult, setTxResult] = useState<TxResult>({ isShowTxResult: false, isTxSuccess: false });
  // const [h160address, setH160address] = useState<string | null>(null);
  const [evmDepositAmount, setEvmDepositAmount] = useState<BigInt | null>(null);
  const [displayEvmDepositAmount, setDisplayEvmDepositAmount] = useState<number | null>(null);
  const { isShowTxResult } = txResult;

  // type SubstrateAccount = {
  //   address: string;
  //   name: string;
  //   source: string;
  // };

  // // ref: https://github.com/polkadot-js/extension/tree/master/packages/extension-inject

  // const getInjectedExtensions = async (): Promise<any[]> => {
  //   const extensions = await web3Enable('ArthWallet - Astar Extension Wallet');

  //   // Memo: obtain the extension name
  //   // console.log('extensions', extensions);
  //   if (extensions.length === 0) {
  //     // no extension installed, or the user did not accept the authorization
  //     // in this case we should inform the use and give a link to the extension
  //     console.log('There is no extension.');

  //     return;
  //   }

  //   // we are now informed that the user has at least one extension and that we
  //   // will be able to show and use accounts
  //   const allAccounts = await web3Accounts();

  //   console.log(allAccounts);

  //   return extensions;
  // };

  // const getInjector = async (accounts: SubstrateAccount[]) => {
  //   const SENDER = currentAccount.address;
  //   const account = accounts.find((it) => it.address === SENDER);
  //   const extensions = await getInjectedExtensions();
  //   const injector = extensions.find((it) => it.name === account?.source);

  //   return injector;
  // };

  // async function withdrawExcecution () {
  //   // ref: https://github.com/polkadot-js/docs/blob/19375457a57275160532c8de63bff1e41da775b6/docs/extension/cookbook.md
  //   // await web3Enable('Arthwallet');

  //   // const accounts = await web3Accounts();

  //   console.log('currentAccount.address: ', currentAccount.address);
  //   const h160address: string = buildEvmAddress(currentAccount.address);

  //   console.log('h160address: ', h160address);

  //   // const evmDepositAmount = new BN('3');
  //   const evmDepositAmount = 1;

  //   // await getInjectedExtensions();

  //   // // const injector = await web3FromAddress(SENDER);
  //   // const injector = getInjector(accounts);

  //   // const transaction = api.tx.evm.withdraw(h160address, new BN('3'));
  //   // 0xE043F94c5031f4C37C660Ac9534c83C05491d106
  //   // api.tx.evm.withdraw(h160address, new BN('3'));
  //   console.log('evmDepositAmount: ', evmDepositAmount);
  //   console.log('api.tx.evm: ', api.tx);

  //   // api.tx.evm.withdraw('0xE043F94c5031f4C37C660Ac9534c83C05491d106', evmDepositAmount);
  //   api.tx.evm.withdraw(h160address, evmDepositAmount);

  //   // await transaction.signAndSend(SENDER,
  //   //   {
  //   //     signer: injector.signer
  //   //   },
  //   //   // (result) => handleResult(result)
  //   //   (result) => {
  //   //     console.log(result);
  //   //   }
  //   // );
  // }

  // useEffect((): void => {
  //   console.log('currentAccount.address: ', currentAccount.address);
  //   console.log('h160address: ', h160address);
  //   console.log('evmDepositAmount: ', evmDepositAmount);
  //   console.log('api.tx: ', api.tx);
  // }, [currentAccount.address, h160address, api.tx, evmDepositAmount]);

  // useEffect((): void => {
  //   checkPhishing(senderId, recipientId)
  //     .then(setPhishing)
  //     .catch(console.error);
  // }, [propSenderId, recipientId, senderId]);

  // const noReference = accountInfo
  //   ? isRefcount(accountInfo)
  //     ? accountInfo.refcount.isZero()
  //     : accountInfo.consumers.isZero()
  //   : true;
  // const canToggleAll = !isProtected && balances && balances.accountId.eq(senderId) && maxTransfer && noReference;

  // const amountGtAvailableBalance = amount && balances && amount.gt(balances.availableBalance);

  // const txParams: unknown[] | (() => unknown[]) | null =
  //   useMemo(() => {
  //     return canToggleAll && isAll
  //       ? isFunction(api.tx.balances.transferAll)
  //         ? [recipientId, false]
  //         : [recipientId, maxTransfer]
  //       : [recipientId, amount];
  //   }, [amount, api.tx.balances.transferAll, canToggleAll, isAll, maxTransfer, recipientId]);

  chrome.storage.local.get(['displayEvmDepositAmount'], function (result) {
    setDisplayEvmDepositAmount(result.displayEvmDepositAmount);
    // console.log('result.displayEvmDepositAmount is: ', result.displayEvmDepositAmount);
  });

  const txParams: unknown[] | (() => unknown[]) | null =
    useMemo(() => {
      if (typeof propSenderId !== 'undefined') {
        const h160address = buildEvmAddress(propSenderId);
        console.log('h160address is: ', h160address);

        chrome.storage.local.get(['evmDepositAmount'], function (result) {
          if (typeof result.evmDepositAmount === 'string') {
          // setEvmDepositAmount(result.evmDepositAmount * 1000000000000000000);
          // const withdrawEvmDepositAmount = Math.ceil(result.evmDepositAmount / (10 ** 3));
          // const withdrawEvmDepositAmount = result.evmDepositAmount - (10 ** 17);
          // const web3Api = getWeb3Api(networkKey);

          // const withdrawEvmDepositAmount = web3Api.utils.toBN(0.1 * (10 ** 18));

          const withdrawEvmDepositAmount: BigInt = BigInt(result.evmDepositAmount);

          // const withdrawEvmDepositAmount: BN = 100000000000000000;
  
            setEvmDepositAmount(withdrawEvmDepositAmount);
  
            console.log('withdrawEvmDepositAmount is: ', withdrawEvmDepositAmount);
            console.log('unitAmount is              : ', 1000000000000000000);
          } else {
            console.log('evmDepositAmount is not valid type.', result.evmDepositAmount);
          }
        });
        // const evmDepositAmount = 1000000000000000;
  
        return isFunction(api.tx.evm.withdraw) ? [h160address, evmDepositAmount] : null;
  
      }

    }, [api.tx.evm.withdraw, evmDepositAmount, propSenderId]);

  // const tx: ((...args: any[]) => SubmittableExtrinsic<'promise'>) | null = canToggleAll && isAll && isFunction(api.tx.balances.transferAll)
  //   ? api.tx.balances.transferAll
  //   : isProtected
  //     ? api.tx.balances.transferKeepAlive
  //     : api.tx.balances.transfer;

  const tx: ((...args: any[]) => SubmittableExtrinsic<'promise'>) | null =
    isFunction(api.tx.evm.withdraw)
      ? api.tx.evm.withdraw
      : null;

  const _onSend = useCallback(() => {
    if (tx) {
      // const txParams: [string, number] = ['5H8kmwy17BeP4emGDPrb4XKSf2w4X7PFvWnz2ZineqNdgNMb', 1];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setExtrinsic(tx(...(
        isFunction(txParams)
          ? txParams()
          : (txParams || [])
      )));

      setShowTxModal(true);
    }
  // }, [txParams, tx]);
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
    } else {
      onGetTxResult(true);
    }
  // }, [senderId, networkKey, onGetTxResult]);
  }, [senderId, onGetTxResult]);

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
  // }, [senderId, networkKey, onGetTxResult]);
  }, [senderId, onGetTxResult]);

  const _onResend = useCallback(() => {
    setTxResult({
      isTxSuccess: false,
      isShowTxResult: false,
      txError: undefined
    });

    setWrapperClass('');
  }, [setWrapperClass]);

  // const isSameAddress = !!recipientId && !!senderId && (recipientId === senderId);

  return (
    <>
      {!isShowTxResult
        ? (
          <div className={'kn-l-submit-wrapper'}>
            <a>Your withdrawable EVM Deposit Amount is</a>
            {displayEvmDepositAmount !== null && displayEvmDepositAmount > 0
              ? <h1>{displayEvmDepositAmount} ASTR</h1>
              : <h1>0 ASTR</h1>
            }
            <Button
              className={'kn-submit-btn'}
              // isDisabled={isSameAddress || !hasAvailable || !(recipientId) || (!amount && !isAll) || amountGtAvailableBalance || !!recipientPhish}
              onClick={_onSend}
            >
              {t<string>('Withdraw EVM Deposit')}
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
`));
