/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * The RealityServer Error class. All rejected promises will receive an instance
 * of this class. Can be identified using either `instanceof RS.Error` or
 * the `name` property which will be `RealityServerError`;
 * @alias Error
 * @memberof RS.
 * @example
 * try {
 *     await this.service.connect(url);
 * } catch(err) {
 *     if (err instanceof RS.Error) {
 *         // A RealityServer error
 *     } else {
 *         // some other error
 *     }
 * }
 * @example
 * try {
 *     await this.service.connect(url);
 * } catch(err) {
 *     if (err.name === 'RealityServerError') {
 *         // A RealityServer error
 *     } else {
 *         // some other error
 *     }
 * }*/
class RealityServerError extends Error {
    /**
     * Creates a RealityServer error.
     * @param {String=} message - Human-readable description of the error.
     * @param {String=} file_name - The name of the file containing the code that caused the exception.
     * @param {Number=} line_number - The line number of the code that caused the exception.
     */
    constructor() {
        super(...arguments);
        this.name = 'RealityServerError';
    }
}

module.exports = RealityServerError;
