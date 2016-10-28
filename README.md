# Watson Polite Candy Machine
This project contains the web tier for the Watson Polite Candymachine. It is written in NodeJS. The transcribed voice is posted to a Node-RED flow that controls the disposal of candies. The same Node-RED flow also serves a basic dashboard that can be used to give insight in the sentiment of the audience that interacted with the candy machine.

Use the button below to start the deployment of the Watson Polite Candy Machine to your own Bluemix organization.

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/eciggaar/candymachine-ui)

## Candy machine Node-RED flows
### The flow on Bluemix

If you do not have a Node-RED environment in Bluemix, use the button below to deploy one to your organization. This environment will be preloaded with the candy machine flow. Once completed, choose a unique value for the MQTT topic and click on 'DEPLOY' to deploy the modified flow.

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/eciggaar/candymachine-nodered)

![](readme_images/define_topicname_bluemix.png)

This flow can be used to test the setup by triggering both a positive and negative message. Furthermore, the requests are being published via MQTT to the local flow -- used to control the candy disposers. Finally, the requests are being logged to a Cloudant database for reporting purposes.

To complete the Bluemix part of the Watson Candy Machine's set up, open the `manifest.yml` and put the values of `POS_TEXT`, `GEN_TEXT` and `NEG_TEXT` between double quotes. Then, set the value of the user-defined variable `NODE_RED_HOST` to your deployed Node-RED environment. The `manifest.yml` should look similar to

```
applications:
- path: .
  memory: 256M
  instances: 1
  domain: eu-gb.mybluemix.net
  name: candymachine-ui
  host: candymachine-ui
  disk_quota: 1024M
  services:
  - AlchemyAPI
  - CandyMachineSTT
  - CandyMachineTTS
  env:
    POS_TEXT: "Wow, that's positive. Thank you! Enjoy your chocolate candy."
    NEG_TEXT: "That negative message hurts. You'll have to take the sour candy."
    GEN_TEXT: "I'm sorry. To get some candies, you need to be more explicit."
    EVENTNAME: dummy
    NODE_RED_HOST: http://<your-node-red-host>

declared-services:
  AlchemyAPI:
    label: alchemy_api
    plan: free
  CandyMachineSTT:
    label: speech_to_text
    plan: standard
  CandyMachineTTS:
    label: text_to_speech
    plan: standard
```

Finally, commit your changes and push the code to your repository. This will automatically trigger the 'BUILD & DEPLOY' pipeline to push the updated version of your application to Bluemix.

### The local flow

You need to have NodeJS and Node-RED installed locally in order to run the candy machine's local flow. Please see http://nodejs.org/ and for http://nodered.org further instructions on how to install and configure this for your platform.

The local flow is used to send a signal to the Arduino device that triggers the candy disposers to dispose some candy. To install the local flow in your environment, copy the contents of the file `resources/local_candyflow.json` to your clipboard. Ensure Node-RED is started locally and open a browser that points to your local installation of Node-RED. Normally this would be the following URL:

    http://localhost:1880

Next, select the menu at the top right and select 'Import' -> 'Clipboard' to paste the local flow from the clipboard to your canvas in Node-RED.

![](readme_images/insert_localflow.png)

You should now see a flow similar to the flow as depicted in the image above. In that flow select the MQTT input node and point it to the topic that you defined for your flow. This name should match the topic name of the MQTT output node in your candy machine flow on IBM Bluemix.

![](readme_images/define_topicname.png)

### Adding reporting views to Cloudant

To be able to gather statistics on the dashboarding page, some views need to be defined in the Cloudant database that is created for you when your Node-RED environment is deployed. The view definitions can be found in `resources/cloudant_designdoc.json`. The following commands assume you have `curl` installed and set up on your environment. We will invoke two Cloudant API calls. One to create the candylogs database and one to create the so-called design document. The URL for Cloudant can be found in the VCAP_SERVICES environment variable.

![](readme_images/get_cloudanturl.png)

To create the database, open a terminal and enter the following command:
```
curl -X PUT <cloudant_credentials_url>/candylogs
```
If the database already has been created during for you during deployment you'll get a response similar to
```
{"error":"file_exists","reason":"The database could not be created, the file already exists."}
```
otherwise the response would be
```
{"ok":true}
```
and the database is created for you. You can now invoke the second API call to create the design document. Please ensure you have a local copy of the `cloudant_designdoc.json` file.
```
curl -X PUT <cloudant_credentials_url>/candylogs/_design/myDesignDoc --data-binary @<path_to_cloudant_designdoc.json>
```
This should return an output similar to
```
{"ok":true,"id":"_design/myDesignDoc","rev":"1-27af6e5ea017c0c99c939322a14a1def"}
```
