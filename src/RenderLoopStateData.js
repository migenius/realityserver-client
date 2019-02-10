/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * This interface encapsulates the data that is to used when executing
 * commands on render loops.
 * This can be used in place of a regular {@link RS.StateData} on the
 * the service and will cause commands to be executed on the given
 * render loop. The state data can be specified when adding
 * commands directly to the service, or when creating a {@link RS.CommandQueue}.
 * A default state data can also  be set on the service itself {@link RS.Service#default_state_data}.
 * This state will then be used for all
 * commands where explicit state data has not been specified.
 *
 * When RenderLoopStateData state is used RealityServer will defer command
 * execution to occur between renders on the specified render loop. This ensures
 * that there will be no transactional overlap which can occur with regular command
 * execution and can cause data loss. Additionally, it is possible to identify which
 * particular rendered image contains the changes made by any given set of commands.
 *
 * Note: The RenderLoopStateData class
 * is designed to be constant. It is not safe to change any members of
 * a RenderLoopStateData object after it has been created, instead a new RenderLoopStateData
 * instance must be created and used if the state data needs to change.
 * @memberof RS
 */
class RenderLoopStateData {

    /**
     * Creates a RenderLoopStateData instance.
     *
     * @param {String} render_loop_name - The name of the render loop to execute on
     * @param {Number=} cancel - Controls whether rendering should be cancelled to
     *   execute the commands sooner. Pass `0` to cancel, and if possible
     *   continues rendering without restarting progression. Pass `1` to
     *   cancel faster at the expense of always needing to restart. Any
     *   other value will not cancel rendering.
     * @param {Boolean=} continue_on_error Controls error handling when an error occurs.
     *   If `true` then sub-commands will continue to be processed, if `false`
     *   processing will end at the first error and any subsequent commands
     *   will be aborted and get error resposes. Defaults to false.
     */
    constructor(render_loop_name, cancel=undefined, continue_on_error=true) {

        this._render_loop_name = render_loop_name;
        this._cancel = cancel;
        this._continue_on_error = continue_on_error;

        if (!this._render_loop_name) {
            throw 'Must provide render_loop_name';
        }
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
     * @readonly
     */
    get render_loop_name() {
        return this._render_loop_name;
    }

    /**
     * The cancel level.
     * @type {String}
     * @readonly
     */
    get cancel() {
        return this._cancel;
    }

    /**
     * Whether to continue on error.
     * @type {String}
     * @readonly
     */
    get continue_on_error() {
        return this._continue_on_error;
    }

}

module.exports = RenderLoopStateData;
