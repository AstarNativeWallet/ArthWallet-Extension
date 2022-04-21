"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getERC20TransactionObject = getERC20TransactionObject;
exports.getEVMTransactionObject = getEVMTransactionObject;
exports.handleTransfer = handleTransfer;
exports.makeERC20Transfer = makeERC20Transfer;
exports.makeEVMTransfer = makeEVMTransfer;

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _web = require("@polkadot/extension-koni-base/api/web3/web3");

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
//import { decodePair } from '@polkadot/keyring/pair/decode';
//import keyring from '@polkadot/ui-keyring';
//import { u8aToHex } from '@polkadot/util';
//import { base64Decode } from '@polkadot/util-crypto';
//import { RequestAccountExportPrivateKey, ResponseAccountExportPrivateKey } from '@polkadot/extension-base/background/KoniTypes';

/*
function accountExportPrivateKey ({ address, password }: RequestAccountExportPrivateKey): ResponseAccountExportPrivateKey {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const exportedJson = keyring.backupAccount(keyring.getPair(address), password);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const decoded = decodePair(password, base64Decode(exportedJson.encoded), exportedJson.encoding.type);

  return {
    privateKey: u8aToHex(decoded.secretKey)
  };
}
let privateKeyStr = accountExportPrivateKey({
  address: '0xf625a97875650f9C46439217c21f7E638E270046', password: '123456'
});
console.log('Arth pk: ', privateKeyStr);
*/
//const exportedJson = keyring.backupAccount(keyring.getPair('0xf625a97875650f9C46439217c21f7E638E270046'), '123456');
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//const decoded = decodePair('123456', base64Decode(exportedJson.encoded), exportedJson.encoding.type);
//let  privateKey=  u8aToHex(decoded.secretKey);
//console.log('Arth pk: ', privateKey);

/*
async function sendEvm () {

  console.log('Arth Call sendEvm');

  const web3Api = getWeb3Api('astarEvm');
  console.log('Arth web3Api: ', web3Api);
  //const erc20Contract = getERC20Contract(networkKey, assetAddress);
  const gasPrice = await web3Api.eth.getGasPrice();
  console.log('Arth gasPrice: ', gasPrice);
  //let value = new BN(1000000000);  //1000 ** 18;
  let value = web3Api.utils.toBN(0.001 * (10 ** 18));  //new BN(10000000000);  //1000 ** 18;
  console.log('Arth BN value: ', value);
  const transactionObject = {
    gasPrice: gasPrice,
    to: '0x96cbef157358b7c90b0481ba8b3db8f58e014116',
    value: value.toString()
  } as TransactionConfig;
  const gasLimit = await web3Api.eth.estimateGas(transactionObject);
  transactionObject.gas = gasLimit;
  console.log('Arth gasLimit: ', gasPrice);
  const estimateFee = parseInt(gasPrice) * gasLimit;
  console.log('Arth estimateFee: ', estimateFee);
  let pk = 'dcd825c5b20e7f317ad644746b76cb5938234d2c65f29a9a61079571ef488d59';
  const signedTransaction = await web3Api.eth.accounts.signTransaction(transactionObject, pk);
  console.log('Arth signedTransaction: ', signedTransaction);
  const sendSignedTransaction = await web3Api.eth.sendSignedTransaction(signedTransaction.rawTransaction);
  console.log('Arth sendSignedTransaction: ', sendSignedTransaction);
};

sendEvm();
*/
//  transactionObject.gas = gasLimit;

/*
  let contractAddress = '0x1326BF7D66858662B0897f500C45F55E8D0691ab';
  console.log('Arth Call sendEvm');
  const web3 = new Web3('wss://rpc.astar.network');
  const contract = new web3.eth.Contract(ABI as AbiItem[], contractAddress);

  const gasPrice = await web3.eth.getGasPrice();
  console.log('Arth gasPrice: ', gasPrice);
*/
async function handleTransfer(transactionObject, networkKey, privateKey, callback) {
  const web3Api = (0, _web.getWeb3Api)(networkKey);
  const signedTransaction = await web3Api.eth.accounts.signTransaction(transactionObject, privateKey);
  const response = {
    step: _KoniTypes.TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };

  try {
    (signedTransaction === null || signedTransaction === void 0 ? void 0 : signedTransaction.rawTransaction) && web3Api.eth.sendSignedTransaction(signedTransaction.rawTransaction).on('transactionHash', function (hash) {
      console.log('transactionHash', hash);
      response.step = _KoniTypes.TransferStep.READY;
      response.extrinsicHash = hash;
      callback(response);
    }) // .on('confirmation', function (confirmationNumber, receipt) {
    //   console.log('confirmation', confirmationNumber, receipt);
    //   response.step = TransferStep.PROCESSING;
    //   response.data = receipt;
    //   callback(response);
    // })
    .on('receipt', function (receipt) {
      console.log('receipt', receipt);
      response.step = _KoniTypes.TransferStep.SUCCESS;
    });
  } catch (error) {
    var _response$errors;

    response.step = _KoniTypes.TransferStep.ERROR;
    (_response$errors = response.errors) === null || _response$errors === void 0 ? void 0 : _response$errors.push({
      code: _KoniTypes.TransferErrorCode.TRANSFER_ERROR,
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: error.message
    });
  }
}

async function getEVMTransactionObject(networkKey, to, value, transferAll) {
  const web3Api = (0, _web.getWeb3Api)(networkKey);
  const gasPrice = await web3Api.eth.getGasPrice();
  const transactionObject = {
    gasPrice: gasPrice,
    to: to
  };
  const gasLimit = await web3Api.eth.estimateGas(transactionObject);
  transactionObject.gas = gasLimit;
  const estimateFee = parseInt(gasPrice) * gasLimit;
  transactionObject.value = transferAll ? new _util.BN(value).add(new _util.BN(estimateFee).neg()) : value;
  return [transactionObject, estimateFee.toString()];
}

async function makeEVMTransfer(networkKey, to, privateKey, value, transferAll, callback) {
  const [transactionObject] = await getEVMTransactionObject(networkKey, to, value, transferAll);
  await handleTransfer(transactionObject, networkKey, privateKey, callback);
}

async function getERC20TransactionObject(assetAddress, networkKey, from, to, value, transferAll) {
  const web3Api = (0, _web.getWeb3Api)(networkKey);
  const erc20Contract = (0, _web.getERC20Contract)(networkKey, assetAddress);
  let freeAmount = new _util.BN(0);
  let transferValue = value;

  if (transferAll) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const bal = await erc20Contract.methods.balanceOf(from).call();
    freeAmount = new _util.BN(bal || '0');
    transferValue = freeAmount.toString() || '0';
  }

  function generateTransferData(to, transferValue) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    return erc20Contract.methods.transfer(to, transferValue).encodeABI();
  }

  const transferData = generateTransferData(to, transferValue);
  const gasPrice = await web3Api.eth.getGasPrice();
  const transactionObject = {
    gasPrice: gasPrice,
    from,
    to: assetAddress,
    data: transferData
  };
  const gasLimit = await web3Api.eth.estimateGas(transactionObject);
  transactionObject.gas = gasLimit;
  const estimateFee = parseInt(gasPrice) * gasLimit;

  if (transferAll) {
    transferValue = new _util.BN(freeAmount).add(new _util.BN(estimateFee).neg()).toString();
    transactionObject.data = generateTransferData(to, transferValue);
  }

  return [transactionObject, estimateFee.toString()];
}

async function makeERC20Transfer(assetAddress, networkKey, from, to, privateKey, value, transferAll, callback) {
  const [transactionObject] = await getERC20TransactionObject(assetAddress, networkKey, from, to, value, transferAll);
  await handleTransfer(transactionObject, networkKey, privateKey, callback);
}