require('dotenv').config({path: '../.env'});
const Botkit = require("botkit");
const config = require("./config");
const debug = require('debug')('okimochi');
const plotly = require('plotly')(config.plotly.account_name, config.plotly.api_key);
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const util = require('util');
const MyConvos = require(path.join(__dirname, "src", "conversations"))
const getRateJPY = require(path.join(__dirname, "src", "lib")).getRateJPY;

// logger
require(path.join(__dirname, "src", "logger.js"));
const winston = require('winston');
const logger = winston.loggers.get('okimochi');


// import message object according to lang setting.
let locale_message;
if (config.lang === "en"){
  locale_message = require("./locale/english");
} else if (config.lang === "ja"){
  locale_message = require('./locale/japanese');
} else {
  throw new Error("must specify MESSAGE_LANG environment variable either to `en` or `ja` !!")
}

console.log("config is", config)

// bitcoin
const bitcoindclient = config.bitcoindclient;


function PromiseGetAllUsersDeposit(){
  return new Promise((resolve, reject) => {
    User.find({} , ["id", "totalPaybacked"], {sort: {'id': 1}}, (err, ids) => {
      if (err) reject(err);
      if (ids === undefined) reject(new Error("couldn't find undefined! "));
      debug("ids are ", ids)
      let ps = [];
      for (let i = 0, size = ids.length; i<size; ++i) {
        debug("id is ", ids[i])
        ps.push(PromisegetUserBalance(ids[i].id))
      }

      Promise.all(ps).then((balances) => {
        let result = [];
        for (let i = 0, size = ids.length; i<size; ++i) {
          if (!UserInfoMap[ids[i].id]) continue;
          let id = ids[i].id
          result.push({
            id: id,
            balance: balances[i],
            color: UserInfoMap[id].color,
            team: UserInfoMap[id].team || "no team",
            name: UserInfoMap[id].name,
            totalPaybacked: ids[i].totalPaybacked
          })
        }
        resolve(result)
      })
      .catch(err => reject(err))
    })
  })
}


function PromiseGetAllUserPayback(userinfos){
  return new Promise((resolve, reject) => {
    User.find({}, ["id", "totalPaybacked"], { sort: { 'id': 1 }}, (err, contents) => {
      if (err) reject(err);
      let result = [];
      for (c of contents){
        result.push(c.toObject().totalPaybacked)
      }
      resolve(result);
    })
  })
}

function makeTraceForPlotly(userinfo, hue){
  debug("makeing trace from", userinfo)
  return {
    x: userinfo.balance,
    y: userinfo.totalPaybacked,
    text: [userinfo.name],
    mode: "markers",
    name: userinfo.name,
    marker: {
      color: userinfo.color,
      size: 20,
      line: {
        color: "white",
        width: 0.5
      }
    },
    type: 'scatter'
  }
}


async function PromisePlotRankingChart(){
  let x;
  try {
    userinfos = await PromiseGetAllUsersDeposit()
  } catch(e) {
    throw e
  }

  let data = [];
  for (u of userinfos){
    data.push(makeTraceForPlotly(u));
  }

  const layout = {
    title: 'OKIMOCHI ranking',
    xaxis: {
      title: locale_message.ranking.xaxis,
      showgrid: false,
      zeroline: false
    },
    yaxis: {
      title: locale_message.ranking.yaxis,
      showline: false
    },
    autosize: false,
    width: 960,
    height: 540
  };

  const opts = {
    layout: layout,
    filename: 'okimochi-ranking',
    fileopt: 'new'
  };

  return new Promise((resolve, reject) => {
    plotly.plot(data, opts, (err, msg) => {
      if (err) reject(err);
      else resolve(msg);
    })
  })
}

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
        reject(new Error(locale_message.register.notValid))
      }
    })
  })
}

/**
 * from users information. choose unused paybackAddress Preferentially.
 * And mark that Address as "used". and returns updated info and address to use.
 * @param {Object} userContent
 * @return {Array}
 *  1. first is the address for using as paying back tx.(null if no address registered.)
 *  2. Second is updated user info.
 *  3. And third is String for bot to speak
 */
function extractUnusedAddress(userContent){
  let paybackAddresses = userContent.paybackAddresses
  let address;
  let replyMessage = "";
  let addressIndex;
  if (!paybackAddresses || paybackAddresses.length === 0){
    address = null
  } else if (paybackAddresses.every((a) => a.used)){
    replyMessage += locale_message.allPaybackAddressUsed
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


function PromiseFindUser(userid){
  return new Promise((resolve, reject) => {
    User.findOne({id: userid}, (err, content) => {
      if (err) {
        reject(err)
    // if user has not registered yet.
      } else if (content === null || content  === undefined ){
        const replyMessage = formatUser(userid) +
          " is not in db. \nplease register or deposit first!";
        reject( new Error(replyMessage))
      } else {
        resolve(content)
      }
    })
  });
}


/*
 * @param userid {string} to retreive the balance
 * @return {Promise} Which will resolves to Integer amount of BTC that the user has deposited.
 */
function PromisegetUserBalance(userid){
  return PromiseFindUser(userid)
    .then((content) => {
      debug("content is ", content)

      content = content.toObject()
      return content.depositAddresses
        .map((a) => bitcoindclient.validateAddress(a))
    })
    .then((ps) => {
      return Promise.all(ps)
        .then((results) => {
          debug("results were ", results)
          return results.filter((r) => r.isvalid)
        })
        .then((validAddresses) => {
          debug("validAddresses were ", validAddresses);
          return Promise.all(
            validAddresses.map((a) => {
              debug("address validation result is ", a);
              return bitcoindclient.getReceivedByAddress(a.address, 0)
            })
          )
        })

        .then((amounts) => {
          debug("amounts are", amounts);
          debug(Object.prototype.toString.call(amounts))
          return amounts.reduce((a, b) => a + b, 0)
        })
    })
}


const message_to_BTC_map = locale_message.message_to_BTC_map;
const thxMessages = Object.keys(message_to_BTC_map);
const userIdPattern = /<@([A-Z\d]+)>/ig;
const formatUser = (user) => `<@${user}>`
const amountPattern = /([\d\.]*)/ig;


// lackbot settings.
let controller = Botkit.slackbot({
  clientId: config.botconfig.clientId,
  clientSecret: config.botconfig.clientSecret,
  scopes: ['bot'],
  logger: winston.loggers.get('botkit')
}).configureSlackApp(
  config.botconfig
);


let bot = controller.spawn({
  token: config.TOKEN,
  debug: config.SLACK_DEBUG,
  retry: 1000
}).startRTM((err) => {
  if (err) {
    throw new Error(err);
  }
});

bot.configureIncomingWebhook({
  url: config.webhook_url
});

controller.on('rtm_reconnect_failed',function(bot) {
  console.log('\n\n*** '+moment().format() + ' ** Unable to automatically reconnect to rtm after a closed conection.')
})

// from id (e.g. U2FG58SDR) => to information used in this bot (mostly by plotting ranking)
let UserInfoMap = {};

bot.api.users.list({}, (err, res) => {
  if (err) throw err;
  if (!res.ok) {throw new Error("failed to call slack `users_list` api")}
  res = res.members;
  for (i = 0, size = res.length; i < size; ++i){
    if (res[i]["is_bot"] || res[i]["id"] === "USLACKBOT") continue;
    if (i === 1){
      console.log("first user's info is ", res[i])
    }
    UserInfoMap[res[i]["id"]] = { "name": res[i]["name"],
      "team": res[i]["team_id"],
      "color": res[i]["color"] || "#000000",
    }
  }
});


if (process.env.NODE_ENV === "production"){
  bot.sendWebhook({
    text: "OKIMOCHI has been updated !",
    channel: config.default_channel,
    icon_emoji: config.icon_emoji
  }, (err, res) => {
    if (err) throw err;
  })
}

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
  totalPaybacked: {type: Number, default: 0}, // pendingBalance + amount payed directry.
  pendingBalance: {type: Number, default: 0}
})

const User = mongoose.model('User', UserSchema);

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

// deposit
controller.hears(`deposit`, ["direct_mention", "direct_message", "mention"], (bot, message) => {
  debug("heard deposit")
  bitcoindclient.getNewAddress()
    .then((address) => {
      debug("going to show following address \n", address)
      const tmpfile = path.join('/tmp', address + ".png")
      QRCode.toFile(tmpfile, address, (err) => {
        if (err) throw err;
        controller.logger.debug("tmpfile is ", tmpfile)
        controller.logger.debug("message is ", locale_message.deposit.filecomment)
        controller.logger.debug("channel is ", message.channel)

        bot.api.files.upload({
          file: fs.createReadStream(tmpfile),
          filename: "please_pay_to_this_address" + ".png",
          title: address + ".png",
          initial_comment: locale_message.deposit.file_comment,
          channels: message.channel
        }, (err, res) => {
          if (err) bot.reply(err)
          debug("result is ", res);
        })

        bot.reply(message, locale_message.deposit.msg_with_qrcode)
        bot.reply(message, address)
      })
      return address
    })
    .then((address) => User.update({ id: message.user },
        {$push: {depositAddresses: address}},
        {upsert: true}, () => debug("registered " + address + " as " + 
          formatUser(message.user) + "'s")))
    .catch((err) => {bot.reply(message, err)})


})

// register
controller.hears('register', ["direct_mention", "direct_message"], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    if (err) {
      throw err
    }
    convo.ask(util.format(locale_message.register.beg, config.btc_network), (response, convo) => {
      let ps = [];
      for (let address of response.text.split("\n")) {
        ps.push(PromiseSetAddressToUser(message.user, address))
      }
      Promise.all(ps)
        .then(() => convo.say(util.format(locale_message.register.success, formatUser(message.user))))
        .then(() => convo.next())
        .catch((err) => {convo.say(err.toString())}).then(() => {convo.next()})
    })
  })
})

// tip by reaction
controller.on(['reaction_added'], (bot, message) => {
  debug("reaction added !")
  debug("and message object is " + JSON.stringify(message));
  const emoji = ":" + message.reaction + ":"
  if (thxMessages.some((p) => p === emoji)) {

    // 支払い
    const amount = message_to_BTC_map[emoji]
    smartPay(message.user, message.item_user, amount, emoji)
      .then((msg) => {
        PromiseOpenPrivateChannel(message.item_user)
          .then((channel) => {
            message.channel  = channel
            bot.reply(message, msg)

            debug("msg was " + msg)
          })
      })
      .catch((err)  => {
        PromiseOpenPrivateChannel(message.user)
          .then((channel) => {
            message.channel  = channel
            bot.reply(message, err.toString())

            debug("err was " + err)
          })
      })
  }
})


async function promisegetPendingSum(){
  const PendingList = await PromiseGetAllUserPayback();
  return PendingList.reduce((a, b) => a + b, 0);
}


/*
 * function to mangae all payments done by this bot.
 * throws error when the bot has to reply to sender.
 * returns string when the bot has to reply to receiver
 */
async function smartPay(fromUserID, toUserID, amount, Txmessage) {
  debug("paying from ", fromUserID);
  debug("paying to ", toUserID);

  // can not pay to yourself
  if (fromUserID === toUserID){
    throw new Error("tried to send to yourself!");
  }

  const PendingSum = await promisegetPendingSum();
  const totalBalance = await bitcoindclient.getBalance();
  if (PendingSum > totalBalance || amount > totalBalance){
    throw new Error(locale_message.needMoreDeposit);
  };

  let returnMessage = "";
  toUserContent = await User.findOneAndUpdate({id: toUserID},
    {id: toUserID},
    { upsert: true, runValidators: true, new: true, setDefaultsOnInsert: true})

  // check if all paybackAddresses has been used.
  let [address, updatedContent, replyMessage] =
    extractUnusedAddress(toUserContent);
  logger.debug("result of extractUnusedAddress was ", address, updatedContent, replyMessage);

  // pend payment when there is no registered address.
  if (!address || amount + toUserContent.pendingBalance < config.minimumTxAmount){
    toUserContent.pendingBalance = toUserContent.pendingBalance + amount;
    toUserContent.totalPaybacked += amount
    toUserContent.save()
    if (!address){
      return util.format(locale_message.cannot_pay, formatUser(fromUserID), amount)
    } else if (amount < config.minimumTxAmount) {
      return util.format(locale_message.pendingSmallTx, formatUser(fromUserID), amount)
    }
  } else {
    const amountToPay = amount + toUserContent.pendingBalance
    debug("going to pay to " + address);
    debug("of user " + updatedContent);

    returnMessage = replyMessage +
      " payed to " + formatUser(toUserID)
    try {
      const result = await bitcoindclient.sendToAddress(address, amountToPay, Txmessage, "this is comment.", true);
    } catch (e) {
      throw e
    }
    updatedContent.totalPaybacked += amount
    updatedContent.pendingBlance -= amountToPay
    updatedContent.save()
    return returnMessage
  }
}

function PromiseOpenPrivateChannel(user){
  return new Promise((resolve,reject) => {
    bot.api.im.open({"user": user}, (err, res) => {
      if (err) reject(err);
      logger.info("result for im.open is " + JSON.stringify(res));
      if (!res.ok) reject(new Error("could not open private channel by api!"));
      if (!res.channel) reject(new Error("there was no private channel to open!"))
      resolve(res.channel.id);
    })
 });
}

// tip intentionally
controller.hears(`tip ${userIdPattern.source} ${amountPattern.source}(.*)`, ["direct_mention", "direct_message"], (bot, message) => {
  controller.logger.debug("whole match pattern was " + message.match[0]);
  const toPayUser = message.match[1];
  const amount = Number(message.match[2]);
  const Txmessage = message.match[3] || "no message";
  if (isNaN(amount)){
    return bot.reply(message, "please give amount of BTC in number !");
  } else if (config.MAX_TIP_AMOUNT < amount){
    return bot.reply(message, "amount must be equal to or lower than " + config.MAX_TIP_AMOUNT);
  }
  if (message.user === toPayUser){
    return bot.reply(message, "can not pay to your self !!")
  }
  smartPay(message.user, toPayUser, amount, Txmessage)
    .then((msg) => {
      PromiseOpenPrivateChannel(toPayUser)
        .then((channel) => {
          bot.reply(message, locale_message.tell_payment_success_to_tipper)
          message.channel  = channel
          bot.reply(message, msg)
        })
    })
    .catch((err) => {
      PromiseOpenPrivateChannel(message.user)
        .then((channel) => {
          message.channel  = channel
          bot.reply(message, err.stack)
        })
      bot.reply(message, err.toString())
    })
})

// show pending balance
controller.hears(`pendingBalance`, ["direct_mention", "direct_message"], (bot, message) => {
  User.findOneAndUpdate({id: message.user}, {id: message.user}, (err, content) => {
    if (err) throw err;
    bot.reply(message, util.format(locale_message.pendingBalance, content.pendingBalance))
  })
})


// show total balance
controller.hears(`totalBalance`, ["direct_mention", "direct_message"], (bot, message) => {
  Promise.all([promisegetPendingSum(), bitcoindclient.getBalance()])
    .then((sums) => sums[1] - sums[0])
    .then((balance) => bot.reply(message, util.format(locale_message.totalBalance, balance)))
})


// withdraw from pendingBalance
controller.hears(`withdraw`, ["direct_mention", "direct_message"], (bot, message) => {
  bot.startConversationInThread(message, (err, convo) => {
    if (err) throw err;
    User.findOneAndUpdate({id: message.user},
      {id: message.user},
      { upsert: true, new: true, runValidators: true},
      (err, content) => {
        if (err) throw err;
        convo.ask(locale_message.withdraw.Ask, MyConvos.getwithdrawConvo(content));
      })
  })
})


// ranking
controller.hears(`ranking`, ['mention', 'direct_mention', 'direct_message'], (bot, message) => {
  PromisePlotRankingChart()
    .then((msg) => {
      console.log("msg was \n")
      bot.reply(message, msg.url)
      console.log("finished plotting!")
    })
    .catch(err => bot.reply(message, err.stack))
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
controller.hears("help", ["direct_mention", "direct_message"], (bot, message) => {
  bot.reply(message, locale_message.help);
  const exp_file = "okimochi_explanation.png";
  bot.api.files.upload({
    file: fs.createReadStream(path.join(__dirname, "static", "images", exp_file)),
    filename: exp_file,
    title: exp_file,
    channels: message.channel
  }, (err, res) => {
    if (err) bot.reply(err)
    debug("result is ", res);
  })
});

