const Botmock = require('botkit-mock')
const helpHandler = require('../../src/handlers/help')
const assert = require('assert')
const locale_message = require('../../config').locale_message

describe('Help Controller Tests', () => {
  beforeEach(() => {
    this.controller = Botmock({})
    this.bot = this.controller.spawn({type: 'slack'})
    helpHandler(this.controller)
  })

  it('bot should return help message when user asked for help', () => {
    return this.bot.usersInput(
      [
        {
          user: 'someUserId',
          channel: 'someChannel',
          messages: [
            {
              text: 'help', isAssertion: true
            }
          ]
        }
      ]
    )
    .then((message) => {
      return assert.equal(message.text, locale_message.help)
    })
  })
})
