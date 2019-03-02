Scene loading follows the same pattern as in the browser {@tutorial browser-scene-loading} tutorial.

After the connected log message add the following:
```javascript
console.log(`loading scene: ${scene_file}`);

const [ scene_info ] = await service.queue_commands()
  .queue(new Command('create_scope', { scope_name: scene_file }))
  .queue(new Command('use_scope', { scope_name: scene_file }))
  .queue(
    new Command('import_scene',
      {
        scene_name: 'myscene',
        block: true,
        filename: scene_file
      }), true)
  .execute().catch(err => [ err ]);

if (scene_info instanceof Command_error) {
  console.error(`scene load failed: ${scene_info.message}`);
  service.close();
  return;
}

if (scene_info instanceof Rs_error) {
  console.error('Service error loading scene: ' + scene_info.toString());
  service.close();
  return;
}

console.log('scene loaded.');
```
The command pattern should be familiar, create scope, use scope, import scene. Note however that instead of wrapping the `await` in a `try/catch` block we are adding a catch handler to the `execute` Promise. So on service error this will resolve to an array containing the error rather than throwing. The order of the error checks is important here since `RS.Command_error` extends from `RS.Error`. If the checks here were swapped then command errors (EG: if the scene could not be found) would be interpreted as service errors.

There's no particular reason for using this pattern here rather than the traditional `try/catch`. It's simply interesting to show alternative execution patterns that can be used. 

### Summary
In this tutorial we have learnt about loading a scene in Node.js.

### Source
The complete source for this tutorial can be found below:

[Source](tutorials/node-scene-loading/index.js)
