/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Web_socket_message_reader = require('./Utils/Web_socket_message_reader');
const Web_socket_message_writer = require('./Utils/Web_socket_message_writer');
const Delayed_promise = require('./Utils/Delayed_promise');
const Command_queue = require('./Command_queue');
const State_data = require('./State_data');
const Response = require('./Response');

let sequence_id=0;

/**
 * Works out the most accurate way to get the current time in seconds.
 * @access private
 */
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


/**
 * The WebSocket implementation to use. By default this will try and get one from `window`.
 * If not found then the user must set this via {@link RS.Service#websocket} or provide
 * a websocket implementation to {@link RS.Service#connect}
 * @access private
 */
let Websocket_impl = function() {
    try {
        return window ? window.WebSocket : undefined;
    } catch (e) {}
    return undefined;
}();


/**
 * The Service class provides a WebSocket connection to RealityServer that
 * allows the user to execute commands as well as stream rendered
 * images from a render loop. This allows for push based image
 * updates rather than the polling system required in HTTP.
 * @memberof RS
 */
class Service {
    /**
     * Creates the service class.
     * @param {(RS.State_data|RS.Render_loop_state_data)} [default_state_data] the default state data to use
     */
    constructor(default_state_data=null) {
        if (!default_state_data) {
            this._default_state_data = new State_data();
        } else {
            this._default_state_data = default_state_data;
        }

        this.binary_commands = true;
    }

    /**
    * The default state data for this Service instance. If no state
    * data is specified when providing commands
    * then this is the state data that will be used. If this is set
    * to an instance of {@link RS.Render_loop_state_data} then all commands
    * will be executed on the render loop. In this case it is the user's responsibility
    * to ensure that the render loop exists.
    * @type {(State_data|Render_loop_state_data)}
    */
    get default_state_data() {
        return this._default_state_data;
    }

    set default_state_data(value) {
        this._default_state_data = value;
    }

    /**
   *
   * Returns the name of the current connector. The connector
   * encapsulates the on-the-wire protocol used to process
   * commands. Currently one connector is available
   * `WS` which indicates that commands are processed using WebSocket requests.
   * @type {String}
   * @readonly
   */
    get connector_name() {
        return 'WS';
    }

    /**
     * Command sequence id used to identify when the results of a
     * command appear in a render.
     * @access private
     * @static Service
     */
    static get sequence_id() {
        return sequence_id;
    }

    static set sequence_id(value) {
        sequence_id = value;
    }

    /**
     * The WebSocket implementation to use. This will default to `window.WebSocket` if
     * available. Otherwise the constructor of a [W3C WebSocket API](https://www.w3.org/TR/websockets/)
     * implementation must be set on this member, or an instance of such an object provided when
     * calling {@link RS.Service#connect}.
     * @type {WebSocket}
     */
    static get websocket() {
        return Websocket_impl;
    }

    static set websocket(value) {
        Websocket_impl = value;
    }

    /**
     * Returns whether the service is supported or not. Web sockets are required and must
     * be accessible either through `window.WebSocket` or by setting {@link RS.Service.websocket}
     * @return {Boolean}
     */
    static get supported() {
        return !!Websocket_impl;
    }

    /**
     * Returns a timestamp in seconds
     * @return {Number}
     * @access private
     */
    static now() {
        return now_function();
    };

    /**
     * Protocol message IDs
     * @access private
    */
    static get MESSAGE_ID_IMAGE() {
        return 0x01;
    };
    static get MESSAGE_ID_IMAGE_ACK() {
        return 0x02;
    };
    static get MESSAGE_ID_TIME_REQUEST() {
        return 0x03;
    };
    static get MESSAGE_ID_TIME_RESPONSE() {
        return 0x04;
    };
    static get MESSAGE_ID_COMMAND() {
        return 0x05;
    };
    static get MESSAGE_ID_RESPONSE() {
        return  0x06;
    };
    static get MESSAGE_ID_PREFER_STRING() {
        return 0x07;
    };

    /**
     * Connects to RealityServer and performs the initial handshake to ensure
     * streaming functionality is available. Returns a `Promise` that resolves when connected. The promise
     * will reject in the following circumstances:
     * - Websockets are not supported
     * - Creation of the WebSocket instance fails.
     * - The RealityServer connection fails.
     * - Invalid RealityServer handshake.
     * - The connected RealityServer does not support the required WebSocket protocol version.
     * @param {String|Object} url If a string then the web service URL to connect to. Typically of the form
     * `ws[s]://HOST::PORT/render_loop_stream/`. If not a string then must be an object that implements the
     * [W3C WebSocket API](https://www.w3.org/TR/websockets/) interface.
     * @param {Array=} extra_constructor_args Extra list of arguments to be passed to the WebSocket constructor
     * after the protocols parameter.
     * @return {Promise} A promise that resolves when the WebSocket is connected.
     */
    connect(url, extra_constructor_args=null) {
        return new Promise((resolve, reject) => {
            // if url is a string then make a websocket and connect. otherwise we assume it's already
            // an instance of a W3C complient web socket implementation.
            if (url !== undefined && url !== null && url.constructor === String) {
                if (!Service.supported) {
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
                this.protocol_state = 'prestart';
                this.web_socket = undefined;
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
            function process_received_render(message,now) {
                const result = message.getSint32();
                // render loop name
                const render_loop_name = message.getString();
                const stream_data = scope.streaming_loops[render_loop_name];
                if (stream_data === undefined) {
                    // nothing to do, no handler
                    return;
                }
                if (result >= 0) {
                    // should have an image
                    const have_image = message.getUint32();
                    if (have_image === 0) {
                        // got an image
                        const img_width = message.getUint32();
                        const img_height = message.getUint32();
                        const mime_type = message.getString();
                        const img_size = message.getUint32();
                        // and finally the image itself
                        const image = message.getUint8Array(img_size);

                        // then any statistical data
                        const have_stats = message.getUint8();
                        let stats;
                        if (have_stats) {
                            stats = message.getTypedValue();
                        }
                        if (stream_data.lastRenderTime) {
                            stats['fps'] = 1 / (now - stream_data.lastRenderTime);
                        }
                        stream_data.lastRenderTime = now;
                        const data = {
                            result: result,
                            width: img_width,
                            height: img_height,
                            mime_type: mime_type,
                            image: image,
                            statistics: stats
                        };
                        if (stats.sequence_id > 0) {
                            while (stream_data.command_promises.length &&
                              stream_data.command_promises[0].sequence_id <= stats.sequence_id) {
                                const handler = stream_data.command_promises.shift();
                                handler.delayed_promise.resolve(data);
                            }
                        }
                        if (!stream_data.pause_count) {
                            if (stream_data.onData) {
                                stream_data.onData(data);
                            }
                        }
                    }
                } else {
                    if (!stream_data.pause_count && stream_data.onData) {
                        stream_data.onData({
                            result: result
                        });
                    }
                }

            }
            function web_socket_stream(event) {
                if (event.data instanceof ArrayBuffer) {
                    // Got some binary data, most likely an image, let's see now.
                    const now = Service.now();
                    const data = new DataView(event.data);
                    const message = data.getUint32(0, scope.web_socket_littleendian);
                    if (message === Service.MESSAGE_ID_IMAGE) {
                        // yup, an image
                        let img_msg = new Web_socket_message_reader(data, 4, scope.web_socket_littleendian);
                        let header_size = img_msg.getUint32();
                        if (header_size !== 16) {
                            // not good
                            return;
                        }
                        let image_id = img_msg.getUint32();

                        process_received_render(img_msg,now);

                        // send image ack
                        let buffer = new ArrayBuffer(16);
                        let response = new DataView(buffer);
                        response.setUint32(0, Service.MESSAGE_ID_IMAGE_ACK, scope.web_socket_littleendian);
                        response.setUint32(4, image_id, scope.web_socket_littleendian); // image id
                        response.setFloat64(8, now, scope.web_socket_littleendian);
                        scope.web_socket.send(buffer);
                    } else if (message === Service.MESSAGE_ID_TIME_REQUEST) {
                        // time request
                        let buffer = new ArrayBuffer(12);
                        // send time response
                        let response = new DataView(buffer);
                        response.setUint32(0, Service.MESSAGE_ID_TIME_RESPONSE, scope.web_socket_littleendian);
                        response.setFloat64(4, now, scope.web_socket_littleendian);
                        scope.web_socket.send(buffer);
                    } else if (message === Service.MESSAGE_ID_RESPONSE) {
                        let response_msg = new Web_socket_message_reader(data, 4, scope.web_socket_littleendian);
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
                        if (protocol_version < 2 || protocol_version > 2) {
                            // unsupported protocol, can't go on
                            scope.web_socket.close();
                            reject('Sever protocol version not supported');
                        } else {
                            // all good, we support this, enter started mode
                            scope.protocol_version = protocol_version;
                            scope.protocol_state = 'started';
                            scope.web_socket.onmessage = web_socket_stream;

                            // if in debug mode then set debug on the server.
                            if (!this.binary_commands) {
                                this.binary_commands = false;
                            }
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
                    let now = Service.now();
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
                        response.setFloat64(16, now, scope.web_socket_littleendian);
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

    /**
     * Closes the WebSocket connection
     */
    close() {
        this.web_socket.close();
        this.web_socket = undefined;
    }

    /**
     * Sends a command over the websocket connection. Note that this is a websocket
     * protocol command, not a RealityServer command.
     * @access private
     * @param {String} command - The command to send
     * @param {Object} args - The commands arguments
     * @param {Function} handler - The function to call with the command's results
     * @param {Object} scope - scope in which to call handler
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
            let buffer = new Web_socket_message_writer(this.web_socket_littleendian);
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
     * over a given web socket. Returns a promise that resolves when the stream has started. The promise will
     * reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - no callback is provided, there is no point in streaming a render loop if there is no callback to process it.
     * - staring the stream failed, usually this occurs if the render loop cannot be found or invalid streaming
     * data is provided.
     * @param {String|Object} render_loop If a `String` then the name of the render loop to stream. Provide an
     * object to specify additional streaming data.
     * @param {String} render_loop.name - the name of the render loop to stream.
     * @param {String=} render_loop.image_format - the streamed image format.
     * @param {String=} render_loop.quality - the streamed image quality.
     * @param {RS.Service~Render_callback} callback - A function to be called every time an image is received, this will receive the image
     * and rendering statistics.
     * @return {Promise} A promise that resolves when the stream has started.
     */
    stream(render_loop, callback) {
        return new Promise((resolve,reject) => {
            if (!this.web_socket) {
                reject('Web socket not connected.');
                return;
            }
            if (this.protocol_state !== 'started') {
                reject('Web socket not started.');
                return;
            }
            if (!callback) {
                reject('No callback provided.');
                return;
            }

            if (typeof render_loop === 'string' || render_loop instanceof String) {
                render_loop = {
                    render_loop_name : render_loop
                };
            }

            // always use the handler since it makes no sense to start a stream without something to deal with it
            this.send_ws_command('start_stream',render_loop,response => {
                if (response.error) {
                    reject(response.error.message);
                } else {
                    this.streaming_loops[render_loop.render_loop_name] = {
                        onData: callback,
                        command_promises: [],
                        pause_count: 0
                    };
                    resolve(response.result);
                }
            });
        });
    }

    /**
     * The result of an image render.
     * @typedef {Object} RS.Service~Rendered_image
     * @property {Number} result - The render result, `0` for success, `1` for converged,
     * `-1` cancelled render, negative values indicate errors.
     * @property {Number} width - The image width.
     * @property {Number} height - The image height.
     * @property {Uint8Array} image - The rendered image
     * @property {String} mime_type - The mime type of the rendered image.
     * @property {Object} statistics - Rendering statistics.
     */


    /**
     * This callback is called whenever a render is recieved from a render loop.
     * @callback RS.Service~Render_callback
     * @param {RS.Service~Rendered_image} image - The received image
     */


    /**
     * Sets parameters on a streaming render loop.
     * @param {Object} parameters The parameter to set. `name` is required, all other properties are
     * set on the stream. Supported properties include:
     * @param {String} parameters.name - the name of the render loop to set streaming parameters on.
     * @param {String=} parameters.image_format - the streamed image format.
     * @param {String=} parameters.quality - the streamed image quality.
     * @return {Promise} A promise that resolves with the set parameter response or rejects with
     * the error message.
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
     * Stops streaming from a render loop.
     * @param {String} render_loop The name of the render loop to stop streaming.
     * @return {Promise} A promise that resolves when the stream is stopped or rejects
     * on error.
     */
    stop_stream(render_loop) {
        return new Promise((resolve,reject) => {
            if (!this.web_socket) {
                reject('Web socket not connected.');
                return;
            }
            if (this.protocol_state !== 'started') {
                reject('Web socket not started.');
                return;
            }

            if (typeof render_loop === 'string' || render_loop instanceof String) {
                render_loop = {
                    render_loop_name : render_loop
                };
            }

            this.send_ws_command('stop_stream',render_loop,response => {
                if (response.error) {
                    reject(response.error.message);
                } else {
                    delete this.streaming_loops[render_loop.render_loop_name];
                    resolve(response.result);
                }
            });
        });
    }

    /**
     * Pauses calling the callback associated with the render loop. Note the images are still transmitted from
     * the server, the callback is just not called. Pause calls are counted so you need to call
     * {@link RS.Service#resume_display} the same number of times as pause_display before calling begins again.
     * @param {String} render_loop The name of the render loop to pause display for.
     * @return {Number The pause count, IE: the number of times resume_display will need to be called to
     * start displaying images again. Returns `-1` if web socket isn't started or `render_loop` cannot
     * be found.
     */
    pause_display(render_loop) {
        if (!this.streaming_loops[render_loop]) {
            return -1;
        }

        return ++this.streaming_loops[render_loop].pause_count;
    }

    /**
     * Resumes calling the callback associated with the paused render loop if the pause count has reduced to `0`.
     *
     * @param {String} render_loop The name of the render loop to resume display for.
     * @param {Boolean=} force  If `true` then forces display to resume regardless of the pause count.
     * @return {Number} The pause count, IE: the number of times resume_display will need to be called to
     * start calling callbacks again. Returns `-1` if web socket isn't started or `render_loop` cannot
     * be found.
     */
    resume_display(render_loop,force=false) {
        if (!this.streaming_loops[render_loop]) {
            return -1;
        }

        if (this.streaming_loops[render_loop].pause_count > 0) {
            if (!!force) {
                this.streaming_loops[render_loop].pause_count = 0;
            } else {
                this.streaming_loops[render_loop].pause_count--;
            }
        }

        return this.streaming_loops[render_loop].pause_count;
    }

    /**
     * Returns the pause count for the given render loop.
     *
     * @param {String} render_loop The name of the render loop to get the pause count for.
     * @return {(Number|Boolean)} The pause count, or `false` if the render loop is not streaming.
     * When evaluated in a truthy way will be `true` if paused and `false` if not
     */
    is_display_paused(render_loop) {
        if (!this.streaming_loops[render_loop]) {
            return false;
        }

        return this.streaming_loops[render_loop].pause_count;
    }

    /**
     * Returns `true` if we are currently streaming the given render loop.
     * @param {String} render_loop The name of the render loop to check.
     * @return {Boolean} `true` if streaming, `false` if not or unknown.
     */
    streaming(render_loop) {
        return !!this.streaming_loops[render_loop];
    }

    /**
     * Utility function to update the camera on a given render loop.
     *
     * The returned promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - no data is provided.
     * - updating the camera infomration failed
     * @endcode
     * @param {String} render_loop The name of the render loop to change the camera on.
     * @param {Object} data Object specifying the camera to update. Supported format is:
     * @param {Object=} data.camera Properties to update on the camera
     * @param {String} data.camera.name The name of the camera to update
     * @param {Number=} data.camera.aperture - The aperture width of the camera.
     * @param {Number=} data.camera.aspect - The aspect ratio of the camera.
     * @param {Number=} data.camera.clip_max - The yon clipping distance.
     * @param {Number=} data.camera.clip_min - The hither clipping distance.
     * @param {Number=} data.camera.focal - The focal length to set.
     * @param {Number=} data.camera.frame_time - The frame time of the camera, in seconds.
     * @param {Number=} data.camera.offset_x - The horizontal plane shift.
     * @param {Number=} data.camera.offset_y - The vertical plane shift.
     * @param {Number=} data.camera.orthographicn - If the camera is orthographic or not.
     * @param {Number=} data.camera.resolution_x - The width of the camera.
     * @param {Number=} data.camera.resolution_y - The height of the camera.
     * @param {Number=} data.camera.window_xh - The right edge of the render sub-window in raster space.
     * @param {Number=} data.camera.window_xl - The left edge of the render sub-window in raster space.
     * @param {Number=} data.camera.window_yh - The top edge of the render sub-window in raster space.
     * @param {Number=} data.camera.window_yl - The bottom edge of the render sub-window in raster space.
     * @param {Object=} data.camera.attributes - Arbitrary attributes to set on the camera. Property names are
     * the attribute names to set. Each property value should be an object containing the following:
     * @param {*} data.camera.attributes.value - The attribute value to set.
     * @param {String} data.camera.attributes.type - The type of the attribute to set.
     * @param {Object=} data.camera_instance Properties to update on the camera instance.
     * @param {String} data.camera_instance.name The name of the camera instance to update.
     * @param {RS.Math.Matrix4x4=} data.camera_instance.transform - The camera instance transform to set
     * @param {Object=} data.camera_instance.attributes - Arbitrary attributes to set on the camera instance. Property
     * names are the attribute names to set. Each property value should be an object containing the following:
     * @param {*} data.camera_instance.attributes.value - The attribute value to set.
     * @param {String} data.camera_instance.attributes.type - The type of the attribute to set.
     * @return {Promise} A promise that resolves with the result of the camera update.
     */
    update_camera(render_loop, data) {
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

            if (typeof render_loop === 'string' || render_loop instanceof String) {
                render_loop = {
                    render_loop_name : render_loop
                };
            }
            render_loop.camera = data.camera;
            render_loop.camera_instance = data.camera_instance;

            this.send_ws_command('set_camera',render_loop,response => {
                if (response.error) {
                    reject(response.error.message);
                } else {
                    resolve(response.result);
                }
            });
        });
    }

    /**
     * Returns a {@link RS.Command_queue} that can be used to queue up a series of commands to
     * be executed.
     * @param {(State_data|Render_loop_state_data)=} state if provided then this is used as the state for
     * executing the commands. If not then the default service state is used.
     * @return {RS.Command_queue}
     */
    queue_commands(state=null) {
        return new Command_queue(this,state || this.default_state_data);
    }

    /**
     * Executes a single command and returns a promise that resolves to an iterable. The iterable will
     * contain up to 2 results
     * - if `want_response` is `true` then the first iterable will be the {@link RS.Response} of the command.
     * - if `wait_for_render` is `true` and the state executes the command on a render loop then
     * the promise will resolve to a {@link RS.Service~Rendered_image} when the command results are about
     * to appear in a render
     * @param {RS.Command} command - The command to execute.
     * @param {Boolean=} want_response - If `true` then the returned promise resolves to the response of the
     * command. If `false` then the promise resolves immediately to `undefined`.
     * @param {Boolean=} wait_for_render - If `true`, and the state executes the command on a render loop then
     * a promise is returned that resolves just before the command results appear in a render.
     * @param {(State_data|Render_loop_state_data)=} state - If provided then this is used as the state to execute the
     * command. If not then the default service state is used.
     * @return {Promise} A promise that resolves to an iterable.
     */
    execute_command(command,want_response=false,wait_for_render=false,state=null) {
        return new Command_queue(this,state || this.default_state_data)
            .queue(command,want_response)
            .execute(wait_for_render);
    }

    /**
     * Sends a single command and returns an `Object` containing promises that will resolve with the results.
     * @param {RS.Command} command - The command to execute.
     * @param {Boolean=} want_response - If `true` then the `reponses` promise resolves to the response of the
     * command. If `false` then the promise resolves immediately to undefined.
     * @param {Boolean=} wait_for_render - If `true`, and the state executes the command on a render loop then
     * the `render` promise resolves to a {@link RS.Service~Rendered_image} just before the command results
     * appear in a render.
     * @param {(State_data|Render_loop_state_data)=} state - If provided then this is used as the state to execute the
     * command. If not then the default service state is used.
     * @return {Object} An object with 2 properties:
     * - `responses` a `Promise` that will resolve with the response of the command.
     * - `render`: a `Promise` that resolves when the result is about to be displayed.
     */
    send_command(command,want_response=false,wait_for_render=false,state=null) {
        return new Command_queue(this,state || this.default_state_data)
            .queue(command,want_response)
            .send(wait_for_render);
    }

    /**
     * Sends a command queue
     * @access private
     * @param {RS.Command_queue} command_queue - The command queue to send
     * @return {Promise|Object} a promise or object depending on whether resolve_all is set on the
     * command queue.
     */
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

        if (command_queue.state_data.render_loop_name) {
            execute_args = {
                commands: command_queue.commands,
                render_loop_name: command_queue.state_data.render_loop_name,
                continue_on_error: command_queue.state_data.continue_on_error,
                cancel: command_queue.state_data.cancel,
            };
            if (wait_for_render) {
                let stream = this.streaming_loops[execute_args.render_loop_name];
                if (stream) {
                    const promise = new Delayed_promise();
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
                return Promise.reject('Commands wants a render handler but are not executing on a render loop');
            }
            execute_args = {
                commands: command_queue.state_data.state_commands ?
                    command_queue.state_data.state_commands.concat(command_queue.commands) :
                    command_queue.commands,
                url: command_queue.state_data.path,
                state_arguments: command_queue.state_data.parameters
            };
        }

        function resolve_responses(response) {
            // state data commands will have results as well so we need to compensate for them
            let response_offset = this.state_data.state_commands ? this.state_data.state_commands.length : 0;
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
     * Whether debug mode is used for the WebSocket protocol. When `true` commands and responses are sent in string
     * mode (where possible) for easier debugging over the WebSocket connection. Defaults to `false`.
     * @type {Boolean}
     */
    set debug_commands(enable) {
        this.binary_commands = !enable;
        if (this.web_socket && this.protocol_state !== 'started') {
            // send debug message
            let buffer = new ArrayBuffer(8);
            let message = new DataView(buffer);

            message.setUint32(0,Service.MESSAGE_ID_PREFER_STRING,this.web_socket_littleendian);
            message.setUint32(4,!!enable ? 1 : 0,this.web_socket_littleendian);
            this.web_socket.send(buffer);
        }
    }

    get debug_commands() {
        return !this.binary_commands;
    }

    /**
     * Sets the maximum transfer rate for this stream. Manually setting a maximum rate will be enforced on
     * the server side so a stream will not generate more than the given amount of bandwidth. Automatic rate
     * control will attempt to fill the available bandwidth, but not flood the connection. Note that even if
     * a manual rate is set flood control will still be enabled so setting a max rate larger than the available
     * bandwidth will not overwhelm the connection. Rate control is implemented using frame dropping rather
     * than adjusting image compression settings.
     *
     * The returned promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - Setting the max rate failed.
     * @param {Number} max_rate - The maximum rate in bytes per second. Set to `0` to use automatic rate
     * control (the default) or `-1` to disable rate control entirely.
     * @return {Promise} A promise that resolves when the max rate has been set.
     */
    set_max_rate(max_rate) {
        return new Promise((resolve, reject) => {
            if (!this.web_socket) {
                reject('Web socket not connected.');
                return;
            }
            if (this.protocol_state !== 'started') {
                reject('Web socket not started.');
                return;
            }

            if (!max_rate) {
                max_rate = 0;
            }

            let args = {
                rate: max_rate
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
};

module.exports = Service;
