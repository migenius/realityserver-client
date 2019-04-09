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
 * const {Vector4,radians} import from 'realityserver';
 * // as opposed to
 * const {Math as RSMath} import from 'realityserver';
 * const {Vector4,radians} = RSMath;
 * @namespace Math
 * @memberof RS
 */


export { default as Color } from './Color';
export { default as Matrix4x4 } from './Matrix4x4';
export { default as Spectrum } from './Spectrum';
export { default as Vector2 } from './Vector2';
export { default as Vector3 } from './Vector3';
export { default as Vector4 } from './Vector4';

export * from './Functions';
