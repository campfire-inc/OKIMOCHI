'use strict'
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
const lib = require(path.join(__dirname, "src", "lib"))
const getRateJPY = lib.getRateJPY
const formatUser = lib.formatUser
const { User, PromiseSetAddressToUser, promisegetPendingSum } = require(path.join(__dirname, 'src', 'db'))
const smartPay = require(path.join(__dirname, 'src', 'smartpay'))


// logger
require(path.join(__dirname, "src", "logger.js"));
const winston = require('winston');
const logger = winston.loggers.get('okimochi');

const locale_message = config.locale_message
console.log("config is", config)

// bitcoin
const bitcoindclient = config.bitcoindclient


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
  for (let i = 0, size = res.length; i < size; ++i){
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


// deposit
controller.hears(`deposit`, ["direct_mention", "direct_message", "mention"], (bot, message) => {
  debug("heard deposit")
  bitcoindclient.getNewAddress()
    .then((address) => {
      debug("going to show following address \n", address)
      const tmpfile = path.join('/tmp', address + ".png")
      QRCode.toFile(tmpfile, address, (err) => {
        if (err) throw err;

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
    .then((address) => PromiseSetAddressToUser(message.user, address, User))
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
        ps.push(PromiseSetAddressToUser(message.user, address, User))
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



function PromiseOpenPrivateChannel(user){
  return new Promise((resolve,reject) => {
    bot.api.im.open({"user": user}, (err, res) => {
      if (err) reject(err);
      logger.info("result for im.open is " + JSON.stringify(res));
      if (!res.ok) reject(new Error("could not open private channel by api!")); return
      if (!res.channel) reject(new Error("there was no private channel to open!")); return
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
          bot.reply(message, err.toString())
        })
      .catch(() => bot.reply(message, err.toString()))
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
  Promise.all([promisegetPendingSum(User), bitcoindclient.getBalance()])
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
require('./src/handlers/help')(controller)
require('./src/handlers/generateKeys')(controller)
