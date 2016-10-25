# Watson Polite Candy Machine

Use the button below to deploy the Watson Polite Candy Machine to your own Bluemix organization.
In the `app.js` file there is a variable `NODE_RED_HOST` defined at `line 11`. Change the value of this variable to match your own Node-RED environment.

## Candy machine Node-RED flows
### The flow on Bluemix

If you do not have a Node-RED environment in Bluemix, use the button below to deploy one to your organization. By default the candy machine flow is loaded. This flow can be used to test the setup by triggering both a positive and negative message. Furthermore, the requests are being published via MQTT to the local flow -- used to control the candy disposers. Finally, the requests are being logged to a Cloudant database for dashboarding purposes.

### The local flow

You need to have NodeJS and Node-RED installed locally in order to run the candy machine's local flow. Please see http://nodejs.org/ and for http://nodered.org further instructions on how to install and configure this for your platform.

The local flow is used to send a signal to the Arduino device that triggers the candy disposers to dispose some candy. To install the local flow in your environment, copy the contents of the file `resources/local_candyflow.json` to your clipboard. Ensure Node-RED is started locally and open a browser that points to your local installation of Node-RED. Normally this would be the following URL:

    http://localhost:1880

Next, select the menu at the top right and select 'Import' -> 'Clipboard' to paste the local flow from the clipboard to your canvas in Node-RED.

![](readme_images/insert_localflow.png)

You should now see a flow similar to the flow as depicted in the image above. In that flow select the MQTT input node and point it to the topic that you defined for your flow. This name should match the topic name of the MQTT output node in your candy machine flow on IBM Bluemix.

![](readme_images/define_topicname.png)
