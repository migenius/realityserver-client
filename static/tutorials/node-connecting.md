Connecting in Node.js requires an extra step since there is no built in WebSocket implementation.

### Dependencies
As we need an external WebSocket we have to install it via npm. We also of course need the client API itself and yargs for command line processing.
```bash
$ npm install --save @migenius/realityserver-client websocket yargs
```
### Import modules and initialize
Now we can start the script itself which we'll call `index.js`. As usual at the top we want to pull in our required modules.
```javascript
const
  path = require('path'),
  fs = require('fs'),
  { Command, Command_error, Error: Rs_error, Utils, Service } = require('@migenius/realityserver-client'),
  WebSocket = require('websocket').w3cwebsocket;

const service = new Service();
```
After the built in modules we require the RealityServer&reg; client itself. The individual components required are destructured out for convenience. Note this requires renaming the Error class else it will clash with the builtin Error class, the same would need to be done if extracting the RS.Math API.

We then pull in the `websocket` module and get the W3C compliant interface. This will be used later to directly create a WebSocket object since `window.WebSocket` is not available in Node.js. 

### Yargs
We use the most excellent [yargs](https://www.npmjs.com/package/yargs "yargs") module to process the command line arguments of this script.

```javascript
require('yargs')
  .demandCommand(7)
  .usage('$0 [--ssl] <host> <port> <scene_file> <width> <height> <max_samples> <filename>',
    'renders an image in RealityServer',
    yargs=>{
      yargs
        .positional('host', {
          describe: 'hostname to connect to',
          type: 'string'
        })
        .positional('port', {
          describe: 'port to connect to',
          type: 'number'
        })
        .positional('scene_file', {
          describe: 'scene filename to render',
          type: 'string'
        })
        .positional('width', {
          describe: 'image width to render',
          type: 'number'
        })
        .positional('height', {
          describe: 'image height to render',
          type: 'number'
        })
        .positional('max_samples', {
          describe: '# of samples to render',
          type: 'number'
        })
        .positional('filename', {
          describe: 'output filename, extension defines the file format',
          type: 'string'
        });
    }, load_and_render)
  .boolean('ssl')
  .default('ssl', false)
  .describe('ssl', 'if true connect using wss, otherwise ws')
  .help('h')
  .alias('h', 'help')
  .argv;
```
Describing the above in detail is beyond the scope of this tutorial. Suffice to say it processes the command line shown in the `usage` line and then calls the `load_and_render` function.

### Connecting
We implement `load_and_render` initially as below to simply connect to the given RealityServer&reg;
```javascript
async function load_and_render(argv) {
  const { host, port, ssl, scene_file, width, height, max_samples, filename } = argv;

  const url = `${(ssl ? 'wss://' : 'ws://')}${host}:${port}/service/`;

  console.log(`connecting to: ${url}`);

  try {
    await service.connect(new WebSocket(url));
  } catch (err) {
    console.error(`Web Socket connection failed: ${err.toString()}`);
    return;
  }

  console.log('connected.');

  service.close();
}
```
First, we destructure out the arguments provided by yargs. From those arguments we generate the URL to connect to. We then connect to the service however instead of supplying the URL we pass an instance of the W3C compatible WebSocket interface. The service will use this object directly for communications rather than creating it's own instance.

Note that you must not process any messages on the WebSocket before passing it to the service otherwise initialization will fail.

From this point on the API can be used in exactly the same way as in the browser. The only exception is the {@link RS.Utils.html_image_display} function which requires an Image DOM object to display. However even that can be used if you can provide a custom `Image` and [Object URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL "Object URL") implementation.

One thing to note is that in Node.js applications we need to ensure that the service gets closed when we're done. Otherwise the open WebSocket connection will prevent the application from exiting on completion.

### Overriding default WebSocket constructor
An alternative to passing in a WebSocket instance to {@link RS.Service#connect} is to override the WebSocket constructor used by the service. You can then simply use the service URL when connecting in the same was as in the browser. To do this simply set the {@link RS.Service#websocket} static property to the W3C compatible constructor:

```javascript
const { Command,Command_error,Error: Rs_error,Utils,Service } = require('@migenius/realityserver-client');
Service.websocket = require('websocket').w3cwebsocket;

const service = new Service();

service.connect(url);
```

This pattern could be more convenient if sharing code between Node.js and the browser or if you are making multiple service connections within an application.

### Summary
In this tutorial we have learnt about the differences between initialization in the browser and Node.js and how to connect to RealityServer&reg;.

### Source
The complete source for this tutorial can be found below:

[Source](tutorials/node-connecting/index.js)
