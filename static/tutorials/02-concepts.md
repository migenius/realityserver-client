# Concepts

A lightweight, modern JavaScript client library to connect to and render using [migenius's](https://migenius.com "migenius") [RealityServer](https://www.migenius.com/products/realityserver "RealityServer")®. Natively supports modern evergreen browsers and Node.js.

## Scopes

## State

## Send and execute


The legacy JavaScript client library shipped with RealityServer was designed in 2010, back when JavaScript in the browser was mostly unusable without some sort of framework like jQuery, WebSockets were still being designed and JavaScript on the server was virtually unheard of (RealityServer being one of the exceptions). A lot has changed since then, JavaScript has significantly evolved and is supported by a huge module ecosystem, WebSockets are under the hood of everything and Node.js is becoming ubiquitous.

The RealityServer client library however has barely changed. Until now.

`realityserver-client` is a Promise based, ES6 RealityServer client library that can be used both in the browser and Node.js. It utilises WebSockets for all communications providing fast and efficient command execution. The WebSocket connection can stream images to the client directly from render loops and provides synchronized command execution, ensuring that no changes are lost and letting you know exactly when changes appear in rendered images.

`realityserver-client` requires at least RealityServer 5.2 2452.XXX

## Usage
Download the [minified](https://insertlinkhere.example.com "RealityServer client library") library and include it directly in your HTML, or install via `npm install @migenius/realityserver-client` and use as a module in [Node.js](https://nodejs.org "Node.js") directly or via your favorite bundler (EG: [rollup.js](https://rollupjs.org "rollup.js") [Webpack](https://webpack.github.io/ "Webpack") [Broswerify](https://github.com/substack/node-browserify "Browerify")). Then simply instantiate `RS.Service`, connect to your RealityServer and start sending commands.

#### Browser
```html
<script source='/js/realityserver.js'></source>
```
```javascript
const service = new RS.Service();

service.connect('ws://host.example.com/service/')
  .then(() => {
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
#### Node
```javascript
// Node has no native socket implementation so we use the 'websocket' module from npm
const WS = require('websocket').w3cwebsocket; // ensure we have the W3C compliant API
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

## Streaming images from a render loop

TODO: show how to stream images from a render loop

## API Documentation

TODO: link to live docs go here

## Demos

- [React/mobx implementation of the render loop demo](http://github.com/migenius/react-mobx-render-loop "render loop demo")

- [Simple Node.js render script](http://github.com/migenius/node-render "node render script")