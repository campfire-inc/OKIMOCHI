/*
 *
 *
 */

class PaybackExecutor {
  constructor () {
    if (this.constructor === PaybackExecutor) {
      throw new TypeError('can not construct Abstract Class!')
    }
  }

  /**
   *@param address {string} - address to pay
   *@param amount {number} - amount to pay (default in BTC)
   *@return {Promise}
   */
  pay () {
    throw new TypeError('function pay is abstract method.')
  }
};


class regularPaybackExecutor extends PaybackExecutor {
  constructor(bitcoindclient, threshold=1000){
    super();
    this.bitcoin = bitcoindclient;
    this.threshold = threshold;
  };

  pay (address, amount, comment) {
    return new Promise((resolve, reject) => {
        this.bitcoin.sendToAddress(address, amount, comment)
        resolve();
    });
  }
}


module.exports = {
  regularPaybackExecutor: regularPaybackExecutor,
  PaybackExecutor: PaybackExecutor
}
