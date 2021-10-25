There are a number of high level concepts in RealityServer&reg; and the client library that need to be understood to make effective use of the system.

## Scopes

RealityServer&reg; is an interactive multi-scene, multi-user renderer. In short this means that you can have multiple users connected rendering multiple scenes simultaneously. Or multiple users rendering the same scene, or simply a single user rendering a single scene. Additionally, each user can make modifications to their scene in isolation from other users. For example users can be rendering the same scene from different camera locations; one can have red chairs and another blue; one can be rendering a bright summer day and another mid-winter twilight. It is even possible to have some scene data shared and some not. Two users can have independent cameras but see all the other scene changes that are made. All this is acheived without making copies of the entire scene but only of the particular elements that are changed.

All RealityServer&reg; scene data is stored in the scene database. This is a key-value store which allows for storage of scene elements for later retrieval when they are needed. The keys are the element names and the values the scene elements themselves. All scene elements are accessed by their name.

Scopes provide an isolated view into the database and allow different database elements to be stored using the same name. Without scopes, it would not be possible for two users to create an element called `camera` as they would clash.

RealityServer&reg; starts with a shared global scope, by default all commands are run in this global scope which results in all scene data being shared by all users. If multiple elements are created with the same name then the last one created shadows all the others. So if two users create an element called `camera` then both users would see the one that was created last. If either user modified the camera both would see the changes.

It is possible to create further scopes as children of the global scope. If we create scopes `A` and `B` then we can create a `camera` element within each and edit them independently. Additionally, any elements created within a scope are not visible to parent scopes. So from the global scope's point of view the `camera` element does not exist. You have to enter either scope `A` or `B` to access the `camera` element. Conversely, the child scopes can see any elements in their parent/ancestor scopes. So if we create an MDL material instance called `red` in the global scope then both scopes `A` and `B` will be able to see the `red` material. If the color of that material is changed to blue, then both child scopes will see the color change since they are accessing it from the global scope.

Scopes can be further nested creating a tree structure of database views. Scope `A` could have child scopes `AA` and `AB`. `B` could have children `BA` and `BB` (or whatever you want to call them). These can then have further child scopes up to a depth of 255 scopes. A typical application would never have that deep a scope tree though, a depth of 3 or 4 (including the global scope) is usually sufficient. A standard pattern is to create a single child scope as an 'application' scope to hold scene data that is shared between all users, and then create 'session' scopes below this, one for each active user. For example, if we were running two applications that had two active users each we would create the following:

![Nested Scopes](images/Nested-Scopes.svg "Nested Scopes")

The applications would load their scenes in the application scopes and each user would execute commands and render in their individual user scopes. If your application can dynamically load different scenes then there may also be a per-scene scope between the application and user.

As described earlier child scopes can see elements in their parent scopes. It is also possible for child scopes to have elements with the same name as elements in their parents. When accessing these elements you will always see the one furthest down the scope tree. By using a process called localization we can easily copy scene elements down the scope tree from whichever scope they are currently accessed from into the current scope.

For example: when a scene is loaded in the application scope, and the user accesses it in their user scope they see the element in the application scope. So every user is sharing the same elements. By localizing scene elements to their user scope, users are able to have their own individual copies of parts of the scene that they can edit without affecting other users. By localizing a scene's camera and camera instance from the application scope to the users it is possible to move around in a scene independently. Localizing an MDL material instance allows for users to change colors or other propeties of the material without affecting anyone else. All this is acheived withough having to copy the entire scene resulting in a potentially huge saving in memory usage.

Scoping and localization allows for powerful render time data sharing. Any editable scene element (apart from MDL definitions) can be localized and customized on a per user basis. In additional to the simple pattern described above more complex scenarios such as collaborative editing, where some scene data is shared and edited and some is per user, can easily be acheived. 

Details on creating and using scopes and localization can be found starting in the {@tutorial browser-scene-loading} tutorial as well as the [migenius blog](https://www.migenius.com/articles/scopes-in-realityserver "Scopes In RealityServer").

## Send and execute

The client library provides a number of entry points where commands can be executed, both the {@link RS.Service} and {@link RS.Stream} provide methods to call either single commands or queue up a sequence of commands to be called in a batch. Each of these provides two variants, send and execute. These perform the same core functionality, executing commands on RealityServer&reg; and promising to provide the results of those commands, if requested. However the form of the Promise(s) returned by each variant is subtly different.

We will be be using {@link RS.Command_queue} to demonstrate the differences between send and execute below as it is more informative to see the results of multiple commands. The same concepts apply to the `send_command` and `execute_command` functions on {@link RS.Service} and {@link RS.Stream}, the only difference is that these will only ever contain a single command result.

The following contrived command queue will be used:

```
const queue = service.queue_commands()
  .queue(new RS.Command('get_version', {}), true)
  .queue(new RS.Command('use_scope', { scope_name: 'my_scope' }))
  .queue(new RS.Command('element_exists', { element_name: 'camera' }), true);
```

This queue will execute three commands but only return two results, the first being the version of RealityServer&reg; being used and the second being whether an element called `camera` exists in the `my_scope` scope. We assume that `my_scope` already exists which is why we are not passing `true` as the second argument to it's `queue` call since we don't care about it's response.

### execute

The simplest, and most common, way to run this queue is to use the {@link RS.Command_queue#execute} method. This will return a single Promise that will resolve to an iterable containing the results of the commands that we want results for. EG:

```
queue.execute().then(([rs_version,camera_exists]) => {
  console.log(`Connected to RS ${rs_version}`);
  if (camera_exists instanceof RS.Command_error) {
    console.log(`camera does not exist.`);
  } else {
    console.log(`camera does exist.`);
  }
}).catch(err => {
  console.log(`System error: ${err.toString()}`);
});
```
Or if we are in an async function we can use:
```
try {
  const [rs_version,camera_exists] = await queue.execute();

  console.log(`Connected to RS ${rs_version}`);
  if (camera_exists instanceof RS.Command_error) {
    console.log(`camera does not exist.`);
  } else {
    console.log(`camera does exist.`);
  }
} catch(err) {
  console.log(`System error: ${err.toString()}`);
};
```
In both these situations a single Promise is being returned. It is resolving to an iterable and we use array destructuring to extract that into individual variables.

Note that the Promise does not reject in the case of RealityServer&reg; command errors. Instead the results of the commands are instances of {@link RS.Command_error}. The Promise will only reject in the case of underlying service errors, EG: you haven't yet connected to RealityServer&reg;.

### send

{@link RS.Command_queue#send} is used in the same was as `execute` except that it returns an array of Promises, one for each command that requested a result.
```
try {
  const [rs_version_promise, camera_exists_promise] = queue.send();
  rs_version_promise.then(rs_version => {
    console.log(`Connected to RS ${rs_version}`);
  });

  camera_exists_promise.then(camera_exists => {
    if (camera_exists instanceof RS.Command_error) {
      console.log(`camera does not exist.`);
    } else {
      console.log(`camera does exist.`);
    }
  });
} catch (err) {
  console.log(`System error: ${err.toString()}`);
}
```
Unlike the `execute` Promise the Promises returned by send will never reject as they are associated with individual command calls. Instead, on service error the `send` call throws directly.

### Which one should I use.

On the surface you might think you should just use {@link RS.Command_queue#execute} all the time. There's just a single Promise to deal with that you can either await on it or handle the results in a single `then` function. This is even more the case when you take into account of the fact that the `send` Promises will all resolve at the same time since all commands and results in a single queue are processed as a batch. You could make processing `send` results easier by wrapping it in a `Promise.all()` however that's effectively what `execute` does internally.

There is one special use case however where `send` is useful which is when you want to know when the result of a particular command has appeared in a rendered image.

When you queue or execute commands on a stream there is no correlation between when the Promises resolve and when the actual change appears in a rendered image. So in the following:

```
const [ set_result ] = await stream.execute_command(
  new RS.Command('mdl_set_argument', {
    element_name: 'red',
    argument_name: 'diffuse',
    value: { r: 0.4, g: 0.8, b: 0.2 }
  }), {
    want_response: true
  }
);  
```

the `await` will resume execution once the `red.diffuse` argument has been set or an error returned. This does not mean that the new color is visible in a render however since it will usually take longer for a scene to reset and pick up the change.

We can however add the `wait_for_render` option. In that case an additional Promise is returned that will resolve when a rendered image that contains the color change has been received by the stream.

```
const [ set_result, have_image ] = await stream.execute_command(
  new RS.Command('mdl_set_argument', {
    element_name: 'red',
    argument_name: 'diffuse',
    value: { r: 0.4, g: 0.8, b: 0.2 }
  }), {
    want_response: true,
    wait_for_render: true
  }
);  
```

So now when `await` resumes you know that the rendered images from the stream contain the changed color.

This issue however is that the `set_result` Promise will have resolved well before the `have_image` one and our function is locked up waiting for both Promises. We also typically want to do some work immediately in response to the `have_image` Promise resolving (IE: in the same tick as when the resolution occurs).

The most typical use case for `wait_for_render` is pausing the display of image streams until the change you've requested is ready for display. The `wait_for_render` Promise resolves when the image has arrived and it's {@link RS.Stream#event:image} event is about to be fired. Since we need to unpause the stream before the event is fired we need to do this in the Promise's then handler. To do so we have to use {@link RS.Stream#send_command} so we can access the Promises directly.

```
stream.pause(); // pause the stream so we don't see images until the below is complete
const [ set_result_promise, have_image_promise ] = stream.send_command(
  new RS.Command('mdl_set_argument', {
    element_name: 'red',
    argument_name: 'diffuse',
    value: { r: 0.4, g: 0.8, b: 0.2 }
  }), {
    want_response: true,
    wait_for_render: true
  }
); 
have_image_promise.then(img => {
  stream.resume(); // resume the stream once the image is ready to display
});
const set_result = await set_result_promise; // we can just await the result here
```

In this code block we first pause display of images on the stream, this means that even if images are received the {@link RS.Stream#event:image} event is not triggered. We then use {@link RS.Stream#send_command} so we can access the returned Promises directly rather than just their results. This allows us to add a then handler to `have_image_promise` to resume the stream once an image with the new color arrives. The event will then be triggered once the handler returns. We can then simply await on the `set_result_promise` and deal with it's response as we wish.

## Long running commands

The Web Socket implementation within RealityServer&reg; has a limitation where it processes all messages consecutively. This means that if executing a long running command on {@link RS.Service} any other messages sent (eg: other commands or operations on either the service or a {@link RS.Stream}) will be queued up and not processed until that command completes. This can cause issues particularly if keep alive commands need to be sent to prevent session expiry.

To mitigate this the option `longrunning: true` can be passed to the following command execution functions:

- {@link RS.Service#queue_commands}
- {@link RS.Service#execute_command}
- {@link RS.Service#send_command}

When this is passed RealityServer&reg; will prepare the command execution environment then execute the commands in a separate thread. This frees up the Web Socket to process further messages immediately while the commands are executed. When complete any results are sent back to the client as usual.

Given that a new thread is created for each set of commands executed it is not recommended to simply set long running to true for every command. You will need to judge whether any given set of commands may execute for an extended period and set the option accordingly. Examples of potentially long running command include any which involve saving scenes or scene elements to disk or rendering images outside of a render loop. Scene loading is also an example of a typically long running command. However this usually occurs at the start of a session when no other operations need to be run, so typically does not need to be marked as long running.

Note that commands executed on a {@link RS.Stream} do not suffer from this problem as they are already executed in the separate render loop thread between renders. Consequently those methods do not support this option. However the queuing of such commands onto the render loop will be blocked by any commands running on {@link RS.Service} that have not been marked as long running.
