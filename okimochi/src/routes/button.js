const express = require('express');
const router = express.Router();
const request = require('request')

router.post('/actions', (req, res, next) => {
  res.status(200).end();
  const actionJSONPayload = JSON.parse(req.body.payload);
  const message = {
    "text": actionJSONPayload.user.name + " clicked " + actionJSONPayload.actions[0].name,
    "replace_original": false
  }

  sendMessageToSlackResponseURL(actionJSONPayload.response_url, message)
})


function sendMessageToSlackResponseURL(responseURL, JSONmessage){
  var postOptions = {
    uri: responseURL,
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    json: JSONmessage
  }
  request(postOptions, (error, response, body) => {
    if (error){
      // handle errors as you see fit
    }
  })
}


module.exports = router;
