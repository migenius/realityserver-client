/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * Contains general 3D Math functionality. This provides a number of classes
 * for manipulating vectors, matrices and colors plus some general functions on
 * `RS.Math`.
 *
 * Note that all classes and functions on `RS.Math` are also available directly
 * on `RS`. This is to make acessing the classes easier when exposed as ES6 modules. 
 * @example
 * const {Vector4} import from 'realityserver';
 * // as opposed to
 * const {Math as RSMath} import from 'realityserver';
 * const {Vector4} = RSMath;
 * @namespace Math
 * @memberof RS
 */
; (function () {

    const RS_math = {
        Color: require('./Color'),
        Matrix4x4: require('./Matrix4x4'),
        Spectrum: require('./Spectrum'),
        Vector2: require('./Vector2'),
        Vector3: require('./Vector3'),
        Vector4: require('./Vector4')
    };

    module.exports = Object.assign(RS_math,require('./Functions'));
})();
