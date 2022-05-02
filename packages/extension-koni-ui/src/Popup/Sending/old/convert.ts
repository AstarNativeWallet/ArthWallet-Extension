// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ethers } from 'ethers';

import { hexToU8a, isHex, u8aToHex } from '@polkadot/util';
import { addressToEvm, decodeAddress, encodeAddress, evmToAddress } from '@polkadot/util-crypto';

const ASTAR_SS58_FORMAT = 5;

const checkSumEvmAddress = (evmAddress: string): string => {
  return ethers.utils.getAddress(evmAddress);
};

export const isValidEvmAddress = (evmAddress: string): boolean => {
  if (!evmAddress) {
    return false;
  }

  // Memo: returns `false` if evmAddress was converted from SS58
  try {
    ethers.utils.getAddress(evmAddress);
  } catch (e) {
    return false;
  }

  const ss58Address = toSS58Address(evmAddress);

  return ss58Address.length > 0;
};

export const toSS58Address = (h160Address: string) => {
  const address = checkSumEvmAddress(h160Address);

  return evmToAddress(address, ASTAR_SS58_FORMAT);
};

// Memo: The EVM address won't be same as the address shown in MetaMask imported from the same private key of the SS58
// Ref: https://github.com/polkadot-js/common/issues/931

export const isValidAddressPolkadotAddress = (address: string) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));

    return true;
  } catch (error) {
    return false;
  }
};

const toEvmAddress = (ss58Address: string) => {
  return u8aToHex(addressToEvm(ss58Address));
};

export const buildEvmAddress = (toAddress: string): string => {
  // Memo: goes to EVM deposit
  if (isValidAddressPolkadotAddress(toAddress)) {
    return toEvmAddress(toAddress);
  }

  if (ethers.utils.isAddress(toAddress)) {
    return toAddress;
  }

  return '';
};
