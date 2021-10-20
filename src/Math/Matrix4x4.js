/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
import * as Const from './Functions';

/**
 * Class representing a row major 4x4 Matrix.
 * @memberof RS.Math
 * @example
 * let m = new RS.Math.Matrix4x4();
 * m = new RS.Math.Matrix4x4(11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34, 41, 42, 43, 44);
 * m = new RS.Math.Matrix4x4([11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34, 41, 42, 43, 44]);
 * m = new RS.Math.Matrix4x4([
 *                [11, 12, 13, 14],
 *                [21, 22, 23, 24],
 *                [31, 32, 33, 34],
 *                [41, 42, 43, 44]
 * ]);
 * m = new RS.Math.Matrix4x4({
 *                xx:11, xy: 12, xz: 13, xw: 14,
 *                yx:21, yy: 22, yz: 23, yw: 24,
 *                zx:31, zy: 32, zz: 33, zw: 34,
 *                wx:41, wy: 42, wz: 43, ww: 44
 * });
 */
class Matrix4x4 {
    /**
     * Creates a new Matrix4x4. Accepts any arguments that
     * {@link RS.Math.Matrix4x4#set} accepts.
     * @param {(RS.Math.Matrix4x4|Array|Object|...Number)=} initial - initial value.
     */
    constructor(matrix) {
        if (matrix !== undefined) {
            this.set(...arguments);
        } else {
            this.set_identity();
        }
    }

    /**
     * Sets this matrix. The source may be of the
     * following types:
     * - {@link RS.Math.Matrix4x4}
     * - an `Array` with 16 or more `Number` members which will set the matrix in row major order.
     * - an `Array` of 4 or more `Array` members (each of length 4 or more) which will set the rows of the matrix.
     * - an `Object`.
     * - a single `Number` which will set the array diagonal to that value.
     * - 16 or more individual `Numbers` which will set the matrix in row major order.
     *
     * In the case of an object being supplied it should have the
     * members `xx`, `xy`, `xz`, `xw`,`yx`, `yy`, `yz`, `yw`, `zx`, `zy`, `zz`, `zw`, `wx`, `wy`, `wz`, `ww`.
     * @example
     * const m = new RS.Math.Matrix4x4();
     * m.set(1); // sets the identify matrix
     * // the following are equivalent
     * m.set(11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34, 41, 42, 43, 44);
     * m.set([11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34, 41, 42, 43, 44]);
     * m.set([[11, 12, 13, 14],
     *        [21, 22, 23, 24],
     *        [31, 32, 33, 34],
     *        [41, 42, 43, 44]]);
     * m.set({xx:11, xy:12, xz:13, wz:14,
     *        yx:21, yy:22, yz:23, yw:24,
     *        zx:31, zy:32, zz:33, zw:34,
     *        wx:41, wy:42, wz:43, ww:44});
     * @param {(RS.Math.Matrix4x4|Array|Object|...Number)} source - the object to set from or a set
     * of numbers.
     */
    set(source) {
        if (source instanceof Array) {
            if (source.length >= 16) {
                /**
                 * The xx component of the vector
                 * @member {Number}
                 */
                this.xx = source[0];
                /**
                 * The xy component of the vector
                 * @member {Number}
                 */
                this.xy = source[1];
                /**
                 * The xz component of the vector
                 * @member {Number}
                 */
                this.xz = source[2];
                /**
                 * The xw component of the vector
                 * @member {Number}
                 */
                this.xw = source[3];

                /**
                 * The yx component of the vector
                 * @member {Number}
                 */
                this.yx = source[4];
                /**
                 * The yy component of the vector
                 * @member {Number}
                 */
                this.yy = source[5];
                /**
                 * The yz component of the vector
                 * @member {Number}
                 */
                this.yz = source[6];
                /**
                 * The yw component of the vector
                 * @member {Number}
                 */
                this.yw = source[7];

                /**
                 * The zx component of the vector
                 * @member {Number}
                 */
                this.zx = source[8];
                /**
                 * The zy component of the vector
                 * @member {Number}
                 */
                this.zy = source[9];
                /**
                 * The zz component of the vector
                 * @member {Number}
                 */
                this.zz = source[10];
                /**
                 * The zw component of the vector
                 * @member {Number}
                 */
                this.zw = source[11];

                /**
                 * The wx component of the vector
                 * @member {Number}
                 */
                this.wx = source[12];
                /**
                 * The wy component of the vector
                 * @member {Number}
                 */
                this.wy = source[13];
                /**
                 * The wz component of the vector
                 * @member {Number}
                 */
                this.wz = source[14];
                /**
                 * The ww component of the vector
                 * @member {Number}
                 */
                this.ww = source[15];
            } else if (source.length === 4 &&
                        source[0] instanceof Array &&
                        source[1] instanceof Array &&
                        source[2] instanceof Array &&
                        source[3] instanceof Array) {
                this.xx = source[0][0];
                this.xy = source[0][1];
                this.xz = source[0][2];
                this.xw = source[0][3];

                this.yx = source[1][0];
                this.yy = source[1][1];
                this.yz = source[1][2];
                this.yw = source[1][3];

                this.zx = source[2][0];
                this.zy = source[2][1];
                this.zz = source[2][2];
                this.zw = source[2][3];

                this.wx = source[3][0];
                this.wy = source[3][1];
                this.wz = source[3][2];
                this.ww = source[3][3];
            } else {
                throw new Error('Invalid array arguments.');
            }
        } else if (!isNaN(source)) {
            if (arguments.length === 1) {
                this.xx = this.yy = this.zz = this.ww = source;
                this.xy = this.xz = this.xw =
                this.yx = this.yz = this.yw =
                this.zx = this.zy = this.zw =
                this.wx = this.wy = this.wz = 0;
            } else if (arguments.length >= 16) {
                this.xx = arguments[0];
                this.xy = arguments[1];
                this.xz = arguments[2];
                this.xw = arguments[3];

                this.yx = arguments[4];
                this.yy = arguments[5];
                this.yz = arguments[6];
                this.yw = arguments[7];

                this.zx = arguments[8];
                this.zy = arguments[9];
                this.zz = arguments[10];
                this.zw = arguments[11];

                this.wx = arguments[12];
                this.wy = arguments[13];
                this.wz = arguments[14];
                this.ww = arguments[15];
            } else {
                throw new Error('Invalid # of numeric arguments.');
            }
        } else {
            this.xx = source.xx;
            this.xy = source.xy;
            this.xz = source.xz;
            this.xw = source.xw;

            this.yx = source.yx;
            this.yy = source.yy;
            this.yz = source.yz;
            this.yw = source.yw;

            this.zx = source.zx;
            this.zy = source.zy;
            this.zz = source.zz;
            this.zw = source.zw;

            this.wx = source.wx;
            this.wy = source.wy;
            this.wz = source.wz;
            this.ww = source.ww;
        }
    }

    /**
     * Returns a copy of this matrix.
     * @return {RS.Math.Matrix4x4}
     */
    clone() {
        return new Matrix4x4(this);
    }


    /**
     * Clear this matrix by setting all elements to 0.
     */
    clear() {
        this.xx = this.xy = this.xz = this.xw =
        this.yx = this.yy = this.yz = this.yw =
        this.zx = this.zy = this.zz = this.zw =
        this.wx = this.wy = this.wz = this.ww = 0;
    }


    /**
     * Sets this matrix to the identity matrix.
     */
    set_identity() {
        this.clear();
        this.xx = this.yy = this.zz = this.ww = 1;
    }


    /**
     * Sets this matrix to be a rotation matrix.
     * @param {(RS.Math.Vector4|RS.Math.Vector3)} axis The vector to rotate around.
     * @param {Number} angle The angle to rotate around the axis in radians.
     */
    set_rotation(axis, angle) {
        this.set_identity();

        let c = Math.cos(angle);
        let s = Math.sin(angle);
        let t = 1-c;
        let X = axis.x;
        let Y = axis.y;
        let Z = axis.z;

        this.xx = t * X * X + c;
        this.xy = t * X * Y + s * Z;
        this.xz = t * X * Z - s * Y;

        this.yx = t * X * Y - s * Z;
        this.yy = t * Y * Y + c;
        this.yz = t * Y * Z + s * X;

        this.zx = t * X * Z + s * Y;
        this.zy = t * Y * Z - s * X;
        this.zz = t * Z * Z + c;
    }


    /**
     * Sets this matrix to a scaling matrix.
     * @param {Number} x The amount to scale in the x axis.
     * @param {Number} y The amount to scale in the y axis.
     * @param {Number} z The amount to scale in the z axis.
     */
    set_scaling(x, y, z) {
        this.set_identity();

        this.xx = x;
        this.yy = y;
        this.zz = z;
    }


    /**
     * Multiples another matrix on the left side of this matrix. Equivalent to
     * this = `matrix * this`
     *
     * @param {RS.Math.Matrix4x4} matrix The matrix on the left hand side of the multiplication
     * @return {RS.Math.Matrix4x4} this
     */
    multiply(matrix) {
        let _mat = this.clone();

        this.xx = _mat.xx * matrix.xx
                + _mat.xy * matrix.yx
                + _mat.xz * matrix.zx
                + _mat.xw * matrix.wx;

        this.xy = _mat.xx * matrix.xy
                + _mat.xy * matrix.yy
                + _mat.xz * matrix.zy
                + _mat.xw * matrix.wy;

        this.xz = _mat.xx * matrix.xz
                + _mat.xy * matrix.yz
                + _mat.xz * matrix.zz
                + _mat.xw * matrix.wz;

        this.xw = _mat.xx * matrix.xw
                + _mat.xy * matrix.yw
                + _mat.xz * matrix.zw
                + _mat.xw * matrix.ww;

        this.yx = _mat.yx * matrix.xx
                + _mat.yy * matrix.yx
                + _mat.yz * matrix.zx
                + _mat.yw * matrix.wx;

        this.yy = _mat.yx * matrix.xy
                + _mat.yy * matrix.yy
                + _mat.yz * matrix.zy
                + _mat.yw * matrix.wy;

        this.yz = _mat.yx * matrix.xz
                + _mat.yy * matrix.yz
                + _mat.yz * matrix.zz
                + _mat.yw * matrix.wz;

        this.yw = _mat.yx * matrix.xw
                + _mat.yy * matrix.yw
                + _mat.yz * matrix.zw
                + _mat.yw * matrix.ww;

        this.zx = _mat.zx * matrix.xx
                + _mat.zy * matrix.yx
                + _mat.zz * matrix.zx
                + _mat.zw * matrix.wx;

        this.zy = _mat.zx * matrix.xy
                + _mat.zy * matrix.yy
                + _mat.zz * matrix.zy
                + _mat.zw * matrix.wy;

        this.zz = _mat.zx * matrix.xz
                + _mat.zy * matrix.yz
                + _mat.zz * matrix.zz
                + _mat.zw * matrix.wz;

        this.zw = _mat.zx * matrix.xw
                + _mat.zy * matrix.yw
                + _mat.zz * matrix.zw
                + _mat.zw * matrix.ww;

        this.wx = _mat.wx * matrix.xx
                + _mat.wy * matrix.yx
                + _mat.wz * matrix.zx
                + _mat.ww * matrix.wx;

        this.wy = _mat.wx * matrix.xy
                + _mat.wy * matrix.yy
                + _mat.wz * matrix.zy
                + _mat.ww * matrix.wy;

        this.wz = _mat.wx * matrix.xz
                + _mat.wy * matrix.yz
                + _mat.wz * matrix.zz
                + _mat.ww * matrix.wz;

        this.ww = _mat.wx * matrix.xw
                + _mat.wy * matrix.yw
                + _mat.wz * matrix.zw
                + _mat.ww * matrix.ww;

        return this;
    }


    /**
     * Sets this matrix to it's transpose.
     * @return {RS.Math.Matrix4x4} this
     */
    transpose() {
        let _mat = this.clone();

        this.xy = _mat.yx;
        this.xz = _mat.zx;
        this.xw = _mat.wx;

        this.yx = _mat.xy;
        this.yz = _mat.zy;
        this.yw = _mat.wy;

        this.zx = _mat.xz;
        this.zy = _mat.yz;
        this.zw = _mat.wz;

        this.wx = _mat.xw;
        this.wy = _mat.yw;
        this.wz = _mat.zw;

        return this;
    }


    /**
     * Returns the determinant of this matrix.
     * @return {Number}
     */
    get_determinant() {
        let det = 0;

        det =  this.xx * this.determinant_rc(0, 0);
        det += this.xy * this.determinant_rc(0, 1) * -1;
        det += this.xz * this.determinant_rc(0, 2);
        det += this.xw * this.determinant_rc(0, 3) * -1;

        return det;
    }


    /**
     * Returns the determinant of the 3x3 sub matrix created by excluding
     * row `row` and column `col`.
     * @param {Number} row the row to exclude
     * @param {Number} col the column to exclude
     * @return {Number}
     * @access private
     */
    determinant_rc(row, col) {
        let data = new Array(9);
        let current = 0;

        if (row !== 0) {
            if (col !== 0) data[current++] = this.xx;
            if (col !== 1) data[current++] = this.xy;
            if (col !== 2) data[current++] = this.xz;
            if (col !== 3) data[current++] = this.xw;
        }

        if (row !== 1) {
            if (col !== 0) data[current++] = this.yx;
            if (col !== 1) data[current++] = this.yy;
            if (col !== 2) data[current++] = this.yz;
            if (col !== 3) data[current++] = this.yw;
        }

        if (row !== 2) {
            if (col !== 0) data[current++] = this.zx;
            if (col !== 1) data[current++] = this.zy;
            if (col !== 2) data[current++] = this.zz;
            if (col !== 3) data[current++] = this.zw;
        }

        if (row !== 3) {
            if (col !== 0) data[current++] = this.wx;
            if (col !== 1) data[current++] = this.wy;
            if (col !== 2) data[current++] = this.wz;
            if (col !== 3) data[current++] = this.ww;
        }

        current = data[0]*(data[4]*data[8] - data[7]*data[5]) -
                  data[1]*(data[3]*data[8] - data[6]*data[5]) +
                  data[2]*(data[3]*data[7] - data[6]*data[4]);

        return current;
    }

    /**
     * Sets this matrix to it's inverse. Throws if the matrix cannot be inverted.
     * @return {RS.Math.Matrix4x4} this
     */
    invert() {
        let det = this.get_determinant();
        if (det === 0 || Number.isNaN(det)) {
            throw new Error('Determinant is 0 or NaN');
        }
        let mat = this.clone();

        this.xx = mat.determinant_rc(0, 0) / det;
        this.yx = mat.determinant_rc(0, 1) / -det;
        this.zx = mat.determinant_rc(0, 2) / det;
        this.wx = mat.determinant_rc(0, 3) / -det;

        this.xy = mat.determinant_rc(1, 0) / -det;
        this.yy = mat.determinant_rc(1, 1) / det;
        this.zy = mat.determinant_rc(1, 2) / -det;
        this.wy = mat.determinant_rc(1, 3) / det;

        this.xz = mat.determinant_rc(2, 0) / det;
        this.yz = mat.determinant_rc(2, 1) / -det;
        this.zz = mat.determinant_rc(2, 2) / det;
        this.wz = mat.determinant_rc(2, 3) / -det;

        this.xw = mat.determinant_rc(3, 0) / -det;
        this.yw = mat.determinant_rc(3, 1) / det;
        this.zw = mat.determinant_rc(3, 2) / -det;
        this.ww = mat.determinant_rc(3, 3) / det;

        return this;
    }

    /**
     * Returns whether this matrix is equal to another matrix within a tolerance.
     * @param {RS.Math.Matrix4x4} rhs - the matrix to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used, otherwise
     * tolerance is `10e-5`
     * @return {Boolean} `true` if equal, `false` if not
     */
    equal_with_tolerance(rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }

        if (Math.abs(this.xx - rhs.xx) > tolerance ||
            Math.abs(this.xy - rhs.xy) > tolerance ||
            Math.abs(this.xz - rhs.xz) > tolerance ||
            Math.abs(this.xw - rhs.xw) > tolerance ||

            Math.abs(this.yx - rhs.yx) > tolerance ||
            Math.abs(this.yy - rhs.yy) > tolerance ||
            Math.abs(this.yz - rhs.yz) > tolerance ||
            Math.abs(this.yw - rhs.yw) > tolerance ||

            Math.abs(this.zx - rhs.zx) > tolerance ||
            Math.abs(this.zy - rhs.zy) > tolerance ||
            Math.abs(this.zz - rhs.zz) > tolerance ||
            Math.abs(this.zw - rhs.zw) > tolerance ||

            Math.abs(this.wx - rhs.wx) > tolerance ||
            Math.abs(this.wy - rhs.wy) > tolerance ||
            Math.abs(this.wz - rhs.wz) > tolerance ||
            Math.abs(this.ww - rhs.ww) > tolerance) {
            return false;
        }

        return true;
    }

    /**
     * Returns whether this matrix is equal to another matrix.
     * @param {RS.Math.Matrix4x4} rhs - the matrix to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used.
     * @return {Boolean} `true` if equal, `false` if not
     */
    equal(rhs, tolerance) {
        if (tolerance) {
            return this.equal_with_tolerance(rhs, tolerance);
        }

        if (rhs.xx === this.xx && rhs.xy === this.xy && rhs.xz === this.xz && rhs.xw === this.xw &&
            rhs.yx === this.yx && rhs.yy === this.yy && rhs.yz === this.yz && rhs.yw === this.yw &&
            rhs.zx === this.zx && rhs.zy === this.zy && rhs.zz === this.zz && rhs.zw === this.zw &&
            rhs.wx === this.wx && rhs.wy === this.wy && rhs.wz === this.wz && rhs.ww === this.ww) {
            return true;
        }

        return false;
    }


    /**
     * Sets the translation elements of this matrix while leaving the
     * rest of the matrix untouched.
     * @param {Number} x - The x value
     * @param {Number} y - The y value
     * @param {Number} z - The z value
     */
    set_translation(x, y, z) {
        this.wx = x;
        this.wy = y;
        this.wz = z;
    }


    /**
     * Increases the translation elements of this matrix while leaving the
     * rest of the matrix untouched.
     * @param {Number} dx - The x value to add
     * @param {Number} dy - The y value to add
     * @param {Number} dz - The z value to add
     */
    translate(dx, dy, dz) {
        this.wx += dx;
        this.wy += dy;
        this.wz += dz;
    }

    /**
     * Returns a string describing this Object.
     * @return {String} A String describing this Object.
     */
    toString() {
        return '[' + this.xx + ', ' + this.xy + ', ' + this.xz + ', ' + this.xw + ', ' +
                     this.yx + ', ' + this.yy + ', ' + this.yz + ', ' + this.yw + ', ' +
                     this.zx + ', ' + this.zy + ', ' + this.zz + ', ' + this.zw + ', ' +
                     this.wx + ', ' + this.wy + ', ' + this.wz + ', ' + this.ww + ']';
    }
}

export default Matrix4x4;
