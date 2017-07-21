// This script is used for bitcoind to send -walletnotify info to slack

const request = require('request');
const path = require('path');
const config = require(path.join( __dirname, 'config' ));

const headers = {
  'Content-type': 'application/json'
};

const data = {
  "text": process.argv[2],
  "channel": config.default_channel,
  "username": config.botUsername,
  "icon_emoji": config.icon_emoji
}

console.log("data is \n")
console.log(data)

const options = {
  url: process.argv[3] || config.webhook_url,
  method: 'POST',
  headers: headers,
  json: data
}



request(options, (err, response, body) => {
  if (err) throw err;
  if (response.statusCode == 400) throw new Error(body);
  console.log("body was ------------ \n")
  console.log (body)
});
