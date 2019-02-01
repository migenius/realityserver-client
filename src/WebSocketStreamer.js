/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/
const WebSocketMessageReader = require('./WebSocketMessageReader');
const WebSocketMessageWriter = require('./WebSocketMessageWriter');
const StateData = require('./StateData');
const RenderLoopStateData = require('./RenderLoopStateData');
const Response = require('./Response');
const RenderedImageHandler = require('./RenderedImageHandler');

let sequence_id=0;

const now_function = function(){
  try {
    if (window && window.performance && performance.now) {
      return function() { return performance.now() / 1000; }
    }
  } catch(e) {
    try {
      if (process && process.hrtime) {
        return function()
        {
            const time = process.hrtime();
            return time[0] + time[1] / 1e9;
        }
      }
    } catch(e) {}
  }
  return function() { return Date.now() / 1000; };
  }();

let websocket_impl = function() {
  try {
    return window ? window.WebSocket : undefined;
  } catch(e) {}
  return undefined;
}();

/**
 * @file WebSocketStreamer.js
 * This file contains the WebsocketStreamer class.
 */
 
/**
 * @class WebSocketStreamer
 * The WebSocketStreamer class provides the same functionality as
 * the RSService except it operates over a Web Socket connection
 * rather than HTTP. It is essetially a drop in replaceent for
 * RSService and additionaly provides streaming of rendered
 * images from a render loop. This allows for push based image
 * updates rather than the polling system required in HTTP.
 * <p>This documentation should be read in conjuction with the
 * RSService documentations which provides an overall description
 * of the service functionality.</p> 
 */
   
/**
 * @ctor
 * Creates a WebSocketStreamer object that can stream images from a
 * render loop. Throws if web sockets are not supported by the browser.
 */
class WebsocketStreamer {
  constructor(defaultStateData) {
    if(!defaultStateData)
        this.defaultStateData = new StateData();
    else
        this.defaultStateData = defaultStateData;

    this.binary_commands = true;

    this.m_general_error_handler = this.on_default_general_error;
    this.m_response_error_handler = this.on_default_response_error;
    this.m_callback_error_handler = this.on_default_callback_error;

    this.catchHandlers = true;
  }

  /**
   * @public StateData|RenderLoopStateData
   * The default state data for this WebSocketStreamer instance. If no state
   * data is specified in the addCommand and addCallback methods,
   * then this is the state data that will be used. If this is set
   * to an instance of RenderLoopStateData then all commands
   * will be executed on the render loop. It is the user's responsibility
   * to ensure that the render loop exists in this case.
   */
  //defaultStateData = undefined;

  /**
   * @public String
   * Returns the name of the current connector. The connector
   * encapsulates the on-the-wire protocol used to process
   * commands. Currently one connector is available:<p>
   * "WS" - Commands are processed using WebSocket requests.<br>
   */
   get connectorName() { return 'WS'; }

  /**
   * @static WebsocketStreamer
   * By default calls to user callbacks are wrapped in try/catch
   * blocks and if they error the appropriate error handler is
   * called. Disabling this can be useful during development as
   * when there is an error in a callback handler, the stack is lost.
   * Set this to true to unwrap the handler calls.
   */
  //catchHandlers = true;

  /**
   * @private
   * @static WebsocketStreamer
   * Command sequence id used to identify when the results of a
   * command appear in a render.
   */
  static get sequence_id() { return sequence_id; }

  static set sequence_id(value) { sequence_id = value; }

  /** static WebsocketStreamer
   * Sets the WebSocket implementation to use. This must implement the
   * W3C WebSocket API specification
   */
  static set websocket(value) { websocket_impl = value;  }
  
  /**
   * @static WebsocketStreamer
   * Returns whether web sockets are supported or not. This should be used to
   * test if web sockets are available before attempting to use them.
   */
  static supported() {
      return !!websocket_impl;
  }

  /**
   * @static WebsocketStreamer
   * Returns a timestamp in seconds
   */
  static now() {
      return now_function();
  };
  // The strange construct above is so the documentation system picks up the now
  // function. Don't ask, just accept that there's an anonymous function that returns
  // the actual function to use and move on.


  /*
   * Protocol message IDs
  */
  static get MESSAGE_ID_IMAGE() { return              0x01};
  static get MESSAGE_ID_IMAGE_ACK() { return          0x02};
  static get MESSAGE_ID_TIME_REQUEST() { return       0x03};
  static get MESSAGE_ID_TIME_RESPONSE() { return      0x04};
  static get MESSAGE_ID_COMMAND() { return            0x05};
  static get MESSAGE_ID_RESPONSE() { return           0x06};
  static get MESSAGE_ID_PREFER_STRING() { return      0x07};

  /**
   * Connects to a web socket server and performs initial handshake to ensure 
   * streaming functionality is available.
   * @param url String The web service URL to connect to. Typically of the form
   * ws[s]://HOST::PORT/render_loop_stream/
   * @param onReady Function Called when the web socket is ready to be used. Takes no
   * parameters.
   * @param onError Function Called if there is an error connecting to the URL. Takes one
   * optional parameter detailing the error.
   */
  connect( url, onReady, onError, extra_connect_args )
  {
      // if url is a string then make a websocket and connect. otherwise we assume it's already
      // an instance of a W3C complient web socket implementation. 
      if (url !== undefined  && url !== null && url.constructor === String) {
        if (!WebsocketStreamer.supported()) {
            if (onError) onError('Websockets not supported.');
            return;
        }
        try {
            if (extra_connect_args) {
              this.web_socket = new websocket_impl( ...[url, undefined].concat(Array.isArray(extra_connect_args) ? extra_connect_args : [extra_connect_args]));
            } else {
              this.web_socket = new websocket_impl(url);
            }
        } catch (e) {
            if (onError) onError(e);
            return;
        }
      } else {
        this.web_socket = url;
      }
      this.protocol_state = 'prestart';
      this.web_socket_littleendian = true;
      this.command_id = 0;
      this.response_handlers = {};
      this.streaming_loops = {};
      this.protocol_version = 0;
      this.web_socket.binaryType = 'arraybuffer';

      var scope = this;
       
      this.web_socket.onopen = function (event) {
      };
      this.web_socket.onclose = function(event) {
        /*
        var code = event.code;
        var reason = event.reason;
        var wasClean = event.wasClean;
        console.log('closed: ' + code + ' ' + reason + ' ' + wasClean);
        */
      };
      this.web_socket.onerror = function(err) {
        if (onError) onError(err);
      };

      function process_response(response) {
          if (scope.response_handlers[response.id] !== undefined) {
              var handler_scope = scope.response_handlers[response.id].scope;
              if (handler_scope === undefined) {
                  handler_scope = scope;
              }
              scope.response_handlers[response.id].handler.call(handler_scope,response);
              delete scope.response_handlers[response.id];
          }
      }
      function web_socket_stream(event) {
          if (event.data instanceof ArrayBuffer) {
              // Got some binary data, most likely an image, let's see now.
              var time_sec = WebsocketStreamer.now();
              var data = new DataView(event.data);
              var message = data.getUint32(0,scope.web_socket_littleendian);
              if (message == WebsocketStreamer.MESSAGE_ID_IMAGE) {
                  // yup, an image
                  var img_msg = new WebSocketMessageReader(data,4,scope.web_socket_littleendian);
                  var header_size = img_msg.getUint32();
                  if (header_size != 16) {
                      // not good
                      if (onError) onError('Invalid image message size.');
                      return;
                  }
                  var image_id = img_msg.getUint32();
                  var result = img_msg.getSint32();
                  // render loop name
                  var render_loop_name = img_msg.getString();
                  if (scope.streaming_loops[render_loop_name] === undefined) {
                      // nothing to do, no handler
                      return;
                  }

                  if (result >= 0) {
                      // should have an image
                      var have_image = img_msg.getUint32();
                      if (have_image == 0) {
                          // got an image
                          var img_width = img_msg.getUint32();
                          var img_height = img_msg.getUint32();
                          var mime_type = img_msg.getString();
                          var img_size = img_msg.getUint32();
                          // and finally the image itself
                          var image = img_msg.getUint8Array(img_size);

                          // then any statistical data
                          var have_stats = img_msg.getUint8();
                          var stats;
                          if (have_stats) {
                              stats = img_msg.getTypedValue();
                          }
                          if (scope.streaming_loops[render_loop_name].lastRenderTime) {
                              stats['fps'] = 1 / (time_sec-scope.streaming_loops[render_loop_name].lastRenderTime);
                          }
                          scope.streaming_loops[render_loop_name].lastRenderTime = time_sec;
                          var data = {
                              result: result,
                              width: img_width,
                              height: img_height,
                              mime_type: mime_type,
                              image: image,
                              statistics : stats
                          };
                          if (stats.sequence_id > 0) {
                              while (scope.streaming_loops[render_loop_name].command_handlers.length &&
                                      scope.streaming_loops[render_loop_name].command_handlers[0].sequence_id <= stats.sequence_id) {
                                  var handler = scope.streaming_loops[render_loop_name].command_handlers.shift();
                                  for (var i=0;i<handler.handlers.length;i++) {
                                      call_callback.call(
                                          scope,
                                          handler.handlers[i],
                                          scope.on_general_error,
                                          data);
                                  }
                              }
                          }
                          if (!scope.streaming_loops[render_loop_name].pause_count) {
                              if (scope.streaming_loops[render_loop_name].renderHandler) {
                                  scope.streaming_loops[render_loop_name].renderHandler.imageRendered(data.image,data.mime_type);
                              }
                              if (scope.streaming_loops[render_loop_name].onData) {
                                  scope.streaming_loops[render_loop_name].onData(data);
                              }
                          }
                      }
                  } else {
                      if (!scope.streaming_loops[render_loop_name].pause_count && scope.streaming_loops[render_loop_name].onData) {
                          scope.streaming_loops[render_loop_name].onData({
                              result: result                                      
                          });
                      }
                  }
                  // send ack
                  var buffer = new ArrayBuffer(16);
                  var response = new DataView(buffer);
                  response.setUint32(0,WebsocketStreamer.MESSAGE_ID_IMAGE_ACK,scope.web_socket_littleendian); // image ack
                  response.setUint32(4,image_id,scope.web_socket_littleendian); // image id
                  response.setFloat64(8,time_sec,scope.web_socket_littleendian);
                  scope.web_socket.send(buffer);
              } else if (message == WebsocketStreamer.MESSAGE_ID_TIME_REQUEST) {
                  // time request
                  var buffer = new ArrayBuffer(12);
                  var response = new DataView(buffer);
                  response.setUint32(0,WebsocketStreamer.MESSAGE_ID_TIME_RESPONSE,scope.web_socket_littleendian); // time response
                  response.setFloat64(4,time_sec,scope.web_socket_littleendian);
                  scope.web_socket.send(buffer);
              } else if (message == WebsocketStreamer.MESSAGE_ID_RESPONSE) {
                  var response_msg = new WebSocketMessageReader(data,4,scope.web_socket_littleendian);
                  var id = response_msg.getTypedValue();
                  var response = response_msg.getTypedValue();
                  response.id = id;
                  if (response.id !== undefined) {
                      process_response(response);
                  }
              }
          } else {
              var data = JSON.parse(event.data);
              if (data.id !== undefined) {
                  process_response(data);                
              }
          }
      }

      function web_socket_handshaking(event) {
          if (event.data instanceof ArrayBuffer) {
              var data = new DataView(event.data);
              // validate header
              var hs_header = String.fromCharCode(data.getUint8(0),data.getUint8(1),data.getUint8(2),data.getUint8(3),data.getUint8(4),data.getUint8(5),data.getUint8(6),data.getUint8(7));
              if (hs_header != 'RSWSRLIS') {
                  // not good
                  scope.web_socket.close();
              } else {
                  // check that the protcol version is acceptable
                  const protocol_version = data.getUint32(8,scope.web_socket_littleendian);
                  if (protocol_version < 1 || protocol_version > 2) {
                      // unsupported protocol, can't go on
                      if (onError) onError('Sever protocol version not supported');
                      scope.web_socket.close();                    
                  } else {
                      // all good, we support this, enter started mode
                      scope.protocol_version = protocol_version;
                      scope.protocol_state = 'started';
                      scope.web_socket.onmessage = web_socket_stream;
                      if (onReady) onReady();
                  }
              }
          } else {
              scope.web_socket.close();
              if (onError) onError('unexpected data during handshake');
          }
      }
      function web_socket_prestart(event) {
          // expecting a handshake message
          if (event.data instanceof ArrayBuffer) {
              var time_sec = WebsocketStreamer.now();
              if (event.data.byteLength != 40) {
                  if (onError) onError('Invalid handshake header size');
                  return;
              }
              var data = new DataView(event.data);
              // validate header
              var hs_header = String.fromCharCode(data.getUint8(0),data.getUint8(1),data.getUint8(2),data.getUint8(3),data.getUint8(4),data.getUint8(5),data.getUint8(6),data.getUint8(7));
              if (hs_header != 'RSWSRLIS') {
                  // not good
                  scope.web_socket.close();
                  if (onError) onError('Invalid handshake header');
              } else {
                  scope.web_socket_littleendian = data.getUint8(8) == 1 ? true : false;
                  const protocol_version = data.getUint32(12,scope.web_socket_littleendian);
                  if (protocol_version < 1 || protocol_version > 2) {
                      // unsupported protocol, let's ask for what we know
                      protocol_version = 2;
                  }
                  // get server time
                  var server_time = data.getFloat64(16,scope.web_socket_littleendian);
                  scope.protocol_state = 'handshaking';

                  var buffer = new ArrayBuffer(40);
                  var response = new DataView(buffer);
                  for (var i=0;i<hs_header.length;++i) {
                      response.setUint8(i,hs_header.charCodeAt(i));
                  }
                  response.setUint32(8,protocol_version,scope.web_socket_littleendian);
                  response.setUint32(12,0,scope.web_socket_littleendian);
                  response.setFloat64(16,time_sec,scope.web_socket_littleendian);
                  for (var i=0;i<16;++i) {
                      response.setUint8(i+24,data.getUint8(i+24),scope.web_socket_littleendian);
                  }
                  scope.web_socket.onmessage = web_socket_handshaking;
                  scope.web_socket.send(buffer);
              }
          } else {
              if (onError) onError('unexpected data during handshake');
          }
      }
      this.web_socket.onmessage = web_socket_prestart;
  }

  close() {
    this.web_socket.close();
    this.web_socket = undefined;
  }

  /**
   * @private
   * Sends a command over the websocket connection
   * @param command String The command to send
   * @param args Object The commands arguments
   * @param handler Function The function to call with the command's results
   * @param scope Object scope in which to call handler
   */
  send_command(command, args, handler, scope)
  {
      var command_id = handler !== undefined ? this.command_id : undefined;
      if (command_id !== undefined) {
          this.response_handlers[command_id] = { handler: handler, scope: scope };
          this.command_id++;
      }
      var payload = {
          command: command,
          arguments: args,
          id : command_id
      };

      if (this.binary_commands && this.protocol_version > 1) {
          var buffer = new WebSocketMessageWriter(this.web_socket_littleendian);
          buffer.pushUint32(WebsocketStreamer.MESSAGE_ID_COMMAND);
          buffer.pushTypedValue(payload);
          buffer = buffer.finalise();
          this.web_socket.send(buffer);
      } else {
          this.web_socket.send(JSON.stringify(payload));    
      }
  }

  /**
   * Begins streaming images from a render loop over the web socket connection. A single web socket connection
   * can stream from multiple render loops simultaneously however a given render loop can only be streamed once
   * over a given web socket.
   * @param renderLoop String|Object If a string then the name of the render loop to stream. If an Object
   * then must contain a 'render_loop_name' property with the name of the render loop to stream. Other supported 
   * properties are 'image_format' (String) to specify the streamed image format and 'quality' (String) to control
   * the image quality
   * @param renderHandler RenderedImageHandler Optional. If provided then images streamed from the render loop
   * will automatically be displayed on this render target.
   * @param onResponse Function If supplied then this is called with the response to the stream request. Response
   * will be true on success.
   * @param onData Function If supplied then this is called every time an image is returned and receives the image
   * and rendering statistics.
   * @param onError Function If supplied then this is called if there is an error starting the stream.
   */
  stream(renderLoop, renderHandler, onResponse, onData, onError)
  {
      if (!this.web_socket) {
          if (onError) onError('Web socket not connected.');
          return;
      }
      if (this.protocol_state != 'started') {
          if (onError) onError('Web socket not started.');
          return; 
      }
      if (! (renderHandler instanceof RenderedImageHandler)) {
          onError = onData;
          onData = onResponse;
          onResponse = renderHandler;
          renderHandler = undefined;
      }

      var scope = this;

      if (typeof renderLoop === 'string' || renderLoop instanceof String) {
          renderLoop = {
              render_loop_name : renderLoop
          }
      }

      function start_stream_response(response) {
          if (response.error) {
              if (onError) onError(response.error.message);
          } else {
              scope.streaming_loops[renderLoop.render_loop_name] = {
                  renderHandler: renderHandler,
                  onData: onData,
                  command_handlers: [],
                  pause_count: 0
              };
              if (onResponse) onResponse(response.result);
          }
      }
      // always use the handler since it makes no sense to start a stream without something to deal with it
      this.send_command('start_stream',renderLoop,start_stream_response);
  }
      
  /**
   * Sets parameters on a stream.
   * @param parameters Object The parameter to set. Must contain a 'render_loop_name' property with the name of
   * the render loop to set parameters for. Supported parameters are 'image_format' (String) to specify the
   * streamed image format and 'quality' (String) to control the image quality
   * @param onResponse Function If supplied then this is called with the response to the set parameter request.
   * @param onError Function If supplied then this is called if there is an error setting parameters.
   */
  set_stream_parameters(parameters, onResponse, onError)
  {
      if (!this.web_socket) {
          if (onError) onError('Web socket not connected.');
          return;
      }
      if (this.protocol_state != 'started') {
          if (onError) onError('Web socket not started.');
          return; 
      }

      function set_stream_response(response) {
          if (response.error) {
              if (onError) onError(response.error.message);
          } else {
              if (onResponse) onResponse(response.result);
          }
      }

      this.send_command('set_stream_parameters',parameters,onResponse || onError ? set_stream_response : undefined);
  }
  /**
   * Stops streaming from a render loop
   * @param renderLoop String The name of the render loop to stop streaming.
   * @param onResponse Function If supplied then this is called with the response to the set parameter request.
   * @param onError Function If supplied then this is called if there is an error setting parameters.
   */
  stop_stream(renderLoop, onResponse, onError)
  {
      if (!this.web_socket) {
          if (onError) onError('Web socket not connected.');
          return;
      }
      if (this.protocol_state != 'started') {
          if (onError) onError('Web socket not started.');
          return; 
      }

      if (typeof renderLoop === 'string' || renderLoop instanceof String) {
          renderLoop = {
              render_loop_name : renderLoop
          }
      }
      
      var scope = this;

      function stop_stream_response(response) {
          if (response.error) {
              if (onError) onError(response.error.message);
          } else {
              delete scope.streaming_loops[renderLoop.render_loop_name]; 
              if (onResponse) onResponse(response.result);
          }
      }

      this.send_command('stop_stream',renderLoop,stop_stream_response);
  }

  /**
   * Pauses display of images from a render loop. Note the images are still transmitted from
   * the server, they are just not dispayed. Pause calls are counted so you need to call resume_display
   * 
   * @param renderLoop String The name of the render loop to pause display for.
   * @return the pause count, IE: the number of times resume_display will need to be called to
   * start displaying images again. Returns -1 if web socket isn't started or \p renderLoop cannot
   * be found.
   */
  pause_display(renderLoop)
  {
      if (!this.streaming_loops[renderLoop]) {
          return -1;
      }
   
      return ++this.streaming_loops[renderLoop].pause_count;
  }

  /**
   * Resumes display of images from a paused render loop if the pause count has reduced to \c 0.
   * 
   * @param renderLoop String The name of the render loop to resume display for.
   * @param force Boolean If \c true then forces display to resume regardless of the pause count.
   * @return the pause count, IE: the number of times resume_display will need to be called to
   * start displaying images again. Returns -1 if web socket isn't started or \p renderLoop cannot
   * be found.
   */
  resume_display(renderLoop,force)
  {
      if (!this.streaming_loops[renderLoop]) {
          return -1;
      }
      
      if (this.streaming_loops[renderLoop].pause_count > 0) {
          if (force) {
              this.streaming_loops[renderLoop].pause_count = 0;
          } else {
              this.streaming_loops[renderLoop].pause_count--;
          }
      }

      return this.streaming_loops[renderLoop].pause_count;
  }

  /**
   * Returns the pause count for the given render loop. 
   * 
   * @param renderLoop String The name of the render loop to resume display for.
   * @return the pause count. When evaluated in a truthy way will be \c true if
   * paused and ]c false if not
   */
  is_dispay_paused(renderLoop)
  {
      if (!this.streaming_loops[renderLoop]) {
          return false;
      }
      
      return this.streaming_loops[renderLoop].pause_count;
  }

  /**
   * Returns \c true if we are currently streaming the given render loop.
   * @param renderLoop String The name of the render loop to check.
   */
  streaming(renderLoop)
  {
      return !!this.streaming_loops[renderLoop];
  }

  /**
   * Updates the camera. The \p data parameter specifies the camera data to set and is 
   * defined as follows:
   * @code
   * {
   *     camera : {
   *       name: String - the camera name to set (required if camera supplied)
   *       aperture: Number - The aperture width of the camera. (optional)
   *       aspect: Number - The aspect ratio of the camera. (optional)
   *       clip_max: Number - The yon clipping distance. (optional)
   *       clip_min: Number - The hither clipping distance. (optional)
   *       focal: Number - The focal length to set. (optional)
   *       frame_time: Number - The frame time of the camera, in seconds. (optional)
   *       offset_x: Number - The horizontal plane shift. (optional)
   *       offset_y: Number - The vertical plane shift. (optional)
   *       orthographic: Boolean - If the camera is orthographic or not. (optional)
   *       resolution_x: Number - The width of the camera. (optional)
   *       resolution_y: Number - The height of the camera. (optional)
   *       window_xh: Number - The right edge of the render sub-window in raster space. (optional)
   *       window_xl: Number - The left edge of the render sub-window in raster space. (optional)
   *       window_yh: Number - The top edge of the render sub-window in raster space. (optional)
   *       window_yl: Number - The bottom edge of the render sub-window in raster space. (optional)
   *       attributes: { Object - attributes to set on the camera. (optional)
   *           attribute_name: { Keys are the attribute names to set.
   *               type: String - The Iray typename of the attribute.
   *               value: Varies - The value of the attribute.
   *           }   
   *       }
   *     },
   *     camera_instance : {
   *       name: String - The camera isntance name to set (required if camera_instance supplied)
   *       transform: Object - The camera instance transform to set in the same format as Float64<4,4>. (optional)
   *       attributes: Object - Attributes to set on the camera instance, format is the same as on the camera. (optional)
   *     }
   * }
   * @endcode
   * @param renderLoop String The name of the render loop to change the camera on.
   * @param data Object object specifying the camera to update. Supported format is:
   * @param onResponse Function If supplied then this is called with the response to the set parameter request.
   * @param onError Function If supplied then this is called if there is an error setting parameters.
   */
  update_camera(renderLoop, data, onResponse, onError)
  {
      if (!this.web_socket) {
          if (onError) onError('Web socket not connected.');
          return;
      }
      if (this.protocol_state != 'started') {
          if (onError) onError('Web socket not started.');
          return; 
      }

      if (!data) {
          if (onError) onError('No data object provided.');
          return;    
      }

      if (typeof renderLoop === 'string' || renderLoop instanceof String) {
          renderLoop = {
              render_loop_name : renderLoop
          }
      }
      renderLoop.camera = data.camera;
      renderLoop.camera_instance = data.camera_instance;

      function update_camera_response(response) {
          if (response.error) {
              if (onError) onError(response.error.message);
          } else {
              if (onResponse) onResponse(response.result);
          }
      }

      this.send_command('set_camera',renderLoop,onResponse || onError ? update_camera_response : undefined);
  }

  /**
   * Adds a command to be processed. The service guarantees that
   * all added commands will be processed and any response handler will
   * always be called regardless of if previous commands experience
   * errors. Note however that if commands using regular StateData
   * and RenderLoopStateData are intermixed then commands will
   * not necessarily be executed in the order they were added. This is also
   * the case if commands are executed on different render loops.
   * <p>
   * Note that adding commands using this method is equivalent to
   * registering a process commands callback and adding commands
   * when the process commands callback is made. This means that any
   * callbacks already registered will be executed before the command
   * (or commands if the \p delayProcessing flag is used) added using this
   * method.
   * <p>
   * Example: Adding commands A, B, and C with delayProcessing set to
   * true for A and B, but false for C will be equivalent to register a
   * callback and add A, B, and C when the callback is made.
   *
   * @param cmd com::mi::rs:Command The command to add.
   *
   * @param options Object Optional. If specified, this provides options
   * for this command. Supported properties are:
   *   - responseHandler: A function or object giving the handler to call
   *                       with the response to this command. The object passed
   *                       to the handler will have the type Response
   *                       and can be used to check if the command succeeded and
   *                       to access any returned data. See below for supported
   *                       handler types.
   *   - renderedHandler: If this command is to be executed on a streaming 
   *                       render loop then this handler will be called when
   *                       the first image that contains the results of this
   *                       command is about to be displayed. The object passes
   *                       to the handler will be the same as what is passed
   *                       to the #stream \c onData handler. See below for supported
   *                       handler types.
   * <p>A handler is either a function or a callback object of the form
   * \c "{method:String, context:Object}".
   * In the first form the function will be called in the context of the
   * global object meaning that \c this will refer to the global
   * object. The second form will call the function with the name given
   * by the \c method member in the context of the object given by the
   * \c context member. If the callback object is specified as
   * {method:"myMethod", context:someObject} the call made will be
   * someObject["myMethod"](arg).</p>
   * <p>For backwards compatibility \c options can be passed a handler directly
   * in which case it will be called as the responseHandler.</P 
   *
   * @param stateData StateData|RenderLoopStateData Optional.
   * The state data to use. If null or omitted the default state data will be
   * used as specified in the constructor.
   *
   * @param delayProcessing Boolean A hint that tells the service not to try to send the
   * command immediately. This hint is useful when adding a sequence
   * of commands in one go. Specifying this flag to true for all
   * commands except the last one added will ensure that the Service
   * don't start processing the events immediately, but holds
   * processing until the last command in the sequence has been added.
   **/
  addCommand(cmd, options, stateData, delayProcessing)
  {
      if (this.protocol_version < 2) {
          throw "Command execution not supported on the server."
      }

      // normalise and process options
      options = options || {};
      if(typeof options === "function") {
          options = {
              responseHandler: options
          }
      } else {
          if (options.context && options.method) {
              options = {
                  responseHandler: options
              }
          }      
      }
      if (!options.stateData) {
          options.stateData = stateData;
      }
      if (options.delayProcessing === undefined) {
          options.delayProcessing = delayProcessing;
      }

  //    alert("addCommand called with cmd: " + cmd + " options: " + (options != null) + " delayProcessing: " + delayProcessing);
      var queue;
      if (this.processing_queue !== undefined) {
          // state is already setup and we just add the command to the specified queue
          queue = this.processing_queue;
          // we're already executing so make sure we don't call it again
          delayProcessing = true;
      } else {
          // If no state data is defined, use the default state data. Also make a
          // rudimentary check to see that the stateData implements the StateData
          // interface
          if(!options.stateData)
              options.stateData = this.defaultStateData
          else if( (typeof options.stateData !== "object") || (options.stateData.stateCommands === undefined && options.stateData.renderLoopName === undefined) )
              throw new String("WebSocketStreamer.addCommand called but stateData was not of the correct type or didn't implement a StateData interface. type: " + (typeof options.stateData));

          // prep the command queue
          this.prepare_command_queue(options.stateData,false);
          queue = this.command_queue[this.command_queue.length - 1];
      }

      // Add the command to the current service callback.
      queue.commands.push(cmd);

      if (options.renderedHandler) {
          queue.renderHandlers.push(options.renderedHandler);
      }

      if(cmd.renderTarget instanceof RenderedImageHandler) {
          // is a render command, ensure we have a response handler for it
          // to update the render target
          options.responseHandler = {
              method: "handle_render_target",
              context: {
                  callback: options.responseHandler,
                  handle_render_target: WebsocketStreamer.handle_render_target, // need to have the function on the context
                  service: this
              }
          }
      }
      if (options.responseHandler) {
          var response_handlers = queue.responseHandlers
          response_handlers.length = queue.commands.length;
          response_handlers[response_handlers.length-1] = options.responseHandler;
      }
      // If processing shouldn't be delayed then execute the command queue
      if(options.delayProcessing !== true)
      {
          this.execute(this.command_queue);
          delete this.command_queue;
      }

  }


  /**
   * @private
   * Calls a callback passing remaining arguments to the callback
   * \param callback Function|Object the callback to call
   */
  static do_call_callback(callback)
  {
      if (callback) {
          if(typeof callback === "function")
              callback.apply(undefined,Array.prototype.slice.call(arguments, 1));
          else
          {
              if(typeof callback.context[callback.method] !== "function")
                  throw new String("Failed to call response handler method \"" + callback.method + "\" on context " + callback.context + ". Method does not exist.");
              callback.context[callback.method].apply(callback.context,Array.prototype.slice.call(arguments, 1));        
          }
      }
  }

  /**
   * @private
   * Calls a callback passing remaining arguments to the callback
   * \param callback Function|Object the callback to call
   * \param error_handler function to call if error is thrown
   */
  call_callback(callback, error_handler)
  {
      var callback_args = [callback].concat(Array.prototype.slice.call(arguments, 2));
      if (WebsocketStreamer.catchHandlers)
      {
          try
          {
              WebsocketStreamer.do_call_callback.apply(this,callback_args);
          }
          catch(e)
          {
              //alert("Exception caught in process commands callback handler: " + e);
              if (typeof error_handler === "function") {
                  error_handler.call(this,e);
              }
          }
      }
      else
      {
          WebsocketStreamer.do_call_callback.apply(this,callback_args);
      }
  }

  /**
   * @private
   * Response handler for sending images to render targets
   */
  static handle_render_target(response)
  {
      var render_cmd = response.command;
      if (response.isErrorResponse) {
          // call user callback with the error, needs to be called with service as this
          call_callback.call(this.service,this.callback,this.service.on_response_error,response);
          return;
      }
      // response should be a binary
      if (!response.result.data instanceof Uint8Array || !response.result.mime_type || response.result.mime_type.constructor !== String) {
          call_callback.call(this.service,this.callback,this.service.on_response_error,new Response(render_cmd,{error:{code:-2, message:"Render command did not return a binary result."}}));
          return;
      } 
      // looks good
      const render_target = render_cmd.renderTarget;
      render_target.imageRendered(response.result.data, response.result.mime_type);

      call_callback.call(this.service,this.callback,this.service.on_response_error,new Response(render_cmd,{result:{}}));
  }

  /**
   * <p>Adds a callback to the end of the callback queue. The callback
   * will be made as soon as a callback or command is added with
   * \p delayProcessing set to true. Callbacks will
   * always be made in the order they were registered with the
   * service, so if callback A is added before callback B, then A
   * will be called before B and consequently any commands added by
   * A will be processed before any commands added by B.</p>
   *
   * <p>Callbacks are one-shot, meaning that a callback needs to be
   * registered every time the application needs to process commands.
   * The same callback can only be registered once at a time. The
   * application is responsible for keeping track of any user input
   * that occurs while waiting for the callback and convert that
   * user input into an optimized sequence of commands. The same
   * callback function can be added again as soon as it has been
   * called or cancelled.</p>
   *
   * <p>NOTE: When the callback is made the supplied CommandSequence
   * instance must be used to add the commands, not
   * WebSocketStreamer.addCommand().</p>
   *
   * @param callback Object The callback. This is either a function or
   * a callback object of the form {method:String, context:Object}.
   * In the first form the function will be called in the context of the
   * global object meaning that the this pointer will refer to the global
   * object. The second form will call the function with the name given
   * by the "callback" memeber in the context of the object given by the
   * context member. In the example {method:"myMethod",
   * context:someObject} the call made will be someObject["myMethod"](seq).
   * The callback function (regardless of which form is used when
   * registering the callback) will be called with a single argument
   * which is the CommandSequence to which commands should be added
   * using the addCommand(cmd, responseHandler) method.
   *
   * @param stateData StateData|RenderLoopStateData Optional. The state data to use. If null or omitted
   * the default state data will be used as specified in the constructor.
   *
   * @param delayProcessing Boolean Optional. This flag instructs the
   * service if it should delay processing of the added callback or not.
   * Defaults to false which is recommended in most cases.
   */
  addCallback(callback, stateData, delayProcessing)
  {
      if (this.protocol_version < 2) {
          throw "Command execution not supported on the server."
      }
      if(callback == null || callback == undefined)
          throw new String("WebSocketStreamer.addCallback called but callback was not defined or null.");

      if(typeof callback !== "function")
      {
          // check if it is a valid callback object
          if( (typeof callback.method !== "string") || (typeof callback.context !== "object"))
              throw new String("WebSocketStreamer.addCallback called but callback was not a function or callback object of the form {method:String, context:Object}.");
      }

      if (this.findCallback(callback)) {
          return;
      }

      // create a callback object to add to the command queue.
      if(!stateData)
          stateData = this.defaultStateData
      else if( (typeof stateData !== "object") || (stateData.stateCommands === undefined && stateData.renderLoopName === undefined) )
          throw new String("WebSocketStreamer.addCallback called but stateData was not of the correct type or didn't implement a StateData interface. type: " + (typeof stateData));

      this.prepare_command_queue(stateData,true);
      var queue_index = this.command_queue.length - 1;

      this.command_queue[queue_index].callbacks.push(callback);

      if(delayProcessing !== true)
      {
          this.execute(this.command_queue);
          delete this.command_queue;
      }
  }

  /**
   * Cancels a registered process commands callback. This call removes
   * the callback from the queue. Useful if the callback is no longer
   * needed, or if the callback needs to be moved to the end of the
   * queue. In the latter case, first cancelling and then adding the
   * callback makse sure that it is executed after any callbacks
   * already in the callback queue.
   * <p>Note that since the web socket service does not have a 
   * busy state cancelling callbacks is only possible if callbacks
   * are added in a delayed state.</p>
   *
   * @param callback Function The previously added callback function.
   *
   * @return Boolean true if the callback was cancelled, false if it was not
   *         in the queue.
   */
  cancelCallback(callback)
  {
      if (this.protocol_version < 2) {
          throw "Command execution not supported on the server."
      }
      if(callback == null || callback == undefined)
          throw new String("WebSocketStreamer.addCallback called but callback was not defined or null.");

      if(typeof callback !== "function")
      {
          // check if it is a valid callback object
          if( (typeof callback.method !== "string") || (typeof callback.context !== "object"))
              throw new String("WebSocketStreamer.addCallback called but callback was not a function or callback object of the form {method:String, context:Object}.");
      }
      var location = this.findCallback(callback);
      if (location) {
          this.command_queue[location[0]].splice(location[1],1);
          return true;
      }
      return false
  }

  /**
   * @private find the provided callback in the command queue. Returns undefined
   * if not found or a 2 element Array. The first is the index of the command object
   * in this.command_queue and the second is the index in callbacks of the callback. 
   * \param callback Object the callback to find
   */
  findCallback(callback)
  {
      if (this.command_queue === undefined) {
          return;
      }
      for (var i=0;i<this.command_queue.length;i++) {
          if (this.command_queue[i].callbacks) {
              var callbacks = this.command_queue[i].callbacks;
              for (var j=0;j<callbacks.length;j++) {
                  var curr = callbacks[j];
                  if(typeof callback === "function" && (curr === callback))
                      return [i,j];
                  else if( (callback.method !== null) && (callback.method !== undefined) && (callback.context !== null) && (callback.context !== undefined) && (curr.method === callback.method) && (curr.context === callback.context) )
                      return [i,j];
              }
          }
      }
  }

  /**
   * @private
   * Prepares the command queue so the final entry is suitable
   * for adding commands to
   * @param stateData StateData|RenderLoopStateData the state we are prepping for
   * @param forCallback Boolean \c true if preparing for a callback, \c false if for a command
   */
  prepare_command_queue(stateData, forCallback)
  {
      function make_command_object() {
          return {
              stateData:stateData,
              commands: [],
              responseHandlers: [],
              renderHandlers: [],
              callbacks: forCallback ? [] : undefined
          };
      }
      // if no comamnd queue then make one.
      if (!this.command_queue) {
          this.command_queue = [ make_command_object() ];
          return;
      }
      var index = this.command_queue.length-1;
      
      // if swapped between addCommand and addCallback, make a new entry
      var curr_queue_for_callback = !!this.command_queue[index].callbacks;
      if (curr_queue_for_callback != forCallback) {
          this.command_queue.push(make_command_object());

      } 
      
      // if new state and current state are different then make a new entry
      if(this.command_queue[index].stateData !== stateData)
      {
          var needNewState = true;
          // if both stateData are on the same render loop they might be equivalent
          if (this.command_queue[index].stateData.renderLoopName !== undefined && 
              this.command_queue[index].stateData.renderLoopName === stateData.renderLoopName) {
              var currState = this.command_queue[index].stateData;

              // here we can either just use the current state, swap it for the new state
              // or push the new state
              if (currState.cancel >= stateData.cancel) {
                  // current state will cancel faster than new one so can just keep it if
                  // continueOnError is the same.
                  needNewState = currState.continueOnError != stateData.continueOnError
              } else {
                  // new state wants to cancel faster.
                  // if continueOnError is the same then just replace current state with
                  // the new one.
                  if (currState.continueOnError == stateData.continueOnError) {
                      this.command_queue[index].stateData = stateData;
                      needNewState = false;
                  }
              } 
          }
          if (needNewState) {
              this.command_queue.push(make_command_object());
          }
      }
  } 
  /**
   * @private
   * Executes the provided commands on the web socket connection
   * @param commandQueue Array The command queue to execute.
   */
  execute(commandQueue)
  {
      if (!commandQueue) {
          return;
      }
      if (!this.web_socket) {
          this.on_general_error('Web socket not connected.');
          return;
      }
      if (this.protocol_state != 'started') {
          this.on_general_error('Web socket not started.');
          return; 
      }

      for (var i=0;i<commandQueue.length;i++) {
          var execute_args;

          if (commandQueue[i].callbacks) {
              // call callbacks to get commands
              this.service = this;            
              this.stateData = commandQueue[i].stateData;
              this.processing_queue = commandQueue[i];
              
              for (var c=0;c<commandQueue[i].callbacks.length;c++) {
                  this.call_callback(commandQueue[i].callbacks[c],this.on_callback_error,this);
              }
              delete this.service;
              delete this.stateData;
              delete this.processing_queue;
          }
          if (commandQueue[i].commands.length == 0) {
              continue;
          }
          if (commandQueue[i].stateData.renderLoopName) {
              execute_args = {
                  commands: commandQueue[i].commands,
                  render_loop_name: commandQueue[i].stateData.renderLoopName,
                  continue_on_error: commandQueue[i].stateData.continueOnError,
                  cancel: commandQueue[i].stateData.cancel,
              };
              if (commandQueue[i].renderHandlers.length) {
                  var stream = this.streaming_loops[execute_args.render_loop_name];
                  if (stream) {
                      execute_args.sequence_id = ++WebsocketStreamer.sequence_id;
                      stream.command_handlers.push({
                          sequence_id: execute_args.sequence_id,
                          handlers: commandQueue[i].renderHandlers
                      })
                  }
              }
          } else {
              execute_args = {
                  commands: commandQueue[i].stateData.stateCommands ? commandQueue[i].stateData.stateCommands.concat(commandQueue[i].commands) : commandQueue[i].commands,
                  url: commandQueue[i].stateData.path,
                  state_arguments: commandQueue[i].stateData.parameters
              };
          }

          function execute_response(response) {
              if (response.error) {
                  // possible errors
                  //if (onError) onError(response.error.message);
              } else {
                  // state data commands will have results as well so we need to compensate for them
                  var response_offset = this.stateData.stateCommands ? this.stateData.stateCommands.length : 0;
                  for (var i=response_offset;i<response.result.length;++i) {
                      var cmd_idx = i - response_offset;
                      var callback = this.responseHandlers[cmd_idx];
                      if (callback) {
                          this.service.call_callback(callback,this.service.on_response_error,new Response(this.commands[cmd_idx], response.result[i]));
                      }
                  }
              }
          }

          if (commandQueue[i].responseHandlers.length) {
              commandQueue[i].service = this;
              this.send_command('execute',execute_args,execute_response,commandQueue[i]);
          } else {
              this.send_command('execute',execute_args);
          }
          
          
      }
  }

  /**
   * Set debug mode for commands. When set commands and responses are sent in string
   * mode (where possible) for easier debugging over the websocket connection. 
   * @param enable Boolean Set to true to enable debug mode, false (the default) to disable.
   */
  debug_commands(enable)
  {
      if (!this.web_socket) {
          this.on_general_error('Web socket not connected.');
          return;
      }
      if (this.protocol_version < 2) {
          throw "Command execution not supported on the server."
      }
      if (this.protocol_state != 'started') {
          this.on_general_error('Web socket not started.');
          return; 
      }

      // send debug message
      var buffer = new ArrayBuffer(8);
      var message = new DataView(buffer);

      this.binary_commands = !enable;

      message.setUint32(0,WebsocketStreamer.MESSAGE_ID_PREFER_STRING,this.web_socket_littleendian);
      message.setUint32(4,!!enable ? 1 : 0,this.web_socket_littleendian);
      this.web_socket.send(buffer);
  }

  /**
   * Sets the max transfer rate for this stream. Manually setting a maximum rate will be enforced on
   * the server side so a stream will not generate more than the given amount of bandwidth. Automatic rate
   * control will attempt to fill the available bandwidth, but not flood the connection. Note that even if
   * a manual rate is set flood control will still be enabled so setting a max rate larger than the available
   * bandwidth will not overwhelm the connection. Rate control is implemented using frame dropping rather than adjusting
   * image compression settings.
   * @param maxRate Number The maximum rate in bytes per second. Set to 0 to use automatic rate
   * control (the default) or -1 to disable rate control entirely.
   * @param onResponse Function If supplied then this is called with the response to the set max rate request.
   * @param onError Function If supplied then this is called if there is an error setting the max rate.
   */
  set_max_rate(maxRate, onResponse, onError)
  {
      if (!this.web_socket) {
          if (onError) onError('Web socket not connected.');
          return;
      }
      if (this.protocol_state != 'started') {
          if (onError) onError('Web socket not started.');
          return; 
      }

      if (!maxRate) {
          maxRate = 0;
      }

      var args = {
          rate: maxRate
      }

      function set_max_rate_response(response) {
          if (response.error) {
              if (onError) onError(response.error.message);
          } else {
              if (onResponse) onResponse(response.result);
          }
      }

      this.send_command('set_transfer_rate',args,onResponse || onError ? set_max_rate_response : undefined);
  }


  /**
   * Sets the general error handler.
   * This is called by both response and callback error handlers by default.
   *
   * If the handler is not a function the general error handler will be set to the default handler.
   *
   * @param handler Function Handler function to deal with all errors.
   */
  set_general_error_handler(handler)
  {
      if (typeof handler !== "function")
      {
          handler = this.on_default_general_error;
      }
      this.m_general_error_handler = handler;
  }
  /**
   * Returns the general error handler function.
   *
   * @return Function Handler function that deals with all errors.
   */
  get_general_error_handler()
  {
      if (typeof this.m_general_error_handler === "function")
      {
          return this.m_general_error_handler;
      }
      return this.on_default_general_error;
  }

  /**
   * Sets the response error handler.
   * This deals with errors that are caused by command response functions.
   *
   * If the handler is not a function the response error handler will be set to the default handler.
   *
   * @param handler Function Handler function to deal with command response function errors.
   */
  set_response_error_handler(handler)
  {
      if (typeof handler !== "function")
      {
          handler = this.on_default_response_error;
      }
      this.m_response_error_handler = handler;
  }
  /**
   * Returns the general error handler function.
   *
   * @return Function Handler function that deals with command response function errors.
   */
  get_response_error_handler()
  {
      if (typeof this.m_response_error_handler === "function")
      {
          return this.m_response_error_handler;
      }
      return this.on_response_general_error;
  }

  /**
   * Sets the callback error handler.
   * This deals with errors that are caused by callback functions (ie functions added to addCallback).
   *
   * If the handler is not a function the callback error handler will be set to the default handler.
   *
   * @param handler Function Handler function to deal with callback function errors.
   */
  set_callback_error_handler(handler)
  {
      if (typeof handler !== "function")
      {
          handler = this.on_default_callback_error;
      }
      this.m_callback_error_handler = handler;
  }
  /**
   * Returns the callback error handler function.
   *
   * @return Function Handler function that deals with callback function errors.
   */
  get_callback_error_handler()
  {
      if (typeof this.m_callback_error_handler === "function")
      {
          return this.m_callback_error_handler;
      }
      return this.on_callback_general_error;
  }

  /**
   * @private Default general error function.
   */
  on_default_general_error(error)
  {
    var errorMsg = error.toString();
    console.error(errorMsg);
  }

  /**
   * @private Default response error function.
   */
  on_default_response_error(error)
  {
      this.on_general_error("Error in response: " + error);
  }

  /**
   * @private Default callback error function.
   */
  on_default_callback_error(error)
  {
      this.on_general_error("Error in callback: " + error);
  }

  /**
   * @private Calls the general error function handler.
   */
  on_general_error(error)
  {
      if (typeof this.m_general_error_handler === "function")
      {
          this.m_general_error_handler(error);
      }
      else
      {
          this.default_error_handler(error);
      }
  }

  /**
   * @private Calls the response error function handler.
   */
  on_response_error(error)
  {
      if (typeof this.m_response_error_handler === "function")
      {
          this.m_response_error_handler(error);
      }
      else
      {
          this.default_error_handler(error);
      }
  }

  /**
   * @private Calls the callback error function handler.
   */
  on_callback_error(error)
  {
      if (typeof this.m_callback_error_handler === "function")
      {
          this.m_callback_error_handler(error);
      }
      else
      {
          this.default_error_handler(error);
      }
  }

  /**
   * @private String
   * Characters to use in random strings.
   */
  static get uidArr() { return ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','x','y','z'] };

  /**
   * @static com::mi::rs::RSService
   * Creates a random string of the given lenght using characters 0-9 and a-z.
   * @param length Number
   * @return String
   */
  static createRandomString(length)
  {
      var charsArr = this.uidArr;

      var id = "";
      var len = charsArr.length;
      for(var i=0; i<length; i++)
      {
          var n = Math.floor((Math.random()*len));
          id += charsArr[n];
      }

      return id;
  }
};

  /*
  function testwriter()
  {
      var w = new WebSocketMessageWriter(true);
      var numbers = [
          2,
          -4,
          1034,
          -2040,
          1232434,
          -4532500,
          239548594383949,
          233,
          233,
          239548594383949,
          -2395485943834,
          -1,
          0,
          3.1415,
          -1232.432254
      ];
      var j=0;
      w.pushTypedValue(numbers[j++],'Uint8');
      w.pushTypedValue(numbers[j++],'Sint8');
      w.pushTypedValue(numbers[j++],'Uint16');
      w.pushTypedValue(numbers[j++],'Sint16');
      w.pushTypedValue(numbers[j++],'Uint32');
      w.pushTypedValue(numbers[j++],'Sint32');
      w.pushTypedValue(numbers[j++],'Uint64');
      w.pushTypedValue(numbers[j++],'Uint64');
      w.pushTypedValue(numbers[j++],'Sint64');
      w.pushTypedValue(numbers[j++],'Sint64');
      w.pushTypedValue(numbers[j++],'Sint64');
      w.pushTypedValue(numbers[j++],'Sint64');
      w.pushTypedValue(numbers[j++],'Sint64');
      w.pushTypedValue(numbers[j++],'Float32');
      w.pushTypedValue(numbers[j++],'Float64');

      j=0;
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      w.pushTypedValue(numbers[j++]);
      var strings = [
          'Bender is great!',
          'Foo © bar 𝌆 baz ☃ qux 🎿 𪘀 諭  🧟'
      ]
      for (j=0;j<strings.length;j++) {
          w.pushTypedValue(strings[j]);
      }

      var obj = {
          t: true,
          f: false,
          n: null,
          numbers: numbers,
          string_obj: {
              string1: strings[0],
              string2: strings[1]
          },
          vec: {
              x: 1.0,
              y:-2.0,
              z:1.5423
          }
      }
      w.pushTypedValue(obj);

      var data = w.finalise();

      var r = new WebSocketMessageReader(new DataView(data),0,true);

      var results = [];
      for (var i=0;i<numbers.length;++i) {
          results.push(r.getTypedValue());
      }
      
      function check(a,b,i) {
          if (i !== undefined) {
              if (a === b) {
                  console.log(i + ': ' + a + ' ' + b + ' true');
              } else {
                  console.warn(i + ': ' + a + ' ' + b + ' false');
              }
          } else {
              if (a === b) {
                  console.log(a + ' ' + b + ' true');
              } else {
                  console.warn(a + ' ' + b + ' false');
              }
          }
      }

      for (var i=0;i<numbers.length;++i) {
          check(numbers[i],results[i],i);
      }
      results = [];
      // second set
      for (var i=0;i<numbers.length;++i) {
          results.push(r.getTypedValue());
      }
      
      for (var i=0;i<numbers.length;++i) {
          check(numbers[i],results[i],i);
      }

      var result_strings = [];
      for (j=0;j<strings.length;j++) {
          result_strings.push(r.getTypedValue());
      }
      
      for (var i=0;i<strings.length;++i) {
          check(strings[i],result_strings[i],i);
      }

      // the object
      var new_obj = r.getTypedValue();
      check(obj.t,new_obj.t);
      check(obj.f,new_obj.f);
      check(obj.n,new_obj.n);

      for (var i=0;i<numbers.length;++i) {
          check(numbers[i],new_obj.numbers[i],i);
      }

      check(strings[0],new_obj.string_obj.string1);
      check(strings[1],new_obj.string_obj.string2);
      check(obj.vec.x,new_obj.vec.x);
      check(obj.vec.y,new_obj.vec.y);
      check(obj.vec.z,new_obj.vec.z);
  }
  */
module.exports = WebsocketStreamer;