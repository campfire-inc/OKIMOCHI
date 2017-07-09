require('dotenv').config({path: '../.env'});

// express related modules
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const buttonRouter = require('./src/routes/button');
app.use("/slack", buttonRouter)


const winston = require('winston');
const Botkit = require("botkit");
const config = require("./config");
const debug = require('debug')('okimochi');
const sync_request = require('sync-request');

debug("config is")
debug(config)
// bitcoin
const BitcoindClient = require("bitcoin-core");
const bitcoindclient = new BitcoindClient(config.bitcoin);

// functions
function PromiseSetAddressToUser(userId, address){
  debug(userId);
  debug(address)
  return new Promise((resolve, reject) => {
  bitcoindclient.validateAddress(address, (err, result) => {
    debug(err);
    debug(result);
    if (err){
      reject(err)
    }
      if (result && result.isvalid){
        User.update( {id: userId},
        {$push: {paybackAddresses: {address: address, used: false}}},
        {upsert: true, 'new': true}, (res) => {resolve(res)})
        resolve()
      } else {
        reject(new Error('please enter valid address !'))
      }
    })
  })
}

/**
 * from users information. choose unused paybackAddress Preferentially.
 * And mark that Address as "used". and returns updated info and address to use.
 * @param {Object} userContent
 * @return {Array} first address for using as paying back. Second updated user info
 *  and third is String for bot to speak
 */
function extractUnusedAddress(userContent){
  let paybackAddresses = userContent.paybackAddresses
  let address;
  let replyMessage = "";
  let addressIndex;
  if (paybackAddresses.every((a) => a.used)){
    replyMessage += "warning: all addresses has been used.\n" +
      "So using the one we used before!\n" +
      "Please register the new address for the sake of fungibility! \n"
    address = paybackAddresses.pop().address
  } else {
    addressIndex = paybackAddresses.findIndex((e) => !e.used)
    debug(addressIndex)
    address = paybackAddresses[addressIndex].address
    debug(userContent)
    console.log("\n\n\n\n")
    debug(addressIndex)
    userContent.paybackAddresses[addressIndex].used = true;
  }
  replyMessage += "Sending Tx to " + address + "\n"
  return [address, userContent, replyMessage];
}


function getUserBalance(userid, convo){
  User.findOne({id: userid}, (err, content) => {
    content = content.toObject()
    debug("content is " + content)

    // if user has not registered yet.
    if (content === null || content  === undefined ){
      convo.say(formatUser(userid) +
        " had no registered address. \nplease register first!");
    }else {
      ps = content.depositAddresses
        .map((a) => bitcoindclient.getReceivedByAddress(a))
      Promise.all(ps)
        .then((amounts) => {
          debug("amounts are" + amounts)
          convo.say(formatUser(userid) + " depositted " +
            amounts.reduce((a, b) => a + b, 0) + " BTC")
        })
        .catch((err) => convo.say(err.toString()))
    }
  })
}



function getRateJPY() {
  const rate_api_url = 'https://coincheck.com/api/exchange/orders/rate?order_type=buy&pair=btc_jpy&amount=1';
  let response = sync_request('GET', rate_api_url);
  let rate;
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
const amountPattern = /([\d\.]*)/ig;

// slackbot settings.

let controller = Botkit.slackbot({
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
}).startRTM((err) => {
  if (err) {
    throw new Error(err);
  }
});


// database initialization
const mongoose = require("mongoose");
mongoose.Promise = global.Promise
mongoose.connect(config.mongoUri, {
  useMongoClient: true,
  autoReconnect: true
})
  .then((db) => {return db.once('open', () => {
    console.log("db is open!")
  })})
  .catch((err) => {throw err})



const Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

let UserSchema = new Schema({
  _id: ObjectId,
  id: String,
  depositAddresses: [String],
  paybackAddresses: [
    {
      address: String,
      used: {type: Boolean, default: false}
    }
  ],
})

const User = mongoose.model('User', UserSchema);
const testuser = new User({
  id: "exampleUsername",
  depositAddresses: ["mg73QvN2KmVzJ9wW56uU7ViFwzrfeqchmw"],
  paybackAddresses: [{
    address: "miS3tb8CZ2CXWwRsGNK2EqXCfmzP6bcjv",
    used: false
  }]
});

mongoose.connection.on( 'connected', function(){
    console.log('connected.');
});

mongoose.connection.on( 'error', function(err){
    console.log( 'failed to connect a mongo db : ' + err );
});

// mongoose.disconnect() を実行すると、disconnected => close の順番でコールされる
mongoose.connection.on( 'disconnected', function(){
    console.log( 'disconnected.' );
});

mongoose.connection.on( 'close', function(){
    console.log( 'connection closed.' );
});

User.update({id: "exampleUsername"}, testuser, {upsert: true})
  .then((res) => {
    console.log(res);
    User.find({id: "exampleUsername"})
      .then(res => {
        debug("found user is " + JSON.stringify(res))
      })
    })
  .catch(err => {throw new Error(err)})

// deposit
controller.hears(`deposit`, ["direct_mention", "direct_message", "mention"], (bot, message) => {
  controller.logger.debug("heard deposit")
  bitcoindclient.getNewAddress()
    .then((address) => {
      bot.reply(message, "your deposit address is " + address)
      return address
    })
    .then((address) => User.update({ id: message.user },
        {$push: {depositAddresses: address}},
        {upsert: true}, () => debug("registered " + address + " as " + 
          formatUser(message.user) + "'s")))
    .catch((err) => {bot.reply(err)})

    
})

// register
controller.hears('register', ["direct_mention", "direct_message"], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    if (err) {
      throw err
    }
    convo.ask("please paste your bitcoin address (separated by \\n) of " + config.bitcoin.network, (response, convo) => {
      let ps = [];
      for (let address of response.text.split("\n")) {
        ps.push(PromiseSetAddressToUser(message.user, address))
      }
      debug(ps)
      Promise.all(ps)
        .then(() => convo.say("successfully registered address as " + formatUser(message.user) + "'s !"))
        .then(() => convo.next())
        .catch((err) => {convo.say(err.toString())}).then(() => {convo.next()})
    })
  })
})
/*
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
半分独り言です。
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
*/

// pay intentionally
controller.hears(`tip ${userIdPattern.source} ${amountPattern.source}(.*)`, ["direct_mention", "direct_message"], (bot, message) => {
  controller.logger.debug("whole match pattern was " + message.match[0]);
  const toPayUser = message.match[1];
  const amount = Number(message.match[2]);
  const Txmessage = message.match[3] || "no message";
  if (isNaN(amount)){
    return bot.reply(message, "please give amount of BTC in number !");
  }
  if (message.user === toPayUser){
    return bot.reply(message, "can not pay to your self !!")
  }
  controller.logger.debug("userId to pay is " + toPayUser);
  controller.logger.debug("and paying from " + message.user);

  User.findOne({ id: message.user }, (err, fromUserContent) => {
    User.findOne({id: toPayUser}, (err, toUserContent) => {

      if (fromUserContent === null || fromUserContent === undefined ){
        controller.logger.warning("fromUserContent was " + JSON.stringify(fromUserContent));
        bot.reply(message, formatUser(message.user) +
          " had no registered address, so not going to pay.\nPlease register first!");
      } else if (toUserContent === null || toUserContent === undefined ) {
        controller.logger.warning("to UserContent was " + JSON.stringify(toUserContent));
        bot.reply(message, formatUser(toPayUser) +
          " had no registered address, so not going to pay.\nPlease register first!");
      } else {

        // check if all paybackAddresses has been used.
        let [address, updatedContent, replyMessage] =
          extractUnusedAddress(toUserContent); 
        debug("going to pay to " + address);
        debug("of user " + updatedContent);
        bitcoindclient.sendToAddress(address,
          amount,
          Txmessage,
          "this is comment."
        )
          .then(() => updatedContent.save())
          .then(() => bot.reply(message, replyMessage +
            "payed to " + formatUser(toPayUser)))
          .catch((err) => bot.reply(message, err.toString()))
      }
    })
  })
})

// balance
controller.hears(`balance`, ['direct_mention', 'direct_message'], (bot, message) => {
  bot.startConversation(message, (err, convo) => {

    const firstQuestion = {
      "username": config.botUsername,
      "icon_emoji": ":moneybag:",
      "text": "Which balance do you want to know?",
      "attachments": [{
        "attachment_type": 'default',
        "fallback": "This is fall back message!",
        "callback_id": "balance_question1",
        "color": "#808080",
        "actions": [
          {
            "type": "button",
            "name": "yourself",
            "text": "ones for yourself"
          },
          {
            "type": "button",
            "name": "total",
            "text": "Total Balance"
          },
          {
            "type": "button",
            "name": "else",
            "text": "someone else's"
          }
        ]
      }]
    }


    const callbacks = [
      {
        pattern: "yourself",
        callback: (reply, convo) => {
          getUserBalance(message.user, convo)
          convo.next();
        }
      },

      {
        pattern: "total",
        callback: (reply, convo) => {
          bitcoindclient.getBalance()
            .then((balance) => {
              convo.say('the total deposited balance is ' + balance);
            })
            .catch((err) => {convo.say(err.toString())})
            .then(() => convo.next())
        }
      },

      {
        pattern: "else",
        callback: (reply, convo) => {
          convo.ask("Please mention the user you want to know", (response, convo) => {
            userId = response.text.match(userIdPattern)[0];
            debug("uesrId is\n" + userId);
            getUserBalance(userId, convo);
            convo.next();
          })
        }
      }
    ]


    convo.ask(firstQuestion, callbacks)
  })
})

// rate
controller.hears('^rate$', ['direct_mention', 'direct_message'], (bot, message) => {
  let rate = getRateJPY();
  if (rate) {
    bot.reply(message, `1BTC is now worth ${rate}JPY!`);
  } else {
    bot.reply(message, 'cannot get the rate somehow :pensive:');
  }
});

// help
controller.hears("^help$", ["direct_mention", "direct_message"], (bot, message) => {
  let usage = `
  \`\`\`
  # show @users bitcoin deposit address
  - @okimochi-bitcoin deposit

  # register the address for getting paied
  - @okimochi-bitcoin register

  # show this help
  - @okimochi-bitcoin help

  # show balance of the @user
  - @bicoin-tip balance @user

  # show BTC-JPY rate
  - @okimochi-bitcoin rate

  # tip intentionally ... message will be included as Tx message for bitcoin
  - @okimochi-bitcoin tip @user <BTC amount> <message>

  # 感謝の言葉にはまだ反応しないよ!ごめんね!
  \`\`\`
  `;
  bot.reply(message, usage);
});



app.listen(process.env.PORT || 3000)
