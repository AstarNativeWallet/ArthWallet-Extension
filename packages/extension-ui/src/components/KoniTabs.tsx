import React from 'react';
import styled from 'styled-components';
import {ThemeProps} from "@polkadot/extension-ui/types";

interface Props extends ThemeProps {
  className?: string;
  activatedTab: number;
  onSelect: (tab: number) => void;
}

function KoniTabs({ className, activatedTab, onSelect }: Props): React.ReactElement<Props> {
  return (
    <>
      <div className={className}>
        <div className='koni-tabs'>
            <button className={`koni-tab ${activatedTab === 1? 'active' : ''}`} onClick={() => {onSelect(1)}}>
              Assets
            </button>
            <button className={`koni-tab ${activatedTab === 2? 'active' : ''}`} onClick={() => {onSelect(2)}}>
              NFT
            </button>
            <button className={`koni-tab ${activatedTab === 3? 'active' : ''}`} onClick={() => {onSelect(3)}}>
              Activity
            </button>
        </div>
      </div>
    </>
  )
}

export default styled(KoniTabs)(({theme}: Props) => `
  .koni-tabs {
    display: flex;
  }

  .koni-tab {
    font-size: 16px;
    line-height: 26px;
    padding: 5px 12px;
    cursor: pointer;
    opacity: 0.6;
    display: flex;
    justify-content: center;
    flex: 1;
    font-weight: 700;
    box-shadow: 0px 4px 7px rgba(0, 0, 0, 0.05);
    background: ${theme.background};
    border: 0;
    outline: 0;
    border-bottom: 2px solid ${theme.tabContentBorderBottomColor};
    color: ${theme.textColor2}
  }

  .active {
    border-bottom-color: ${theme.buttonTextColor2};
    color: ${theme.buttonTextColor2};
    opacity: 1;
  }
`)