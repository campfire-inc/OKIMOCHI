const smartPay = require('../../src/smartpay')
const { UserSchema } = require('../../src/db')
const Mongoose = require('mongoose').Mongoose
const mongoose = new Mongoose()
const config = require("../../config")
const mongoBaseUri = config.mongoBaseUri
const bitcoindclient = config.bitcoindclient

const testUser = mongoose.model('User', UserSchema, 'User')
const assert = require('power-assert')
const should = require('should')
const failTest = require('../util').failTest

describe('smartPay', () => {
  before((done) => {
    mongoose.connect(mongoBaseUri + 'testDB', { useMongoClient: true }, (err) => {if (err) throw err})
    const db = mongoose.connection
    db.dropDatabase();
    db.once('open', () => {done()})
  })


  describe('When depisited balance is zero', () => {
    it('throws error when deposited balance are zero.', (done) => {
      smartPay("@FROMUSERID", "@TOUSERID", 0.001, "test message", testUser)
        .then(failTest)
        .catch((err) => done())
    })
  })


  describe("When it has enough balance to pay", () => {
    before((done) => {
     bitcoindclient.generate(450)
        .then(() => {done()})
        .catch((err) => {throw err})
    })

    it('creates a new user with Pendging Balance when paying for the first time .', (done) => {
      smartPay("@FROMUSERID", "@TOUSERID", 0.001, "test message", testUser)
        .then((retMessage) => {
          testUser.findOne({id: '@TOUSERID'}, (err, content) => {
            if (err) {throw err};
            assert.equal(content.pendingBalance, 0.001)
            done()
          })
        })
        .catch((err) => {throw err})
    })

  })
})
