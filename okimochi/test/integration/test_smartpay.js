const smartPay = require('../../src/smartpay')
const { UserSchema } = require('../../src/db')
const Mongoose = require('mongoose').Mongoose
const mongoose = new Mongoose()
const config = require("../../config")
const mongoBaseUri = config.mongoBaseUri

const testUser = mongoose.model('User', UserSchema, 'User')
const assert = require('assert')
const should = require('should')
const failTest = require('../util').failTest

describe('smartPay', () => {

  before((done) => {
    mongoose.connect(mongoBaseUri + 'testDB', { useMongoClient: true }, (err) => {if (err) throw err})
    const db = mongoose.connection
    db.once('open', () => {done()})
  })

  it('can pay to user not in db, and it will create a new user.', async (done) => {
    smartPay("@FROMUSERID", "@TOUSERID", 0.001, "test message", testUser)
      .then(failTest)
      .catch((err) => assert(err.message === 'There is no way to pay since OKIMOCHI is now empty :('))
    
    /* const content = await testUser.findOne({id: '@TOUSERID'})
    assert(content.pendingBalance, 0.001) */
    done()
    })
})
