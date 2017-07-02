const winston = require('winston');
const Botkit = require("botkit");
const config = require("./config");
const mysql = require("mysql");
const mongoStorage = require("botkit-storage-mongo")({
  mongoUri: config.mongoUri
});

// bitcoin
const BitcoindClient = require("bitcoin-core");
const bitcoindclient = new BitcoindClient(config.bitcoin);


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

const message_to_BTC_map = {
  ":bitcoin:": 0.001,
  "感謝": 0.0001,
  "ありがと": 0.0001,
  "thanks": 0.0001,
  "どうも": 0.0001,
  ":pray:": 0.0001,
  ":okimochi:": 0.001,
  "気持ち": 0.001,
  "きもち": 0.001
}

const thxMessages = Object.keys(message_to_BTC_map);
const userIdPattern = /<@([A-Z\d]+)>/ig;
const formatUser = (user) => `<@${user}>`

// slackbot settings.

let controller = Botkit.slackbot({
  storage: mongoStorage,
  logger: new winston.Logger({
    levels: winston.config.syslog.levels,
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: './okimochi.log'})
    ]
  })
}).configureSlackApp(
  config.botconfig
);


controller.spawn({
  token: process.env.TOKEN
}).startRTM(err => {
  if (err) {
    throw new Error(err);
  }
});


const testuser = {
  id: "@hogeusername",
  address: "mg73QvN2KmVzJ9wW56uU7ViFwzrfeqchmw"
};
controller.storage.users.save(testuser);
controller.storage.users.get("@hogeusername", (err, beans) => {
  if (err) {
    console.log(err);
  }
  console.log(beans);
});



// deposit
controller.hears(`deposit`, ["direct_mention", "direct_message", "mention"], (bot, message) => {
    controller.storage.users.get(message.user, (err, userinfo) => {
      if (!(userinfo.depositAddress instanceof Array)){
        userinfo.depositAddress = []
      }
      bitcoindclient.getNewAddress().then((address) => {
        userinfo.depositAddress.push(address);
        controller.storage.users.save(userinfo, (res) => {
          console.log(res)
          return bot.reply(message, "your deposit address is " + address);
      })
    })
  })
});

// pay by gratitude

const patternize = (msg) => String.raw`(.*)(${msg})(.*)`;
const paypattern = thxMessages.map(patternize);

controller.hears(paypattern, ["direct_mention", "direct_message", "ambient"], (bot, message) => {
  const before = message.match[1];
  const thxMessage = message.match[2]
  const after = message.match[3];

  if ((userIdPattern.test(before) === false) && (userIdPattern.test(after) === false)) {
    bot.reply(message, "not going to pay since there was no user in the message");
    return
  }

  let bfuser = before.match(userIdPattern)
  let afuser = after.match(userIdPattern)
  console.log("bfuser is " + bfuser + " and afuser is " + afuser);
  let usernames = [bfuser, afuser].filter((v) => v !== null)
  console.log("usernames be fore concat are " + usernames)
  usernames = Array.prototype.concat.apply([], usernames) // flatten
    .map((u) => u.replace(/@|<|>/g, ""))
  console.log("going to pay " + usernames);

  for(let u of usernames){
    controller.storage.users.get(u, (err, content) => {
      if (err) {
        throw new Error("no username in entry "+ err)
      }
      if (content === null || !content.address){
        controller.logger.info("content was " + JSON.stringify(content));
        controller.storage.users.save({id: u}, (err) => {
          return bot.reply(message, u + "had no registered address, so not going to pay");
        })
      }else{
        controller.logger.info("content is " + content);
        const paybackAddress = content.address.pop();
        console.log("payback address is " + paybackAddress)
        bitcoindclient.sendToAddress(paybackAddress,
          message_to_BTC_map[thxMessage],
          "this is comment.",
          u)
        return bot.reply(message, "payed to " + formatUser(u) )
      }
    })
  }
});

// pay intentionally

// registerAddress

controller.hears('register', ["direct_mention", "direct_message"], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    if (err) {
      throw err
    }
    convo.ask("please paste your bitcoin address (separated by \\n)", (response, convo) => {
      controller.storage.users.get(message.user, (err, userinfo) => {
        controller.logger.debug('user info retrieved from db was ' + userinfo)
        if (err) {
          throw err
        }
        if (!(userinfo.address instanceof Array)){
          userinfo.address = []
        }
        for(let address of response.text.split("\n")){
          bitcoindclient.validateAddress(response.text)
          .then(userinfo.address.push(address))
        }
        controller.storage.users.save(userinfo, (err) => {
          convo.say("successfully registered address as " + formatUser(message.user) + "'s !");
          convo.next();
        })
      })
    });
  })
})

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
  - @bitcoin-tip deposit

  # register the address for getting paied
  - @bitcoin-tip register

  # show this help
  - @bitcoin-tip help

  # show balance of the @user
  - @bicoin-tip balance @user

  # show BTC-JPY rate
  - @bitcoin-tip rate

  `;
  bot.reply(message, usage);
});
