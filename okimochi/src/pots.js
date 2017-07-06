/*
 *
 *
 */

class AbstractPot {
  constructor () {
    if (this.constructor === AbstractPot) {
      throw new TypeError('can not construct Abstract Class!')
    }
  }

  /**
   *
   *
   */
  getMaxAmount () {
    throw new TypeError('function pay is abstract method.')
  }
}


class SharedPot extends AbstractPot {
  constructor(maxAmount=1000){
    super();
    this.maxAmount = maxAmount;
  }

  getMaxAmount() {
    return this.maxAmount;
  }
}

module.exports = {  AbstractPot: AbstractPot,
                    SharedPot: SharedPot }
