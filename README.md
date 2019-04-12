# realityserver-client

A lightweight, modern JavaScript client library to connect to and render using [migenius's](https://migenius.com "migenius") [RealityServer](https://www.migenius.com/products/realityserver "RealityServer")®. Natively supports modern evergreen browsers and Node.js.
## Introduction

The legacy JavaScript client library shipped with RealityServer was designed in 2010, back when JavaScript in the browser was mostly unusable without some sort of framework like jQuery, WebSockets were still under design and JavaScript on the server was virtually unheard of (RealityServer being one of the exceptions). A lot has changed since then, JavaScript has significantly evolved and is supported by a huge module ecosystem, WebSockets are under the hood of everything and Node.js is becoming ubiquitous.

The RealityServer client library however has barely changed. Until now.

`realityserver-client` is a Promise based, ES6 RealityServer client library that can be used directly both in the browser and Node.js. It utilises WebSockets for all communications providing fast and efficient command execution. The WebSocket connection can stream images to the client directly from render loops and provides synchronized command execution, ensuring that no changes are lost and letting you know exactly when changes appear in rendered images.

`realityserver-client` requires at least RealityServer 5.2 2272.266.
## Usage
Download the [minified](https://unpkg.com/@migenius/realityserver-client@1.0.0 "RealityServer client library") library and include it directly in your HTML, or install via `npm install @migenius/realityserver-client` and use as a module in [Node.js](https://nodejs.org "Node.js") directly or via your favorite bundler (EG: [rollup.js](https://rollupjs.org "rollup.js") [Webpack](https://webpack.github.io/ "Webpack") [Broswerify](https://github.com/substack/node-browserify "Browerify")). Then simply instantiate `RS.Service`, connect to your RealityServer and start sending commands.
#### Browser
```html
<script source='/js/realityserver.js'></script>
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
    if (scene_info instanceof RS.Error) {
      console.log(`Scene load error: ${scene_info.toString())}`);
    } else {
      // scene is loaded, do some more work with it
      scene_loaded(scene_info);
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
const { Service, Command, Error: Rs_error, Utils } = require('realityserver-client');

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
    if (scene_info instanceof Rs_error ) {
      console.log(`Scene load error: ${scene_info.toString()}`);
      return;
    } else {
      scene_loaded(scene_info);
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
A typical interactive browser application will want to start a render loop and display the rendered images. The WebSocket connection can be tightly bound with a render loop and stream the rendered results directly to the browser.

```html
<img id="rendered_image"/>
```

```javascript
const user_scope_name = `scope_${RS.Utils.create_random_string(8)}`;
const render_loop_name = `render_loop_${RS.Utils.create_random_string(8)}`;

function scene_loaded(scene_info) {
  const img = document.getElementById('rendered_image');

  service.queue_commands()
    // create a scope for the user
    .queue(new RS.Command('create_scope', { scope_name: user_scope_name, parent_scope: 'myscope' }))
    .queue(new RS.Command('use_scope', { scope_name: user_scope_name }))
    // localize the camera to the user scope
    .queue(new RS.Command('localize_element',{ element_name: scene_info.camera }))
    // set the camera resolution to match the size of the Image element we will display in
    .queue(new RS.Command('camera_set_resolution',
      {
        camera_name: scene_info.camera,
        resolution: { x: img.width, y: img.height }
      }))
    .queue(new RS.Command('camera_set_aspect',
      {
        camera_name: scene_info.camera,
        aspect: img.width / img.height
      }))
    // start the render loop
    .queue(new RS.Command('render_loop_start',
      {
        scene_name: 'myscene',
        render_loop_name: render_loop_name,
        render_loop_handler_name: 'default',
        timeout: 30
      }),true) // want a response for this command
    .execute()
    .then(([ start_response ]) => {
      if (start_response instanceof RS.Error) {
        console.log(`Render loop start error: ${start_response.toString()}`);
        return;
      }
      console.log('Starting render loop stream');

      // Render loop has started, start streaming images to img.
      const stream = service.create_stream();

      // The stream will emit 'image' events whenever a rendered image is received.
      // RS.Utils.html_image_display creates an event handling function which
      // will display rendered images in the provided Image.
      stream.on('image',RS.Utils.html_image_display(img));

      // Also log that we received an image 
      stream.on('image',(image) => {
        if (image.result < 0) {
          return; // error on render
        }
        console.log('Rendered image received');
      });

      // start the stream
      return stream.start(
        {
          render_loop_name,
          image_format: 'jpg',
          quality: '100'
        }
      );
    })
    .then(() => {
      console.log('Render loop stream started');
    })
    .catch(err => {
      // service promises only reject for system errors which are not expected
      // once the web socket is connected
      console.error(`Unexpected service error: ${err.toString()}`);
    });
}

```
## Batch rendering an image

A Node.js connection to RealityServer can be used for batch rendering sets of images. A typical use case would be to load a scene as above, apply changes then render images to disk as below
```javascript
function render_scene(scene_info, width, height, max_samples, filename) {
  return new Promise(async (resolve,reject) => {
    const camera = scene_info.camera;
    const options = scene_info.options;

    let image;
    try {
      [ image ] = await service.queue_commands()
        .queue(new Command('use_scope', { scope_name: 'myscope' }))
        .queue(new Command('camera_set_resolution',{
          camera_name: camera,
          resolution: {
            x: width,
            y: height
          }
        }))
        .queue(new Command('camera_set_aspect',{
          camera_name: camera,
          aspect: width / height
        }))
        .queue(new Command('element_set_attribute', {
          element_name: options,
          attribute_name: 'progressive_rendering_max_samples',
          attribute_value: max_samples,
          attribute_type: 'Sint32'
        }))
        .queue(new Command('render',
          {
            scene_name: 'myscene',
            renderer: 'iray',
            format: path.extname(filename).slice(1),
            render_context_options: {
              scheduler_mode: {
                value: 'batch',
                type: 'String'
              }
            }
          }),true)
        .execute();

      if (image instanceof Rs_error) {
        reject(`render error: ${image.toString()}`);
      }
    } catch (err) {
      reject(`Service error rendering scene: ${err.toString()}`);
      return;
    }

    if (!image.data) {
      reject('no rendered image');
      return;
    }
    fs.writeFile(filename,image.data,(err) => {
      if (err) {
        reject(`error writing file ${err}`);
      } else {
        resolve(`image saved to ${filename}`);
      }
    });
  });
}
```
  
## API Documentation

TODO: link to live docs go here

## Demos

- [A simple rendering demo with camera dolly and material changing](https://github.com/migenius/realityserver-client-tutorial "Simple demo")

- [React/mobx implementation of the render loop demo](https://github.com/migenius/render-loop-react-mobx "React/MobX demo")

- [Simple Node.js render script](https://github.com/migenius/render-node "node render script")

## Extras
A [RealityServer Extras](https://github.com/migenius/realityserver-extras "RealityServer Extras") add-on package is available to assist in manipulating scene elements.