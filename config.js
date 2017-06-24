module.exports = {
  adminPassword: "hoge",
  db: {
    'host': '127.0.0.1',
    'user': 'root',
    'database': 'bitcoin-tip'
  },
  botconfig: {
    clientId: "2154447482.200385943586",
    clientSecret: "9efb47c35019d6e656575e331f5480fc",
    scopes: ['bot']
  },
  mongoConfig: {
    mongoUri: "http://localhost:3367",
    tables: ['userAddress']
  },
  "bitcoin": {
    host: "localhost",
    port: '8332',
    user: 'sample-user',
    pass: 'bitcoin-pass'
  }
}
