Unfortunately there is no simple migration path from the legacy client library to the modern. The library structure and concepts have changed too drastically to simply rename a few functions and classes and all will work. In fact, the only API that has not changed is the {@link RS.Command} class, but that only ever consisted of a constructor anyway.

This migration document operates more at the conceptual level, mostly describing how features of the legacy library translate into the new one.

## Command State

The legacy client library has an extensive command state system which allowed the user to add persistent state information to each command request. The system was flexible enough to support all the features used by server side state handlers (via URL path prefixes or HTTP headers) or for vanilla RealityServer&reg; installations by specifying state commands that were prefixed to each command set.

In practise however the only use made of this system was to prefix a `use_scope` command at the start of each command set to ensure it was running in the user's session scope.

Therefore the state system has been reduced to simply allowing for a default scope to be specified via {@link RS.Service#default_scope_name}.

In the legacy library we would first create the required scopes then create a state data object to set on the service:

```
var stateData = new com.mi.rs.StateData(null, null, [new com.mi.rs.Command("use_scope", {scope_name:userScope})]);
service.defaultStateData = stateData;
```

In the modern library we simply set the scope name onto the service and it will deal with setting up the `use_scope` command internally:

```
service.default_scope_name = userScope;
```

In many cases performing even this step isn't required as most commands are executed on {@link RS.Stream} rather than the {@link RS.Service}. All commands executed on {@link RS.Stream} are automatically executed in the scope of the stream's render loop, which is usually the user scope, so explicit scope management is not required.


## Batch Commands

Applications using the legacy client library typically made much use of `batch_command` to group a sequence of commands together to ensure they were called in a single request. So much so that calls to `batch_command` were abstracted out to the `com.mi.rs.BatchCommand` class and responses from this were specifically separated out internally to make response management easier.

However `batch_command` has little use in the WebSocket based command system as the underlying framework supports command batching as a first class feature (actually, the old library had native batching as well but it wasn't used very much). Additionally, `batch_command` has numerous limitations, not least that it could not handle returning binary data. Even native batching in the legacy library could not directly return mixed binary data and text data due to the limitations of JSON-RPC. So complex command handling was required by both the user and the underlying library to separate out commands that returned different data types.

Use of `batch_command` is possible it is strongly discouraged. The {@link RS.Command_queue} class provides the same command sequencing functionality in a more user friendly manner. {@link RS.Command_queue} instances can be created using either {@link RS.Service#queue_commands} or {@link RS.Stream#queue_commands}.

## Render Commands

The legacy library had specific `com.mi.rs.RenderCommand` classes to identify commands that rendered images separately from those that returned JSON-RPC results. Given that the underlying system supports mixed binary and text data natively this distinction is no longer required.

## addCallback

`com.mi.rs.RSService.addCallback` provides a number of levels of functionality in the legacy library. The first is the native command batching mentioned above which has been replaced by {@link RS.Command_queue}. The second was part of the browser connection limit management system. Even today web browsers limit how many parallel connections can be made to the same web server. When the legacy library was developed this limit was around 2 connections. So having a render request and a command running simultaneously would saturate the allowance. This was problematic as it was often necessary to send keep alive commands to ensure render loops were not shutdown prematurely. If all connections were taken up by service commands these would get delayed and rendering could be lost.

To mitigate this the legacy library limited itself to a single connection to RealityServer. If commands were added to the service while other commands were executing they would be queued up and sent once execution completed. Alternatively, `addCallback` could be called and passed a function. This function would be called once any current execution was complete and commands then added at a time when we knew the connection was idle.

Given that the WebSocket system does not suffer from this connection limit problem there is no need for `addCallback` type functionality. Commands sent or executed via the {@link RS.Service}, {@link RS.Stream} or {@link RS.Command_queue} get sent immediately.

There was a useful side effect property of `addCallback` however which was greatly effective when using mouse interaction to navigate a scene. When dragging the mouse many matrix update events occur and if a command was queued for each one you could easily end up with hundreds of `instance_set_world_to_obj` calls waiting to execute once the connection was clear. And only the last one of these was important since all the earlier ones get overwritten by the latter. Using `addCallback` you could simply register a callback function on mouse move, and once the service was ready to send commands read the current camera location from state and send a single `instance_set_world_to_obj` command.

There is no equivalent functionality in the new API. If a similar system is required implementing a debounce system would be fairly straightforward.

## Command Debugging

Command debugging in the legacy API was fairly straightforward, simply open your browser console and watch the JSON-RPC requests go back and forth. Things are not so simple with all commands going over a binary WebSocket connection however so the client library offers two different forms of command debugging. 

### Developer Console debugging

The Chrome debugger does allow WebSocket packet inspection but binary packets are still generally opaque. Setting {@link RS.Service#debug_commands} to `true`  activates text mode and all commands and responses are then sent as JSON text packets rather than binary where possible. You can then inspect these in the console to see what is going back and forth.

### Request/Response events

More detailed inspection can be enabled by setting {@link RS.Service#log_commands} to `true`. When this is enabled, {@link RS.Service} will emit {@link RS.Service#event:command_requests} and {@link RS.Service#event:command_results} events for every set of commands that are executed over the service. Event handlers can then log or parse these as necessary to resolve problems.

Note that it is not recommended to enable either of these in production systems. For the former the text based requests are much larger than their binary equivalents. For the latter you will get responses sent for every single request made, not just the ones for which you have requested results.

