// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {useEffect, useMemo, useRef, useState} from 'react';

// import { getAllMetatdata } from '../messaging';
import chains from '../util/chains';
import useTranslation from './useTranslation';

interface Option {
  text: string;
  value: string;
  networkPrefix: number;
  icon: string;
}

const RELAY_CHAIN = 'Relay Chain';

export default function (): Option[] {
  const { t } = useTranslation();
  const [metadataChains, setMetadatachains] = useState<Option[]>([]);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    //todo: we will support metadata later
    // getAllMetatdata().then((metadataDefs) => {
    //   const res = metadataDefs.map((metadata) =>
    //     ({ text: metadata.chain, value: metadata.genesisHash, networkPrefix: metadata.ss58Format, icon: metadata.icon }));
    //   if (mounted.current) {
    //     setMetadatachains(res);
    //   }
    // }).catch(console.error);

    setMetadatachains([]);

    return () => {
      mounted.current = false;
    };
  }, []);
  const hashes = useMemo(() => [
    {
      text: t('Allow use on any chain'),
      value: '',
      networkPrefix: -1,
      icon: 'substrate'
    },
    // put the relay chains at the top
    ...chains.filter(({ chain }) => chain.includes(RELAY_CHAIN))
      .map(({ chain, genesisHash, ss58Format , icon}) => ({
        text: chain,
        value: genesisHash,
        networkPrefix: ss58Format,
        icon
      })),
    ...chains.map(({ chain, genesisHash, ss58Format , icon}) => ({
      text: chain,
      value: genesisHash,
      networkPrefix: ss58Format,
      icon
    }))
      // remove the relay chains, they are at the top already
      .filter(({ text }) => !text.includes(RELAY_CHAIN))
      .concat(
      // get any chain present in the metadata and not already part of chains
        ...metadataChains.filter(
          ({ value }) => {
            return !chains.find(
              ({ genesisHash }) => genesisHash === value);
          }
        ))
      .sort((a, b) => a.text.localeCompare(b.text))
  ], [metadataChains, t]);

  return hashes;
}
