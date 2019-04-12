Rendering images is of course the core purpose of RealityServer&reg; Once a scene is loaded we can start rendering it on the server and stream images back to the client over the WebSocket connection.

### State
We need to add rendering state variables.
```javascript
const state = {
  server: {
    host: 'localhost',
    port: 8080,
    secure: false
  },
  scene_filename: 'scenes/meyemii.mi',
  scene_name: 'meyemii',
  app_scope_name: 'tutorial',
  session_scope_name: `scope_${RS.Utils.create_random_string(8)}`,
  render_loop_name: `render_loop_${RS.Utils.create_random_string(8)}`
};
```
Since we are now going to be be modifying the scene to render it we will need a session scope in addition to the application one. This needs to be unique so we just give it a random name using one of the built in helpers. Server side rendering occurs in a render loop and we need a name for that as well.

We now want to modify the way we handle the `import_scene` result. On error we'll still set the error status but will return immediately as there's no more work for us to do. On success though we'll store the scene info in the state then call a new `scene_loaded` function to take the next steps.
```javascript
if (scene_info instanceof RS.Command_error) {
  set_status(`Scene load error: ${scene_info.message}`);
  return;
} else {
  state.scene = scene_info;
  scene_loaded();
}
```
The scene info object provides information about the top level elements of the imported scene.
```json
{
  "options": "meyemii::opt",
  "rootgroup": "meyemii::rootgroup",
  "camera_instance": "meyemii::cam_inst",
  "camera": "meyemii::cam",
  "imported_elements": [],
  "messages": []
}
```
- `options` The name of scene options block. Most global rendering options are controlled here.
- `rootgroup` The name of scene rootgroup. This group is the entry point to the scene DAG and contains all elements that will be rendered.
- `camera_instance` The name of the camera instance used for rendering. This instance provides the camera position and orientation.
- `camera` The name of the camera used for rendering. This provides camera controls like field of view, resolution, tonemapping, depth of field etc.
- `imported_elements` If the `list_elements` import option was set this contains an array listing all elements added to the database by this import operation.
- `messages` An array of any messages reported by the importer.

### Image display
We need somewhere to actually display the rendered image in the client. We can simply add a standard DOM Image to our html for this:
```html
<div width="400">
  <h1>RealityServer&reg; Client Tutorial</h1>
  <img id="rendered_image" width="400" height="400"/>
  <div>
    <span id="status" />
  </div>
</div>
```

### Starting the render loop
The `scene_loaded` function is defined as:
```javascript
async function scene_loaded() {
  set_status('Initializing render.');
  try {
    const img = document.getElementById('rendered_image');

    const [ start_result ] = await service.queue_commands()
      // create a scope for the session
      .queue(new RS.Command('create_scope', 
        {
          scope_name: state.session_scope_name,
          parent_scope: state.app_scope_name
        }))
      .queue(new RS.Command('use_scope', { scope_name: state.session_scope_name }))
      // localize the camera to the session scope
      .queue(new RS.Command('localize_element', { element_name: state.scene.camera }))
      // set the camera resolution to match the size of the Image element we will display in
      .queue(new RS.Command('camera_set_resolution',
        {
          camera_name: state.scene.camera,
          resolution: { x: img.width, y: img.height }
        }))
      .queue(new RS.Command('camera_set_aspect',
        {
          camera_name: state.scene.camera,
          aspect: img.width / img.height
        }))
      .queue(new RS.Command('render_loop_start',
        {
          scene_name: state.scene_name,
          render_loop_name: state.render_loop_name,
          render_loop_handler_name: 'default',
          timeout: 10,
        }), true) // want a response for this command
      .execute();

    if (start_result instanceof RS.Command_error) {
      set_status(`Render loop start error: ${start_result.message}`);
      return;
    }
    start_stream();
  } catch (err) {
    // service promises only reject for system errors which are not expected
    // once the web socket is connected
    set_status(`Unexpected service error: ${err.toString()}`);
  }
}
```
Again, there's a lot to be unpacked.
```
const img = document.getElementById('rendered_image');
```
This is the DOM element that we are going to be using to display images in. We require it here to work out what size image we need to render to.
```
// create a scope for the session
.queue(new RS.Command('create_scope', 
  {
    scope_name: state.session_scope_name,
    parent_scope: state.app_scope_name
  }))
.queue(new RS.Command('use_scope', { scope_name: state.session_scope_name }))
```
We are making another scope, this time for the session. The session scope is used to perform scene changes that only want to be applied for this user in this session. As it wants to be able to access the scene we've just loaded it is created as a child of the application scope by passing it's name is as the parent. We then issue a `use_scope` command so that the rest of the commands in this sequence are executed in the session scope.

The `localize_element` command is the other important scoping related command. You will remember from the {@tutorial browser-scene-loading} tutorial that commands can see all elements within their scope, and its parents. The other important factor is that the element the command sees is the one furthest down in the scope tree. For example: after issuing the `use_scope` command to enter the `session_scope_name` scope we can access and edit the camera called `meyemii::cam`. The particular element we edit is the one that was imported into `app_scope_name`. 

All the `localize_element` command does is makes a copy of the given element and store it in the current scope.

```
// localize the camera to the session scope
.queue(new RS.Command('localize_element', { element_name: state.scene.camera }))
```
Now there is another camera called 'meyemii::cam' that exists in `session_scope_name`. Changes we make to that camera are only visible within that scope (and it's children). So we can freely edit that camera without having it affect users in other session. When we reload the page, or another user simultaneously accesses the application a new session scope will be made and a new copy of the scene camera.

```
// set the camera resolution to match the size of the Image element we will display in
.queue(new RS.Command('camera_set_resolution',
  {
    camera_name: state.scene.camera,
    resolution: { x: img.width, y: img.height }
  }))
.queue(new RS.Command('camera_set_aspect',
  {
    camera_name: state.scene.camera,
    aspect: img.width / img.height
  }))
```
We set the resolution and aspect ratio of the camera to that of the Image element we are rendering into. Since we've localized the camera the camera visible to `app_scope_name` is still at it's original resolution and aspect (512x512). However in `session_scope_name` the resolution is now 400x400.

```
.queue(new RS.Command('render_loop_start',
  {
    scene_name: state.scene_name,
    render_loop_name: state.render_loop_name,
    render_loop_handler_name: 'default',
    timeout: 10,
  }), true) // want a response for this command
.execute();
```
Adds the start render loop command and executes the sequence. Render loops are the primary mechanism of providing interactive rendering results to the user. Given a scene name they render in a tight loop on the server and can push images back to the client when available. Render loops are named so they can be identified and they behaviour modified. Any changes to the scene are automatically picked up and rendering will automatically begin again with the changes.

The command requires the following parameters:
- `scene_name` The name of the scene to render. Note it is not possible to change the scene being rendered once started. You would need to stop this render loop and start a new one on the new scene.
- `render_loop_name` The name to use for the render loop.
- `render_loop_handler_name` Rendering itself is performed by a handler which is specified here. These can be user implemented but in this case we will use the `default` one that comes with RealityServer&reg;
- `timeout` As rendering consumes significant server resource (IE: GPU and CPU cycles) we do not want to be rendering images if there is no-one consuming them. If the render loop has not been accessed in this amount of seconds then it is shutdown automatically. Note that streaming images from a render loop counts as accessing the render loop. What this effectively means is that 10 seconds after leaving the application the render loop will shutdown.

Note we request a response for this command, both so we can check it starts correctly and so we know when it is running.

```
if (start_result instanceof RS.Command_error) {
  set_status(`Render loop start error: ${start_result.message}`);
  return;
}
start_stream();
```
We just perform the standard error checking pattern and then call the `start_stream` function to begin displaying images.

### Image streaming
Now the render loop is running we want to get images from it and display them to the user. RealityServer&reg; provides a system to push rendered images from the server to the client over the WebSocket connection.
```
async function start_stream() {
  set_status('Starting render loop stream');
  try {
    const img = document.getElementById('rendered_image');
    state.stream = service.create_stream();

    // RS.Utils.html_image_display creates an 'image' event handler which
    // will display rendered images in the provided Image element.
    state.stream.on('image', RS.Utils.html_image_display(img));
    state.stream.on('image', (image) => {
        if (image.result < 0) {
          set_status(`Render error: ${image.result}`);
          return; // error on render
        }
        set_status(`Iteration count: ${image.statistics.iteration ? image.statistics.iteration : 1} ` +
                                      `${image.result == 1 ? "(converged)" :""}`);
    });
    
    await state.stream.start(
      {
        render_loop_name: state.render_loop_name,
        image_format: 'jpg',
        quality: '100'
      }
    );

    set_status('Render loop stream started');
  } catch (err) {
    // service promises only reject for system errors which are not expected
    // once the web socket is connected
    set_status(`Unexpected service error: ${err.toString()}`);
  }
}
```
After updating status we fetch the image display element again, create a stream and store it on the state:
```
const img = document.getElementById('rendered_image');
state.stream = service.create_stream();
```
A stream is tied to a render loop and every time a render completes it is pushed to the client. When the image is received a {@link RS.Stream#event:image} event is emitted on the stream object (and on the service itself) containing the image and various statistics (see {@link RS.Stream~Rendered_image}). So all we need to do is listen for these events to handle each image:
```
state.stream.on('image', RS.Utils.html_image_display(img));
state.stream.on('image', (image) => {
    if (image.result < 0) {
      set_status(`Render error: ${image.result}`);
      return; // error on render
    }
    set_status(`Iteration count: ${image.statistics.iteration ? image.statistics.iteration : 1} ` +
                                  `${image.result == 1 ? "(converged)" :""}`);
});
```
{@link RS.Utils.html_image_display} is a utility function for image display. It returns a function that will display a rendered image in the Image element provided. Passing this as an event handler is all that's needed for image display.

We also register a second event handler to display render progress.

```
await state.stream.start(
  {
    render_loop_name: state.render_loop_name,
    image_format: 'jpg',
    quality: '100'
  }
);
```
Finally we start streaming from the render loop we started previously. We also specify the image format and quality to use. This must be a format supported by both RealityServer&reg; and the client's image display system.

Now load your page and you should get something like the following:

![rendering](tutorials/browser-rendering/rendering.jpg)

As rendering progresses the iteration count will increase and the quality of the displayed image will improve. If you wait until convergence (100 iterations by default) you will also receive a message indicating this. Once converged, the render loop stops rendering until further changes are made to the scene.

### Summary
In this tutorial we have learnt about scene data, localization, render loops and image streaming. In the next tutorial we will start making changes to the scene while rendering.

### Source
The complete source for this tutorial can be found below:

[GitHub](https://github.com/migenius/realityserver-client/blob/master/docs/tutorials/browser-rendering/index.html)

If you have a local checkout and a running RealityServer&reg; you can load the tutorial below:

[Load](tutorials/browser-rendering/index.html)
