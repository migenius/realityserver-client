/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * Defines the interface of a command response object. Instances of this class
 * are provided as the resolved values to {@link RS.Command}s. This
 * gives access to all the data available in a response to a
 * RealityServer command.
 * *NOTE:* Users do not create `Responses` directly.
 * @memberof RS
 */
class Response {
    /**
     * Creates a Response object.
     * @hideconstructor
     * @param {RS.Command} command The command that triggered this response.
     * @param {Object} server_response  The response object as sent by the server.
     */
    constructor(command, server_response) {
        this._command = command;
        this._server_response = server_response;

        this._result = server_response.result;

        this._is_error = (!!server_response.error && server_response.error.code !== 0);

        if (this._is_error === false) {
            this._error = null;
        } else {
            this._error = server_response.error;
        }

    }

    /**
     * The command this is the response to.
     * @type {RS.Command}
     * @readonly
     */
    get command() {
        return this._command;
    }

    /**
     * The result data that was returned by the RealityServer
     * command. The result will be `null` if the command experienced an
     * error. Commands not returning a value will have an empty object
     * as result.
     * @type {*}
     * @readonly
     */
    get result() {
        return this._result;
    }

    /**
     * Contains information about the error, or `null` if no error occured. If
     * the error is defined, it will always have a string `message` property
     * with a short description about the error, and a `code` integer property
     * that identifies the error. There may be an additional `data` property with
     * more information.
     * @type {Object}
     * @readonly
     */
    get error() {
        return this._error;
    }

    /**
     * Convenience property that is `true` if this is an error response.
     * In this case {@link RS.Response#result} will be null and {@link RS.Response#error}
     * be set to an object containing more information about the error.
     * @type {Boolean}
     * @readonly
     */
    get is_error() {
        return this._is_error;
    }

    /**
     * The raw response object returned by the server.
     * @type {Object}
     * @readonly
     * @access private
     */
    get serverResponse() {
        return this._server_response;
    }
}

module.exports = Response;
