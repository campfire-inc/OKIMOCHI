const smartPay = require('../../src/smartpay')
const { UserSchema, PromiseSetAddressToUser } = require('../../src/db')
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
      smartPay("FROMUSERID", "TOUSERID", 0.001, "test message", testUser)
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
      smartPay("FROMUSERID", "TOUSERID", 0.001, "test message", testUser)
        .then((retMessage) => {
          testUser.findOne({id: 'TOUSERID'}, (err, content) => {
            if (err) {throw err};
            assert.equal(content.pendingBalance, 0.001)
            done()
          })
        })
        .catch((err) => {throw err})
    })

    describe('when the receiver has registered address', () => {
      before((done) => {
        PromiseSetAddressToUser('TOUSERID2', 'mufX2qkNPLFWXSrXha9uEK94rTwJKV6mA9', testUser)
          .then(() => {done()})
          .catch((err) => {throw err})
      })

      it('will send Tx to address when has enough balance', () => {
        return smartPay("FROMUSERID", "TOUSERID2", 0.9, "test message", testUser)
          .then((retMessage) => {
            console.log('retMessage is', retMessage)
            testUser.findOne({id: 'TOUSERID2'}, (err, content) => {
              if (err) {throw err};
              assert.equal(content.pendingBalance, 0)
              assert.equal(bitcoindclient.getReceivedByAddress('mufX2qkNPLFWXSrXha9uEK94rTwJKV6mA9'), 0.9)
            })
          })
          .catch((err) => {throw err})
      })

      it('can pay even when precision is too small', () => {
       return smartPay('FROMUSERID', 'TOUSERID2', 0.99999999999999999, 'test message',testUser)
          .then((retMessage) => {
            console.log('retMessage is', retMessage)
            testUser.findOne({id: 'TOUSERID2'}, (err, content) => {
              if (err) {throw err};
              assert.equal(content.pendingBalance, 0)
            })
          })
        .catch((err) => {throw err})
      })

      it('will save to pendingBalance of the receiver when payment is small.', () => {
        return smartPay('FROMUSERID', 'TOUSERID3', 0.0000001, 'test message', testUser)
          .then((retmessage) => {
            testUser.findOne({id: 'TOUSERID3'}, (err, content) => {
              if (err) {throw err};
              assert.equal(content.pendingBalance, 0.0000001)
            })
          })
        .catch((err) => {throw err})
      })
    })

  })

  after((done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });
})
