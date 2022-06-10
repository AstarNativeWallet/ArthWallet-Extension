// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BigN from 'bignumber.js';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { TFunction } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ChainRegistry, CurrentAccountInfo, CurrentNetworkInfo, NftCollection as _NftCollection, NftItem as _NftItem, TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { reformatAddress } from '@polkadot/extension-koni-base/utils/utils';
import cloneLogo from '@polkadot/extension-koni-ui/assets/clone.svg';
import crowdloans from '@polkadot/extension-koni-ui/assets/home-tab-icon/crowdloans.svg';
import crowdloansActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/crowdloans-active.svg';
import crypto from '@polkadot/extension-koni-ui/assets/home-tab-icon/crypto.svg';
import cryptoActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/crypto-active.svg';
import nfts from '@polkadot/extension-koni-ui/assets/home-tab-icon/nfts.svg';
import nftsActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/nfts-active.svg';
import staking from '@polkadot/extension-koni-ui/assets/home-tab-icon/staking.svg';
import stakingActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/staking-active.svg';
import transfers from '@polkadot/extension-koni-ui/assets/home-tab-icon/transfers.svg';
import transfersActive from '@polkadot/extension-koni-ui/assets/home-tab-icon/transfers-active.svg';
import receivedIcon from '@polkadot/extension-koni-ui/assets/receive-icon.svg';
import { AccountContext, AccountQrModal, Link } from '@polkadot/extension-koni-ui/components';
import { BalanceVal } from '@polkadot/extension-koni-ui/components/balance';
import Tooltip from '@polkadot/extension-koni-ui/components/Tooltip';
import useAccountBalance from '@polkadot/extension-koni-ui/hooks/screen/home/useAccountBalance';
import useCrowdloanNetworks from '@polkadot/extension-koni-ui/hooks/screen/home/useCrowdloanNetworks';
import useFetchNft from '@polkadot/extension-koni-ui/hooks/screen/home/useFetchNft';
import useFetchStaking from '@polkadot/extension-koni-ui/hooks/screen/home/useFetchStaking';
import useShowedNetworks from '@polkadot/extension-koni-ui/hooks/screen/home/useShowedNetworks';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { saveCurrentAccountAddress, triggerAccountsSubscription } from '@polkadot/extension-koni-ui/messaging';
import { Header } from '@polkadot/extension-koni-ui/partials';
// import AccountsTree from '@polkadot/extension-koni-ui/Popup/Accounts/AccountsTree';
import AccountMenuLists from '@polkadot/extension-koni-ui/partials/AccountList';
import AddAccount from '@polkadot/extension-koni-ui/Popup/Accounts/AddAccount';
import NftContainer from '@polkadot/extension-koni-ui/Popup/Home/Nfts/render/NftContainer';
import StakingContainer from '@polkadot/extension-koni-ui/Popup/Home/Staking/StakingContainer';
import TabHeaders from '@polkadot/extension-koni-ui/Popup/Home/Tabs/TabHeaders';
import { TabHeaderItemType } from '@polkadot/extension-koni-ui/Popup/Home/types';
// import { ApiPromise, SubmittableResult } from '@polkadot/api';
import useApi from '@polkadot/extension-koni-ui/Popup/Sending/old/hook/useApi';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BN_ZERO, isAccountAll, NFT_DEFAULT_GRID_SIZE, NFT_GRID_HEIGHT_THRESHOLD, NFT_HEADER_HEIGHT, NFT_PER_ROW, NFT_PREVIEW_HEIGHT } from '@polkadot/extension-koni-ui/util';

import buyIcon from '../../assets/buy-icon.svg';
// import donateIcon from '../../assets/donate-icon.svg';
import sendIcon from '../../assets/send-icon.svg';
import useToast from '../../hooks/useToast';
// import swapIcon from '../../assets/swap-icon.svg';
import ChainBalances from './ChainBalances/ChainBalances';
import TokenListing from './ChainBalances/TokenListing';
import Crowdloans from './Crowdloans/Crowdloans';
import TransactionHistory from './TransactionHistory/TransactionHistory';
import ActionButton from './ActionButton';
import WithdrawButton from './WithdrawButton';

// import Available from '../Sending/old/component/Available';
// import AvailableEVM from '../Sending/old/component/AvailableEVM';
// import AvailableNativeNum from '../Sending/old/component/AvailableNativeNum';
// import { getBalances, parseBalancesInfo } from '@polkadot/extension-koni-ui/util';

interface WrapperProps extends ThemeProps {
  className?: string;
}

interface Props {
  className?: string;
  currentAccount: AccountJson;
  network: CurrentNetworkInfo;
  chainRegistryMap: Record<string, ChainRegistry>;
  historyMap: Record<string, TransactionHistoryItemType[]>;
  showCopyBtn: boolean;
}

/*
interface ContentProps extends ThemeProps {
  className?: string;
  setWrapperClass: (classname: string) => void;
  currentAccount?: AccountJson | null;
  isEthereum: boolean;
  networkKey: string;
}
*/

function getTabHeaderItems (address: string, t: TFunction): TabHeaderItemType[] {
  const result = [
    {
      tabId: 1,
      label: t('Crypto'),
      lightIcon: crypto,
      darkIcon: crypto,
      activatedLightIcon: cryptoActive,
      activatedDarkIcon: cryptoActive
    },
    {
      tabId: 2,
      label: t('NFTs'),
      lightIcon: nfts,
      darkIcon: nfts,
      activatedLightIcon: nftsActive,
      activatedDarkIcon: nftsActive
    },
    {
      tabId: 3,
      label: t('Crowdloans'),
      lightIcon: crowdloans,
      darkIcon: crowdloans,
      activatedLightIcon: crowdloansActive,
      activatedDarkIcon: crowdloansActive
    },
    {
      tabId: 4,
      label: t('Staking'),
      lightIcon: staking,
      darkIcon: staking,
      activatedLightIcon: stakingActive,
      activatedDarkIcon: stakingActive
    }
  ];

  if (!isAccountAll(address)) {
    result.push({
      tabId: 5,
      label: t('Transfers'),
      lightIcon: transfers,
      darkIcon: transfers,
      activatedLightIcon: transfersActive,
      activatedDarkIcon: transfersActive
    });
  }

  return result;
}

function Wrapper ({ className, theme }: WrapperProps): React.ReactElement {
  const { hierarchy } = useContext(AccountContext);
  const { chainRegistry: chainRegistryMap,
    currentAccount: { account: currentAccount },
    currentNetwork,
    transactionHistory: { historyMap } } = useSelector((state: RootState) => state);

  if (!hierarchy.length) {
    return (<AddAccount />);
  }

  if (!currentAccount) {
    return (<></>);
  }

  return (
    <Home
      chainRegistryMap={chainRegistryMap}
      className={className}
      currentAccount={currentAccount}
      historyMap={historyMap}
      network={currentNetwork}
      showCopyBtn
    />
  );
}

let tooltipId = 0;

function Home ({ chainRegistryMap, className = '', currentAccount, historyMap, network, showCopyBtn = true }: Props): React.ReactElement {
  const { icon: iconTheme,
    networkKey,
    networkPrefix } = network;
  const { t } = useTranslation();
  const { currentNetwork: { isEthereum } } = useSelector((state: RootState) => state);

  
  const { api, apiUrl, isApiReady, isNotSupport } = useApi('astarEvm'); // networkKey);

  console.log(api);
  console.log(apiUrl);
  console.log(isApiReady);
  console.log(isNotSupport);

  const { address } = currentAccount;

  let _isAccountAll = isAccountAll(address);

  const [isShowBalanceDetail, setShowBalanceDetail] = useState<boolean>(false);
  const [isEvmDeposit, setIsEvmDeposit] = useState<boolean>(false);
  const backupTabId = window.localStorage.getItem('homeActiveTab') || '1';
  const [activatedTab, setActivatedTab] = useState<number>(Number(backupTabId));
  const _setActiveTab = useCallback((tabId: number) => {
    window.localStorage.setItem('homeActiveTab', `${tabId}`);

    console.log('Arth homeActiveTab: ', tabId);

    if (tabId === 1) {
      console.log('Arth isAccountAll: ', isAccountAll);
      _isAccountAll = true; // isAccountAll(address);
    }

    setActivatedTab(tabId);
    setShowBalanceDetail(false);
  }, []);
  const [isShowZeroBalances, setShowZeroBalances] = useState<boolean>(
    window.localStorage.getItem('show_zero_balances') === '1'
  );
  const [isQrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [selectedNetworkBalance, setSelectedNetworkBalance] = useState<BigN>(BN_ZERO);
  const [trigger] = useState(() => `home-balances-${++tooltipId}`);
  const [
    { iconTheme: qrModalIconTheme,
      networkKey: qrModalNetworkKey,
      networkPrefix: qrModalNetworkPrefix,
      showExportButton: qrModalShowExportButton }, setQrModalProps] = useState({
    networkPrefix,
    networkKey,
    iconTheme,
    showExportButton: true
  });
  const { accounts } = useContext(AccountContext);
  const { balanceStatus: { isShowBalance }, networkMetadata: networkMetadataMap } = useSelector((state: RootState) => state);
  const showedNetworks = useShowedNetworks(networkKey, address, accounts);
  const crowdloanNetworks = useCrowdloanNetworks(networkKey);

  const [nftPage, setNftPage] = useState(1);

  const [chosenNftCollection, setChosenNftCollection] = useState<_NftCollection>();
  const [showNftCollectionDetail, setShowNftCollectionDetail] = useState<boolean>(false);

  const [chosenNftItem, setChosenNftItem] = useState<_NftItem>();
  const [showNftItemDetail, setShowNftItemDetail] = useState<boolean>(false);

  const [showTransferredCollection, setShowTransferredCollection] = useState(false);
  const [showForcedCollection, setShowForcedCollection] = useState(false);

  const parseNftGridSize = useCallback(() => {
    if (window.innerHeight > NFT_GRID_HEIGHT_THRESHOLD) {
      const nftContainerHeight = window.innerHeight - NFT_HEADER_HEIGHT;
      const rowCount = Math.floor(nftContainerHeight / NFT_PREVIEW_HEIGHT);

      return rowCount * NFT_PER_ROW;
    } else {
      return NFT_DEFAULT_GRID_SIZE;
    }
  }, []);
  const nftGridSize = parseNftGridSize();
  const { loading: loadingNft, nftList, totalCollection, totalItems } = useFetchNft(nftPage, networkKey, nftGridSize);
  const { data: stakingData, loading: loadingStaking, priceMap: stakingPriceMap } = useFetchStaking(networkKey);

  const handleNftPage = useCallback((page: number) => {
    setNftPage(page);
  }, []);

  useEffect(() => {
    if (isAccountAll(address) && activatedTab === 5) {
      _setActiveTab(1);
    }
  }, [address, activatedTab, _setActiveTab]);

  const { crowdloanContributeMap,
    networkBalanceMaps,
    totalBalanceValue } = useAccountBalance(networkKey, showedNetworks, crowdloanNetworks);

  const _toggleZeroBalances = useCallback(() => {
    setShowZeroBalances((v) => {
      window.localStorage.setItem('show_zero_balances', v ? '0' : '1');

      return !v;
    });
  }, []);

  const toShortAddress = (_address: string | null, halfLength?: number) => {
    const address = (_address || '').toString();

    const addressLength = 7;

    return address.length > 20 ? `${address.slice(0, addressLength)}……${address.slice(-addressLength)}` : address;
  };

  const { show } = useToast();
  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const _showQrModal = useCallback(() => {
    setQrModalProps({
      networkPrefix: networkPrefix,
      networkKey: networkKey,
      iconTheme: iconTheme,
      showExportButton: true
    });

    setQrModalOpen(true);
  }, [iconTheme, networkKey, networkPrefix]);

  const _closeQrModal = useCallback(() => {
    setQrModalOpen(false);
  }, []);

  const tabItems = useMemo<TabHeaderItemType[]>(() => {
    return getTabHeaderItems(address, t);
  }, [address, t]);

  const _toggleBalances = useCallback(() => {
    const accountInfo = {
      address: address,
      isShowBalance: !isShowBalance
    } as CurrentAccountInfo;

    saveCurrentAccountAddress(accountInfo, () => {
      triggerAccountsSubscription().catch((e) => {
        console.error('There is a problem when trigger Accounts Subscription', e);
      });
    }).catch((e) => {
      console.error('There is a problem when set Current Account', e);
    });
  }, [address, isShowBalance]);

  const _backToHome = useCallback(() => {
    setShowBalanceDetail(false);
  }, [setShowBalanceDetail]);

  const formattedAddress = reformatAddress(currentAccount.address, networkPrefix, isEthereum);

  const onChangeAccount = useCallback((address: string) => {
    setShowBalanceDetail(false);
  }, []);

  setTimeout((): void => {
    //    useEffect((): void => {
    chrome.storage.local.get(['isEvmDeposit'], function (result) {
      if (typeof result.isEvmDeposit === 'boolean') {
        setIsEvmDeposit(result.isEvmDeposit);
      }
    });
  // }, []);
  }, 500);

  /*
  const balanceInfo = parseBalancesInfo(priceMap, tokenPriceMap, {
    networkKey,
    tokenDecimals: registry.chainDecimals,
    tokenSymbols: registry.chainTokens,
    balanceItem
  });
*/

  const [displayEvmDepositAmount, setDisplayEvmDepositAmount] = useState<number | null>(null);

  setTimeout((): void => {
  // useEffect((): void => {
    chrome.storage.local.get(['displayEvmDepositAmount'], function (result) {
      if (typeof result.displayEvmDepositAmount === 'number') {
        setDisplayEvmDepositAmount(result.displayEvmDepositAmount);
      } else {
        setDisplayEvmDepositAmount(0);
      }
    });
  // }, []);
  }, 500);

  let symbolName: string = 'ASTR';
  if (networkKey === 'shibuya') {
    symbolName = 'SBY';
  } else if (networkKey === 'astarTest') {
    symbolName = 'ASTL';
  }

  return (
    <div className={`home-screen home ${className}`}>
      <Header
        changeAccountCallback={onChangeAccount}
        className={'home-header'}
        // isContainDetailHeader={true}
        // isShowZeroBalances={isShowZeroBalances}
        setShowBalanceDetail={setShowBalanceDetail}
        showAdd
        showSearch
        showSettings
        text={t<string>('Accounts')}
        toggleZeroBalances={_toggleZeroBalances}
      />
      <div className={'home-tab-contents'}>
        {activatedTab === 1 && (
          <div
            className='Home-contents'
          >
            <div className='total-balances'>

              {_isAccountAll
                ? <a className ='total-text'>
                  {t<string>('All Accounts')}</a>
                : <div
                  className='address-container'
                >
                  <a
                    className='account-name'
                  >
                    {currentAccount.name}
                  </a>
                  <div className='address-wrap'>
                    <CopyToClipboard text={formattedAddress}>
                      <div
                        className='address-icon'
                        onClick={_onCopy}
                      >
                        <span className='address-name'>{toShortAddress(formattedAddress || t('<unknown>'), 10)}</span>
                        <img
                          alt='copy'
                          className='account-info-copy-icon'
                          onClick={_onCopy}
                          src={cloneLogo}
                        />
                      </div>

                    </CopyToClipboard>
                    <img
                      alt='receive'
                      className='chain-balance-item__receive'
                      onClick={_showQrModal}
                      src={receivedIcon}
                    />
                  </div>
                </div>
              }
              <div
                className={'account-total-btn'}
                data-for={trigger}
                data-tip={true}
                onClick={_toggleBalances}
              >
                {isShowBalance
                  ? <BalanceVal
                    startWithSymbol
                    symbol={'$'}
                    value={isShowBalanceDetail ? selectedNetworkBalance : totalBalanceValue}
                    // eslint-disable-next-line @typescript-eslint/indent
                    />
                  : <span>*********</span>
                }
              </div>
            </div>
            {_isAccountAll && (
              <div className='IsAccountALL'>
                <div className='action-button-wrapper'>
                  <ActionButton
                    className='action-button-recieve'
                    iconSrc={buyIcon}
                    isDisabled
                    tooltipContent={t<string>('Receive')}
                  />
                  <Link
                    className={'action-button-send'}
                    isDisabled
                    to={'/account/send-from-evm-fund'}
                  >
                    <ActionButton
                      iconSrc={sendIcon}
                      isDisabled
                      tooltipContent={t<string>('Send')}
                    />
                  </Link>

                </div>
                <AccountMenuLists></AccountMenuLists>
              </div>
            )}
            {!_isAccountAll && (
              <div className='not-isAccountAll'>
                <div className='action-button-wrapper'>
                  <ActionButton
                    className='action-button-recieve'
                    iconSrc={buyIcon}
                    onClick={_showQrModal}
                    tooltipContent={t<string>('Receive')}
                  />
                  {isEthereum
                    ? <Link
                      className={'action-button-send'}
                      to={'/account/send-from-evm-fund'}
                    >
                      <ActionButton
                        iconSrc={sendIcon}
                        tooltipContent={t<string>('Send')}
                      />
                    </Link>
                    : <Link
                      className={'action-button-send'}
                      to={'/account/send-from-native-fund'}
                    >
                      <ActionButton
                        iconSrc={sendIcon}
                        tooltipContent={t<string>('Send')}
                      />
                    </Link>
                  }
                </div>
                { ((networkKey === 'astar' || networkKey === 'shibuya' || networkKey === 'astarTest') 
                    && isEvmDeposit) &&
                  <div className='withdraw-balance-wrapper'>
                    <h5>EVM Deposit</h5>
                    <div className='top'>
                      <div className='withdraw-token-icon'><img
                        alt='ICON'
                        src='static/astar.png'
                      /></div>
                      <div className='withdraw-token-symbol'>
                        <p className='symbol'>{symbolName}</p>
                      </div>
                      <div className='withdraw-token-balance'>
                        {displayEvmDepositAmount !== null && displayEvmDepositAmount > 0
                          ? <p className='balance'>{displayEvmDepositAmount} ASTR</p>
                          : <p className='balance'>0 ASTR</p>
                        }
                      </div>
                    </div>
                    <div className='bottom'>
                      <div className=''>
                        <p className='alert-str'>You need to withdraw from EVM Deposit</p>
                        <p>
                          <Link
                            className='withdraw-button'
                            to={'/account/withdraw-evm-deposit'}
                          >
                            <WithdrawButton tooltipContent={t<string>('Withdraw EVM Deposit')} />
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                }
                <div>
                  <TokenListing
                    address={address}
                    currentNetworkKey={networkKey}
                    isShowBalanceDetail={isShowBalanceDetail}
                    isShowZeroBalances={isShowZeroBalances}
                    networkBalanceMaps={networkBalanceMaps}
                    networkKeys={showedNetworks}
                    networkMetadataMap={networkMetadataMap}
                    setQrModalOpen={setQrModalOpen}
                    setQrModalProps={setQrModalProps}
                    setSelectedNetworkBalance={setSelectedNetworkBalance}
                    setShowBalanceDetail={setShowBalanceDetail}
                  />
                  {isShowBalanceDetail &&
                  <div
                    className='home__back-btn'
                    onClick={_backToHome}
                  >
                    <FontAwesomeIcon
                      className='home__back-icon'
                      // @ts-ignore
                      icon={faArrowLeft}
                    />
                    <span>{t<string>('Back to home')}</span>
                  </div>
                  }
                  {networkKey !== 'all' && (
                    <ChainBalances
                      address={address}
                      currentNetworkKey={networkKey}
                      isShowBalanceDetail={isShowBalanceDetail}
                      isShowZeroBalances={isShowZeroBalances}
                      networkBalanceMaps={networkBalanceMaps}
                      networkKeys={showedNetworks}
                      networkMetadataMap={networkMetadataMap}
                      setQrModalOpen={setQrModalOpen}
                      setQrModalProps={setQrModalProps}
                      setSelectedNetworkBalance={setSelectedNetworkBalance}
                      setShowBalanceDetail={setShowBalanceDetail}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {activatedTab === 2 && (
          <NftContainer
            chosenCollection={chosenNftCollection}
            chosenItem={chosenNftItem}
            currentNetwork={networkKey}
            loading={loadingNft}
            nftGridSize={nftGridSize}
            nftList={nftList}
            page={nftPage}
            setChosenCollection={setChosenNftCollection}
            setChosenItem={setChosenNftItem}
            setPage={handleNftPage}
            setShowCollectionDetail={setShowNftCollectionDetail}
            setShowForcedCollection={setShowForcedCollection}
            setShowItemDetail={setShowNftItemDetail}
            setShowTransferredCollection={setShowTransferredCollection}
            showCollectionDetail={showNftCollectionDetail}
            showForcedCollection={showForcedCollection}
            showItemDetail={showNftItemDetail}
            showTransferredCollection={showTransferredCollection}
            totalCollection={totalCollection}
            totalItems={totalItems}
          />
        )}
        {activatedTab === 3 && (
          <Crowdloans
            crowdloanContributeMap={crowdloanContributeMap}
            networkKeys={crowdloanNetworks}
            networkMetadataMap={networkMetadataMap}
          />
        )}
        {activatedTab === 4 && (
          <StakingContainer
            data={stakingData}
            loading={loadingStaking}
            priceMap={stakingPriceMap}
          />
        )}
        {activatedTab === 5 && (
          <TransactionHistory
            historyMap={historyMap}
            networkKey={networkKey}
            registryMap={chainRegistryMap}
          />
        )}
      </div>
      <TabHeaders
        activatedItem={activatedTab}
        className={'home-tab-headers'}
        items={tabItems}
        onSelectItem={_setActiveTab}
      />
      {isQrModalOpen && (
        <AccountQrModal
          accountName={currentAccount.name}
          address={address}
          className='home__account-qr-modal'
          closeModal={_closeQrModal}
          iconTheme={qrModalIconTheme}
          networkKey={qrModalNetworkKey}
          networkPrefix={qrModalNetworkPrefix}
          showExportButton={qrModalShowExportButton}
        />
      )}
      <Tooltip
        offset={{ top: 8 }}
        text={isShowBalance ? 'Hide balance' : 'Show balance'}
        trigger={trigger}
      />
    </div>
  );
}

export default React.memo(styled(Wrapper)(({ theme }: WrapperProps) => `
  display: flex;
  flex-direction: column;
  height: 100%;

  .home-tab-contents {
    flex: 1;
    overflow: auto;
  }

  .home-action-block {
    display: flex;
    padding: 20px 25px;
  }

  .account-total-balance {
    flex: 1;
    font-weight: 500;
    font-size: 32px;
    line-height: 44px;
  }

  .account-total-btn {
    /*width: fit-content;*/
    cursor: pointer;
    position: absolute;
    top: 85px;
    
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 700;
    font-size: 36px;
    line-height: 100%;
    /* identical to box height, or 36px */
    
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.05em;
    
    color: #FFFFFF;
  }

  .home-account-button-container {
    display: flex;
  }

  .action-button-wrapper {
    margin:10px 0px;
    display: flex;
    padding-left: 54px;
  }
  .action-button-send {
    box-shadow: 0px 2px 4px rgba(255, 255, 255, 0.25);
    width: 164px;
    height: 40px;
    background: #494B56;
    border-radius: 4px;
    margin-left:22px;

  }
  .action-button-recieve {
    box-shadow: 0px 2px 4px rgba(255, 255, 255, 0.25);
    width: 164px;
    height: 40px;
    background: #494B56;
    border-radius: 4px;
  }

  .withdraw-balance-wrapper {
    width: 400px;
    margin : 20px auto;
    padding: 10px 20px;
    border-radius: 8px;
    background-color: #282A37;
  }
  .withdraw-balance-wrapper .top {
    margin: 6px 0;
    height: 32px;
  }

  .withdraw-balance-wrapper .bottom p {
    text-align: center;
    margin: 0 auto;
  }
  .withdraw-balance-wrapper .bottom p.alert-str {
    color: #E83B5A;
    margin: 0 auto;
  }
  .withdraw-balance-wrapper .fYxHvM {
    width: 148px;
    height: 40px;
    margin: 6px auto 0;
    backgroung: none;
    background-color: #B1384E;
    border-radius: 8px;
  }

  .withdraw-balance-wrapper h5 {
    margin: 0;
    font-size: 15px;
  }

  .withdraw-balance-wrapper .withdraw-token-icon {
    display: inline-block;
    width: 32px;
  }
  .withdraw-balance-wrapper .withdraw-token-icon img {
    display: block;
    width: 32px;
    height: 32px;
  }
  .withdraw-balance-wrapper .withdraw-token-symbol {
    display: inline-block;
    vertical-align: top;
    margin-left: 16px;
    padding: 2px 0;
    width: 100px;
    height: 32px;
  }
  .withdraw-balance-wrapper .withdraw-token-symbol p.symbol {
    margin: 0;
    font-weight: 700;
    font-size: 17px;
    line-hegit: 16px;
  }

  .withdraw-balance-wrapper .withdraw-token-balance {
    display: inline-block;
    text-align: right;
    vertical-align: top;
    padding: 2px 0;
    width: 200px;
  }
  .withdraw-balance-wrapper .withdraw-token-balance p.balance {
    margin: 0;
    font-size: 16px;
    font-weight: 450;
    line-hegit: 16px;
    height: 32px;
  }

  .chain-balances-container__body {
    width: 400px !important;
    margin : 20px auto;
    /*margin : 20px 30px;*/
    border-radius: 8px;
  }
 
  .home__account-qr-modal .subwallet-modal {
    max-width: 460px;
  }
  .WithdrawButton-sc-nrp1nq-0 a {
    color: #f0f0f0;
  }

  .home__back-btn {
    color: ${theme.buttonTextColor2};
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    margin-left: 25px;
    cursor: pointer;
    margin-bottom: 10px;
  }

  .home__back-icon {
    padding-right: 7px;
  }
  .total-text {
    position: absolute;
    height: 20px;
    top: 24px;
    
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 400;
    font-size: 20px;
    line-height: 100%;
    /* identical to box height, or 20px */
    
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.03em;
    
    color: #FFFFFF;
    
  }

  .account-menu-lists {
    position: relative;
    width: 406px;
    left: 28px;
    margin-top: 14px;

  }

  .total-balances {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 350px;
    height: 150px;
    margin: 18px auto;
    
    background: radial-gradient(98.81% 537.96% at 0% 58.33%, #8380C2 0%, #D4D3FF 100%);
    border-radius: 6px;
    }

    .address-container {
      margin:8px 0px;
      &: hover {
        cursor: pointer;
      }
    }
    .account-name{
      display:block;
      text-align:center;
      font-family: 'Roboto';
      font-style: normal;
      font-weight: 400;
      font-size: 20px;
      align-items: center;
      letter-spacing: 0.03em;
      
      color: rgba(255, 255, 255, 0.8);
    }
    .address-wrap {
      display:flex;
      margin:5px 0px;
    }
    .address-name {
      flex:1;
      color: rgba(255, 255, 255, 0.7);
      margin-right: 8px;
    }
    .account-info-copy-icon {
      min-width: 20px;
      height: 20px;
      margin-right:8px
    }
    .address-icon {
      display:flex;
    }

.IsAccountALL .action-button-wrapper{
  display: none;
}
.all-account-row {
  display: none;    
}
.account-menu-lists > div {
  background-color: rgba(196, 196, 196, 0.2) !important;
  margin-top: 14px;
}

`));
