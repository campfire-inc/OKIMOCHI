const util = require('util');

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

module.exports = {
  help: util.format(`
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
  - @okimochi-bitcoin help

  # show @users bitcoin deposit address
  - @okimochi-bitcoin deposit

  # show users received amount pending inside this bot.
  - @okimochi-bitcoin pendingBalance

  # withdrow from your pending balance.
  - @okimochi-bitcoin withdrow

  # register the address for getting paied automatically.
  - @okimochi-bitcoin register

  # show BTC-JPY rate
  - @okimochi-bitcoin rate

  # tip intentionally ... message will be included as Tx message for bitcoin
  - @okimochi-bitcoin tip @user <BTC amount> <message>

  # show ranking for deposited amount and the amount payed to registered Address
  - @okimochi-bitcoin ranking

  this bot will tip automatically when someone showed his gratitude by
  action button.
  below is a list of actions that okimochi will react.
  \`\`\`
  %s

  `, Object.keys(emoji_to_BTC_map).join("\n")),

  message_to_BTC_map: Object.assign(gratitude_to_BTC_map, emoji_to_BTC_map),
  cannot_pay: ` had no registered address, so the tip will be in \`pendingBalance\`,
  Please do the following!
  1. check your \`pendingBalance\` by \`@okimochi-bitcoin pendingBalance\`
  2. withdrow your balance to your address by \`@okimochi-bitcoin withdrow\`
  3. (optional) register your own address by \`@okimochi-bitcoin register\` to automatically pay to this address from next time.
    * It is possible to register multiple address by \`register\` by separating by \\\n
  `
}
