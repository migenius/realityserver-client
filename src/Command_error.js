/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
import RS_error from './Error';

/**
 * The RealityServer Command_error class. Commands that result in errors will
 * resolve with instances of this class.
 * Can be identified using either `instanceof RS.Error` or the name property
 * which will be `CommandError`
 * @extends RS.Error
 * @memberof RS.
 */
class Command_error extends RS_error {
    /**
     * Creates a RealityServer Command error.
     * @param {Object} error - The command error.
     * @hideconstructor
     */
    constructor(error) {
        super(error.message);
        this.error = error;
        this.name = 'CommandError';
    }

    /**
     * The error code returned by RealityServer
     * @type {Number}
     */
    get code() {
        return this.error.code;
    }

    /**
     * Additional error data returned by RealityServer
     * @type {Object}
     */
    get data() {
        return this.error.data;
    }
}

export default Command_error;
