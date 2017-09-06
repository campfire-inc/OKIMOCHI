'use strict'
const path = require("path")
const config = require(path.join(__dirname, "..", "config"));
const logger = require("winston");
const bitcoindclient = config.bitcoindclient;

const locale_message = config.locale_message


module.exports = {
  getwithdrawConvo: (content) => {return [
    {
      default: true,
      callback: (response, convo) => {
        convo.say(locale_message.withdraw.amountMustBeNumber);
        convo.repeat();
        convo.next();
      }
    },
    {
      pattern: /[\.\d]+/,
      callback: (response, convo) => {
	    let amount = Number(response.text);
          if (amount < config.minimumTxAmount) {
            convo.say(locale_message.withdraw.amountLessThanThreshold)
            convo.next()
          } else if (amount > content.pendingBalance) {
            convo.say(locale_message.withdraw.notEnoughPendingBalance)
            convo.repeat();
            convo.next();
          } else {
            convo.next()
            convo.ask(locale_message.withdraw.pasteAddress, (response, convo) => {
              bitcoindclient.sendToAddress(response.text, amount, "", "", true)
                .then((response) => {
                  content.pendingBalance -= amount;
                  content.save();
                  convo.say(locale_message.withdraw.successfulPayment)
                })
                .catch((err) => convo.say(err.toString()))
                .then(() =>convo.next());
            convo.say(locale_message.withdraw.sent);
          })
        }
      }
    }
  ]}
}
