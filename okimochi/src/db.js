'use strict'
const config = require('../config')
const debug = require('debug')
const bitcoindclient = config.bitcoindclient
const locale_message = config.locale_message

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

// database initialization
const mongoose = require("mongoose");
mongoose.Promise = global.Promise
mongoose.connect(config.mongoUri, {
  useMongoClient: true,
  autoReconnect: true
})
  .then((db) => {return db.once('open', () => {
    console.log("db is open!")
  })})
  .catch((err) => {throw err})


const BTCaddressValidator = {
  validator: (v) => {
    return new Promise((resolve, reject) => {
      bitcoindclient.validateAddress(v)
        .then((res) => {
          if (res.isvalid) {
            resolve(false)
         } else {
           reject()
         }
      })
    })
  },
  message: 'btc address is not correct!'
}

const Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

let UserSchema = new Schema({
  _id: ObjectId,
  id: String,
  depositAddresses: [{ type: String, validate: BTCaddressValidator }],
  paybackAddresses: [
    {
      address: { type: String, validate: BTCaddressValidator },
      used: { type: Boolean, default: false },
    }
  ],
  totalPaybacked: {type: Number, default: 0}, // pendingBalance + amount payed directry.
  pendingBalance: {type: Number, default: 0}
})

const User = mongoose.model('User', UserSchema);

mongoose.connection.on( 'connected', function(){
    console.log('connected.');
});

mongoose.connection.on( 'error', function(err){
    console.log( 'failed to connect a mongo db : ' + err );
});

// mongoose.disconnect() を実行すると、disconnected => close の順番でコールされる
mongoose.connection.on( 'disconnected', function(){
    console.log( 'disconnected.' );
});

mongoose.connection.on( 'close', function(){
    console.log( 'connection closed.' );
});

function PromiseSetAddressToUser(userId, address, UserModel){
  return new Promise((resolve, reject) => {
  bitcoindclient.validateAddress(address, (err, result) => {
    if (err){
      reject(err)
    }
      if (result && result.isvalid){
        UserModel.update( {id: userId},
        {$push: {paybackAddresses: {address: address, used: false}}},
        {upsert: true, 'new': true}, (res) => {resolve(res)})
        resolve()
      } else {
        reject(new Error(locale_message.register.notValid))
      }
    })
  })
}


function PromiseGetAllUserPayback(UserModel){
  return new Promise((resolve, reject) => {
    UserModel.find({}, ["id", "totalPaybacked"], { sort: { 'id': 1 }}, (err, contents) => {
      if (err) reject(err);
      let result = [];
      for (let c of contents){
        result.push(c.toObject().totalPaybacked)
      }
      resolve(result);
    })
  })
}


/**
 * Promise to return the total amount of pendingBalance
 * for all users
 * */
module.exports.promisegetPendingSum = async function promisegetPendingSum(UserModel){
  const PendingList = await PromiseGetAllUserPayback(UserModel);
  const res = PendingList.reduce((a, b) => a + b, 0);
  console.log('res are', res)
  return res
}

module.exports.User = User
module.exports.UserSchema = UserSchema
module.exports.PromiseSetAddressToUser = PromiseSetAddressToUser
