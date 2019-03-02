Connecting in Node.js requires an extra step since there is no built in WebSocket implementation.

### Dependencies
As we need an external WebSocket we have to install it via npm. We also of course need the client API itself and yargs for command line processing.
```bash
$ npm install realityserver-client websocket yargs
```
### Import modules and initialize
Now we can start the script itself which we'll call `index.js`. As usual at the top we want to pull in our required modules.
```javascript
const
  path = require('path'),
  fs = require('fs'),
  { Command, Command_error, Error: Rs_error, Utils, Service } = require('realityserver-client');

Service.websocket = require('websocket').w3cwebsocket;

const service = new Service();
```
After the built in modules we require the RealityServer&reg; client itself. The individual components required are destructured out for convenience. Note this requires renaming the Error class else it will clash with the builtin Error class, the same would need to be done if extracting the RS.Math API.

We then pull in the `websocket` module and get the W3C compliant interface. But instead of importing to a new global we instead assign it to the `Service.websocket` static property. This will cause the API to use that as the WebSocket constructor instead of `window.WebSocket` which won't be defined. 

That is all that is needed to setup the API for Node.js. From this point on it can be used in exactly the same was as in the browser. The only exception is the {@link RS.Utils.html_image_display} function which requires an Image DOM object to display. However even that can be used if you can provide a custom `Image` and [Object URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL "Object URL") implementation.

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
    await service.connect(url);
  } catch (err) {
    console.error(`Web Socket connection failed: ${err.toString()}`);
    return;
  }

  console.log('connected.');

  service.close();
}
```
First, we destructure out the arguments provided by yargs. From those arguments we generate the URL to connect to and connect the service.

One thing to note is that in Node.js applications we need to ensure that the service gets closed when we're done. Otherwise the open WebSocket connection will prevent the application from exiting on completion.

### Custom constructor arguments
In some cases it may be necessary to pass additional arguments to the WebSocket contructor, EG: if custom headers are required on the initial HTTP connection. There are two ways to acheive this.
```javascript
service.connect(url, [ null, { 'custom-header': 'value' } ]);
```
The 2nd argument to {@link RS.Service#connect} can be an array of additional arguments to provide to the WebSocket construtor. These are appended after the `protocol` argument in the constructor. The above would result in the following constructor call:
```javascript
new WebSocket(url, null, null, { 'custom-header': 'value' });
```

Alternatively, an already created WebSocket object may be passed into connect. This gives the user complete control over the creation of the WebSocket and allows them to call any additional setup functions the implementation may provide before handing it over to the service.
```
const { Command,Command_error,Error: Rs_error,Utils,Service } = require('realityserver-client');
const WebSocket = require('websocket').w3cwebsocket;

const service = new Service();

const ws = new WebSocket(url, null, null, { 'custom-header': 'value' });

service.connect(ws);
```
Note that you must not process any messages on the WebSocket before passing it to the service otherwise initialization will fail.

### Summary
In this tutorial we have learnt about the differences between initialization in the browser and Node.js and how to connect to RealityServer&reg;.

### Source
The complete source for this tutorial can be found below:

[Source](tutorials/node-connecting/index.js)
