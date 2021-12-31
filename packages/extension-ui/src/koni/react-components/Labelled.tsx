// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import LabelHelp from './LabelHelp';

interface Props {
  className?: string;
  help?: React.ReactNode;
  isHidden?: boolean;
  isFull?: boolean;
  isOuter?: boolean;
  isSmall?: boolean;
  label?: React.ReactNode;
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
  withEllipsis?: boolean;
  withLabel?: boolean;
}

const defaultLabel: React.ReactNode = <div>&nbsp;</div>;

function Labelled ({ className = '', children, help, isFull, isHidden, isOuter, isSmall, label = defaultLabel, labelExtra, withEllipsis, withLabel = true }: Props): React.ReactElement<Props> | null {
  if (isHidden) {
    return null;
  } else if (!withLabel) {
    return (
      <div className={className}>{children}</div>
    );
  }

  return (
    <div className={`ui--Labelled${isSmall ? ' isSmall' : ''}${isFull ? ' isFull' : ''}${isOuter ? ' isOuter' : ''} ${className}`}>
      <label>{withEllipsis
        ? <div className='withEllipsis'>{label}</div>
        : label
      }{help && <LabelHelp help={help} />}</label>
      {labelExtra && <div className='labelExtra'>{labelExtra}</div>}
      <div className='ui--Labelled-content'>
        {children}
      </div>
    </div>
  );
}

export default React.memo(styled(Labelled)`
  .withEllipsis {
    display: inline;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`);