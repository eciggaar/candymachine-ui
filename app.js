/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

var vcapServices = require('vcap_services');
var watson = require('watson-developer-cloud');
var extend = require('util')._extend;

// For local development, replace username and password
var config = extend({
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api',
  username: process.env.STT_USERNAME || '<username>',
  password: process.env.STT_PASSWORD || '<password>'
}, vcapServices.getCredentials('speech_to_text'));

var authService = watson.authorization(config);

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

app.get('/token', function(req, res) {
   authService.getToken({url: config.url}, function(err, token) {
      if (err) {
         console.log('error:', err);
         res.status(err.code);
      }
      res.send(token);
   });
});

app.post('/sentiment', function(req,res){

});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
