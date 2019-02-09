/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const WebSocketMessageReader = require('./WebSocketMessageReader');
const WebSocketMessageWriter = require('./WebSocketMessageWriter');
const StateData = require('./StateData');
const Response = require('./Response');

let sequence_id=0;

class DelayedPromise {
    constructor() {
        this.promise = new Promise((resolve,reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}

class CommandQueue {
    constructor(service,state_data) {
        this.service = service;
        this.state_data = state_data;
        this.commands = [];
        this.response_promises = [];
    }

    // adds command to the command queue.
    // if want_reponse is true then a promise will be created to resolve
    // this commands response
    queue(command,want_response=false) {
        this.commands.push(command);
        if (want_response) {
            let response_promises = this.response_promises;
            response_promises.length = this.commands.length;
            response_promises[response_promises.length-1] = new DelayedPromise();
        }
        return this;
    }

    // Sends the command queue for execution and returns promises that will resolve
    // to the results of the command. If wait_for_render is true
    // then an additional promise is returned that will resolve when the commands in this
    // queue are about to be displayed in the associated render loop stream.
    // @return Object An object with 2 properties: \c responses an array of Promises
    // that will resolve with the results of the commands; render: a Promise that
    // resolves when the results are about to be displayed
    send(wait_for_render=false) {
        this.wait_for_render = wait_for_render;
        this.resolve_all = false;
        return this.service.send_command_queue(this);
    }

    // sends the command queue for execution. Returns a promise that will resolve
    // to an iterable containing the respones of all commands whose \c want_response
    // argument was true. If wait_for_render is true then the last iterable
    // will contain the render data for the rendered image that contains the results
    // of the commands.
    execute(wait_for_render=false) {
        this.wait_for_render = wait_for_render;
        this.resolve_all = true;
        return this.service.send_command_queue(this);
    }
}

const now_function = function(){
    try {
        if (window && window.performance && performance.now) {
            return function() {
                return performance.now() / 1000;
            };
        }
    } catch (e) {
        try {
            if (process && process.hrtime) {
                return function() {
                    const time = process.hrtime();
                    return time[0] + time[1] / 1e9;
                };
            }
        } catch (e) {}
    }
    return function() {
        return Date.now() / 1000;
    };
}();

let Websocket_impl = function() {
    try {
        return window ? window.WebSocket : undefined;
    } catch (e) {}
    return undefined;
}();

/**
 * @file Service.js
 * This file contains the Service class.
 */

/**
 * @class Service
 * The Service class provides the same functionality as
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
 * Creates a Service object that can stream images from a
 * render loop. Throws if web sockets are not supported by the browser.
 */
class Service {
    constructor(defaultStateData) {
        if (!defaultStateData) {
            this.defaultStateData = new StateData();
        } else {
            this.defaultStateData = defaultStateData;
        }

        this.binary_commands = true;

        this.m_general_error_handler = this.on_default_general_error;
    }

    /**
   * @public StateData|RenderLoopStateData
   * The default state data for this Service instance. If no state
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
    get connectorName() {
        return 'WS';
    }

    /**
   * @static Service
   * By default calls to user callbacks are wrapped in try/catch
   * blocks and if they error the appropriate error handler is
   * called. Disabling this can be useful during development as
   * when there is an error in a callback handler, the stack is lost.
   * Set this to true to unwrap the handler calls.
   */
    static get catchHandlers() {
        return true;
    };

    /**
   * @private
   * @static Service
   * Command sequence id used to identify when the results of a
   * command appear in a render.
   */
    static get sequence_id() {
        return sequence_id;
    }

    static set sequence_id(value) {
        sequence_id = value;
    }

    /** static Service
   * Sets the WebSocket implementation to use. This must implement the
   * W3C WebSocket API specification
   */
    static set websocket(value) {
        Websocket_impl = value;
    }

    /**
   * @static Service
   * Returns whether the service is supported or not. Web sockets are required and must
   * be accessible either through window.WebSocket or by setting Service.websocket to the
   * constructor of a W3C compliant web socket implementation.
   */
    static supported() {
        return !!Websocket_impl;
    }

    /**
   * @static Service
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
    static get MESSAGE_ID_IMAGE() {
        return              0x01;
    };
    static get MESSAGE_ID_IMAGE_ACK() {
        return          0x02;
    };
    static get MESSAGE_ID_TIME_REQUEST() {
        return       0x03;
    };
    static get MESSAGE_ID_TIME_RESPONSE() {
        return      0x04;
    };
    static get MESSAGE_ID_COMMAND() {
        return            0x05;
    };
    static get MESSAGE_ID_RESPONSE() {
        return           0x06;
    };
    static get MESSAGE_ID_PREFER_STRING() {
        return      0x07;
    };

    /**
   * Connects to a web socket server and performs initial handshake to ensure
   * streaming functionality is available.
   * @param url String The web service URL to connect to. Typically of the form
   * ws[s]://HOST::PORT/render_loop_stream/
   * @param extra_constructor_args Array Extra list of arguments to be passed to the websocket constructor
   * after the protocols parameter.
   * @return a promise that resolves when connected
   */
    connect( url, extra_constructor_args ) {
        return new Promise((resolve, reject) => {
            // if url is a string then make a websocket and connect. otherwise we assume it's already
            // an instance of a W3C complient web socket implementation.
            if (url !== undefined && url !== null && url.constructor === String) {
                if (!Service.supported()) {
                    reject('Websockets not supported.');
                    return;
                }
                try {
                    if (extra_constructor_args) {
                        this.web_socket = new Websocket_impl(...[ url, undefined ].concat(
                            Array.isArray(extra_constructor_args) ?
                                extra_constructor_args :
                                [ extra_constructor_args ]));
                    } else {
                        this.web_socket = new Websocket_impl(url);
                    }
                } catch (e) {
                    reject(e);
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

            let scope = this;

            this.web_socket.onopen = event => {
                event;
            };
            this.web_socket.onclose = event => {
                event;
                /*
              let code = event.code;
              let reason = event.reason;
              let wasClean = event.wasClean;
              console.log('closed: ' + code + ' ' + reason + ' ' + wasClean);
              */
            };
            this.web_socket.onerror = err => {
                reject(err);
            };

            function process_response(response) {
                if (scope.response_handlers[response.id] !== undefined) {
                    let handler_scope = scope.response_handlers[response.id].scope;
                    if (handler_scope === undefined) {
                        handler_scope = scope;
                    }
                    scope.response_handlers[response.id].handler.call(handler_scope, response);
                    delete scope.response_handlers[response.id];
                }
            }
            function web_socket_stream(event) {
                if (event.data instanceof ArrayBuffer) {
                    // Got some binary data, most likely an image, let's see now.
                    let time_sec = Service.now();
                    let data = new DataView(event.data);
                    let message = data.getUint32(0, scope.web_socket_littleendian);
                    if (message === Service.MESSAGE_ID_IMAGE) {
                        // yup, an image
                        let img_msg = new WebSocketMessageReader(data, 4, scope.web_socket_littleendian);
                        let header_size = img_msg.getUint32();
                        if (header_size !== 16) {
                            // not good
                            scope.on_general_error('Invalid image message size.');
                            return;
                        }
                        let image_id = img_msg.getUint32();
                        let result = img_msg.getSint32();
                        // render loop name
                        let render_loop_name = img_msg.getString();
                        if (scope.streaming_loops[render_loop_name] === undefined) {
                            // nothing to do, no handler
                            return;
                        }

                        if (result >= 0) {
                            // should have an image
                            let have_image = img_msg.getUint32();
                            if (have_image === 0) {
                                // got an image
                                let img_width = img_msg.getUint32();
                                let img_height = img_msg.getUint32();
                                let mime_type = img_msg.getString();
                                let img_size = img_msg.getUint32();
                                // and finally the image itself
                                let image = img_msg.getUint8Array(img_size);

                                // then any statistical data
                                let have_stats = img_msg.getUint8();
                                let stats;
                                if (have_stats) {
                                    stats = img_msg.getTypedValue();
                                }
                                if (scope.streaming_loops[render_loop_name].lastRenderTime) {
                                    stats['fps'] = 1 / (time_sec - scope.streaming_loops[render_loop_name].lastRenderTime);
                                }
                                scope.streaming_loops[render_loop_name].lastRenderTime = time_sec;
                                let data = {
                                    result: result,
                                    width: img_width,
                                    height: img_height,
                                    mime_type: mime_type,
                                    image: image,
                                    statistics: stats
                                };
                                if (stats.sequence_id > 0) {
                                    while (scope.streaming_loops[render_loop_name].command_promises.length &&
                                      scope.streaming_loops[render_loop_name].command_promises[0].sequence_id <= stats.sequence_id) {
                                        let handler = scope.streaming_loops[render_loop_name].command_promises.shift();
                                        handler.delayed_promise.resolve(data);
                                    }
                                }
                                if (!scope.streaming_loops[render_loop_name].pause_count) {
                                    if (scope.streaming_loops[render_loop_name].renderHandler) {
                                        scope.streaming_loops[render_loop_name].renderHandler.imageRendered(data.image, data.mime_type);
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
                        let buffer = new ArrayBuffer(16);
                        let response = new DataView(buffer);
                        response.setUint32(0, Service.MESSAGE_ID_IMAGE_ACK, scope.web_socket_littleendian); // image ack
                        response.setUint32(4, image_id, scope.web_socket_littleendian); // image id
                        response.setFloat64(8, time_sec, scope.web_socket_littleendian);
                        scope.web_socket.send(buffer);
                    } else if (message === Service.MESSAGE_ID_TIME_REQUEST) {
                        // time request
                        let buffer = new ArrayBuffer(12);
                        let response = new DataView(buffer);
                        response.setUint32(0, Service.MESSAGE_ID_TIME_RESPONSE, scope.web_socket_littleendian); // time response
                        response.setFloat64(4, time_sec, scope.web_socket_littleendian);
                        scope.web_socket.send(buffer);
                    } else if (message === Service.MESSAGE_ID_RESPONSE) {
                        let response_msg = new WebSocketMessageReader(data, 4, scope.web_socket_littleendian);
                        let id = response_msg.getTypedValue();
                        let response = response_msg.getTypedValue();
                        response.id = id;
                        if (response.id !== undefined) {
                            process_response(response);
                        }
                    }
                } else {
                    let data = JSON.parse(event.data);
                    if (data.id !== undefined) {
                        process_response(data);
                    }
                }
            }

            function web_socket_handshaking(event) {
                if (event.data instanceof ArrayBuffer) {
                    let data = new DataView(event.data);
                    // validate header
                    let hs_header = String.fromCharCode(data.getUint8(0), data.getUint8(1),
                        data.getUint8(2), data.getUint8(3),
                        data.getUint8(4), data.getUint8(5),
                        data.getUint8(6), data.getUint8(7));
                    if (hs_header !== 'RSWSRLIS') {
                        // not good
                        scope.web_socket.close();
                    } else {
                        // check that the protcol version is acceptable
                        const protocol_version = data.getUint32(8, scope.web_socket_littleendian);
                        if (protocol_version < 1 || protocol_version > 2) {
                            // unsupported protocol, can't go on
                            scope.web_socket.close();
                            reject('Sever protocol version not supported');
                        } else {
                            // all good, we support this, enter started mode
                            scope.protocol_version = protocol_version;
                            scope.protocol_state = 'started';
                            scope.web_socket.onmessage = web_socket_stream;
                            resolve();
                        }
                    }
                } else {
                    scope.web_socket.close();
                    reject('unexpected data during handshake');
                }
            }
            function web_socket_prestart(event) {
                // remove on error as we're now connected
                scope.web_socket.onerror = undefined;
                // expecting a handshake message
                if (event.data instanceof ArrayBuffer) {
                    let time_sec = Service.now();
                    if (event.data.byteLength !== 40) {
                        scope.web_socket.close();
                        reject('Invalid handshake header size');
                        return;
                    }
                    let data = new DataView(event.data);
                    // validate header
                    let hs_header = String.fromCharCode(data.getUint8(0), data.getUint8(1),
                        data.getUint8(2), data.getUint8(3),
                        data.getUint8(4), data.getUint8(5),
                        data.getUint8(6), data.getUint8(7));
                    if (hs_header !== 'RSWSRLIS') {
                        // not good
                        scope.web_socket.close();
                        reject('Invalid handshake header');
                    } else {
                        scope.web_socket_littleendian = data.getUint8(8) === 1 ? true : false;
                        const protocol_version = data.getUint32(12, scope.web_socket_littleendian);
                        if (protocol_version < 1 || protocol_version > 2) {
                            // unsupported protocol, let's ask for what we know
                            protocol_version = 2;
                        }
                        // get server time
                        //let server_time = data.getFloat64(16, scope.web_socket_littleendian);
                        scope.protocol_state = 'handshaking';

                        let buffer = new ArrayBuffer(40);
                        let response = new DataView(buffer);
                        for (let i = 0; i < hs_header.length; ++i) {
                            response.setUint8(i, hs_header.charCodeAt(i));
                        }
                        response.setUint32(8, protocol_version, scope.web_socket_littleendian);
                        response.setUint32(12, 0, scope.web_socket_littleendian);
                        response.setFloat64(16, time_sec, scope.web_socket_littleendian);
                        for (let i = 0; i < 16; ++i) {
                            response.setUint8(i + 24, data.getUint8(i + 24), scope.web_socket_littleendian);
                        }
                        scope.web_socket.onmessage = web_socket_handshaking;
                        scope.web_socket.send(buffer);
                    }
                } else {
                    this.web_socket.close();
                    reject('unexpected data during handshake');
                }
            }
            this.web_socket.onmessage = web_socket_prestart;
        });
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
    send_ws_command(command, args, handler, scope) {
        let command_id = handler !== undefined ? this.command_id : undefined;
        if (command_id !== undefined) {
            this.response_handlers[command_id] = { handler: handler, scope: scope };
            this.command_id++;
        }
        let payload = {
            command: command,
            arguments: args,
            id : command_id
        };

        if (this.binary_commands && this.protocol_version > 1) {
            let buffer = new WebSocketMessageWriter(this.web_socket_littleendian);
            buffer.pushUint32(Service.MESSAGE_ID_COMMAND);
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
   * @param onData Function If supplied then this is called every time an image is returned and receives the image
   * and rendering statistics.
   * @return a promise that resolves when the stream has started
   */
    stream(renderLoop, renderHandler, onData) {
        return new Promise((resolve,reject) => {
            if (!this.web_socket) {
                reject('Web socket not connected.');
                return;
            }
            if (this.protocol_state !== 'started') {
                reject('Web socket not started.');
                return;
            }

            if (typeof renderLoop === 'string' || renderLoop instanceof String) {
                renderLoop = {
                    render_loop_name : renderLoop
                };
            }

            // always use the handler since it makes no sense to start a stream without something to deal with it
            this.send_ws_command('start_stream',renderLoop,response => {
                if (response.error) {
                    reject(response.error.message);
                } else {
                    this.streaming_loops[renderLoop.render_loop_name] = {
                        renderHandler: renderHandler,
                        onData: onData,
                        command_promises: [],
                        pause_count: 0
                    };
                    resolve(response.result);
                }
            });
        });
    }

    /**
   * Sets parameters on a stream.
   * @param parameters Object The parameter to set. Must contain a 'render_loop_name' property with the name of
   * the render loop to set parameters for. Supported parameters are 'image_format' (String) to specify the
   * streamed image format and 'quality' (String) to control the image quality
   * @return a promise that resolves with the set parameter response
   */
    set_stream_parameters(parameters) {
        return new Promise((resolve,reject) => {
            if (!this.web_socket) {
                reject('Web socket not connected.');
                return;
            }
            if (this.protocol_state !== 'started') {
                reject('Web socket not started.');
                return;
            }

            this.send_ws_command('set_stream_parameters',parameters, response => {
                if (response.error) {
                    reject(response.error.message);
                } else {
                    resolve(response.result);
                }
            });
        });
    }
    /**
   * Stops streaming from a render loop
   * @param renderLoop String The name of the render loop to stop streaming.
   * @return a promise that resolves when the stream is stopped
   */
    stop_stream(renderLoop) {
        return new Promise((resolve,reject) => {
            if (!this.web_socket) {
                reject('Web socket not connected.');
                return;
            }
            if (this.protocol_state !== 'started') {
                reject('Web socket not started.');
                return;
            }

            if (typeof renderLoop === 'string' || renderLoop instanceof String) {
                renderLoop = {
                    render_loop_name : renderLoop
                };
            }

            this.send_ws_command('stop_stream',renderLoop,response => {
                if (response.error) {
                    reject(response.error.message);
                } else {
                    delete this.streaming_loops[renderLoop.render_loop_name];
                    resolve(response.result);
                }
            });
        });
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
    pause_display(renderLoop) {
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
    resume_display(renderLoop,force) {
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
    is_display_paused(renderLoop) {
        if (!this.streaming_loops[renderLoop]) {
            return false;
        }

        return this.streaming_loops[renderLoop].pause_count;
    }

    /**
   * Returns \c true if we are currently streaming the given render loop.
   * @param renderLoop String The name of the render loop to check.
   */
    streaming(renderLoop) {
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
   * @return a promise that resolves with the result
   */
    update_camera(renderLoop, data) {
        return new Promise((resolve,reject) => {
            if (!this.web_socket) {
                reject('Web socket not connected.');
                return;
            }
            if (this.protocol_state !== 'started') {
                reject('Web socket not started.');
                return;
            }

            if (!data) {
                reject('No data object provided.');
                return;
            }

            if (typeof renderLoop === 'string' || renderLoop instanceof String) {
                renderLoop = {
                    render_loop_name : renderLoop
                };
            }
            renderLoop.camera = data.camera;
            renderLoop.camera_instance = data.camera_instance;

            this.send_ws_command('set_camera',renderLoop,response => {
                if (response.error) {
                    reject(response.error.message);
                } else {
                    resolve(response.result);
                }
            });
        });
    }

    /**
   * Returns a CommandQueue that can be used to queue up a series of commands to
   * be executed.
   * @param state if provided then this is used as the state for executing the commands.
   * If not then the default service state is used.
   */
    queue_commands(state=null) {
        return new CommandQueue(this,state || this.defaultStateData);
    }

    /**
   * Executes a single command and returns a promise.
   * @param command the command to execute
   * @param want_response if \c true then the returned promise resolves to the response of the
   * command. If \c false then the promise resolves immediately to undefined.
   * @param wait_for_render if \c true, and the state executes the command on a render loop then
   * a promise is returned that resolves just before the command results appear in a render.
   * @param state if provided then this is used as the state to execute the command.
   * If not then the default service state is used.
   * @return a promise that resolves to an iterable. If a response is requested then it resolves
   * into the first value of the iterable. If \p wait_for_render is \c true then that resolves into
   * the last value of the iterable.
   */
    execute_command(command,want_response=false,wait_for_render=false,state=undefined) {
        return new CommandQueue(this,state || this.defaultStateData).queue(command,want_response).execute(wait_for_render);
    }

    /**
   * Sends a single command and returns promies that will resolve with the results.
   * @param command the command to execute
   * @param want_response if \c true then the returned promise resolves to the response of the
   * command. If \c false then the promise resolves immediately to undefined.
   * @param wait_for_render if \c true, and the state executes the command on a render loop then
   * a promise is returned that resolves just before the command results appear in a render.
   * @param state if provided then this is used as the state to execute the command.
   * If not then the default service state is used.
   * @return a promise that resolves to an iterable. If a response is requested then it resolves
   * into the first value of the iterable. If \p wait_for_render is \c true then that resolves into
   * the last value of the iterable.
   */
    send_command(command,want_response=false,wait_for_render=false,state=undefined) {
        return new CommandQueue(this,state || this.defaultStateData).queue(command,want_response).send(wait_for_render);
    }
    // if wait_for_render is true but we are not currently streaming that loop then its promise will
    // resolve immediately
    send_command_queue(command_queue) {
        if (!command_queue) {
            return Promise.reject('No command queue provided');
        }
        if (!this.web_socket) {
            return Promise.reject('Web socket not connected.');
        }
        if (this.protocol_state !== 'started') {
            return Promise.reject('Web socket not started.');
        }

        const { wait_for_render,resolve_all } = command_queue;

        if (command_queue.commands.length === 0) {
            // move along, nothing to see here
            return Promise.all(Promise.resolve());
        }
        let execute_args;
        const promises = {
            responses: command_queue.response_promises.reduce((result,value) => {
                if (value) {
                    result.push(value.promise);
                }
                return result;
            },[]),
            render: undefined
        };

        if (command_queue.state_data.renderLoopName) {
            execute_args = {
                commands: command_queue.commands,
                render_loop_name: command_queue.state_data.renderLoopName,
                continue_on_error: command_queue.state_data.continueOnError,
                cancel: command_queue.state_data.cancel,
            };
            if (wait_for_render) {
                let stream = this.streaming_loops[execute_args.render_loop_name];
                if (stream) {
                    const promise = new DelayedPromise();
                    execute_args.sequence_id = ++Service.sequence_id;
                    stream.command_promises.push({
                        sequence_id: execute_args.sequence_id,
                        delayed_promise: promise
                    });
                    promises.render = promise.promise;
                } else {
                    promises.render = Promise.resolve();
                }
            }
        } else {
            if (wait_for_render) {
                return Promise.reject('A command wants a render handler but commands are not executing on a render loop');
            }
            execute_args = {
                commands: command_queue.state_data.stateCommands ?
                    command_queue.state_data.stateCommands.concat(command_queue.commands) :
                    command_queue.commands,
                url: command_queue.state_data.path,
                state_arguments: command_queue.state_data.parameters
            };
        }

        function resolve_responses(response) {
            // state data commands will have results as well so we need to compensate for them
            let response_offset = this.state_data.stateCommands ? this.state_data.stateCommands.length : 0;
            for (let i=response_offset;i<response.result.length;++i) {
                let cmd_idx = i - response_offset;
                if (this.response_promises[cmd_idx]) {
                    this.response_promises[cmd_idx].resolve(new Response(this.commands[cmd_idx], response.result[i]));
                }
            }
        }

        if (promises.responses.length) {
            // we want responses
            this.send_ws_command('execute',execute_args,resolve_responses,command_queue);
        } else {
            this.send_ws_command('execute',execute_args);
        }
        if (resolve_all) {
            if (promises.render) {
                promises.responses.push(promises.render);
            }
            return Promise.all(promises.responses);
        } else {
            return promises;
        }
    }

    /**
   * Set debug mode for commands. When set commands and responses are sent in string
   * mode (where possible) for easier debugging over the websocket connection.
   * @param enable Boolean Set to true to enable debug mode, false (the default) to disable.
   */
    debug_commands(enable) {
        if (!this.web_socket) {
            this.on_general_error('Web socket not connected.');
            return;
        }
        if (this.protocol_version < 2) {
            throw 'Command execution not supported on the server.';
        }
        if (this.protocol_state !== 'started') {
            this.on_general_error('Web socket not started.');
            return;
        }

        // send debug message
        let buffer = new ArrayBuffer(8);
        let message = new DataView(buffer);

        this.binary_commands = !enable;

        message.setUint32(0,Service.MESSAGE_ID_PREFER_STRING,this.web_socket_littleendian);
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
   * @return a promise that resolves when the max rate has been set.
   */
    set_max_rate(maxRate) {
        return new Promise((resolve, reject) => {
            if (!this.web_socket) {
                reject('Web socket not connected.');
                return;
            }
            if (this.protocol_state !== 'started') {
                reject('Web socket not started.');
                return;
            }

            if (!maxRate) {
                maxRate = 0;
            }

            let args = {
                rate: maxRate
            };

            this.send_ws_command('set_transfer_rate',args,response => {
                if (response.error) {
                    reject(response.error.message);
                } else {
                    resolve(response.result);
                }
            }
            );
        });
    }


    /**
   * Sets the general error handler.
   * This is called by both response and callback error handlers by default.
   *
   * If the handler is not a function the general error handler will be set to the default handler.
   *
   * @param handler Function Handler function to deal with all errors.
   */
    set_general_error_handler(handler) {
        if (typeof handler !== 'function') {
            handler = this.on_default_general_error;
        }
        this.m_general_error_handler = handler;
    }
    /**
   * Returns the general error handler function.
   *
   * @return Function Handler function that deals with all errors.
   */
    get_general_error_handler() {
        if (typeof this.m_general_error_handler === 'function') {
            return this.m_general_error_handler;
        }
        return this.on_default_general_error;
    }

    /**
   * @private Default general error function.
   */
    on_default_general_error(error) {
        let errorMsg = JSON.stringify(error);
        console.error(errorMsg);
    }

    /**
   * @private Calls the general error function handler.
   */
    on_general_error(error) {
        if (typeof this.m_general_error_handler === 'function') {
            this.m_general_error_handler(error);
        } else {
            this.default_error_handler(error);
        }
    }

    /**
   * @private String
   * Characters to use in random strings.
   */
    static get uidArr() {
        return [ '0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','x','y','z' ];
    };

    /**
   * @static com::mi::rs::RSService
   * Creates a random string of the given lenght using characters 0-9 and a-z.
   * @param length Number
   * @return String
   */
    static createRandomString(length) {
        let charsArr = this.uidArr;

        let id = '';
        let len = charsArr.length;
        for (let i=0; i<length; i++) {
            let n = Math.floor((Math.random()*len));
            id += charsArr[n];
        }

        return id;
    }
};

/*
  function testwriter()
  {
      let w = new WebSocketMessageWriter(true);
      let numbers = [
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
      let j=0;
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
      let strings = [
          'Bender is great!',
          'Foo © bar 𝌆 baz ☃ qux 🎿 𪘀 諭  🧟'
      ]
      for (j=0;j<strings.length;j++) {
          w.pushTypedValue(strings[j]);
      }

      let obj = {
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

      let data = w.finalise();

      let r = new WebSocketMessageReader(new DataView(data),0,true);

      let results = [];
      for (let i=0;i<numbers.length;++i) {
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

      for (let i=0;i<numbers.length;++i) {
          check(numbers[i],results[i],i);
      }
      results = [];
      // second set
      for (let i=0;i<numbers.length;++i) {
          results.push(r.getTypedValue());
      }

      for (let i=0;i<numbers.length;++i) {
          check(numbers[i],results[i],i);
      }

      let result_strings = [];
      for (j=0;j<strings.length;j++) {
          result_strings.push(r.getTypedValue());
      }

      for (let i=0;i<strings.length;++i) {
          check(strings[i],result_strings[i],i);
      }

      // the object
      let new_obj = r.getTypedValue();
      check(obj.t,new_obj.t);
      check(obj.f,new_obj.f);
      check(obj.n,new_obj.n);

      for (let i=0;i<numbers.length;++i) {
          check(numbers[i],new_obj.numbers[i],i);
      }

      check(strings[0],new_obj.string_obj.string1);
      check(strings[1],new_obj.string_obj.string2);
      check(obj.vec.x,new_obj.vec.x);
      check(obj.vec.y,new_obj.vec.y);
      check(obj.vec.z,new_obj.vec.z);
  }
  */
module.exports = Service;
