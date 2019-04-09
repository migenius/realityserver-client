/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * This interface encapsulates the data that is to used when executing
 * commands on render loops. Used when rendering commands on streams to
 * pass required information to the service.
 * @memberof RS
 */
class Render_loop_state_data {

    /**
     * Creates a Render_loop_state_data instance.
     *
     * @param {String=} render_loop_name - The name of the render loop to execute on
     * @param {Number=} cancel - Controls whether rendering should be cancelled to
     *   execute the commands sooner. Pass `0` to cancel, and if possible
     *   continues rendering without restarting progression. Pass `1` to
     *   cancel faster at the expense of always needing to restart. Any
     *   other value will not cancel rendering.
     * @param {Boolean=} continue_on_error Controls error handling when an error occurs.
     *   If `true` then sub-commands will continue to be processed, if `false`
     *   processing will end at the first error and any subsequent commands
     *   will be aborted and get error resposes. Defaults to true.
     */
    constructor(render_loop_name, cancel=undefined, continue_on_error=true) {

        this._render_loop_name = render_loop_name;
        this._cancel = cancel;
        this._continue_on_error = continue_on_error;

        if (this._cancel !== 0 && this._cancel !== 1) {
            this._cancel = -1;
        }
        if (this._continue_on_error === null || this._continue_on_error === undefined) {
            this._continue_on_error = true;
        }
        this._continue_on_error = !!this._continue_on_error;
    }

    /**
     * The name of the render loop to execute on.
     * @type {String}
     */
    get render_loop_name() {
        return this._render_loop_name;
    }

    set render_loop_name(value) {
        this._render_loop_name = value;
    }

    /**
     * The cancel level.
     * @type {Number}
     */
    get cancel() {
        return this._cancel;
    }

    set cancel(value) {
        if (value !== 0 && value !== 1) {
            this._cancel = -1;
        } else {
            this._cancel = value;
        }
    }

    /**
     * Whether to continue on error.
     * @type {Boolean}
     */
    get continue_on_error() {
        return this._continue_on_error;
    }

    set continue_on_error(value) {
        this._continue_on_error = !!value;
    }

}

export default Render_loop_state_data;
