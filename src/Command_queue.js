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
     * @param {RS.Service} service - the service
     * @param {RS.State_data|RS.Render_loop_state_data} state_data - the state to execute in
     * @hideconstructor
     */
    constructor(service,state_data) {
        this.service = service;
        this.state_data = state_data;
        this.commands = [];
        this.response_promises = [];
    }

    /**
     * Adds a command to the command queue.
     * @param {Command} command - The command to add.
     * @param {Boolean} [want_response=false] - Whether we want a response from this command or not
     */
    queue(command,want_response=false) {
        this.commands.push(command);
        if (want_response) {
            let response_promises = this.response_promises;
            response_promises.length = this.commands.length;
            response_promises[response_promises.length-1] = new Delayed_promise();
        }
        return this;
    }

    /**
     * Sends the command queue for execution and returns promises that will resolve
     * to the results of the command. If `wait_for_render` is `true`
     * then an additional promise is returned that will resolve when the commands in this
     * queue are about to be displayed in the associated render loop stream.
     * @param {Boolean} [wait_for_render=false] - If `true` then a `Promise` is returned that
     * will resolve when an image containing the results of these commands is about to be provided.
     * @return {Object} An object with 2 properties:
     * - `responses` an `Array` of `Promises` that will resolve with the responses of the commands.
     * - `render`: a `Promise` that resolves to a {@link RS.Service~Rendered_image} when the first image
     * that contains the results of these commands is available.
    */
    send(wait_for_render=false) {
        this.wait_for_render = wait_for_render;
        this.resolve_all = false;
        return this.service.send_command_queue(this);
    }

    /**
     * Sends the command queue for execution and returns a promise that will resolve
     * to an iterable containing the responses of all commands whose `want_response`
     * argument was `true`. If `wait_for_render` is `true` then the last iterable
     * will contain the first rendered image that contains the results of the command
     * as a {@link RS.Service~Rendered_image}.
     * @param {Boolean} [wait_for_render=false] - If `true` then the last iterable will
     * be the first rendered image (as a {@link RS.Service~Rendered_image}) that contains the results
     * of these commands.
    */
    execute(wait_for_render=false) {
        this.wait_for_render = wait_for_render;
        this.resolve_all = true;
        return this.service.send_command_queue(this);
    }
}

module.exports = Command_queue;
