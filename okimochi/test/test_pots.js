const chai = require('chai');
const expect = chai.expect
chai.should()
const assert = chai.assert;
const SharedPot = require('../src/pots').SharedPot

describe('pot', () => {
  describe('SharedPot', () => {
    beforeEach(() => {
      pot = new SharedPot()
    });

    it('default Max Amount should be 1000', () => {
      pot.maxAmount.should.equal(1000)
    });

    it('MaxAmount should be number', () => {
      expect(pot.maxAmount).to.be.a('number')
    })
  })
})
