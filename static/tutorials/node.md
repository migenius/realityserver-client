# RealityServer&reg; Client API
The RealityServer Client API is a lightweight, modern JavaScript client library to connect to and render using [migenius's](https://migenius.com "migenius") [RealityServer](https://www.migenius.com/products/realityserver "RealityServer")®.

## Supported Environments
The API supports any JavaScript ES6 environment that provides a [W3C WebSocket API](https://www.w3.org/TR/websockets/ "W3C WebSocket API") implementation. This includes all evergreen desktop browsers, most mobile browsers and Node.js >= 6.5 (with an appropriate WebSocket module like [websocket](https://www.npmjs.com/package/websocket "websocket")). The most notable exclusion is IE 11 which supports WebSockets but not ES6. If you end support for IE 11 it is recommended to transpile the API down to ES5.

RealityServer&reg; 5.2 2452.XXXX or later is required.

## Installation
For Node.js and bundlers simply install the modue:
```shell
$ npm install @migenius/realityserver-client
```
For native browser usage download via CDN:
```html
<script source='https://unpkg.com/@migenius/realityserver-client@1.0.0'></script>
```
or unminified
```html
<script source='https://unpkg.com/@migenius/realityserver-client/1.0.0/lib/umd/realityserver.js'></script> 
```
Although for mission critical deployments it is recommended you serve the client API yourself. 
## First steps
### In the browser
```html
<script source='https://unpkg.com/@migenius/realityserver-client@1.0.0'></script>
```
```javascript
// The UMD module exposes all classes on the RS global.
const service = new RS.Service();

// Connect to RealityServer
service.connect('ws://host.example.com/service/')
  .then(() => {
    // Load a scene
    return service.queue_commands()
      .queue(new RS.Command('create_scope',{scope_name:'myscope'}))
      .queue(new RS.Command('use_scope',{scope_name:'myscope'}))
      .queue(new RS.Command('import_scene',
        {
          scene_name:'myscene',
          block:true,
          filename: 'scenes/meyemii.mi'
        }),true) // the response from this will resolve next
      .execute();
  })
  .then(([scene_info]) => {
    if (scene_info.is_error) {
      console.log(`Scene load error: ${JSON.stringify(scene_info.error)}`);
    } else {
      // scene is loaded, do some more work with it
      scene_loaded(scene_info.result);
    }
  })
  .catch(err => {
      // service promises only reject for system errors, not command errors so
      // this is likely a connection problem.
      console.error(`Failed to connect to RealityServer: ${err.toString()}`);
  });
```
#### Node.js
```javascript
// Node has no native socket implementation so we use the 'websocket' module from npm
const WS = require('websocket').w3cwebsocket; // ensure we have the W3C compliant API
// Just grab the classes we need
const { Service, Command } = require('realityserver-client');

async () => {
  const service = new Service();
  // pass in a websocket implementation to use rather than a URL.
  try {
    await service.connect(new WS('ws://host.example.com/service/'));
  } catch(err) {
    console.error(`Failed to connect to RealityServer: ${err.toString()}`);
    return; 
  }
  try {
    const [ scene_info ] = await service.queue_commands()
      .queue(new Command('create_scope',{scope_name:'myscope'}))
      .queue(new Command('use_scope',{scope_name:'myscope'}))
      .queue(new Command('import_scene',
        {
          scene_name:'myscene',
          block:true,
          filename: 'scenes/meyemii.mi'
        }),true)
      .execute();
    if (scene_info.is_error) {
      console.log(`Scene load error: ${JSON.stringify(scene_info.error)}`);
      return;
    } else {
      scene_loaded(scene_info.result);
    }
  } catch(err) {
    // In general usage command promises shouldn't reject unless something
    // went fundanmentally wrong. 
    console.error(`System error: ${err.toString()}`);
    service.close();
    return; 
  }
})();
```

From here you can start rendering images and editing your scene. For more details see the {@tutorial 01-getting-started} tutorial and the {@link RS.Service} class documentation. The {@tutorial 02-concepts} tutorial covers some basic RealitServer&reg; concepts and {@tutorial 03-migrating} provides information on migrating legacy code to the new API.

Note that this documentation should be read in conjuction with the [RealityServer&reg; documentation](https://rsdoc.migenius.com "RealityServer&reg; documentation").

## Sample applications

- [React/mobx implementation of the render loop demo](http://github.com/migenius/react-mobx-render-loop "render loop demo")

- [Simple Node.js render script](http://github.com/migenius/node-render "node render script")