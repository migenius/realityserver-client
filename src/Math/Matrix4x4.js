/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Const = require('./Functions');

/**
 * @file Matrix4x4.js
 * This file defines the com.mi.rs.types.Matrix4x4 class.
 */

/**
 * @ctor
 * Creates a %Matrix4x4 object.
 * @param matrix Object An object with the initial values for the Matrix4x4.
 * Can be either an Array, Object or Matrix4x4.
 */
class Matrix4x4 {
    /// If \p matrix is not supplied defaults to the identity matrix
    /// @param matrix Object|Array|Matrix4x4 initial value
    constructor(matrix) {
        if (matrix !== undefined) {
            Matrix4x4.prototype.set.apply(this,arguments);
        } else {
            this.set_identity();
        }
    }

    /// Sets this matrix from an object. Arguments can be any of:
    ///
    /// An array. The array must have 16 elements in the following
    /// order: [xx,xy,xz,xw,yx,yy,yz,yw,zx,zy,zz,zw,wx,wy,wz,ww] or
    /// 4 array elements specifying the rows of the array.
    ///
    /// An Object. The object must have the interface defined by
    /// the RealityServer type Float64&lt;4,4&gt; meaning it must have 16
    /// members of type Number called xx, xy, xz, ..., wy, wz, ww.
    ///
    /// 16 Numbers. Specifies the matrix elements in row major order.
    ///
    /// 1 Number. Sets the diagonal values on the array, all other elements
    /// are set to 0.
    /// @param rhs Object|Array|Matrix4x4 the object to set this from
    set(rhs) {
        if (rhs instanceof Array) {
            if (rhs.length >= 16) {
                this.xx = rhs[0];
                this.xy = rhs[1];
                this.xz = rhs[2];
                this.xw = rhs[3];

                this.yx = rhs[4];
                this.yy = rhs[5];
                this.yz = rhs[6];
                this.yw = rhs[7];

                this.zx = rhs[8];
                this.zy = rhs[9];
                this.zz = rhs[10];
                this.zw = rhs[11];

                this.wx = rhs[12];
                this.wy = rhs[13];
                this.wz = rhs[14];
                this.ww = rhs[15];
            } else if (rhs.length === 4 &&
                        rhs[0] instanceof Array &&
                        rhs[1] instanceof Array &&
                        rhs[2] instanceof Array &&
                        rhs[3] instanceof Array) {
                this.xx = rhs[0][0];
                this.xy = rhs[0][1];
                this.xz = rhs[0][2];
                this.xw = rhs[0][3];

                this.yx = rhs[1][0];
                this.yy = rhs[1][1];
                this.yz = rhs[1][2];
                this.yw = rhs[1][3];

                this.zx = rhs[2][0];
                this.zy = rhs[2][1];
                this.zz = rhs[2][2];
                this.zw = rhs[2][3];

                this.wx = rhs[3][0];
                this.wy = rhs[3][1];
                this.wz = rhs[3][2];
                this.ww = rhs[3][3];
            } else {
                throw new Error('Invalid array arguments.');
            }
        } else if (!isNaN(rhs)) {
            if (arguments.length === 1) {
                this.xx = this.yy = this.zz = this.ww = rhs;
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
            this.xx = rhs.xx;
            this.xy = rhs.xy;
            this.xz = rhs.xz;
            this.xw = rhs.xw;

            this.yx = rhs.yx;
            this.yy = rhs.yy;
            this.yz = rhs.yz;
            this.yw = rhs.yw;

            this.zx = rhs.zx;
            this.zy = rhs.zy;
            this.zz = rhs.zz;
            this.zw = rhs.zw;

            this.wx = rhs.wx;
            this.wy = rhs.wy;
            this.wz = rhs.wz;
            this.ww = rhs.ww;
        }
    }


    /// Clear this matrix by setting all elements to 0.
    clear() {
        this.xx = this.xy = this.xz = this.xw =
        this.yx = this.yy = this.yz = this.yw =
        this.zx = this.zy = this.zz = this.zw =
        this.wx = this.wy = this.wz = this.ww = 0;
    }


    /// Sets this matrix to the identity matrix.
    set_identity() {
        this.clear();
        this.xx = this.yy = this.zz = this.ww = 1;
    }


    /// Sets this matrix to a rotation matrix.
    ///
    /// @param axis Vector4 The vector to rotate around.
    /// @param angle Number The angle to rotate in radians.
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


    /// Sets this matrix to a scaling matrix.
    ///
    /// @param x Number The amount to scale in the x axis.
    /// @param y Number The amount to scale in the y axis.
    /// @param z Number The amount to scale in the z axis.
    set_scaling(x, y, z) {
        this.set_identity();

        this.xx = x;
        this.yy = y;
        this.zz = z;
    }


    /// Multiples this matrix by \p matrix
    ///
    /// @param matrix Matrix4x4 The matrix on the left hand side of the multiplication
    /// @return Matrix4x4 this
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


    /// Sets this matrix to it's transpose.
    /// @return Matrix 4x4 this
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


    /// The matrix determinant.
    ///
    /// @return Number The determinant.
    get_determinant() {
        let det = 0;

        det =  this.xx * this.determinant_rc(0, 0);
        det += this.xy * this.determinant_rc(0, 1) * -1;
        det += this.xz * this.determinant_rc(0, 2);
        det += this.xw * this.determinant_rc(0, 3) * -1;

        return det;
    }


    /// @private
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


    /// Sets this matrix to its inverse. Throws if the determinant is zero.
    /// Note that you will likely need to transpose the inverted matrix
    /// to keep it in row major form which is what  RealityServer expects.
    /// @return Matrix4x4 this
    invert() {
        let det = this.get_determinant();
        if (det === 0) {
            throw Error('Determinant is 0');
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


    /// Returns a copy of this matrix.
    /// @return Matrix4x4 A clonse of this matrix
    clone() {
        return new Matrix4x4(this);
    }


    /// Compares two matrices to see if they are roughly equal. Useful
    /// when comparing two matrices to see if they are equal in a more
    /// practical sense than just comparing floating point numbers that
    /// might be different only because of rounding errors etc.
    /// @param lhs com::mi::rs::types::Matrix4x4
    /// @param rhs com::mi::rs::types::Matrix4x4
    /// @param tolerance Number
    /// @return Boolean True if lhs and rhs are roughly equal.
    equal_with_tolerance(lhs, rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }

        if (Math.abs(lhs.xx - rhs.xx) > tolerance ||
            Math.abs(lhs.xy - rhs.xy) > tolerance ||
            Math.abs(lhs.xz - rhs.xz) > tolerance ||
            Math.abs(lhs.xw - rhs.xw) > tolerance ||

            Math.abs(lhs.yx - rhs.yx) > tolerance ||
            Math.abs(lhs.yy - rhs.yy) > tolerance ||
            Math.abs(lhs.yz - rhs.yz) > tolerance ||
            Math.abs(lhs.yw - rhs.yw) > tolerance ||

            Math.abs(lhs.zx - rhs.zx) > tolerance ||
            Math.abs(lhs.zy - rhs.zy) > tolerance ||
            Math.abs(lhs.zz - rhs.zz) > tolerance ||
            Math.abs(lhs.zw - rhs.zw) > tolerance ||

            Math.abs(lhs.wx - rhs.wx) > tolerance ||
            Math.abs(lhs.wy - rhs.wy) > tolerance ||
            Math.abs(lhs.wz - rhs.wz) > tolerance ||
            Math.abs(lhs.ww - rhs.ww) > tolerance) {
            return false;
        }

        return true;
    }


    /// Returns true if this matrix and rhs are equal. If use tolerance
    /// is true then small differences because of for instance rounding
    /// errors are still regarded as equal.
    /// @param rhs Matrix4x4
    /// @param use_tolerance Boolean
    equal(rhs, use_tolerance) {
        if (use_tolerance) {
            return this.equal_with_tolerance(rhs);
        }

        if (rhs.xx === this.xx && rhs.xy === this.xy && rhs.xz === this.xz && rhs.xw === this.xw &&
            rhs.yx === this.yx && rhs.yy === this.yy && rhs.yz === this.yz && rhs.yw === this.yw &&
            rhs.zx === this.zx && rhs.zy === this.zy && rhs.zz === this.zz && rhs.zw === this.zw &&
            rhs.wx === this.wx && rhs.wy === this.wy && rhs.wz === this.wz && rhs.ww === this.ww) {
            return true;
        }

        return false;
    }


    /// Sets the translation elements of this matrix while leaving the
    /// rest of the matrix untouched.
    /// @param x Number
    /// @param y Number
    /// @param z Number
    set_translation(x, y, z) {
        this.wx = x;
        this.wy = y;
        this.wz = z;
    }


    /// Increases the translation elements of this matrix while leaving the
    /// rest of the matrix untouched.
    /// @param dx Number
    /// @param dy Number
    /// @param dz Number
    translate(dx, dy, dz) {
        this.wx += dx;
        this.wy += dy;
        this.wz += dz;
    }

    /// Returns a string describing this Object.
    /// @return String A String describing this Object.
    toString() {
        return '[' + this.xx + ', ' + this.xy + ', ' + this.xz + ', ' + this.xw + ', ' +
                     this.yx + ', ' + this.yy + ', ' + this.yz + ', ' + this.yw + ', ' +
                     this.zx + ', ' + this.zy + ', ' + this.zz + ', ' + this.zw + ', ' +
                     this.wx + ', ' + this.wy + ', ' + this.wz + ', ' + this.ww + ']';
    }
}
/// @}

module.exports = Matrix4x4;
