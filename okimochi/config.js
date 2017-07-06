module.exports = {
  adminPassword: "hoge",
  mongoUri: `mongodb://${process.env.MONGO_URI}:27017/example` || `mongodb://localhost:27017/example`,
  botconfig: {
    clientId: "2154447482.200385943586",
    clientSecret: "9efb47c35019d6e656575e331f5480fc",
    scopes: ['bot']
  },
  bitcoin: {
    network: 'testnet',
    username: 'slackbot',
    password: 'bitcoin-tipper',
    host: process.env.BITCOIND_URI || "localhost"
  }
}
