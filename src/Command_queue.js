/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Delayed_promise = require('./Utils/Delayed_promise');

/**
 * The Command_queue class queues up an array of commands to be executed
 * as a batch.
 *
 * *NOTE:* Users do not create `Command_queues` directly but by calling {@link RS.Service#queue_commands}.
 * @memberof RS
 */
class Command_queue {
    /**
     * Creates a command queue
     * @param {RS.Service} service - The service
     * @param {Boolean} wait_for_render - If `true` then a `Promise` will be generated when the
     * results of these commands are available in a rendered image.
     * @param {RS.State_data|RS.Render_loop_state_data} state_data - The state to execute in
     * @hideconstructor
     */
    constructor(service,wait_for_render,state_data) {
        this.service = service;
        this.wait_for_render = wait_for_render;
        this.state_data = state_data;
        this.commands = [];
    }

    /**
     * Adds a command to the command queue.
     * @param {Command} command - The command to add.
     * @param {Boolean} [want_response=false] - Whether we want a response from this command or not
     */
    queue(command,want_response=false) {

        this.commands.push({
            command,
            response_promise: want_response ? new Delayed_promise() : undefined
        });
        return this;
    }

    /**
     * Sends the command queue for execution and returns an array of promises that will resolve
     * to the responses of all commands whose `want_response`
     * argument was `true`. If the queue was created with `wait_for_render`
     * set to `true` (see {@link RS.Service#queue_commands}) then there will be an additional
     * Promise at the end of the array that will resolve with a {@link RS.Service~Rendered_image}
     * when the first rendered image that contains the results of the commands is generated.
     * @return {Promise[]} An `Array` of `Promises`.
     * @throws {RS.Error} This call will throw an error in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - `wait_for_render` is `true` but the state is not executing on a render loop.
     */
    send() {
        this.resolve_all = false;
        return this.service.send_command_queue(this);
    }

    /**
     * Sends the command queue for execution and returns a `Promise` that will resolve
     * to an iterable containing the {@link RS.Response}s of all commands whose `want_response`
     * argument was `true`. If the queue was created with `wait_for_render`
     * set to `true` (see {@link RS.Service#queue_commands}) then the last iterable
     * will contain the first rendered image that contains the results of the commands.
     * as a {@link RS.Service~Rendered_image}.
     * The promise will reject in the following circumstances:
     * - there is no WebSocket connection.
     * - the WebSocket connection has not started (IE: {@link RS.Service#connect} has not yet resolved).
     * - `wait_for_render` is `true` but the state is not executing on a render loop.
     * @return {Promise}
     */
    execute() {
        this.resolve_all = true;
        return this.service.send_command_queue(this);
    }
}

module.exports = Command_queue;
