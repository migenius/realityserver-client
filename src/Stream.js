/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const EventEmitter = require('eventemitter3');
const RS_error = require('./Error');

/**
 * Represents an image stream from a render loop.
 *
 * This class will emit {@link RS.Service#event:image} events whenever an image is
 * rendered on the stream. It also provides functionality to manage stream parameters and
 * stop streaming images.
 *
 * *NOTE:* Users do not create `Streams` directly, streams are obtained using
 * {@link RS.Service#stream}
 * @memberof RS
 * @fires RS.Service#image whenever an image is rendered on the stream.
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
        this.command_promises = [];
        this.pause_count = 0;
        this._render_loop_name = undefined;
    }

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
     * Starts streaming images from a render loop on this stream. Note that a stream can only
     * stream images from one render loop at a time. Returns a promise that resolves when the stream has started.
     * The promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - if the given render loop is already being streamed by this service.
     * - starting the stream failed, usually this occurs if the render loop cannot be found or invalid streaming
     * data is provided.
     * @param {String|Object} render_loop If a `String` then the name of the render loop to stream. Provide an
     * object to specify additional streaming data.
     * @param {String} render_loop.render_loop_name - the name of the render loop to stream.
     * @param {String=} render_loop.image_format - the streamed image format.
     * @param {String=} render_loop.quality - the streamed image quality.
     * @return {Promise} A promise that resolves when the stream has started.
     * @fires RS.Service#image
     */
    start(render_loop) {
        return new Promise((resolve,reject) => {
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

            this.service.send_ws_command('start_stream',render_loop,response => {
                if (response.error) {
                    reject(new RS_error(response.error.message));
                } else {
                    this._render_loop_name = render_loop.render_loop_name;
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
        return new Promise((resolve,reject) => {
            if (!this.service.validate(reject)) {
                return;
            }
            if (!this.streaming) {
                reject(new RS_error('Not streaming.'));
            }
            this.service.send_ws_command('stop_stream',{ render_loop_name: this.render_loop_name },response => {
                if (response.error) {
                    reject(new RS_error(response.error.message));
                } else {
                    this.service.remove_stream(this.render_loop_name);
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
     * @param {String=} parameters.image_format - the streamed image format.
     * @param {String=} parameters.quality - the streamed image quality.
     * @return {Promise} A promise that resolves with the set parameter response or rejects with
     * the error message.
     */
    set_parameters(parameters) {
        return new Promise((resolve,reject) => {
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
            this.service.send_ws_command('set_stream_parameters',args, response => {
                if (response.error) {
                    reject(new RS_error(response.error.message));
                } else {
                    resolve(response.result);
                }
            });
        });
    }

    /**
     * TODO: passing a cancel level
     * Utility function to update the camera on this stream's render loop
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
     * @endcode
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
    update_camera(data) {
        return new Promise((resolve,reject) => {
            if (!this.service.validate(reject)) {
                return;
            }
            if (!this.streaming) {
                reject(new RS_error('Not streaming.'));
            }

            if (!data) {
                reject(new RS_error('No data object provided.'));
                return;
            }

            const args = {
                render_loop_name: this.render_loop_name,
                camera: data.camera,
                camera_instance: data.camera_instance
            };

            this.service.send_ws_command('set_camera',args,response => {
                if (response.error) {
                    reject(new RS_error(response.error.message));
                } else {
                    resolve(response.result);
                }
            });
        });
    }
}

module.exports = Stream;
