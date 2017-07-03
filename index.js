const winston = require('winston');
const Botkit = require("botkit");
const config = require("./config");
const debug = require('debug')('okimochi');

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
  useMongoClient: true
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
      return new Promise((resolve, reject) => {User.update({ id: message.user },
          {$push: {depositAddresses: address}},
          {upsert: true}, () => resolve(address))
        }
      )
     })
    .then((address) => {
      bot.reply(message, "your deposit address is " + address)
    })
    .catch((err) => {bot.reply(err)})
})

// register
controller.hears('register', ["direct_mention", "direct_message"], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    if (err) {
      throw err
    }
    convo.ask("please paste your bitcoin address (separated by \\n)", (response, convo) => {
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
  const userId = message.match[1];
  const amount = Number(message.match[2]);
  const Txmessage = message.match[3] || "no message";
  if (isNaN(amount)){
    return bot.reply(message, "please give amount of BTC in number !");
  }

  controller.logger.debug("userId was " + userId);
  User.findOne({ id: message.user } ,(err, content) => {
    debug(content)

    // when the user is not registered
    if (content === null || content === undefined){
      controller.logger.info("content was " + JSON.stringify(content));
      bot.reply(message, formatUser(userId) + " had no registered address, so not going to pay.\nPlease register first!");

    } else {

      // check if all paybackAddresses has been used.
      const paybackAddresses = content.paybackAddresses
      let address;
      let addressIndex;
      if (paybackAddresses.every((a) => a.used)){
        bot.reply(message, "all addresses has been used. So using the one we used before!")
        address = paybackAddresses.pop().address
      } else {
        addressIndex = paybackAddresses.findIndex((e) => !e.used)
        debug(addressIndex)
        address = paybackAddresses[addressIndex].address
      }
      debug("going to pay to " + address);
      try {
        bitcoindclient.sendToAddress(address,
          amount,
          Txmessage,
          "this is comment."
        )
      } catch (e) {
        bot.reply(message, e.toString())
      }
    bot.reply(message, "payed to " + formatUser(userId));
    }
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
