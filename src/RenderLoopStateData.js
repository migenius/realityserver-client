/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * @file Command.js
 * This file defines the com.mi.rs.RenderLoopStateData class.
 */

/**
 * @class com.mi.rs.RenderLoopStateData
 * This interface encapsulates the data that is to used when executing
 * commands on render loops via a WebSocketStreamer.
 * This can be used in place of a regular com.mi.rs.StateData on a
 * WebSocketStreamer and will cause commands to be executed on the given
 * render loop. The state data can be specified when adding
 * commands directly to the streamer, or when regstering a process
 * commands callback. All commands added in a specific callback
 * will operate in the same state. A default state data can also
 * be set on the streamer itself. This state will then be used for all
 * commands where an explicit state data has not been specified.
 *
 * <p><b>Note: The RenderLoopStateData class
 * is designed to be constant. It is not safe to change any members of
 * a RenderLoopStateData object after it has been created, instead a new RenderLoopStateData
 * instance must be created and used if the state data needs to change.</b>
 * </p>
 */

/**
 * @ctor
 * Creates a %RenderLoopStateData object.
 *
 * @param renderLoopName String the name of the render loop to execute on
 * @param cancel Number Controls whether rendering should be cancelled to
 *   execute the commands sooner. Pass 0 to cancel, and if possible
 *   continues rendering without restarting progression. Pass 1 to
 *   cancel faster at the expense of always needing to restart. Any
 *   other value will not cancel rendering.
 * @param continueOnError Boolean Controls error handling when an error occurs.
 *   If true then sub-commands will continue to be processed, if false
 *   processing will end at the first error and any subsequent commands
 *   will be aborted and get error resposes. Defaults to false.
 */
class RenderLoopStateData {
    constructor(renderLoopName, cancel, continueOnError) {
        this.renderLoopName = renderLoopName;
        this.cancel = cancel;
        this.continueOnError = continueOnError;

        if (!this.renderLoopName) {
            throw 'Must provide renderLoopName';
        }
        if (this.cancel !== 0 && this.cancel !== 1) {
            this.cancel = -1;
        }
        if (this.continueOnError === null || this.continueOnError === undefined) {
            this.continueOnError = true;
        }
        this.continueOnError = !!this.continueOnError;

    //    alert("created " + this);
    }

    /**
     * @public String
     * [read-only] The name of the render loop to execute on.
     */
    //renderLoopName;

    /**
     * @public Object
     * [read-only] The cancel level.
     */
    //cancel;

    /**
     * @public Array
     * [read-only] wheter to continue on error.
     */
    //continueOnError;
}

module.exports = RenderLoopStateData;
