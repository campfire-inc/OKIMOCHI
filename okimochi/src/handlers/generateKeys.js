const fs = require('fs')
const util =require('util')
const path = require('path')
const config = require('../../config')
const locale_message = config.locale_message
const network = config.bitcoinjsNetwork
const networkString = config.btc_network
const debug = require('debug')
const bitcoin = require('bitcoinjs-lib')
const bip39 = require('bip39')

module.exports = (controller) => {
  controller.hears('generateKeys', ['direct_mention', 'direct_message'], (bot, message) => {
    const mnemonic = bip39.generateMnemonic()
    const seed = bip39.mnemonicToSeed(mnemonic)
    const node = bitcoin.HDNode.fromSeedBuffer(seed, network)
    const xprv = node.toBase58()
    const wif = node.keyPair.toWIF()
    const replytMessage = [
      util.format(locale_message.generateKeys.explain, networkString),
      locale_message.generateKeys.warn,
      locale_message.generateKeys.mnemonic,
      mnemonic,
      locale_message.generateKeys.base58,
      xprv,
      locale_message.generateKeys.wif,
      wif,
      locale_message.generateKeys.address,
      node.getAddress()
    ].join('\n')
    bot.reply(message, replytMessage)
  })
}
