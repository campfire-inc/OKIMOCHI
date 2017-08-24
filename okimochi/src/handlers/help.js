const fs = require('fs')
const path = require('path')
const locale_message = require('../../config').locale_message
const debug = require('debug')

module.exports = (controller) => {
  controller.hears('help', ['direct_mention', 'direct_message'], (bot, message) => {
    bot.reply(message, locale_message.help);
    const exp_file = "okimochi_explanation.png";
    bot.api.files.upload({
      file: fs.createReadStream(path.join(__dirname, '..', '..', "static", "images", exp_file)),
      filename: exp_file,
      title: exp_file,
      channels: message.channel
    }, (err, res) => {
      if (err) bot.reply(err)
      debug("result is ", res);
    })
  })
}
