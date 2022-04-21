// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Runs in the extension background, handling all keyring access

import '@polkadot/extension-inject/crossenv';

import type { RequestSignatures, TransportRequestMessage } from '@polkadot/extension-base/background/types';

import { withErrorLog } from '@polkadot/extension-base/background/handlers/helpers';
import { PORT_CONTENT, PORT_EXTENSION } from '@polkadot/extension-base/defaults';
import { AccountsStore } from '@polkadot/extension-base/stores';
import { KoniCron } from '@polkadot/extension-koni-base/background/cron';
import handlers, { initBackgroundWindow } from '@polkadot/extension-koni-base/background/handlers';
import { KoniSubcription } from '@polkadot/extension-koni-base/background/subscription';
import keyring from '@polkadot/ui-keyring';
import { assert } from '@polkadot/util';
import { cryptoWaitReady } from '@polkadot/util-crypto';

//import { Keyring } from '@polkadot/api';

// setup the notification (same a FF default background, white text)
withErrorLog(() => chrome.browserAction.setBadgeBackgroundColor({ color: '#d90000' }));

// listen to all messages and handle appropriately
chrome.runtime.onConnect.addListener((port): void => {
  // shouldn't happen, however... only listen to what we know about
  assert([PORT_CONTENT, PORT_EXTENSION].includes(port.name), `Unknown connection from ${port.name}`);

  // message and disconnect handlers
  port.onMessage.addListener((data: TransportRequestMessage<keyof RequestSignatures>) => handlers(data, port));
  port.onDisconnect.addListener(() => console.log(`Disconnected from ${port.name}`));
});

//import keyring from '@polkadot/ui-keyring';
//import { RequestAccountExportPrivateKey, ResponseAccountExportPrivateKey } from '@polkadot/extension-base/background/KoniTypes';

//import { decodePair } from '@polkadot/keyring/pair/decode';
//import { u8aToHex } from '@polkadot/util';
//import { base64Decode, mnemonicGenerate, createAccount  } from '@polkadot/util-crypto';

// initial setup
cryptoWaitReady()
  .then((): void => {
    console.log('Arth crypto initialized');

    // load all the keyring data
    keyring.loadAll({ store: new AccountsStore(), type: 'sr25519' });
    //keyring.loadAll({ store: new AccountsStore(), type: 'ethereum' });

    // load all available addresses and accounts
    console.log('Arth keyring.loadAll Done..');

    console.log('Arth keyring.loadAll Done.. ', keyring);
    
//    const mnemonic = mnemonicGenerate();
//    console.log('Arth keyring.mnemonicGenerate: ', mnemonic);
/*
//    test('signs with default signed extensions - ethereum', async () => {
//      const ethAddress = await createAccount('ethereum');
//      const ethPair = keyring.getPair(ethAddress);
//    }

    let address = '0xf625a97875650f9C46439217c21f7E638E270046';
    let password = '123456';

//    keyring.getPair('0xf625a97875650f9C46439217c21f7E638E270046');

    
//    const ethAddress = createAccount('ethereum');
//    const ethPair = keyring.getPair(ethAddress);

    //const keyring = new Keyring({ type: 'sr25519' });

    /*
    const accounts = keyring.getAccounts();
    accounts.forEach(({ address, meta, publicKey }) =>
      console.log('Arth address: ', address, JSON.stringify(meta), u8aToHex(publicKey))
    );
*/

//keyring.getPair('5FURcxweuwfwJkC39TNR9zu8K8DJnaf62q5hcmCw5to6Febh');

    //    const exportedJson = keyring.backupAccount(keyring.getPair(address), password);
//    const decoded = decodePair(password, base64Decode(exportedJson.encoded), exportedJson.encoding.type);
  
//    let privateKey = u8aToHex(decoded.secretKey)
//    console.log('Arth privateKey: ', privateKey);
  
    // additional initialization here, including rendering

    // Init subcription
    const subscriptions = new KoniSubcription();

    subscriptions.init();

    // Init cron
    (new KoniCron(subscriptions)).init();

    initBackgroundWindow(keyring);

//    keyring.getPair('0xf625a97875650f9C46439217c21f7E638E270046');

    console.log('Arth initialization completed');
  })
  .catch((error): void => {
    console.error('Arth initialization failed', error);
  });
