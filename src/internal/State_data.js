/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Command = require('../Command');
/**
 * This cass encapsulates the state data that is used when rendering commands on
 * the service. Used when rendering commands on the service to pass required
 * information to the core command executor.
 * @memberof RS
 */
class State_data {

    /**
     * Creates a State_data instance. Currently state only supports setting an initial
     * scope.
     *
     * @param {String} scope_name - The name of the scope to execute in. Defaults to the
     * global scope.
     */
    constructor(scope_name=null) {
        this._state_commands = null;
        this.scope_name = scope_name || undefined;
    }

    /**
     * The name of the scope we are executing in. `undefined` represents the global
     * scope.
     * @type {String}
     */
    get scope_name() {
        return this._scope_name;
    }

    set scope_name(value) {
        if (value !== this._scope_name) {
            this._scope_name = value;
            if (value) {
                this._state_commands = [
                    new Command('use_scope', { scope_name: value })
                ];
            } else {
                this._state_commands = null;
            }
        }
    }

    /**
     * Array of state commands or `null` if none defined.
     * @type {RS.Command[]}
     * @readonly
     */
    get state_commands() {
        return this._state_commands;
    }
}

module.exports = State_data;
