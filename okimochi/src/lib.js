'use strict'
const moment = require('moment');
const sync_request = require('sync-request');

let lastRequestTime = moment().unix()
let responseCache;

function getRateJPY() {
  const rate_api_url = 'https://coincheck.com/api/exchange/orders/rate?order_type=buy&pair=btc_jpy&amount=1';
  let now = moment().unix();
  let response;
  if ((lastRequestTime < now - 30) || (!responseCache)) {
    response = sync_request('GET', rate_api_url);
    lastRequestTime = now;
    responseCache = response
  } else {
    response = responseCache;
  }
  let rate;
  if (response.statusCode == 200) {
    rate = Math.round(JSON.parse(response.body).rate);
    return rate;
  }
}

function jpy2btc(jpyAmount) {
  let rate = getRateJPY();
  return jpyAmount * 1.0 / rate;
}

function btc2jpy(btcAmount) {
  let rate = getRateJPY();
  return btcAmount * rate;
}

function inBTC(satoshi) {
  return (satoshi / 100000000.0).toFixed(4);
}

function inSatoshi(btc) {
  return parseFloat((btc * 100000000).toFixed(0));
}

module.exports = { getRateJPY: getRateJPY,
                   jpy2btc: jpy2btc,
                   btc2jpy: btc2jpy,
                   inBTC: inBTC,
                   inSatoshi: inSatoshi
}

