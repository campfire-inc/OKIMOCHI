const path = require("path")
const config = require(path.join(__dirname, "..", "config"));
const logger = require("winston");
const bitcoindclient = config.bitcoindclient;

// import message object according to lang setting.
let locale_message;
if (config.lang === "en"){
  locale_message = require(path.join(__dirname, "..", "locale", "english"));
} else if (config.lang === "ja"){
  locale_message = require(path.join(__dirname, "..", 'locale', 'japanese'));
} else {
  throw new Error("must specify MESSAGE_LANG environment variable either to `en` or `ja` !!")
}


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
          if (amount > content.pendingBalance) {
            convo.say(locale_message.withdraw.notEnoughPendingBalance)
            convo.repeat();
            convo.next();
          } else {
            convo.next()
            convo.ask(locale_message.withdraw.pasteAddress, (response, convo) => {
              bitcoindclient.sendToAddress(response.text, amount)
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
