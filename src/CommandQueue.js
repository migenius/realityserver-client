/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const DelayedPromise = require('./Utils/DelayedPromise');

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

module.exports = CommandQueue;
