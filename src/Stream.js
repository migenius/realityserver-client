/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
import { EventEmitter } from './Utils';
import RS_error from './Error';
import Command_queue from './Command_queue';
import Render_loop_state_data from './internal/Render_loop_state_data';
import Service from './Service';
import Delayed_promise from './internal/Delayed_promise';

/**
 * Represents an image stream from a render loop.
 *
 * *NOTE:* Users do not create `Streams` directly, streams are obtained using
 * {@link RS.Service#stream}
 * @memberof RS
 * @extends RS.Utils.EventEmitter
 * @hideconstructor
 */
class Stream extends EventEmitter {
    /**
     * Creates Stream  class.
     * @param {RS.Service} the service
     * @hideconstructor
     */
    constructor(service) {
        super();
        this.service = service;
        this.sequence_promises = [];
        this.pause_count = 0;
        this._render_loop_name = undefined;

        this.state_data = new Render_loop_state_data();
    }

    /**
     * A single image of a render result.
     * @typedef {Object} RS.Stream~Rendered_image
     * @property {Number} width - The image width.
     * @property {Number} height - The image height.
     * @property {Uint8Array} image - The rendered image
     * @property {String} mime_type - The mime type of the rendered image.
     * @property {String} render_type - The renderer defined type for the image. Typically 'result'.
     */

    /**
     * The result of an image render.
     * @typedef {Object} RS.Stream~Rendered_result
     * @property {String} render_loop_name - The name of the render loop this image was rendered by.
     * @property {Number} result - The render result, `0` for success, `1` for converged,
     * `-1` cancelled render, other negative values indicate errors.
     * @property {RS.Stream~Rendered_image[]} images - An array of images that have been rendered.
     * @property {Object} statistics - Rendering statistics.
     */

    /**
     *
     * The name of the render loop this stream is providing images from. Is
     * \c undefined if the stream has not yet been started.
     * @type {String}
     * @readonly
     */
    get render_loop_name() {
        return this._render_loop_name;
    }

    /**
     * The pause count for this stream.
     * When evaluated in a truthy manner will be `true` if paused and `false` if not.
     *
     * @type {Number}
     * @readonly
     */
    get paused() {
        return this.pause_count;
    }

    /**
     * Whether this loop is streaming or not.
     * @type {Boolean}
     */
    get streaming() {
        return this.render_loop_name && this.service.streaming(this.render_loop_name);
    }

    /**
     * When commands are executed on a stream the actual execution occurs between renders.
     * Consequently there can be a (possibly considerable) delay before execution occurs.
     * Specifying a cancel level causes any current render to be cancelled so command execution
     * can occur as soon as possible. If set to `0` then rendering is cancelled, and if possible
     * rendering continues without restarting progression. If `1` then cancelling will occur faster
     * at the expense of always needing to restart. Any other value will not cancel rendering when
     * executing commands
     * @type {Number}
     * @default -1
     */
    get cancel_level() {
        return this.state_data.cancel;
    }

    set cancel_level(value) {
        this.state_data.cancel = value;
    }

    /**
     * Controls error handling when an error occurs during command execution.
     * If `true` then commands will continue to be processed, if `false`
     * processing will end at the first error and any subsequent commands
     * will be aborted and get error resposes. Defaults to true.
     * @type {Boolean}
     * @default true
     */
    get continue_on_error() {
        return this.state_data.continue_on_error;
    }

    set continue_on_error(value) {
        this.state_data.continue_on_error = value;
    }

    /**
     * Starts streaming images from a render loop on this stream. Note that a stream can only
     * stream images from one render loop at a time. Returns a promise that resolves when the stream has started.
     * The promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - if the given render loop is already being streamed by this service.
     * - starting the stream failed, usually this occurs if the render loop cannot be found or invalid streaming
     * data is provided.
     *
     * Once the stream has started {@link RS.Stream#event:image} events will be emitted on both the stream
     * object and the original {@link RS.Service} object every time a rendered image is received from the server.
     *
     * Starting from version 2.0.1 the special `image_format` value of `NONE` can be supplied. This will
     * establish a 'command and control' stream that will not send images to the client but can still
     * be used to edit the RealityServer scene. Note that it is not possible to start or stop streaming
     * images once a stream has started.
     *
     * @param {String|Object} render_loop If a `String` then the name of the render loop to stream. Provide an
     * object to specify additional streaming data.
     * @param {String} render_loop.render_loop_name - the name of the render loop to stream.
     * @param {String=} render_loop.image_format - the streamed image format.
     * @param {String=} render_loop.pixel_type - the streamed image pixel type.
     * @param {String=} render_loop.quality - the streamed image quality.
     * @param {Boolean=} render_loop.pause_state - whether render loop pause state events {@link RS.Service#event:progress}
     * should be generated whenever the render loop is paused or resumed. The event id will be in the format
     * `[render_loop_name]::pause` and the area will be `pause_state`. The progress field will be one of: `0` (running),
     * `1` (entering paused state), `2` (paused). The message field will be empty. This option is off by default.
     * Supported in RealityServer 6.4 3508.349 or later.
     * @param {Boolean=} render_loop.render_progress - whether rendering progress events {@link RS.Service#event:progress}
     * should be generated whenever an image is being rendered. The event id will be in the format `[render_loop_name]::render`.
     * This option is off by default. Supported in RealityServer 6.4 3508.349 or later.
     * @param {Object=} render_loop.encoders - an object containing named stream encoder settings,
     * each defining image_format, pixel_type and quality parameters. Note that all possible named encoders
     * must be specified at start time. It is not possible to add new named encoders using
     * {@link RS.Stream#set_parameters}, only modify existing settings.
     * @return {Promise} A promise that resolves when the stream has started.
     * @fires RS.Stream#image
     */
    start(render_loop) {
        return new Promise((resolve, reject) => {
            if (!this.service.validate(reject)) {
                return;
            }
            if (this.streaming) {
                reject(new RS_error('Render loop is already streaming.'));
            }

            if (typeof render_loop === 'string' || render_loop instanceof String) {
                render_loop = {
                    render_loop_name: render_loop
                };
            }

            this.service.send_ws_command('start_stream', render_loop, response => {
                if (response.error) {
                    reject(new RS_error(response.error.message));
                } else {
                    this._render_loop_name = render_loop.render_loop_name;
                    this.state_data.render_loop_name = this.render_loop_name;
                    this.service.add_stream(this);

                    resolve();
                }
            });
        });
    }

    /**
     * Stops streaming from a render loop.
     * @return {Promise} A promise that resolves when the stream is stopped or rejects
     * on error.
     */
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.service.validate(reject)) {
                return;
            }
            if (!this.streaming) {
                reject(new RS_error('Not streaming.'));
            }
            this.service.send_ws_command('stop_stream', { render_loop_name: this.render_loop_name }, response => {
                if (response.error) {
                    reject(new RS_error(response.error.message));
                } else {
                    this.service.remove_stream(this.render_loop_name);
                    this.state_data.render_loop_name = undefined;
                    resolve(response.result);
                }
            });
        });
    }

    /**
     * Pauses emiting {@link RS.Service#event:image} events for this stream. Note the images are still transmitted from
     * the server, the callback is just not called. Pause calls are counted so you need to call
     * {@link RS.Stream#resume} the same number of times as pause before events are emitted begins again.
     * @return {Number} The pause count, IE: the number of times resume will need to be called to
     * start emitting events again.
     */
    pause() {
        return ++this.pause_count;
    }

    /**
     * Resumes emiting {@link RS.Service#event:image} events for this stream if the pause count has reduced to `0`.
     *
     * @param {Boolean=} force  If `true` then forces display to resume regardless of the pause count.
     * @return {Number} The pause count, IE: the number of times resume will need to be called to
     * start emitting events again.
     */
    resume(force=false) {
        if (this.pause_count > 0) {
            if (!!force) {
                this.pause_count = 0;
            } else {
                this.pause_count--;
            }
        }

        return this.pause_count;
    }

    /**
     * Sets parameters on a stream. Returns a promise that resolves with the parameters have been set.
     * The returned promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - this stream is not yet streaming
     * - updating the parameters failed
     * @param {Object} parameters The parameter to set. Supported parameters include:
     * @param {String=} parameters.encoder_name - the name of the stream encoder to modify or the default encoder
     * if omitted.
     * @param {String=} parameters.image_format - the streamed image format.
     * @param {String=} parameters.pixel_type - the streamed image pixel type.
     * @param {String=} parameters.quality - the streamed image quality.
     * @param {Boolean=} parameters.pause_state - whether render loop pause state events {@link RS.Service#event:progress}
     * should be generated whenever the render loop is paused or resumed. The event id will be in the format
     * `[render_loop_name]::pause` and the area will be `pause_state`. The progress field will be one of: `0` (running),
     * `1` (entering paused state), `2` (paused). The message field will be empty. This option is off by default.
     * Supported in RealityServer 6.4 3508.349 or later.
     * @param {Boolean=} parameters.render_progress - whether rendering progress events {@link RS.Service#event:progress}
     * should be generated whenever an image is being rendered.  The event id will be in the format `[render_loop_name]::render`.
     * This option is off by default. Supported in RealityServer 6.4 3508.349 or later.
     * @param {Object=} parameters.encoders - named encoder parameters.
     * @return {Promise} A promise that resolves with the set parameter response or rejects with
     * the error message.
     */
    set_parameters(parameters) {
        return new Promise((resolve, reject) => {
            if (!this.service.validate(reject)) {
                return;
            }
            if (!this.streaming) {
                reject(new RS_error('Not streaming.'));
            }
            const args = Object.assign(
                {
                    render_loop_name: this.render_loop_name
                },
                parameters
            );
            this.service.send_ws_command('set_stream_parameters', args, response => {
                if (response.error) {
                    reject(new RS_error(response.error.message));
                } else {
                    resolve(response.result);
                }
            });
        });
    }

    /**
     * Utility function to update the camera on this stream's render loop.
     *
     * While it is possible to simply use individual commands to update the
     * camera this method is more efficient as changes will be collated on the
     * server and applied as a single update between render calls.
     *
     * The returned promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - this stream is not yet streaming
     * - no data is provided.
     * - updating the camera information failed
     * - wait for render is true but the connected RealityServer does not support this with
     * update camera.
     * @endcode
     * @param {Object} data Object specifying the camera to update. Supported format is:
     * @param {Number=} data.cancel_level - Cancel level to use when updating.
     * @param {Boolean=} data.wait_for_render - If true then the promise will resolve when the new camera
     * data is available in a rendered image.
     * @param {Object=} data.camera - Properties to update on the camera
     * @param {String} data.camera.name - The name of the camera to update
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
     * @return {Promise} A promise that resolves with the result of the camera update or when the camera
     * data is available in a render if \c wait_for_render is c true.
     */
    update_camera(data) {
        const promise = new Delayed_promise();

        if (!this.service.validate(promise.reject)) {
            return promise.promise;
        }
        if (!this.streaming) {
            promise.reject(new RS_error('Not streaming.'));
            return promise.promise;
        }

        if (!data) {
            promise.reject(new RS_error('No data object provided.'));
            return promise.promise;
        }

        const args = {
            render_loop_name: this.render_loop_name,
            camera: data.camera,
            camera_instance: data.camera_instance,
            cancel_level: data.cancel_level
        };
        if (data.wait_for_render) {
            if (this.service.protocol_version < 5) {
                promise.reject(new RS_error('Connected RealityServer does not support wait for render ' +
                                        'with camera updates. Update to RealityServer 6 to use ' +
                                        'this feature.'));
                return promise.promise;
            }
            args.sequence_id = ++Service.sequence_id;
            this.sequence_promises.push({
                sequence_id: args.sequence_id,
                delayed_promise: promise
            });
        }

        this.service.send_ws_command('set_camera', args, response => {
            if (response.error) {
                promise.reject(new RS_error(response.error.message));
            } else {
                // promise will resolve when camera is in the render
                if (!data.wait_for_render) {
                    promise.resolve(response.result);
                }
            }
        });

        return promise.promise;
    }

    /**
     * Executes a pick operation on the render loop. The returned promise resolves with an array of
     * pick results. If no objects were under the point then the array will be empty.
     *
     * Note that stream picking is only supported in RealityServer 6.2 and above.
     *
     * The returned promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - this stream is not yet streaming
     * - no position is provided.
     * - arguments are the wrong type or \p position has a negative coordinate
     * - the render loop is no longer available.
     * - the connected RealityServer does not support picking on a stream.
     * @deprecated This variant of pick is deprecated in favour of the two argument version below.
     * @param {Vector2} position The screen space position of the pick.
     * @param {Vector2=} size The screen space rectangular size of the pick. Defaults to a 1x1 pixel area.
     * @param {Number=} cancel_level - The cancel level override. Defaults to 1.
     * @return {Promise} A `Promise` that resolves to an array of pick results. Each element
     *                   in the pick result array will be an object containing the following properties:
     *                   world_point (Vector3), picked_object_name (String), path (String[]).
     *//**
     * Executes a pick operation on the render loop. The returned promise resolves with an array of
     * pick results. If no objects were under the point then the array will be empty.
     *
     * Note that stream picking is only supported in RealityServer 6.2 and above.
     *
     * The returned promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - this stream is not yet streaming
     * - no position is provided.
     * - arguments are the wrong type or \p position has a negative coordinate
     * - the render loop is no longer available.
     * - the connected RealityServer does not support picking on a stream.
     * @param {Object} pick Object defining what to pick
     * @param {Vector2} pick.position The screen space position of the pick.
     * @param {Vector2=} pick.size The screen space rectangular size of the pick. Defaults to a 1x1 pixel area.
     * @param {Number=} pick.max_levels Controls the number of rays that may be cast, per ray, during the
     *                   picking operation. A level of 1 will only trace primary rays. Any other value
     *                   will continue tracing rays through the scene until nothing was hit or the maximum
     *                   depth is exhausted, with a value of 0 indicating unconstrained depth. This parameter
     *                   has no effect when using versions of RealityServer prior to 6.3.
     * @param {Object=} pick.params Render loop handler defined parameters used to control the pick operation.
     * @param {Number=} cancel_level - The cancel level override. Defaults to 1.
     * @return {Promise} A `Promise` that resolves to an array of pick results. Each element
     *                   in the pick result array will be an object containing the following properties:
     *                   world_point (Vector3), picked_object_name (String), path (String[]).
     */
    pick(pick, cancel_level = null) {

        const promise = new Delayed_promise();
        if (!this.service.validate(promise.reject)) {
            return promise.promise;
        }

        if (this.service.protocol_version < 6) {
            promise.reject(new RS_error(
                'Connected RealityServer does not support pick command. ' +
                'Update to RealityServer 6.2 to use this feature.'));
            return promise.promise;
        }

        if (!this.streaming) {
            promise.reject(new RS_error('Not streaming.'));
            return promise.promise;
        }

        if (!pick.position) {
            pick = {
                position: arguments[0],
                size: arguments[1]
            };
            cancel_level = arguments[2];
        }

        if (!pick.position) {
            promise.reject(new RS_error('No position provided.'));
            return promise.promise;
        }

        const args = {
            render_loop_name: this.render_loop_name,
            position: pick.position
        };

        if (pick.size !== null && pick.size !== undefined) {
            args.size = pick.size;
        }

        if (pick.max_levels !== null && pick.max_levels !== undefined) {
            args.max_levels = pick.max_levels;
        }

        if (pick.params !== null && pick.params !== undefined) {
            args.params = pick.params;
        }

        if (cancel_level !== null && cancel_level !== undefined) {
            args.cancel_level = cancel_level;
        }

        this.service.send_ws_command('pick', args, response => {
            if (response.error) {
                promise.reject(new RS_error(response.error.message));
            } else {
                promise.resolve(response.result);
            }
        });

        return promise.promise;
    }

    /**
     * Returns the state data to use.
     * @param {Number=} cancel_level - cancel level override
     * @param {Boolean=} continue_on_error - continue on error override
     * @return {RS.Render_loop_state_data}
     * @access private
     */
    get_state_data(cancel_level=null, continue_on_error=null) {
        let state_data = this.state_data;
        if ((cancel_level !== null && cancel_level !== this.cancel_level) ||
            (continue_on_error !== null && !!continue_on_error !== this.continue_on_error)) {
            state_data = new Render_loop_state_data(
                this.render_loop_name,
                cancel_level !== null ? cancel_level : this.cancel_level,
                continue_on_error !== null ? continue_on_error : this.continue_on_error);
        }
        return state_data;
    }

    /**
     * Returns a {@link RS.Command_queue} that can be used to queue up a series of commands to
     * be executed on this render loop
     * @param {Object=} options
     * @param {Boolean=} options.wait_for_render - If `true` then when this queue is executed it will also
     * generate a `Promise` that will resolve when the
     * {@link RS.Service#event:image} event that contains the results of the commands is about to be emitted.
     * @param {Number} [options.cancel_level=this.cancel_level] - If provided then this overrides the streams
     * cancel level.
     * @param {Boolean} [options.continue_on_error=this.continue_on_error] - If provided then this overrides the streams
     * continue on error.
     * @return {RS.Command_queue} The command queue to add commands to and then execute.
     */
    queue_commands({ wait_for_render=false, cancel_level=null, continue_on_error=null }={}) {
        return new Command_queue(this.service, wait_for_render, this.get_state_data(cancel_level, continue_on_error));
    }

    /**
     * Executes a single command on this render loop and returns a `Promise` that resolves to an iterable.
     * The iterable will contain up to 2 results
     * - if `want_response` is `true` then the first iterable will be the result of the command or a
     * {@link RS.Command_error}.
     * - if `wait_for_render` is `true` then the last iterable will be a {@link RS.Stream~Rendered_result} containing
     * the first rendered image that contains the result of the command.
     *
     * The promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * @param {RS.Command} command - The command to execute.
     * @param {Object=} options
     * @param {Boolean=} options.want_response - If `true` then the returned promise will not resolve until the command
     * response is available and the response will be in the first iterable.
     * @param {Boolean=} options.wait_for_render - If `true`, the promise will not resolve until the
     * {@link RS.Service#event:image} event that contains the result of this command is about to be emitted. The
     * last iterable in the resolved value will be contain the rendered image.
     * @param {Number} [options.cancel_level=this.cancel_level] - If provided then this overrides the streams
     * cancel level.
     * @param {Boolean} [options.continue_on_error=this.continue_on_error] - If provided then this overrides the streams
     * continue on error.
     * @return {Promise} A `Promise` that resolves to an iterable.
     * @fires RS.Service#command_requests
     * @fires RS.Service#command_results
     */
    execute_command(command, {
        want_response=false,
        wait_for_render=false,
        cancel_level=null,
        continue_on_error=null
    } = {}) {
        return new Command_queue(this.service, wait_for_render, this.get_state_data(cancel_level, continue_on_error))
            .queue(command, want_response)
            .execute();
    }

    /**
     * Sends a single command to execute on this render loop and returns an `Array` of `Promises` that will resolve
     * with the responses. The array will contain up to 2 `Promises`.
     * - if `want_response` is `true` then the first `Promise` will resolve to the result of the command or a
     * {@link RS.Command_error}.
     * - if `wait_for_render` is `true` then the last `Promise` will resolve to a {@link RS.Stream~Rendered_image} when
     * the first rendered image that contains the results of the commands is generated.
     * @param {RS.Command} command - The command to execute.
     * @param {Object=} options
     * @param {Boolean=} options.want_response - If `true` then the `reponse` promise resolves to the response of the
     * command. If `false` then the promise resolves immediately to undefined.
     * @param {Boolean=} options.wait_for_render - If `true`, then the `render` promise resolves to a
     * {@link RS.Stream~Rendered_result} just before the {@link RS.Service#event:image} event that contains the
     * result of this command is emitted.
     * @param {Number} [options.cancel_level=this.cancel_level] - If provided then this overrides the streams
     * cancel level.
     * @param {Boolean} [options.continue_on_error=this.continue_on_error] - If provided then this overrides the streams
     * continue on error.
     * @return {Promise[]} An `Array` of `Promises`. These promises will not reject.
     * @throws {RS.Error} This call will throw an error in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * @fires RS.Service#command_requests
     * @fires RS.Service#command_results
     */
    send_command(command, {
        want_response=false,
        wait_for_render=false,
        cancel_level=null,
        continue_on_error=null
    } = {}) {
        return new Command_queue(this.service, wait_for_render, this.get_state_data(cancel_level, continue_on_error))
            .queue(command, want_response)
            .send(wait_for_render);
    }
}

export default Stream;
