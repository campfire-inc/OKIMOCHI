'use strict'

const config = require('../config')
const bitcoindclient = config.bitcoindclient
const locale_message = config.locale_message
const debug = require('debug')
const util = require('util')
const lib = require('./lib')
const formatUser = lib.formatUser
const { promisegetPendingSum } = require('./db')


/**
 * from users information. choose unused paybackAddress Preferentially.
 * And mark that Address as "used". and returns updated info and address to use.
 * @param {Object} userContent
 * @return {Array}
 *  1. first is the address for using as paying back tx.(null if no address registered.)
 *  2. Second is updated user info.
 *  3. And third is String for bot to speak
 */
function extractUnusedAddress(userContent){
  let paybackAddresses = userContent.paybackAddresses
  let address;
  let replyMessage = "";
  let addressIndex;
  if (!paybackAddresses || paybackAddresses.length === 0){
    address = null
  } else if (paybackAddresses.every((a) => a.used)){
    replyMessage += locale_message.allPaybackAddressUsed
    address = paybackAddresses.pop().address
  } else {
    addressIndex = paybackAddresses.findIndex((e) => !e.used)
    address = paybackAddresses[addressIndex].address
    userContent.paybackAddresses[addressIndex].used = true;
  }
  replyMessage += "Sending Tx to " + address + "\n"
  return [address, userContent, replyMessage];
}


/**
 * function to mangae all payments done by this bot.
 * throws error when the bot has to reply to sender.
 * returns string when the bot has to reply to receiver
 */
module.exports = async function smartPay(fromUserID, toUserID, amount, Txmessage, UserModel) {
  debug("paying from ", fromUserID);
  debug("paying to ", toUserID);
  amount = Number(amount.toFixed(8)) // since 1 satoshi is the smallest amount bitcoind can recognize
  console.log('amount is ', amount)

  // can not pay to yourself
  if (fromUserID === toUserID){
    throw new Error("tried to send to yourself!");
  }

  let pendingSum;
  let totalBitcoindBalance;
  try {
    pendingSum = await promisegetPendingSum(UserModel);
    totalBitcoindBalance = await bitcoindclient.getBalance();
  } catch (e) {
    console.log(e)
    console.log("pendingSum and totalBitcoindBalance are", pendingSum, totalBitcoindBalance)
    throw e
  }
  const ableToPayInPot = totalBitcoindBalance - pendingSum
  if (ableToPayInPot < amount){
    throw new Error(locale_message.needMoreDeposit);
  };

  let returnMessage = "";
  const toUserContent = await UserModel.findOneAndUpdate({id: toUserID},
    {id: toUserID},
    { upsert: true, runValidators: true, new: true, setDefaultsOnInsert: true})

  // check if all paybackAddresses has been used.
  let [address, updatedContent, replyMessage] =
    extractUnusedAddress(toUserContent);
  console.log("result of extractUnusedAddress was ", address, updatedContent, replyMessage);

  // pend payment when it does not satisfy condifitons
  if (!address || amount + toUserContent.pendingBalance < config.minimumTxAmount){
    console.log("not going to send Tx")
    toUserContent.pendingBalance = toUserContent.pendingBalance + amount;
    toUserContent.totalPaybacked = toUserContent.totalPaybacked + amount
    await toUserContent.save()

    if (!address){
      console.log("because there were no address registered")
      return util.format(locale_message.cannot_pay, formatUser(fromUserID), amount)
    } else if (amount + toUserContent.pendingBalance < config.minimumTxAmount) {
      console.log("because amount to send is less than minimumTxAmount")
      return util.format(locale_message.pendingSmallTx, formatUser(fromUserID), amount)
    } else {
      throw new Error("unreachable!")
    }

  // when it satisfies the criteria to send Tx.
  } else {
    const amountToPay = amount + Number(toUserContent.pendingBalance.toFixed(8))
    console.log("going to send Tx to " + address);
    console.log("of user " + updatedContent);

    returnMessage = replyMessage +
      " payed to " + formatUser(toUserID)
    try {
      const result = await bitcoindclient.sendToAddress(address, amountToPay, Txmessage, "this is comment.", true);
    } catch (e) {
      throw e
    }
    updatedContent.totalPaybacked = updatedContent.totalPaybacked + amount
    updatedContent.pendingBalance = updatedContent.totalPaybacked - amountToPay
    updatedContent.save((err) => {if (err) throw err;})
    return returnMessage
  }
}
