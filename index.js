const Botkit = require('botkit');
const request = require('sync-request');
const config = require('./config');
const mysql = require('mysql');
const mongoStorage = require('botkit-storage-mongo')({
  mongoUri: '127.0.0.1'
});

if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}


// functions

function getBTCperJPY() {
  const rate_api_url = 'https://coincheck.com/api/exchange/orders/rate?order_type=buy&pair=btc_jpy&amount=1';
  let response = request('GET', rate_api_url);
  if (response.statusCode == 200) {
    rate = Math.round(JSON.parse(response.body).rate);
    return rate;
  }
}

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


// db and miscs

const userIdPattern = /<@([A-Z\d]+)>/;
const userBWClient = {};
const adminPassword = config.adminPassword;

let connection = mysql.createConnection(config.db);
connection.connect(err => {
  if (err) {
    throw new Error(err);
  }
});

connection.query('SELECT slack_id, passphrase FROM account', (err, results, fields) => {
  if (err) {
    throw new Error(err);
  }
  results.forEach(result => {
    activateWallet(result.slack_id, result.passphrase);
  });
});


// slackbot settings.

let controller = Botkit.slackbot({
  debug: true
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

controller.on('reaction_added', (bot, event) => {
  console.log(event);
  if (event.reaction == 'ok' || event.reaction == 'ng') {
    let ts = event.item.ts;
    let userReacting = event.user;
  }
})


// hello world handler
controller.hears('hi', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  const replyObj = {
    'username': 'tip',
    'text': 'This is pre-text',
    'attachments': [
      {
        'fallback': 'Please'
      }]
  }
  bot.reply(message, replyObj);
});


// tipbot functions
// charge
/*
controller.hears('^charge ((${userIdPattern.source} )+)(.+) (\\d+)$',
  ['direct_mention'], (bot, message) => {
    let userIds = message.match[1].slice(0, -1).split(' ').map(e => e.match(/[A-Z\d]+/)[0]);
    let item = message.match[4];
    let dutch = Math.round(message.match[5] / (userIds.length + 1.00));
    console.log(message);
    if (userIds.every(e => e in userBWClient)) {
      bot.say(
        {
          text: "hogehoge",
          channel: message.channel
        },
        (err, response) => {
          if (err) {
            throw new Error(err)
          }

        }
      )
    }
  })
*/


// credit
controller.hears('^credit$', ['direct_mention'], (bot, message) => {
  let userId = message.user;
  if (userId in userBWClient) {
    connection.query(
      'SELECT debtor_id, item, amount FROM debt WHERE status = \'claimed\' AND creditor_id = ?',
      [userId],
      (err, results, fields) => {
        if (err) {
          throw new Error(err);
        }
        if (results.length > 0) {
          let credits = results.map(result => {
            return [`<@${result.debtor_id}>`, result.item, `${result.amount}JPY`].join('\t');
          });
          bot.reply(message, 'you have credits below! :moneybag: \n ```' + credits.join('\n') + '\n```');
        } else {
          bot.reply(message, 'you have no credits :white_check_mark:');
        }
      }
    )
  } else {
    bot.say('you haven\'t activated a wallet');
  }
}
);
