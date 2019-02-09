/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Const = require('./Functions');

/** \ingroup mi_v8_modules_math
    @{
*/
/// \mig_inside_class RS.Math
/// A 3 Component vector.
class Vector3 {
    /// @param vector Object|Array|Vector3 initial value
    constructor(vector) {
        if (vector !== undefined) {
            Vector3.prototype.set.apply(this,arguments);
        } else {
            this.set(0,0,0);
        }
    }

    /// Sets this vector from an object. The object may be of the
    /// following types: Vector3, and Array with 3 or more members
    /// or an Object. In the case of an object it must have the
    /// members x, y, and z.
    /// @param rhs Vector3|Array|Object the object to set from
    set(rhs) {
        if (rhs instanceof Vector3) {
            this.x = rhs.x;
            this.y = rhs.y;
            this.z = rhs.z;
        } else if (rhs instanceof Array) {
            if (rhs.length < 3) {
                throw new Error('Array needs at least 3 elements.');
            }

            this.x = parseFloat(rhs[0]);
            this.y = parseFloat(rhs[1]);
            this.z = parseFloat(rhs[2]);
        } else if (!isNaN(rhs)) {
            this.x = parseFloat(arguments[0]);
            this.y = parseFloat(arguments[1]);
            this.z = parseFloat(arguments[2]);
        } else {
            this.x = parseFloat(rhs.x);
            this.y = parseFloat(rhs.y);
            this.z = parseFloat(rhs.z);
        }
    }

    /// returns a copy of this vector.
    clone() {
        return new Vector3(this);
    }

    /// Transforms this vector by applying the provided matrix.
    /// @param matrix Matrix4x4 The matrix to apply.
    /// @return Vector3 this
    transform(matrix) {
        let vec = this.clone();

        this.x =    vec.x * matrix.xx +
                    vec.y * matrix.yx +
                    vec.z * matrix.zx;

        this.y =    vec.x * matrix.xy +
                    vec.y * matrix.yy +
                    vec.z * matrix.zy;

        this.z =    vec.x * matrix.xz +
                    vec.y * matrix.yz +
                    vec.z * matrix.zz;

        return this;
    }

    /// Transforms this vector by applying the given matrix and copies
    /// the result into the out vector.
    /// @param matrix Matrix4x4 The matrix to apply.
    /// @param out Vector3 Vector to write to
    /// @return Vector3 the result
    transform_to(matrix, out) {
        out.x =     this.x * matrix.xx +
                    this.y * matrix.yx +
                    this.z * matrix.zx;

        out.y =     this.x * matrix.xy +
                    this.y * matrix.yy +
                    this.z * matrix.zy;

        out.z =     this.x * matrix.xz +
                    this.y * matrix.yz +
                    this.z * matrix.zz;

        return out;
    }

    /// Transforms this vector by the transpose of the matrix passed in.
    /// @param matrix Matrix4x4 The matrix to apply.
    /// @return Vector3 this
    transform_transpose(matrix) {
        let vec = this.clone();

        this.x =     vec.x * matrix.xx +
                    vec.y * matrix.xy +
                    vec.z * matrix.xz;

        this.y =     vec.x * matrix.yx +
                    vec.y * matrix.yy +
                    vec.z * matrix.yz;

        this.z =     vec.x * matrix.zx +
                    vec.y * matrix.zy +
                    vec.z * matrix.zz;

        return this;
    }


    /// Transforms this vector by the transpose of the matrix passed in and copies
    /// the result into the out vector.
    /// @param matrix Matrix4x4 The matrix to apply.
    /// @param out Vector3 Vector to write to
    /// @return Vector3 out
    transform_transpose_to(matrix, out) {
        out.x =     this.x * matrix.xx +
                    this.y * matrix.xy +
                    this.z * matrix.xz;

        out.y =     this.x * matrix.yx +
                    this.y * matrix.yy +
                    this.z * matrix.yz;

        out.z =     this.x * matrix.zx +
                    this.y * matrix.zy +
                    this.z * matrix.zz;

        return out;
    }

    /// Rotates this vector by applying the provided matrix.
    /// @param matrix Matrix4x4 The matrix to apply.
    /// @return Vector3 this
    rotate(matrix) {
        let vec = this.clone();

        this.x =     vec.x * matrix.xx +
                    vec.y * matrix.yx +
                    vec.z * matrix.zx;

        this.y =     vec.x * matrix.xy +
                    vec.y * matrix.yy +
                    vec.z * matrix.zy;

        this.z =     vec.x * matrix.xz +
                    vec.y * matrix.yz +
                    vec.z * matrix.zz;

        return this;
    }


    /// Rotates this vector by the transpose of the provided matrix.
    /// @param matrix Matrix4x4 The matrix to apply.
    /// @return Vector3 this
    rotate_transpose(matrix) {
        let vec = this.clone();

        this.x =     vec.x * matrix.xx +
                    vec.y * matrix.xy +
                    vec.z * matrix.xz;

        this.y =     vec.x * matrix.yx +
                    vec.y * matrix.yy +
                    vec.z * matrix.yz;

        this.z =     vec.x * matrix.zx +
                    vec.y * matrix.zy +
                    vec.z * matrix.zz;

        return this;
    }

    /// Rotates this vector by applying the provided matrix.
    /// @param matrix Matrix4x4 The matrix to apply.
    /// @param out Vector3 Vector to write to
    /// @return Vector3 out
    rotate_to(matrix,out) {
        out.x =     vec.x * matrix.xx +
                    vec.y * matrix.yx +
                    vec.z * matrix.zx;

        out.y =     vec.x * matrix.xy +
                    vec.y * matrix.yy +
                    vec.z * matrix.zy;

        out.z =     vec.x * matrix.xz +
                    vec.y * matrix.yz +
                    vec.z * matrix.zz;

        return out;
    }


    /// Rotates this vector by the transpose of the provided matrix.
    /// @param matrix Matrix4x4 The matrix to apply.
    /// @param out Vector3 Vector to write to
    /// @return Vector3 this
    rotate_transpose_to(matrix,out) {
        out.x =     vec.x * matrix.xx +
                    vec.y * matrix.xy +
                    vec.z * matrix.xz;

        out.y =     vec.x * matrix.yx +
                    vec.y * matrix.yy +
                    vec.z * matrix.yz;

        out.z =     vec.x * matrix.zx +
                    vec.y * matrix.zy +
                    vec.z * matrix.zz;

        return out;
    }

    /// Returns the dot product between this vector and rhs.
    /// @param rhs Vector3
    /// @return Number
    dot(rhs) {
        return (this.x*rhs.x + this.y*rhs.y + this.z*rhs.z);
    }


    /// Returns the cross product between this vector and rhs.
    /// @param rhs Vector3
    /// @return Vector3
    cross(rhs) {
        let cp = new Vector3();

        cp.x = this.y*rhs.z - this.z*rhs.y;
        cp.y = this.z*rhs.x - this.x*rhs.z;
        cp.z = this.x*rhs.y - this.y*rhs.x;
        return cp;
    }


    /// Returns the length of this vector.
    /// @return Number
    length() {
        let lsq = this.dot(this);
        return Math.sqrt(lsq);
    }


    /// Returns the distance between the point specified by this
    /// vector and rhs.
    /// @param rhs Vector3
    /// @return Number
    distance(rhs) {
        let x = rhs.x - this.x;
        let y = rhs.y - this.y;
        let z = rhs.z - this.z;

        return Math.sqrt(x*x + y*y + z*z);
    }


    /// Normalizes this vector.
    /// @return Vector3 this
    normalize() {
        let len = this.length();

        if (len) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }


    /// Scales this vector.
    ///
    /// @param scale Number Scale the scalar to apply.
    /// @return Vector3 this
    scale(scale) {
        this.x *= scale;
        this.y *= scale;
        this.z *= scale;
        return this;
    }

    /// Adds rhs to this vector and stores the result in
    /// this vector.
    /// @param rhs Vector3 the vector to add.
    /// @return Vector3 this
    add(rhs) {
        this.x += rhs.x;
        this.y += rhs.y;
        this.z += rhs.z;
        return this;
    }


    /// Subtracts rhs from this vector and stores the result in
    /// this vector.
    ///
    /// @param rhs Vector3 the vector to subtract.
    /// @return Vector3 this
    subtract(rhs) {
        this.x -= rhs.x;
        this.y -= rhs.y;
        this.z -= rhs.z;
        return this;
    }

    /// Multiplies rhs with this vector and stores the result in
    /// this vector.
    ///
    /// @param rhs Vector3 the vector to multiply.
    /// @return Vector3 this
    multiply(rhs) {
        this.x *= rhs.x;
        this.y *= rhs.y;
        this.z *= rhs.z;
        return this;
    }

    /// Divide rhs into this vector and stores the result in
    /// this vector.
    ///
    /// @param rhs Vector3 the vector to multiply.
    /// @return Vector3 this
    divide(rhs) {
        this.x /= rhs.x;
        this.y /= rhs.y;
        this.z /= rhs.z;
        return this;
    }

    /// Returns true if this vector and rhs are colinear.
    /// @param rhs Vector3
    /// @return Boolean True if this vector and rhs are colinear
    is_colinear(rhs) {
        let vec = this.cross(rhs);
        return (Math.abs(vec.x) < Const.ALMOST_ZERO &&
                   Math.abs(vec.y) < Const.ALMOST_ZERO &&
                   Math.abs(vec.z) < Const.ALMOST_ZERO);
    }


    /// Checks if the vector is the null vector.
    /// @param tolerance Number Optional. A Number used to approximate the comparison.
    /// @return Boolean
    is_null_vector(tolerance) {
        if (tolerance === undefined) {
            return this.x === 0 && this.y === 0 && this.z === 0;
        } else {
            return Math.abs(this.x) < tolerance && Math.abs(this.y) < tolerance && Math.abs(this.z) < tolerance;
        }
    }

    /// Returns true if this vector equals rhs.
    /// @param rhs Vector3 The vector to compare with.
    /// @param use_tolerance Boolean if supplied and \c true then use tolerance
    /// @return Boolean
    equal(rhs, use_tolerance) {
        if (use_tolerance) {
            return this.equal_with_tolerance(rhs);
        }

        return this.x === rhs.x && this.y === rhs.y && this.z === rhs.z;
    }

    /// Returns true if this vector equals rhs using tolerance
    /// @param rhs Vector3 The vector to compare with.
    /// @param tolerance Number The tolerance to use or RS.Math.ALMOST_ZERO if not supplied.
    /// @return Boolean
    equal_with_tolerance(rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }
        return (Math.abs(this.x - rhs.x) < tolerance &&
                Math.abs(this.y - rhs.y) < tolerance &&
                Math.abs(this.z - rhs.z) < tolerance);
    }

    /// Returns a string describing this Object.
    /// @return String A String describing this Object.
    toString() {
        return '[x: ' + this.x + ', y: ' + this.y + ', z:' + this.z + ']';
    }
}

module.exports = Vector3;
/// @}

