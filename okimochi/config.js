let mongoUri;

if (process.env.MONGO_PORT_27017_TCP_ADDR){
  mongoUri =  `mongodb://${process.env.MONGO_PORT_27017_TCP_ADDR}:27017/okimochi`
} else if (process.env.mongo) {
  mongoUri = `mongodb://${process.env.mongo}:27017/example`;
} else if(process.env.MONGO_URI ){
  mongoUri = `mongodb://${process.env.MONGO_URI}:27017/example`;
} else {
  mongoUri = `mongodb://localhost:27017/example`;
}

const TOKEN = (process.env.NODE_ENV === "development") ? process.env.DEVELOP_TOKEN : process.env.TOKEN
const SLACK_DEBUG = (process.env.NODE_ENV === "development") ? true : false

module.exports = {
  adminPassword: "hoge",
  mongoUri: mongoUri,
  botconfig: {
    clientId: process.env.CLIENT_ID ||"2154447482.200385943586",
    clientSecret: process.env.CLIENT_SECRET || "9efb47c35019d6e656575e331f5480fc",
    scopes: ['bot']
  },
  bitcoin: {
    network: process.env.BITCOIND_NETWORK || 'testnet',
    username: process.env.BITCOIND_USERNAME || 'slackbot',
    password: process.env.BITCOIND_PASSWORD || 'bitcoin-tipper',
    host: process.env.BITCOIND_PORT_8333_TCP_ADDR ||
      process.env.BITCOIND_URI || "localhost"
  },
  TOKEN: TOKEN,
  SLACK_DEBUG: SLACK_DEBUG,

  botUsername: "okimochi-bitcoin",
  iconUrl: "http://3.bp.blogspot.com/-LE-WPdZd5j4/UzoZuyc49QI/AAAAAAAAesw/4EU0zMlH_E4/s800/gold_kinkai_nobebou.png",
  icon_emoji: ":moneybag:",
  webhook_url: "https://hooks.slack.com/services/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",
  default_channel: "#okimochi-test"
}
