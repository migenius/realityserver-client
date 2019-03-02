Once connected the next step is to get some content into RealityServer&reg; so we can render it. This can be acheived in a number of ways but the most common is to load it from a file. 

### State
We'll update the state to include the filename we want to load and a name for the scene. We'll use the `meyemii` scene that is used in the standard RealityServer&reg; demos.
```javascript
const state = {
  server: {
    host: 'localhost',
    port: 8080,
    secure: false
  },
  scene_filename: 'scenes/meyemii.mi',
  scene_name: 'meyemii'
};
```
`scene_filename` is the path to the file to load, relative to the RealityServer&reg; `content_root` directory. `scene_name` is the name of the database element to create that will refer to this scene. Note that loading a file into a scene is a one off event. You cannot later load a different file into the same scene, you would have to create a new scene for the new file. You can of course change the contents of the scene, or import another file and manually attach it's contents to your scene. But you cannot simply decide you want `scene_name` to refer to the file `scenes/cornell_box.mi` instead.

Next we'll modify our connection call to return on error and tell the user what scene we are about to load.
```javascript
try {
  const url = `${(state.server.secure ? 'wss' : 'ws')}://${state.server.host}:${state.server.port}/service/`;
  await service.connect(url);
} catch (err) {
  set_status(`Failed to connect to RealityServer: ${err.toString()}`);
  return;
}
set_status(`Loading scene: ${state.scene_filename}`);
```

### Scoping
Before actually loading the scene we need to introduce the concept of scoping. All RealityServer&reg; scene data is stored in the scene database. This is a key-value store which allows for storage of scene elements for later retrieval when they are needed. The keys are the element names and the values the scene elements themselves. All scene elements are accessed by their name. 

Scopes provide an isolated view into the database and allow different database elements stored using the same name. Without scopes, it would not be possible for two users to create an element called `camera` as they would clash. 

RealityServer&reg; starts with a shared global scope, by default all commands are run in this global scope which results in all scene data being shared by all users. Further scopes can be created as children of the global scope and scopes can also be nested creating a tree structure of database views.

Commands executed within any given scope can only see database elements within that scope and its parents. Additionally, any elements created are created within that scope and are not visible to parent scopes. Therefore the first step an application usually takes is to create a scope for itself.

### First commands
So the first commands we want to execute are to create an application scope, use it and import the scene. We'll define the application scope name in the state:
```javascript
const state = {
  server: {
    host: 'localhost',
    port: 8080,
    secure: false
  },
  scene_filename: 'scenes/meyemii.mi',
  scene_name: 'meyemii',
  app_scope_name: 'tutorial'
};
```

Then create a command queue, add the commands to it and execute.

```
try {
  const [ scene_info ] = await service.queue_commands()
    .queue(new RS.Command('create_scope', { scope_name: state.app_scope_name }))
    .queue(new RS.Command('use_scope', { scope_name: state.app_scope_name }))
    .queue(new RS.Command('import_scene',
      {
        filename: state.scene_filename,
        scene_name: state.scene_name,
        block: true,
        import_options: {
          prefix: `${state.scene_name}::`
        }
      }), true)
    .execute();
  if (scene_info instanceof RS.Command_error) {
    set_status(`Scene load error: ${scene_info.message}`);
  } else {
    set_status(`Loaded scene: ${state.scene_filename}`);
  }
} catch (err) {
  // In general usage comand promises shouldn't reject unless something
  // went fundamentally wrong.
  set_status(`System error: ${err.toString()}`);
  return;
}
```
There's a lot going on here that we need to unpack. However the above encapsulates the standard pattern of RealityServer&reg; command execution and covers most use cases.

```
service.queue_commands()
```
The {@link RS.Service#queue_commands} call returns a {@link RS.Command_queue} object that can be used to queue a sequence of commands for execution as a block. It is possible to just execute single commands directly however typically more than one command is needed to acheive a given result. The command queue has a {@link RS.Command_queue#queue} function which adds commands to the queue and {@link RS.Command_queue#execute} and {@link RS.Command_queue#send} which push the commands for execution. The two latter function both perform the same function but have a subtle difference in how they return results.

```
.queue(new RS.Command('create_scope', { scope_name: state.app_scope_name }))
```
Adds the first command to the queue which will create the application scope. The {@link RS.Command} class reprents individual commands. The constructor takes just 2 arguments, the name of the command and an object containing it's named arguments. For convenience `queue` returns the command queue object so we can chain commands.

```
.queue(new RS.Command('use_scope', { scope_name: state.app_scope_name }))
```
As stated above all commands are executed in the global scope by default so the newly created scope won't automatically be used. Therefore we need to explicitly make this new scope active with the `use_scope` command so that the import command adds the scene elements to our application scope. Once made activate, all subsequent commands in the queue will use this scope.

```
.queue(new RS.Command('import_scene',
  {
    filename: state.scene_filename,
    scene_name: state.scene_name,
    block: true,
    import_options: {
      prefix: `${state.scene_name}::`
    }
  }), true)
```
Imports the actual scene and adds all elements to the scene database. The `filename` and `scene_name` arguments come from the state and should be self explanatory. `block` prevents other users from attempting to load content into `scene_name` while the current import is taking place. We wouldn't want someone else populating the scene with unexpected content while we're loading. The `import_options` specify a prefix that will be added to the start of all scene element names. For example: if the scene contains a camera called `cam` it would be added to the database as `meyemii::cam`. This is done to prevent name clashes with other scenes that may be imported into the `tutorial` scope. Note we could accomplish the same thing by creating a per-scene child scope of `tutorial` and importing the content into there.

The other important factor here is that we are passing a `true` argument to the `queue` function after the command. This informs the command queue that we want to get the response to this command call. We need to know that the import worked and want to get the names of the top level elements created. For `create_scope` and `use_scope` we don't need to process their responses. `create_scope` will technically return an error if the scope already exists but this is an error we can safely ignore. And given we just created the scope we also know that the scope name will exist when calling `use_scope`.

```
const [ scene_info ] = await service.queue_commands()
    ...
    .execute();
```
We complete the command queue chaining with an {@link RS.Command_queue#execute} call which collects up the queued commands and executes them as a batch on RealityServer&reg;. `execute` returns a Promise (which we are awaiting on) that will resolve to an iterable containing the results of all commands that requested a response. Since we only wanted a response for the `import_scene` command we can use array destructuring to extract the single results.

```
  if (scene_info instanceof RS.Command_error)) {
    set_status(`Scene load error: ${scene_info.message}`);
  } else {
    set_status(`Loaded scene: ${state.scene_filename}`);
  }
```
Command results will resolve to the result of the command or an {@link RS.Command_error} if there was an execution error. Note that the execute Promise does not reject due to command execution errors, only for core library errors. So we need to check the result to see if an error occurred. In this case we are simply logging whether the scene import worked or not.

Now load your page and you should get something like the following:

![scene loaded](tutorials/browser-scene-loading/loaded.jpg)

### Summary
In this tutorial we have learnt about scopes, basic scene management and how to queue and execute commands on RealityServer&reg;. The next tutorial covers rendering the scene itself.

### Source
The complete source for this tutorial can be found below:

[Source](tutorials/browser-scene-loading/index.html)


