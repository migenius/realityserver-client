/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
import Delayed_promise from './internal/Delayed_promise';

/**
 * The Command_queue class queues up an array of commands to be executed
 * as a batch.
 *
 * *NOTE:* Users do not create `Command_queues` directly but by calling {@link RS.Service#queue_commands}
 * or {@link RS.Stream#queue_commands}.
 * @memberof RS
 */
class Command_queue {
    /**
     * Creates a command queue
     * @param {RS.Service} service - The service
     * @param {Boolean} wait_for_render - If `true` then a `Promise` will be generated when the
     * results of these commands are available in a rendered image.
     * @param {(RS.State_data|RS.Render_loop_state_data)} state_data - The state to execute in
     * @param {Object=} options - General command queue options.
     * @param {Boolean=} options.longrunning - A hint as to whether the commands are expected to
     * be long running or not. Long running commands are executed asynchronously on the server to
     * ensure they do not tie up the web socket connection. Note this hint is only supported in
     * protcol version 7 and above (RealityServer 6.2 3938.141 or later).
     * @hideconstructor
     */
    constructor(service, wait_for_render, state_data, options) {
        this.service = service;
        this.wait_for_render = wait_for_render;
        this.state_data = state_data;
        this.options = options || {};
        this.commands = [];
    }

    /**
     * The length of the current command queue.
     * @return {Number}
     */
    get length() {
        return this.commands.length;
    }

    /**
     * Adds a command to the command queue.
     * @param {Command} command - The command to add.
     * @param {Boolean} [want_response=false] - Whether we want a response from this command or not
     */
    queue(command, want_response=false) {
        this.commands.push({
            command,
            response_promise: want_response ? new Delayed_promise() : undefined
        });
        return this;
    }

    /**
     * Sends the command queue for execution and returns an array of promises that will resolve
     * to the results of all commands whose `want_response`
     * argument was `true`. On command error they will resolve with a {@link RS.Command_error}. If the
     * queue was created with `wait_for_render` set to `true` (see {@link RS.Stream#queue_commands})
     * then there will be an additional `Promise` at the end of the array that will resolve with a
     * {@link RS.Stream~Rendered_result} just before the {@link RS.Stream#event:image} event that
     * contains the result of this command is emitted.
     * @return {Promise[]} An `Array` of `Promises`.
     * @throws {RS.Error} This call will throw an error in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * @fires RS.Service#command_requests
     * @fires RS.Service#command_results
     */
    send() {
        this.resolve_all = false;
        return this.service.send_command_queue(this);
    }

    /**
     * Sends the command queue for execution and returns a `Promise` that will resolve
     * to an iterable containing the results of all commands whose `want_response`
     * argument was `true`. On command error they will resolve with a {@link RS.Command_error}.
     * If the queue was created with `wait_for_render` set to `true` (see {@link RS.Stream#queue_commands})
     * then the last iterable will contain the first rendered image that contains the results of the commands
     * as a {@link RS.Stream~Rendered_image}.
     *
     * The promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * @return {Promise}
     * @fires RS.Service#command_requests
     * @fires RS.Service#command_results
     */
    execute() {
        this.resolve_all = true;
        return this.service.send_command_queue(this);
    }
}

export default Command_queue;
