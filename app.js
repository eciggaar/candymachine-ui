/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

require('dotenv').config();

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

var alchemy_cred = extend({
    apikey: process.env.ALCHEMY_API_KEY
}, vcapServices.getCredentials('alchemy_api'));
var authService = watson.authorization(config);

var alchemy_language = new watson.AlchemyLanguageV1({
    api_key: alchemy_cred.apikey
});

var eventname = process.env.EVENTNAME;

tts_credentials = vcapServices.getCredentials('text_to_speech');

console.log('TTS Credentials: ' + JSON.stringify(tts_credentials));
console.log('username: ' + tts_credentials.username || process.env.TTS_USERNAME);
console.log('password: ' + tts_credentials.password || process.env.TTS_PASSWORD);

var tts_config = extend({
  version: 'v1',
  username: process.env.STT_USERNAME,
  password: process.env.STT_PASSWORD
}, vcapServices.getCredentials('text_to_speech'));

console.log('tts_config: ' + JSON.stringify(tts_config));

// For local development, replace username and password
var textToSpeech = watson.text_to_speech({
    version: 'v1',
    username: tts_credentials.username || process.env.TTS_USERNAME,
    password: tts_credentials.password || process.env.TTS_PASSWORD
});

var params = {
  text: process.env.POS_TEXT,
  voice: 'en-US_MichaelVoice'
};

// Pipe the synthesized positive text to a file.
textToSpeech.synthesize(params).pipe(fs.createWriteStream('public/resources/positive.ogg'));

// Pipe the synthesized negative text to a file.
params.text = process.env.NEG_TEXT;
textToSpeech.synthesize(params).pipe(fs.createWriteStream('public/resources/negative.ogg'));

// Pipe the synthesized neutral text to a file.
params.text = process.env.GEN_TEXT;
textToSpeech.synthesize(params).pipe(fs.createWriteStream('public/resources/text.ogg'));


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

    alchemy_language.sentiment({
        'text': text
    }, function(err, response) {
        var client = new Client();
        var msgbody = {};

        if (err) {
            console.log('error: ', err);
        } else {
            var sentiment = response.docSentiment.type;

            if (response.status == 'OK') {
                if (sentiment == 'neutral') {
                    score = 0;
                } else {
                    score = new Number(response.docSentiment.score);

                    if (score != 0) {
                        if (score > 0) {
                            msgbody = {
                                'text': 'p'
                            };
                        } else {
                            msgbody = {
                                'text': 'n'
                            };
                        }
                    }

                    // set content-type header and data as json in args parameter
                    var args = {
                        data: msgbody,
                        headers: {
                            "Content-Type": "application/json"
                        }
                    };

                    client.post('http://amsiic-cf-nodered.eu-gb.mybluemix.net/candy', args, function(data, response) {});
                }

                // set content-type header and data as json in args parameter
                var args = {
                    data: {
                        'text': text,
                        'event': eventname,
                        'sentiment': sentiment,
                        'score': score,
                        "ts": Date.now()
                    },
                    headers: {
                        "Content-Type": "application/json"
                    }
                };

                client.post('http://amsiic-cf-nodered.eu-gb.mybluemix.net/candylog', args, function(data, response) {});
            } else {
                console.log('Error in sentiment analysis call: ' + result.statusInfo);
            }

            console.log('Result: ' + response.status + ', Score: ' + score);
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
