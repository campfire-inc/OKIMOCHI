const assert = require('assert')
const { UserSchema, PromiseSetAddressToUser } = require('../../src/db')
const Mongoose = require('mongoose').Mongoose
const mongoose = new Mongoose()
const config = require("../../config")
const mongoBaseUri = config.mongoBaseUri


const testUser = mongoose.model('User', UserSchema)

describe('User Database entry', () => {

  before((done) => {
    mongoose.connect(mongoBaseUri + 'testDB', { useMongoClient: true }, (err) => {if (err) throw err})
    const db = mongoose.connection
    db.once('open', () => {done()})
  })

  it('can be created from id', () => {
    const validUser = new testUser({id: "hoge user ID"})
    return validUser.save()
  })

  it('can not be created with invalid address', (done) => {
    invalidUser = new testUser({id: "hoge user ID", depositAddresses: ["invalid address format"]})
    invalidUser.save(err => {
      if (err) {return done()}
      throw new Error('User should return Error when address is invalid!')
    })
  })
  
  it('can set regtest address to user', (done) => {
    PromiseSetAddressToUser('TOUSERID', 'mufX2qkNPLFWXSrXha9uEK94rTwJKV6mA9', testUser)
      .then(() => {done()})
      .catch((err) => {throw err})
  })

  after((done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });
})


