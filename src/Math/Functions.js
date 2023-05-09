/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * A number that is very close to zero.
 * @memberof RS.Math
 * @alias ALMOST_ZERO
 */
export const ALMOST_ZERO = 10e-5;

/**
 * Converts a value from degrees to radians.
 * @memberof RS.Math
 * @alias radians
 * @param {Number} degrees - the value in degrees.
 * @return {Number} the value in radians.
 */
export function radians(degrees) {
    return degrees * 0.017453292519943295769236907684886;
}

/**
 * Converts a value from radians to degrees.
 * @memberof RS.Math
 * @alias degrees
 * @param {Number} radians - the value in radians.
 * @return {Number} the value in degrees.
 */
export function degrees(radians) {
    return radians * 57.295779513082320876798154814105;
}

