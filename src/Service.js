/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Web_socket_message_reader = require('./Utils/Web_socket_message_reader');
const Web_socket_message_writer = require('./Utils/Web_socket_message_writer');
const Delayed_promise = require('./Utils/Delayed_promise');
const Command_queue = require('./Command_queue');
const { EventEmitter } = require('./Helpers');
const State_data = require('./State_data');
const Response = require('./Response');
const RS_error = require('./Error');
const Stream = require('./Stream');

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
 * @extends RS.Helpers.EventEmitter
 */
class Service extends EventEmitter {
    /**
     * Creates the service class.
     * @param {RS.State_data=} default_state_data the default state data to use
     */
    constructor(default_state_data=null) {
        super();
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
    * then this is the state data that will be used.
    * @type {State_data}
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
     * `ws[s]://HOST::PORT/service/`. If not a string then must be an object that implements the
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
                    reject(new RS_error('Websockets not supported.'));
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
                    reject(e instanceof Error ? e : new RealityServerError(e));
                    return;
                }
            } else {
                this.web_socket = url;
            }
            this.protocol_state = 'prestart';
            this.web_socket_littleendian = true;
            this.command_id = 0;
            this.response_handlers = {};
            this.streams = {};
            this.protocol_version = 0;
            this.web_socket.binaryType = 'arraybuffer';

            let scope = this;

            this.web_socket.onopen = event => {
                event;
            };
            this.web_socket.onclose = event => {
                scope.protocol_state = 'prestart';
                scope.web_socket.onmessage = undefined;
                scope.web_socket = undefined;
                /**
                 * Close event.
                 *
                 * Emitted when the web socket connection is closed.
                 *
                 * @event RS.Service#close
                 * @param {CloseEvent} event The underlying WebSocket close event.
                 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
                 */
                scope.emit('close',event);
            };
            this.web_socket.onerror = err => {
                err;
                reject(new RS_error('WebSocket connection error.'));
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
            function emit_image_event(stream,data) {
                if (!stream.pause_count) {
                    /**
                     * Image event.
                     *
                     * Fired whenever a renderer image is available on a stream.
                     * This event will be fired on {@link RS.Service} for all streams
                     * and on each individual {@link RS.Stream}
                     *
                     * @event RS.Service#image
                     * @param {RS.Service~Rendered_image} image The rendered image
                     */
                    scope.emit('image',data);
                    stream.emit('image',data);
                }
            }
            function process_received_render(message,now) {
                const result = message.getSint32();
                // render loop name
                const render_loop_name = message.getString();
                const stream = scope.streams[render_loop_name];
                if (stream === undefined) {
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
                        if (stream.last_render_time) {
                            stats['fps'] = 1 / (now - stream.last_render_time);
                        }
                        stream.last_render_time = now;
                        const data = {
                            result: result,
                            width: img_width,
                            height: img_height,
                            mime_type: mime_type,
                            image: image,
                            statistics: stats,
                            render_loop_name: stream.render_loop_name
                        };
                        // Process any command promises that are resolved by this render.
                        const command_promises = [];
                        if (stats.sequence_id > 0) {
                            while (stream.command_promises.length &&
                              stream.command_promises[0].sequence_id <= stats.sequence_id) {
                                const handler = stream.command_promises.shift();
                                handler.delayed_promise.resolve(data);
                                command_promises.push(handler.promise);
                            }
                        }
                        // Any command promises resolved above will not have their resolve
                        // functions called until the next tick. So if there are any we
                        // must wait until they are complete before emitting the image event
                        // giving them a chance to unpause the stream.
                        if (command_promises.length) {
                            Promise.all(command_promises).then(() => {
                                emit_image_event(stream,data);
                            });
                        } else {
                            emit_image_event(stream,data);
                        }
                    }
                } else {
                    emit_image_event(stream,data);
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
                        scope.web_socket.close(1002,'Invalid handshake response');
                        reject(new RS_error('Unexpected handshake header, ' +
                                            'does not appear to be a RealityServer connection.'));
                    } else {
                        // check that the protcol version is acceptable
                        const protocol_version = data.getUint32(8, scope.web_socket_littleendian);
                        if (protocol_version < 2 || protocol_version > 2) {
                            // unsupported protocol, can't go on
                            scope.web_socket.close();
                            reject(new RS_error(protocol_version < 2 ?
                                'RealityServer version unsupported, upgrade your RealityServer.' :
                                'RealityServer WebSocket protocol version not supported.'));
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
                    scope.web_socket.close(1002,'Handshake response not binary');
                    reject(new RS_error('unexpected data during handshake'));
                }
            }
            function web_socket_prestart(event) {
                // remove on error as we're now connected
                scope.web_socket.onerror = undefined;
                // expecting a handshake message
                if (event.data instanceof ArrayBuffer) {
                    let now = Service.now();
                    if (event.data.byteLength !== 40) {
                        scope.web_socket.close(1002,'Invalid handshake size');
                        reject(new RS_error('Invalid handshake header size'));
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
                        scope.web_socket.close(1002,'Not a RealityServer handshake');
                        reject(new RS_error('Invalid handshake header, ' +
                                            'does not appear to be a RealityServer connection.'));
                    } else {
                        scope.web_socket_littleendian = data.getUint8(8) === 1 ? true : false;
                        const protocol_version = data.getUint32(12, scope.web_socket_littleendian);
                        if (protocol_version < 2 || protocol_version > 2) {
                            // unsupported protocol, let's ask for what we know
                            protocol_version = 2;
                        }
                        // get server time
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
                    this.web_socket.close(1002,'Handshake header not binary');
                    reject(new RS_error('Unexpected data during handshake, ' +
                                            'does not appear to be a RealityServer connection.'));
                }
            }
            this.web_socket.onmessage = web_socket_prestart;
        });
    }

    /**
     * Closes the WebSocket connection
     * @param {Number=} code - Code indicating the reason for closing the connection. Default value indicates
     * normal closure
     * @param {String=} reason - Explanation of why we are closing, must be less than 128 UTF8 bytes.
     * @fires RS.Service#close
     * @see [WebSocket Status Codes](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes)
     */
    close(code=1000,reason='User request') {
        this.web_socket.close(code,reason);
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
            id: command_id
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
     * Creates a stream that can be used to receive rendered images from a render loop. A single web socket connection
     * can stream from multiple render loops simultaneously however a given render loop can only be streamed once
     * over a given web socket. Returns a {@link RS.Stream} which can then have a stream started on it.
     * @return {RS.Stream} A stream instance
     */
    create_stream() {
        return new Stream(this);
    }

    /**
     * The result of an image render.
     * @typedef {Object} RS.Service~Rendered_image
     * @property {String} render_loop_name - The name of the render loop this image was rendered by.
     * @property {Number} result - The render result, `0` for success, `1` for converged,
     * `-1` cancelled render, other negative values indicate errors.
     * @property {Number} width - The image width.
     * @property {Number} height - The image height.
     * @property {Uint8Array} image - The rendered image
     * @property {String} mime_type - The mime type of the rendered image.
     * @property {Object} statistics - Rendering statistics.
     */

    /**
     * Validates that the service is up and running.
     * @param {Function=} reject - An optional reject function
     * @return {Boolean} - `true` if valid, `false` if not.
     * @access private
     */
    validate(reject=null) {
        if (!this.web_socket) {
            if (reject) {
                reject(new RS_error('Web socket not connected.'));
            }
            return false;
        }
        if (this.protocol_state !== 'started') {
            if (reject) {
                reject(new RS_error('Web socket not started.'));
            }
            return false;
        }
        return true;
    }


    /**
     * Adds a stream to the service
     * @param {RS.Stream} stream The stream to add.
     * @access private
     */
    add_stream(stream) {
        this.streams[stream.render_loop_name] = stream;
    }

    /**
     * Removes a stream from the service
     * @param {String} render_loop_name The name of the render loop to remove.
     * @access private
     */
    remove_stream(render_loop_name) {
        delete this.streams[render_loop_name];
    }

    /**
     * Returns `true` if we are currently streaming the given render loop.
     * @param {String} render_loop_name The name of the render loop to check.
     * @return {Boolean} `true` if streaming, `false` if not or unknown.
     */
    streaming(render_loop_name) {
        return !!this.streams[render_loop_name];
    }

    /**
     * Returns a {@link RS.Command_queue} that can be used to queue up a series of commands to
     * be executed.
     * @param {Object=} options
     * @param {State_data=} options.state - If provided then this is used as the state for
     * executing the commands. If not then the default service state is used.
     * @return {RS.Command_queue} The command queue to add commands to and then execute.
     */
    queue_commands({ state=null }={}) {
        return new Command_queue(this,false,state || this.default_state_data);
    }

    /**
     * Executes a single command and returns a `Promise` that resolves to an iterable. The iterable will
     * contain a single result which will be the {@link RS.Response} of the command.
     *
     * The promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * @param {RS.Command} command - The command to execute.
     * @param {Object=} options
     * @param {Boolean=} options.want_response - If `true` then the returned promise resolves to the response of the
     * command. If `false` then the promise resolves immediately to `undefined`.
     * @param {State_data=} options.state - If provided then this is used as the state to
     * execute the command. If not then the default service state is used.
     * @return {Promise} A `Promise` that resolves to an iterable.
     */
    execute_command(command,{ want_response=false,state=null }={}) {
        return new Command_queue(this,false,state || this.default_state_data)
            .queue(command,want_response)
            .execute();
    }

    /**
     * Sends a single command and returns an `Array` of `Promises` that will resolve with the responses.
     * The array will contain up to 1 `Promise`.
     * - if `want_response` is `true` then the first `Promise` will resolve to the {@link RS.Response} of the command.
     * - otherwise the array will be empty.
     * @param {RS.Command} command - The command to execute.
     * @param {Object=} options
     * @param {Boolean=} options.want_response - If `true` then the `reponses` promise resolves to the response of the
     * command. If `false` then the promise resolves immediately to undefined.
     * @param {State_data=} options.state - If provided then this is used as the state to
     * execute the command. If not then the default service state is used.
     * @return {Promise[]} An `Array` of `Promises`. These promises will not reject.
     * @throws {RS.Error} This call will throw an error in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     */
    send_command(command,{ want_response=false,state=null }={}) {
        return new Command_queue(this,false,state || this.default_state_data)
            .queue(command,want_response)
            .send();
    }

    /**
     * Sends a command queue
     * @access private
     * @param {RS.Command_queue} command_queue - The command queue to send
     * @return {Promise|Object} a promise or object depending on whether resolve_all is set on the
     * command queue.
     */
    send_command_queue(command_queue) {
        const { wait_for_render,resolve_all } = command_queue;

        function throw_or_reject(arg) {
            if (resolve_all) {
                return Promise.reject(arg);
            }
            throw arg;
        }
        if (!command_queue) {
            return throw_or_reject(new RS_error('No command queue provided'));
        }
        if (!this.web_socket) {
            return throw_or_reject(new RS_error('Web socket not connected.'));
        }
        if (this.protocol_state !== 'started') {
            return throw_or_reject(new RS_error('Web socket not started.'));
        }

        if (command_queue.commands.length === 0) {
            // move along, nothing to see here
            return resolve_all ? Promise.all() : [];
        }
        let execute_args;

        const commands = command_queue.commands.map(c => c.command);
        const promises = command_queue.commands.reduce((result,{ response_promise }) => {
            if (response_promise) {
                result.push(response_promise.promise);
            }
            return result;
        },[]);
        if (command_queue.state_data.render_loop_name) {
            execute_args = {
                commands,
                render_loop_name: command_queue.state_data.render_loop_name,
                continue_on_error: command_queue.state_data.continue_on_error,
                cancel: command_queue.state_data.cancel,
            };
            if (wait_for_render) {
                let stream = this.streams[execute_args.render_loop_name];
                if (stream) {
                    const promise = new Delayed_promise();
                    execute_args.sequence_id = ++Service.sequence_id;
                    stream.command_promises.push({
                        sequence_id: execute_args.sequence_id,
                        delayed_promise: promise
                    });
                    promises.push(promise.promise);
                } else {
                    promises.push(Promise.resolve());
                }
            }
        } else {
            if (wait_for_render) {
                return throw_or_reject(new RS_error('Commands want to wait for a rendered image but ' +
                                                    'are not executing on a render loop'));
            }
            execute_args = {
                commands: command_queue.state_data.state_commands ?
                    command_queue.state_data.state_commands.concat(commands) :
                    commands,
                url: command_queue.state_data.path,
                state_arguments: command_queue.state_data.parameters
            };
        }

        function resolve_responses(response) {
            // this is the command queue
            // state data commands will have results as well so we need to compensate for them
            let response_offset = this.state_data.state_commands ? this.state_data.state_commands.length : 0;
            for (let i=response_offset;i<response.result.length;++i) {
                let cmd_idx = i - response_offset;
                if (this.commands[cmd_idx].response_promise) {
                    this.commands[cmd_idx].response_promise.resolve(
                        new Response(this.commands[cmd_idx].command, response.result[i]));
                }
            }
        }

        if ((wait_for_render && promises.length > 1) || promises.length) {
            // we want responses
            this.send_ws_command('execute',execute_args,resolve_responses,command_queue);
        } else {
            this.send_ws_command('execute',execute_args);
        }
        return resolve_all ? Promise.all(promises) : promises;
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
                reject(new RS_error('Web socket not connected.'));
                return;
            }
            if (this.protocol_state !== 'started') {
                reject(new RS_error('Web socket not started.'));
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
                    reject(new RS_error(response.error.message));
                } else {
                    resolve(response.result);
                }
            }
            );
        });
    }
};

module.exports = Service;
