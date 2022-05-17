"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NftHandler = void 0;

var _apiHelper = require("@polkadot/extension-koni-base/api/dotsama/api-helper");

var _config = require("@polkadot/extension-koni-base/api/nft/config");

var _eth_nft = require("@polkadot/extension-koni-base/api/nft/eth_nft");

var _handlers = require("@polkadot/extension-koni-base/background/handlers");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
//import { AcalaNftApi } from '@polkadot/extension-koni-base/api/nft/acala_nft';
//import { BitCountryNftApi } from '@polkadot/extension-koni-base/api/nft/bit.country';
//import QuartzNftApi from '@polkadot/extension-koni-base/api/nft/quartz_nft';
//import { RmrkNftApi } from '@polkadot/extension-koni-base/api/nft/rmrk_nft';
//import StatemineNftApi from '@polkadot/extension-koni-base/api/nft/statemine_nft';
//import UniqueNftApi from '@polkadot/extension-koni-base/api/nft/unique_nft';
function createNftApi(chain, api, addresses) {
  const [substrateAddresses, evmAddresses] = (0, _utils.categoryAddresses)(addresses);
  const useAddresses = _apiHelper.ethereumChains.indexOf(chain) > -1 ? evmAddresses : substrateAddresses;

  switch (chain) {
    //    case SUPPORTED_NFT_NETWORKS.karura:
    //      return new KaruraNftApi(api, useAddresses, chain);
    //    case SUPPORTED_NFT_NETWORKS.acala:
    //      return new AcalaNftApi(api, useAddresses, chain);
    //    case SUPPORTED_NFT_NETWORKS.rmrk:
    // eslint-disable-next-line no-case-declarations
    //      const rmrkNftApi = new RmrkNftApi();
    //      rmrkNftApi.setChain(SUPPORTED_NFT_NETWORKS.rmrk);
    //      rmrkNftApi.setAddresses(useAddresses);
    //      return rmrkNftApi;
    //    case SUPPORTED_NFT_NETWORKS.statemine:
    //      return new StatemineNftApi(api, useAddresses, chain);
    //    case SUPPORTED_NFT_NETWORKS.uniqueNft:
    //      return new UniqueNftApi(api, useAddresses, chain);
    //    case SUPPORTED_NFT_NETWORKS.quartz:
    //      return new QuartzNftApi(api, useAddresses, chain);
    //    case SUPPORTED_NFT_NETWORKS.bitcountry:
    //      return new BitCountryNftApi(api, useAddresses, chain);
    //    case SUPPORTED_NFT_NETWORKS.moonbeam:
    //      return new Web3NftApi(useAddresses, chain);
    //    case SUPPORTED_NFT_NETWORKS.moonriver:
    //      return new Web3NftApi(useAddresses, chain);
    case _config.SUPPORTED_NFT_NETWORKS.astarEvm:
      return new _eth_nft.Web3NftApi(useAddresses, chain);
  }

  return null;
}

class NftHandler {
  apiPromises = [];
  handlers = [];
  addresses = [];
  total = 0;

  constructor(dotSamaAPIMap, addresses) {
    if (addresses) {
      this.addresses = addresses;
    }

    for (const item in _config.SUPPORTED_NFT_NETWORKS) {
      this.apiPromises.push({
        chain: item,
        api: dotSamaAPIMap[item]
      });
    }
  }

  setAddresses(addresses) {
    this.addresses = addresses; // if (this.prevAddresses.length === 0) this.prevAddresses = addresses;

    const [substrateAddresses, evmAddresses] = (0, _utils.categoryAddresses)(addresses);

    for (const handler of this.handlers) {
      const useAddresses = _apiHelper.ethereumChains.indexOf(handler.chain) > -1 ? evmAddresses : substrateAddresses;
      handler.setAddresses(useAddresses);
    }
  }

  setupApi() {
    try {
      if (this.handlers.length <= 0) {
        // setup connections for first time use
        const [substrateAddresses, evmAddresses] = (0, _utils.categoryAddresses)(this.addresses);
        this.apiPromises.forEach(_ref => {
          let {
            api: apiPromise,
            chain
          } = _ref;
          const useAddresses = _apiHelper.ethereumChains.indexOf(chain) > -1 ? evmAddresses : substrateAddresses; // eslint-disable-next-line @typescript-eslint/no-unsafe-argument

          const handler = createNftApi(chain, apiPromise, useAddresses);

          if (handler && !this.handlers.includes(handler)) {
            this.handlers.push(handler);
          }
        }); // console.log(`${this.handlers.length} nft connected`);
      }
    } catch (e) {
      console.error('error setting up nft handlers', e);
    }
  }

  existCollection(newCollection) {
    return _handlers.state.getNftCollection().nftCollectionList.some(collection => collection.chain === newCollection.chain && collection.collectionId === newCollection.collectionId && collection.collectionName === newCollection.collectionName);
  }

  existItem(newItem) {
    return _handlers.state.getNft().nftList.some(item => item.chain === newItem.chain && item.id === newItem.id && item.collectionId === newItem.collectionId && item.name === newItem.name);
  }

  async handleNfts(updateItem, updateCollection, updateReady) {
    this.setupApi();
    await Promise.all(this.handlers.map(async handler => {
      await handler.fetchNfts(data => {
        if (!this.existItem(data)) {
          updateItem(data);
        }
      }, data => {
        if (!this.existCollection(data)) {
          updateCollection(data);
        }
      }, updateReady);
    }));
  }

  parseAssetId(id) {
    const numberId = parseInt(id);
    return numberId.toString();
  }

}

exports.NftHandler = NftHandler;