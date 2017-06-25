const Botkit = require('botkit');
const config = require('./config');
const mysql = require('mysql');
const mongoStorage = require('botkit-storage-mongo')({
  mongoUri: '127.0.0.1'
});

// bitcoin
const BitcoindClient = require('bitcoin-core');
const bitcoindclient = new BitcoindClient({
  network: "regtest",
  username: 'slackbot',
  password: 'bitcoin-tipper',
  host: '127.0.0.1'
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

function activateWallet(userId, passphrase) {
  let client = new bwclient(config.bwc);
  client.importFromMnemonic(passphrase, {
    network: 'testnet'
  }, err => {
    if (err) {
      throw new Error(err);
    }
  });
}

const userIdPattern = /<@([A-Z\d]+)>/;

// slackbot settings.

let controller = Botkit.slackbot({
}).configureSlackApp(
  config.botconfig
);


controller.spawn({
  token: process.env.token
}).startRTM(err => {
  if (err) {
    throw new Error(err);
  }
});


// balance
/*
controller.hears(`^balance ${userIdPattern.source}$`, ['direct_mention'], (bot, message) => {
  let userId = message.match[1];
  let (userId in )
})
*/


// help
controller.hears('^help$', ['direct_mention', 'direct_message'], (bot, message) => {
  let usage = `
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
  `;
  bot.reply(message, usage);
});
