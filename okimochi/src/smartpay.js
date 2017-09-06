'use strict'
/**
 * function to mangae all payments done by this bot.
 * throws error when the bot has to reply to sender.
 * returns string when the bot has to reply to receiver
 */
module.exports = async function smartPay(fromUserID, toUserID, amount, Txmessage) {
  debug("paying from ", fromUserID);
  debug("paying to ", toUserID);

  // can not pay to yourself
  if (fromUserID === toUserID){
    throw new Error("tried to send to yourself!");
  }

  const pendingSum = await promisegetPendingSum();
  const totalBitcoindBalance = await bitcoindclient.getBalance();
  if (totalBitcoindBalance - pendingSum < amount){
    throw new Error(locale_message.needMoreDeposit);
  };

  let returnMessage = "";
  toUserContent = await User.findOneAndUpdate({id: toUserID},
    {id: toUserID},
    { upsert: true, runValidators: true, new: true, setDefaultsOnInsert: true})

  // check if all paybackAddresses has been used.
  let [address, updatedContent, replyMessage] =
    extractUnusedAddress(toUserContent);
  logger.debug("result of extractUnusedAddress was ", address, updatedContent, replyMessage);

  // pend payment when there is no registered address.
  if (!address || amount + toUserContent.pendingBalance < config.minimumTxAmount){
    toUserContent.pendingBalance = toUserContent.pendingBalance + amount;
    toUserContent.totalPaybacked += amount
    toUserContent.save()
    if (!address){
      return util.format(locale_message.cannot_pay, formatUser(fromUserID), amount)
    } else if (amount < config.minimumTxAmount) {
      return util.format(locale_message.pendingSmallTx, formatUser(fromUserID), amount)
    }
  } else {
    const amountToPay = amount + Number(toUserContent.pendingBalance)
    debug("going to pay to " + address);
    debug("of user " + updatedContent);

    returnMessage = replyMessage +
      " payed to " + formatUser(toUserID)
    try {
      const result = await bitcoindclient.sendToAddress(address, amountToPay, Txmessage, "this is comment.", true);
    } catch (e) {
      throw e
    }
    updatedContent.totalPaybacked += amount
    updatedContent.pendingBlance -= amountToPay
    updatedContent.save()
    return returnMessage
  }
}
