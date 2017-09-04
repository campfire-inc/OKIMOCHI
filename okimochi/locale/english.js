// This module should not require config (to avoid circular dependency problem)

const path = require('path');
const lib = require(path.join(__dirname, '..', 'src', 'lib'));
const config = require(path.join(__dirname, '..', 'config'));

const APP_NAME = process.env.APP_NAME || '@okimochi'
let minimumTxAmount = process.env.MINIMUM_TX || 0.003
minimumTxAmount = Number(minimumTxAmount)

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
  - ${APP_NAME} help

  # show @users bitcoin deposit address
  - ${APP_NAME} deposit

  # show users received amount pending inside this bot.
  - ${APP_NAME} pendingBalance

  # withdrow from your pending balance.
  - ${APP_NAME} withdrow

  # register the address for getting paied automatically.
  - ${APP_NAME} register

  # show BTC-JPY rate
  - ${APP_NAME} rate

  # tip intentionally ... message will be included as Tx message for bitcoin
  - ${APP_NAME} tip @user <BTC amount> <message>

  # show ranking for deposited amount and the amount payed to registered Address
  - ${APP_NAME} ranking

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
  1. check your \`pendingBalance\` by \`${APP_NAME} pendingBalance\`
  2. withdraw your balance to your address by \`${APP_NAME} withdraw\`
  3. (optional) register your own address by \`${APP_NAME} register\` to automatically pay to this address from next time.
    * It is possible to register multiple address by \`register\` by separating by \\\n

  try \`${APP_NAME} help\` to see detailed info.
  `,

  allPaybackAddressUsed: "warning: all addresses has been used.\n" +
      "So using the one we used before!\n" +
      "Please register the new address for the sake of security! \n",
pendingSmallTx: `you got tip from %s, amount is  %sBTC.
It was too small amount to send Tx, so payment has been pending inside this bot.
if you have been registered your address by \`${APP_NAME} register\`, this bot will automatically send Tx when your pendingBalance has exceed the threshold.
The threshold is now set to ${minimumTxAmount}, and the pendingBalance can be seen by \`${APP_NAME} pendingBalance\` .
  `,
  needMoreDeposit: `There is no way to pay since OKIMOCHI is now empty :(
waiting for someone to deposit :)`,
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
  	please check it by \`${APP_NAME} pendingBalance\` `,
    pasteAddress: "please paste your bitcoin address to send.",
    successfulPayment: 'sent!',
    sent: "accepted! I will try to send Tx in a moment ... ",
    amountLessThanThreshold: `Sorry! Tx have to be bigger than ${minimumTxAmount}! wait until you gather more!`
  },
  generateKeys: {
    explain: 'generating yoru private key and corresponding address',
    warn: `caution!: this is just helper for you playing with $\`{APP_NAME}\` ! be aware that you must generate your own private key in your safe environment if you want to make sure your wallet safe!`,
    mnemonic: 'your bip39 mnemonic code for master private key',
    base58: 'base58 of your master private key',
    wif: 'WIF format for the same private key',
    address: 'address generated from the private key above'
  }
}
