const assert = require('assert')
const { UserSchema, PromiseSetAddresstoUser } = require('../../src/db')
const Mongoose = require('mongoose').Mongoose
const mongoose = new Mongoose()
const config = require("../../config")
const mongoBaseUri = config.mongoBaseUri


const testUser = mongoose.model('User', UserSchema)

describe('test setting address to user', () => {
  before((done) => {
    mongoose.connect(mongoBaseUri + 'testDB', { useMongoClient: true }, (err) => {if (err) throw err})
    const db = mongoose.connection
    db.once('open', () => {done()})
  })

  it('User document can be created from id', (done) => {
    const validUser = new testUser({id: "hoge user ID"})
    validUser.save().then(done())
  })

  it('User document can not be created with invalid address', (done) => {
    invalidUser = new testUser({id: "hoge user ID", depositAddresses: ["invalid address format"]})
    invalidUser.save(err => {
      if (err) {return done()}
      throw new Error('User should return Error when address is invalid!')
    })
  })

  after((done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });
})


