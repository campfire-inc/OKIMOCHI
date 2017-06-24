const Botkit = require('botkit');
const config = require('./config');
const mysql = require('mysql');
const mongoStorage = require('botkit-storage-mongo')({
  mongoUri: '127.0.0.1'
});

// bitcoin
const Client = require('bitcoin-core');
const client = new Client({
  network: "regtest"
});

client.getInfo().then((help) => console.log(help));


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
