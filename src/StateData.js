/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * This cass encapsulates the data that is used by the
 * RealityServer state handlers to decide which state commands are
 * processed in. The state data can be specified when adding
 * commands directly to the service, or when creating a {@link RS.CommandQueue}.
 * A default state data can also  be set on the service itself {@link RS.Service#default_state_data}.
 * This state will then be used for all
 * commands where explicit state data has not been specified.
 *
 * Note: The StateData class
 * is designed to be constant. It is not safe to change any members of
 * a StateData object after it has been created, instead a new StateData
 * instance must be created and used if the state data needs to change.
 *
 * Note: WebSocket state current only support state commands. The path and
 * parameters will have no effect.
 * @memberof RS
 */
class StateData {

    /**
     * @ctor
     * Creates a %StateData object.
     *
     * @param {String} path - The state data path.
     * @param {Object} parameters - The state data parameters.
     * @param {RS.Command[]} state_commands - Array of commands to be executed before every command set.
     */
    constructor(path=null, parameters=null, state_commands=null) {
        this._path = path;
        this._parameters = parameters;
        this._state_commands = state_commands;

        if (!this._path) {
            this._path = null;
        }
        if (!this._parameters) {
            this._parameters = null;
        }
        if (!this._state_commands) {
            this._state_commands = null;
        }
    }

    /**
     * The path of the state data or `null` if not defined.
     * @type {String}
     * @readonly
     */
    get path() {
        return this._path;
    }

    /**
     * Abitrary state parameters or `null` if not defined.
     * @type {Object}
     * @readonly
     */
    get parameters() {
        return this._parameters;
    }

    /**
     * Array of state commands or `null` if not defined.
     * @type {RS.Command[]}
     * @readonly
     */
    get state_commands() {
        return this._state_commands;
    }
}

module.exports = StateData;
