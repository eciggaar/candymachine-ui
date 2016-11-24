var state                   = 'loading'
var model                   = 'en-US_BroadbandModel'
var sttToken                = null
var $analyzeButton          = document.getElementById('analyze')
var $recordButton           = document.getElementById('record')
var $stopButton             = document.getElementById('stop')
var $results                = document.getElementById('results')
var $playaudio              = document.getElementById('playaudio')
var sttStream               = null
var isStopped               = false
var timeout                 = null

if ($recordButton != null) {
  $recordButton.addEventListener('click', listen)
}

if ($stopButton != null) {
  $stopButton.addEventListener('click', stop)
}

if ($analyzeButton != null) {
  $analyzeButton.addEventListener('click', analyze)
}


function listen() {
  clearTimeout(timeout)

  if(!sttStream) {
    sttStream = WatsonSpeech.SpeechToText.recognizeMicrophone({
      token: sttToken,
      model: model,
      objectMode: true,
    })

    sttStream.on('data', onData)
  }

  $recordButton.disabled  = true
  $stopButton.disabled    = false
}

function stop() {
  $recordButton.disabled  = true
  $stopButton.disabled    = true

  if(sttStream) {
    sttStream.stop()
    sttStream = null
  }

  isStopped = true
  sentimentAnalysis($results.textContent)
}

function onData(data) {
  if(!isStopped) {
    $results.textContent = arguments[0].alternatives[0].transcript
  }
}

function analyze() {
  sentimentAnalysis(document.getElementById('transcript').value)
}

function sentimentAnalysis(transcript) {
  if(!transcript) {
    return reset()
  }

  var xhr = new XMLHttpRequest()

  xhr.addEventListener('load', function(evt) {
    sentiment = JSON.parse(evt.target.responseText).sentiment

    if(sentiment === 'positive') {
      reset('rgba(164,198,57,0.50)', true)
      $playaudio.src = "resources/positive.ogg?ts=" + new Date().getTime()
    } else if(sentiment === 'negative') {
      reset('rgba(255,76,76,0.50)', true)
      $playaudio.src = "resources/negative.ogg?ts=" + new Date().getTime()
    } else {
      reset('f4f4f4', true)
      $playaudio.src = "resources/text.ogg?ts=" + new Date().getTime()
    }

    timeout = setTimeout(reset, 3000)
  })

  var formData = new FormData()
  formData.append('transcript', transcript)

  xhr.open('POST', '/sentiment')
  xhr.send(formData)
}

function reset(backgroundColor, keepText) {
  state = 'ready'
  isStopped = false
  document.body.style.background = backgroundColor || ''

  if ($recordButton != null) {
    $recordButton.disabled  = false
  }

  if ($stopButton != null) {
    $stopButton.disabled    = true
  }

  if(!keepText) {
    $results.textContent = ''

    if ($analyzeButton != null) {
      document.getElementById('transcript').value = ''
    }
  }
}

function getToken() {
  var xhr = new XMLHttpRequest()

  xhr.addEventListener('load', function(evt) {
    sttToken = evt.target.responseText
    reset()
  })

  xhr.open('GET', '/token')
  xhr.send()
}

getToken()
