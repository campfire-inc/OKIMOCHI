let mongoUri;
const BitcoindClient = require('bitcoin-core');
const network = process.env.BITCOIND_NETWORK || 'testnet';

if (process.env.MONGO_PORT_27017_TCP_ADDR){
  mongoUri =  `mongodb://${process.env.MONGO_PORT_27017_TCP_ADDR}:27017/` + network;
} else if (process.env.mongo) {
  mongoUri = `mongodb://${process.env.mongo}:27017/` + network;
} else if(process.env.MONGO_URI ){
  mongoUri = `mongodb://${process.env.MONGO_URI}:27017/` + network ;
} else {
  mongoUri = `mongodb://localhost:27017/` + network;
}

let TOKEN = "";
if (process.env.NODE_ENV === "development") {
  TOKEN = process.env.DEVELOP_TOKEN ? process.env.DEVELOP_TOKEN : process.env.TOKEN;
} else {
  TOKEN = process.env.TOKEN
}

const SLACK_DEBUG = (process.env.NODE_ENV === "development") ? true : false

module.exports = {
  adminPassword: "hoge",
  mongoUri: mongoUri,

  botconfig: {
    clientId: process.env.SLACK_CLIENT_ID ||"2154447482.200385943586",
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scopes: ['bot']
  },
  TOKEN: TOKEN,
  SLACK_DEBUG: SLACK_DEBUG,
  APP_NAME: process.env.APP_NAME || "okimochi-bitcoin",
  iconUrl: "http://3.bp.blogspot.com/-LE-WPdZd5j4/UzoZuyc49QI/AAAAAAAAesw/4EU0zMlH_E4/s800/gold_kinkai_nobebou.png",
  icon_emoji: process.env.EMOJI || ":moneybag:",
  webhook_url: process.env.WEBHOOK_URL,
  default_channel: process.env.DEFAULT_CHANNEL || "#okimochi-test",

  lang: process.env.MESSAGE_LANG || "en",


  btc_network: network,
  bitcoindclient: new BitcoindClient({
    network: network,
    username: process.env.BITCOIND_USERNAME || 'slackbot',
    password: process.env.BITCOIND_PASSWORD || 'bitcoin-tipper',
    host: process.env.BITCOIND_PORT_8333_TCP_ADDR ||
      process.env.BITCOIND_URI || "localhost",
    timeout: 30000
  }),

  MAX_TIP_AMOUNT: 0.1,

  plotly: {
    api_key: process.env.PLOTLY_API_KEY,
    account_name: process.env.PLOTLY_API_USER
  },
}
