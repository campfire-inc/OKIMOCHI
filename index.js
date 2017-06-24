const Botkit = require('botkit');
const config = require('./config');
const mysql = require('mysql');
const mongoStorage = require('botkit-storage-mongo')({
  mongoUri: '127.0.0.1'
});

// bitcoin
const bcoin = require('bcoin').set('testnet');

const chain = new bcoin.chain({
  db: 'leveldb',
  location: process.env.HOME + '/spvchain',
  spv: true
});
const pool = new bcoin.pool({
  chain: chain,
  spv: true,
  maxPeers: 8
});
const walletdb = new bcoin.walletdb({
  db: 'memory'
});

pool.open().then(function() {
  return walletdb.open();
}).then(function() {
  return walletdb.create();
}).then(function(wallet) {
  console.log('created wallet with address %s', wallet.getAddress('base58'));

  // アドレスを監視対象に追加
  pool.watchAddress(wallet.getAddress());

  // P2Pネットワークからのtxのやり取りを開始
  pool.connect().then(function() {
    pool.startSync();
    pool.on('tx', (tx) => {
      walletdb.addTx(tx);
    });

    wallet.on('balance', (balance) => {
      console.log('balance updated.');
      console.log(bcoinl.amount.btc(balance.unconfirmed));
    });
  });
});


// functions

function jpy2btc(jpyAmount) {
  let rate = getRateJPY();
  return jpyAmount * 1.0 / rate;
}

function inBTC(satoshi) {
  return (satoshi / 100000000.0).toFixed(4);
}

function inSatoshi(BTC) {
  return parseFloat((btc * 100000000).toFixed(0));
}

function saveWallet(userId, passphrase) {
  connection.query('INSERT INTO account SET ?',
    {
      slack_id: userId,
      passphrase: passphrase,
      role: 'user'
    },
    (err, results, fields) => {
      if (err) {
        throw new Error(err);
      }
    }
  );
}


// help

controller.hears('^help$', ['direct_mention', 'direct_message'], (bot, message) => {
  let usage = `
  ```
  # show @users bitcoin deposit address
  - @bitcoin-tip depositAddress @user

  # register the address for getting paied
  - @bitcoin-tip registerAddress @user

  # show this help
  - @bitcoin-tip help

  # show balance of the @user
  - @bicoin-tip balance @user

  # show BTC-JPY rate
  - @bitcoin-tip rate
  ```
  `;
});
