const Botkit = require("botkit");
const config = require("./config");
const mysql = require("mysql");
const mongoStorage = require("botkit-storage-mongo")({
  mongoUri: "127.0.0.1"
});

// bitcoin
const BitcoindClient = require("bitcoin-core");
const bitcoindclient = new BitcoindClient({
  network: "mainnet",
  username: "slackbot",
  password: "bitcoin-tipper",
  host: "127.0.0.1"
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
  connection.query("INSERT INTO account SET ?",
    {
      slack_id: userId,
      passphrase: passphrase,
      role: "user"
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
    network: "testnet"
  }, err => {
    if (err) {
      throw new Error(err);
    }
  });
}

const message_to_BTC_map = {
  ":bitcoin:": 0.001,
  "感謝": 0.0001,
  "ありがと": 0.0001,
  "thanks": 0.0001,
  "どうも": 0.0001,
  ":pray:": 0.0001
}

const thxMessages = Object.keys(message_to_BTC_map);
const userIdPattern = /@([A-Z\d]+)/ig;

// slackbot settings.

let controller = Botkit.slackbot({
  storage: mongoStorage
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

const testuser = {
  id: "hogeusername",
  address: "hogehogeaddress"
};
controller.storage.teams.save(testuser);
controller.storage.teams.get("hogeusername", (err, beans) => {
  if (err) {
    console.log(err);
  }
  console.log(beans);
});

// deposit
controller.hears(`^deposit ${userIdPattern.source}$`, ["direct_mention", "direct_message"], (bot, message) => {
  bitcoindclient.getNewAddress().then((address) => {
    bot.reply(message, "your deposit address is " + address);
  })
});

// pay by gratitude

const patternize = (msg) => String.raw`(.*)${msg}(.*)`;
const paypattern = thxMessages.map(patternize);

controller.hears(paypattern, ["direct_mention", "direct_message", "ambient"], (bot, message) => {
  const before = message.match[1];
  const after = message.match[2];
  console.log("before is " + before + " and after is " + after);

  if ((userIdPattern.test(before) === false) && (userIdPattern.test(after) === false)) {
    bot.reply(message, "not going to pay")
    return
  }

  let bfuser = before.match(userIdPattern)
  let afuser = after.match(userIdPattern)
  const usernames = [bfuser, afuser].filter((v) => v !== null)
  bot.reply(message, "payed to " + usernames);
});

// pay intentionally



// balance
/*
controller.hears(`^balance ${userIdPattern.source}$`, ['direct_mention'], (bot, message) => {
  let userId = message.match[1];
  let (userId in )
})
*/


// help
controller.hears("^help$", ["direct_mention", "direct_message"], (bot, message) => {
  let usage = `
  # show @users bitcoin deposit address
  - @bitcoin-tip DepositAddress @user

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
