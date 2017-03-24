/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------
if (!process.env.VCAP_SERVICES) {
  require('dotenv').config();  // Running locally so configuring dotenv to read .env file
}

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var path = require("path");
var multer = require('multer');
var fs = require('fs');
var upload = multer();

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

var vcapServices = require('vcap_services');
var watson = require('watson-developer-cloud');
var extend = require('util')._extend;
var Client = require('node-rest-client').Client;

// For local development, replace username and password
var config = extend({
    version: 'v1',
    url: 'https://stream.watsonplatform.net/speech-to-text/api',
    username: process.env.STT_USERNAME,
    password: process.env.STT_PASSWORD
}, vcapServices.getCredentials('speech_to_text'));

var authService = watson.authorization(config);

var nlu_config = extend({
  version_date: watson.NaturalLanguageUnderstandingV1.VERSION_DATE_2016_01_23,
  username: process.env.NLU_USERNAME,
  password: process.env.NLU_PASSWORD
}, vcapServices.getCredentials('natural-language-understanding'));

var naturalLanguageUnderstanding = new watson.NaturalLanguageUnderstandingV1(nlu_config);

var eventname = process.env.EVENTNAME;

var tts_config = extend({
  version: 'v1',
  username: process.env.TTS_USERNAME,
  password: process.env.TTS_PASSWORD
}, vcapServices.getCredentials('text_to_speech'));


// For local development, replace username and password
var textToSpeech = watson.text_to_speech(tts_config);

var params = {
  text: unescape(process.env.POS_TEXT),
  voice: 'en-US_MichaelVoice'
};

// Pipe the synthesized positive text to a file.
textToSpeech.synthesize(params).pipe(fs.createWriteStream('public/resources/positive.ogg'));

// Pipe the synthesized negative text to a file.
params.text = unescape(process.env.NEG_TEXT);
textToSpeech.synthesize(params).pipe(fs.createWriteStream('public/resources/negative.ogg'));

// Pipe the synthesized neutral text to a file.
params.text = unescape(process.env.GEN_TEXT);
textToSpeech.synthesize(params).pipe(fs.createWriteStream('public/resources/text.ogg'));

// Pipe the synthesized 'need more text' text to a file.
params.text = unescape(process.env.MORE_TEXT);
textToSpeech.synthesize(params).pipe(fs.createWriteStream('public/resources/more_text.ogg'));


// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

app.get('/token', function(req, res) {
    authService.getToken({
        url: config.url
    }, function(err, token) {
        if (err) {
            console.log('error:', err);
            res.status(err.code);
        }
        res.send(token);
    });
});

app.post('/sentiment', upload.single(), function(req, res) {
    var text = req.body.transcript;
    var score;

    naturalLanguageUnderstanding.analyze({
        'text': text,
        'features': {
          'sentiment': {},
          'concepts': {},
          'catagories': {}
      }
    }, function(err, response){
      var client = new Client();
      var msgbody = {};

      if (err) {
        if (err.code == '422') {
          console.log('Error code: ' + err.code + ': ' + err.error); // Need more text as input to determine language ID

          // Send response back to client (setting sentiment value to 'error' indicating that more input is needed)
          res.send({
            'sentiment': 'more_input',
            'score': 'n/a'
          });
        } else {
          console.log(err);
          return;
        }
      } else {
        var score = new Number(response.sentiment.document.score);
        var sentiment = response.sentiment.document.label;

        console.log(JSON.stringify(response));


        if (score >= -0.5 && score <= 0.5) {
          score = 0; // Sentiment score is not negative or positive enough, so set to 0 to reflect neutral score
          sentiment = 'neutral';
        } else {
          if (score > 0) {
            msgbody = { 'text': 'p' };
          } else {
            msgbody = { 'text': 'n' };
          }

          // set content-type header and data as json in args parameter
          var args = {
            data: msgbody,
            headers: {
              'Content-Type': 'application/json'
            }
          };

          client.post(process.env.NODE_RED_HOST + '/candy', args, function(data, response) {});
        }

        // set content-type header and data as json in args parameter
        var args = {
          data: {
            'text': text,
            'event': eventname,
            'sentiment': sentiment,
            'score': score,
            'ts': Date.now()
          },
          headers: {
            'Content-Type': 'application/json'
          }
        };

        console.log('NODE_RED_HOST: ' + process.env.NODE_RED_HOST);

        client.post(process.env.NODE_RED_HOST + '/candylog', args, function(data, response) {});

        console.log('Result: ' + text + '. Score: ' + score);
        console.log('Watson Natural Language Understanding result:\n--------\n' + JSON.stringify(response, null, 2), '\n--------');

        res.send({
            'sentiment': sentiment,
            'score': score
        });
      }
    });
});


// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});
