const path = require('path');
const lib = require(path.join(__dirname, '..', 'src', 'lib'));
const config = require(path.join(__dirname, '..', 'config'));

const inSatoshi = lib.inSatoshi;
const btc2jpy = lib.btc2jpy;

const  gratitude_to_BTC_map = {
  "awesome": 0.0001,
  "thanks": 0.0001,
  "thx": 0.0001,
};

const emoji_to_BTC_map = {
  ":pray:": 0.0001,
  ":bow:": 0.0001,
  ":okimochi:": 0.001,
  ":+1:": 0.00001,
  ":bitcoin:": 0.0001,
};


let emoji_info = []
for (k of Object.keys(emoji_to_BTC_map)){
  let btc = emoji_to_BTC_map[k]
  emoji_info.push([k, btc + "BTC", inSatoshi(btc) + "Satoshi"])
}


module.exports = {
  help: `
  \`\`\`
  # What is this bot?
  This is a bot to enable team members to tip each other.
  And to visualize
    1. who has deposited most to this bot (investor)
    2. who got most honored from others.
  Currently it is based on the assumption that some members
  won't conspire with another member to pay only in between them.
  So be careful to use!


  # show this help
  - ${config.APP_NAME} help

  # show @users bitcoin deposit address
  - ${config.APP_NAME} deposit

  # show users received amount pending inside this bot.
  - ${config.APP_NAME} pendingBalance

  # withdrow from your pending balance.
  - ${config.APP_NAME} withdrow

  # register the address for getting paied automatically.
  - ${config.APP_NAME} register

  # show BTC-JPY rate
  - ${config.APP_NAME} rate

  # tip intentionally ... message will be included as Tx message for bitcoin
  - ${config.APP_NAME} tip @user <BTC amount> <message>

  # show ranking for deposited amount and the amount payed to registered Address
  - ${config.APP_NAME} ranking

  this bot will tip automatically when someone showed his gratitude by
  action button.
  below is a list of actions that okimochi will react.
  \`\`\`
  ${emoji_info.join("\n")}

  `,

  message_to_BTC_map: Object.assign(gratitude_to_BTC_map, emoji_to_BTC_map),
  cannot_pay: `you got tip from %s. The amount is %s BTC.
  but you had no registered address, so the tip will be in \`pendingBalance\`,
  Please do the following!
  1. check your \`pendingBalance\` by \`${config.APP_NAME} pendingBalance\`
  2. withdraw your balance to your address by \`${config.APP_NAME} withdraw\`
  3. (optional) register your own address by \`${config.APP_NAME} register\` to automatically pay to this address from next time.
    * It is possible to register multiple address by \`register\` by separating by \\\n

  try \`${config.APP_NAME} help\` to see detailed info.
  `,

  allPaybackAddressUsed: "warning: all addresses has been used.\n" +
      "So using the one we used before!\n" +
      "Please register the new address for the sake of security! \n",
pendingSmallTx: `you got tip from %s, amount is  %sBTC.
It was too small amount to send Tx, so payment has been pending inside this bot.
if you have been registered your address by \`${config.APP_NAME} register\`, this bot will automatically send Tx when your pendingBalance has exceed the threshold.
The threshold is now set to ${config.minimumTxAmount}, and the pendingBalance can be seen by \`${config.APP_NAME} pendingBalance\` .
  `,
  needMoreDeposit: "you have consumed all depositted amount! please deposit more.",
  totalBalance: "%s BTC left as deposited amount!",
  ranking:{
    xaxis: "deposit amount",
    yaxis: "payback amount",
  },

  pendingBalance: "the amount you can withdraw is %s BTC",
  tell_payment_success_to_tipper: "tipped!",
  deposit: {
    msg_with_qrcode: "Please deposit to this address (or QRcode if you prefer)",
   file_comment: "this is a same address with the one shown above."
  },
  register: {
    beg: "please paste your bitcoin address separated by \\n of %s",
    success: "successfully registered address as %s's!",
    notValid: 'please enter valid address !'
  },
  withdraw: {
    Ask: "How much do you want to retrieve?",
    amountMustBeNumber: "amount must be Number (BTC) !",
    notEnoughPendingBalance: `you can'not withdraw more than your pending balance!
  	please check it by \`${config.APP_NAME} pendingBalance\` `,
    pasteAddress: "please paste your bitcoin address to send.",
    successfulPayment: 'sent!',
    sent: "accepted! I will try to send Tx in a moment ... ",
    amountLessThanThreshold: `Sorry! Tx have to be bigger than ${config.minimumTxAmount}! wait until you gather more!`
  },
}
