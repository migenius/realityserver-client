Batch rendering is a different process to interactive rendering as used in the browser. Here, instead of receiving a stream of images and being able to make changes to the scene at any time we simply want to fire off a render call and get a single response when the result is ready.

### A bit of prep
```javascript
console.log(`rendering at ${width}x${height} for ${max_samples} iterations`);

try {
  scene_info.scene_name = 'myscene';
  scene_info.scope_name = scene_file;
  await render_scene(scene_info, width, height, max_samples, filename);
  console.log(`image saved to ${filename}`);
} catch (err) {
  console.error(err);
}
```
So we just transfer some data to the scene info then call our `render_scene` function to perform the actual render.

### Rendering
```javascript
function render_scene(scene_info, width, height, max_samples, filename) {
  return new Promise(async (resolve, reject) => {
    const camera = scene_info.camera;
    const options = scene_info.options;
    const user_scope_name = `scope_${Utils.create_random_string(8)}`;

    const [ image ] = await service.queue_commands()
      .queue(new Command('create_scope', { scope_name: user_scope_name, parent_scope: scene_info.scope_name }))
      .queue(new Command('use_scope', { scope_name: user_scope_name }))
      .queue(new Command('localize_element', { element_name: options }))
      .queue(new Command('localize_element', { element_name: camera }))
      .queue(new Command('camera_set_resolution', {
        camera_name: camera,
        resolution: {
          x: width,
          y: height
        }
      }))
      .queue(new Command('camera_set_aspect', {
        camera_name: camera,
        aspect: width / height
      }))
      .queue(new Command('element_set_attribute', {
        element_name: options,
        attribute_name: 'progressive_rendering_max_samples',
        attribute_value: max_samples,
        attribute_type: 'Sint32',
        create: true
      }))
      .queue(new Command('render',
        {
          scene_name: scene_info.scene_name,
          renderer: 'iray',
          format: path.extname(filename).slice(1),
          render_context_options: {
            scheduler_mode: {
              value: 'batch',
              type: 'String'
            }
          }
        }), true)
      .queue(new Command('delete_scope', { scope_name: user_scope_name }))
      .execute().catch(err => [ err ]);

    if (image instanceof Command_error) {
      reject(`render error: ${image.message}`);
      return;
    }
    if (image instanceof Rs_error) {
      reject(`render error: ${image.toString()}`);
      return;
    }

    if (!image.data) {
      reject('no rendered image');
      return;
    }
    fs.writeFile(filename, image.data, (err) => {
      if (err) {
        reject(`error writing file ${err}`);
      } else {
        resolve(`image saved to ${filename}`);
      }
    });
  });
}
```
The render returns a Promise that resolves when the rendered image has been written to disk or rejects on error.

Similar to the browser tutorial we are creating a user scope to make our changes and render in. However, in addition to localizing the camera we are also localizing the scene options block:
```
const options = scene_info.options;
...
  .queue(new Command('localize_element',{ element_name: options }))
  ...
  .queue(new Command('element_set_attribute', {
    element_name: options,
    attribute_name: 'progressive_rendering_max_samples',
    attribute_value: max_samples,
    attribute_type: 'Sint32',
    create: true
  }))
```
Like the camera elements the option block is also returned when importing the scene. This element is the main location where global rendering options are set for the scene. In this case we are setting the `progressive_rendering_max_samples` attribute on the options. In interactive rendering, images are returned every few progressive iterations. So you can watch the quality of the render improve as time goes on. In batch rendering however the render call doesn't return until a converged image is obtained. A converged image is one where one of three refinement metrics is met:

1. Iteration count - the image is converged once it has rendered a given number of iterations.
2. Time - the image is converged once it has rendered for a given amount of time. 
3. Quality - the image is converged once a given quality metric has been obtained in a given percentage of pixels.

All 3 have default values, 100 iterations, 1 hour and a quality of 1 in 95% of pixels. Whichever of these three criteria is first met terminates rendering and returns the final image. Individual criteria can also be disabled. We really should allow all 3 types to be set however for simplicity we are only exposing max iterations.

The `element_set_attribute` command is a generic command that allows any attribute to be set on any element. Most settings on scene elements are controlled by attributes, ones that will have specific RealityServer&reg; commands for controlling them.

Two important things to note, the `element_set_attribute` command will not create attributes by default. If the attribute does not already exist on the element the set command will fail. So we provide the `create` argument so the attribute can be created if it doesn't already exist. Attributes are also strictly typed, so we need to provide the type of the attribute in `attribute_type` as well. 

Note that termination criteria are also honoured when using interactive mode in render loops. When converged, the render loop simply pauses rendering until the scene is changed again.

Information on how to setup the other 2 criteria, as well as supported attributes in general, can be found in the RealityServer&reg; documentation.

```javascript
.queue(new Command('render',
{
  scene_name: scene_info.scene_name,
  renderer: 'iray',
  format: path.extname(filename).slice(1),
  render_context_options: {
    scheduler_mode: {
      value: 'batch',
      type: 'String'
    }
  }
}),true)
```
The command that does the actual work. We supply scene name, renderer and the image format to encode the image to which comes from the filename extension (png/jpg/exr etc.). Render context options are the other main location that rendering options are provided. These however are per render options rather than scene options. In this case we are setting `scheduler_mode` to `batch` which enables batch mode as described previously. Like the options block, these options are also strictly typed.

Remember that since we want to get the result of this command (the actual rendered image) we pass `true` as the second argument.

```
.queue(new Command('delete_scope', { scope_name: user_scope_name }))
.execute().catch(err => [ err ]);
```
Since this is a one shot render we clean up after ourselves by deleting the created user scope after rendering. This is the last command for the queue so we execute the commands and resolve any errors.

```
if (image instanceof Command_error) {
  reject(`render error: ${image.message}`);
  return;
}
if (image instanceof Rs_error) {
  reject(`render error: ${image.toString()}`);
  return;
}

if (!image.data) {
  reject('no rendered image');
  return;
}
fs.writeFile(filename, image.data, (err) => {
  if (err) {
    reject(`error writing file ${err.toString()}`);
  } else {
    resolve(`image saved to ${filename}`);
  }
});
```
If our error checks pass then the render command will have returned an object containing two properties:
* `data` - a `Uint8Array` containing the rendered image.
* `mime_type` a `String` containing the mime-type of the image.

The final step is to write the image data to disk and resolve or reject the promise.

We can now perform a render:
```
$ node index.js localhost 8080 scenes/meyemii.mi 800 800 500 out.png
```
Given this is a generic command you can substitute any scene name that is in the RealityServer&reg; content root and render at any resolution required.

### Summary
In this tutorial we have learnt about setting rendering options, termination critera and how to perform a one shot render.

### Source
The complete source for this tutorial can be found below:

[Source](tutorials/node-rendering/index.js)
