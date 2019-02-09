/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Const = require('./Functions');

/**
 * Class representing a 3D Vector with components x, y and z.
 * @memberof RS.Math
 * @example
 * let v = new RS.Math.Vector3();
 * v = new RS.Math.Vector3(1,2,3);
 * v = new RS.Math.Vector3([0.2,-0.3,0.5]);
 * v = new RS.Math.Vector3({x: 0.1, y: 0.53, z: -0.2}); 
 */
class Vector3 {
    /**
     * Creates a new Vector3. Accepts any arguments that
     * {@link RS.Math.Vector3#set} accepts.
     * @param {(RS.Math.Vector3|Array|Object|...Number)=} initial - initial value.
     */
    constructor(initial) {
        if (initial !== undefined) {
            this.set(...arguments);
        } else {
            this.set(0,0,0);
        }
    }

    /**
     * Sets this vector. The source may be of the
     * following types:
     * - {@link RS.Math.Vector3}
     * - an `Array` with 3 or more members
     * - an `Object`.
     * - individual arguments for `x`, `y` and `z`
     *
     * In the case of an object being supplied it should have the
     * members `x`, `y`, `z`. Parsing failures on `x`, `y` or
     * `z` will set them to `0`.
     * @example
     * const v = new RS.Math.Vector3();
     * v.set(1,2,3);
     * v.set([0.2,-0.3,0.5]);
     * v.set({x: 0.1, y: 0.53, z: -0.2});
     * @param {(RS.Math.Vector3|Array|Object|...Number)} source - the object to set from or a set
     * of numbers.
     */
    set(source) {
        if (source instanceof Vector3) {
            /**
             * The X component of the vector
             * @member {Number}
             */
            this.x = source.x;
            /**
             * The Y component of the vector
             * @member {Number}
             */
            this.y = source.y;
            /**
             * The Z component of the vector
             * @member {Number}
             */
            this.z = source.z;
        } else if (source instanceof Array) {
            if (source.length < 3) {
                throw new Error('Array needs at least 3 elements.');
            }

            this.x = parseFloat(source[0]);
            this.y = parseFloat(source[1]);
            this.z = parseFloat(source[2]);
        } else if (!isNaN(source)) {
            this.x = parseFloat(arguments[0]);
            this.y = parseFloat(arguments[1]);
            this.z = parseFloat(arguments[2]);
        } else {
            this.x = parseFloat(source.x);
            this.y = parseFloat(source.y);
            this.z = parseFloat(source.z);
        }
        if (Number.isNaN(this.x)) {
            this.x = 0;
        }
        if (Number.isNaN(this.y)) {
            this.y = 0;
        }
        if (Number.isNaN(this.z)) {
            this.z = 0;
        }
    }


    /**
     * returns a copy of this vector.
     * @return {RS.Math.Vector3}
     */
    clone() {
        return new Vector3(this);
    }

    /**
     * Transforms this vector by multiplying the provided matrix on
     * the right hand side.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @return {RS.Math.Vector3} this
     */
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

    /**
     * Transforms this vector by multiplying the provided matrix on
     * the right hand side and copies the result into the out vector.
     * This vector is not modified.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @param {RS.Math.Vector3=} out - The vector to receive the result. If not provided
     * a new vector is created.
     * @return {RS.Math.Vector3} the transformed vector.
     */
    transform_to(matrix, out) {
        if (out === undefined || out === null) {
            out = new Vector3();
        }
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

    /**
     * Transforms this vector by multiplying the transpose of the provided matrix on
     * the right hand side.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @return {RS.Math.Vector3} this
     */
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

    /**
     * Transforms this vector by multiplying the transpose of the provided matrix on
     * the right hand side and copies the result into the out vector.
     * This vector is not modified.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @param {RS.Math.Vector3=} out - The vector to receive the result. If not provided
     * a new vector is created.
     * @return {RS.Math.Vector3} the transformed vector.
     */
    transform_transpose_to(matrix, out) {
        if (out === undefined || out === null) {
            out = new Vector3();
        }
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

    /**
     * Rotates this vector by multiplying the provided matrix on
     * the right hand side.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @return {RS.Math.Vector3} this
     */
    rotate(matrix) {
        return this.transform(matrix);
    }


    /**
     * Rotates this vector by multiplying the transpose of the provided matrix on
     * the right hand side.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @return {RS.Math.Vector3} this
     */
    rotate_transpose(matrix) {
        return this.transform_transpose(matrix);
    }

    /**
     * Rotates this vector by multiplying the provided matrix on
     * the right hand side and copies the result into the out vector.
     * This vector is not modified.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @param {RS.Math.Vector3=} out - The vector to receive the result. If not provided
     * a new vector is created.
     * @return {RS.Math.Vector3} the transformed vector.
     */
    rotate_to(matrix,out) {
        return this.transform_to(matrix,out);
    }

    /**
     * Rotates this vector by multiplying the transpose of the provided matrix on
     * the right hand side and copies the result into the out vector.
     * This vector is not modified.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @param {RS.Math.Vector3=} out - The vector to receive the result. If not provided
     * a new vector is created.
     * @return {RS.Math.Vector3} the transformed vector.
     */
    rotate_transpose_to(matrix,out) {
        return this.transform_transpose_to(matrix,out);
    }

    /**
     * Returns the dot product between this vector and another.
     * @param {(RS.Math.Vector4|RS.Math.Vector3)} rhs the other vector.
     * @return {Number} the dot product
     */
    dot(rhs) {
        return (this.x*rhs.x + this.y*rhs.y + this.z*rhs.z);
    }

    /**
     * Returns the cross product between this vector and another.
     * @param {(RS.Math.Vector4|RS.Math.Vector3)} rhs the other vector.
     * @return {RS.Math.Vector3} the cross product
     */
    cross(rhs) {
        let cp = new Vector3();

        cp.x = this.y*rhs.z - this.z*rhs.y;
        cp.y = this.z*rhs.x - this.x*rhs.z;
        cp.z = this.x*rhs.y - this.y*rhs.x;
        return cp;
    }

    /**
     * Returns the length of this vector.
     * @return {Number} the length
     */
    length() {
        let lsq = this.dot(this);
        return Math.sqrt(lsq);
    }


    /**
     * Returns the distance between the point specified by this
     * vector and another
     * @param {(RS.Math.Vector4|RS.Math.Vector3)} rhs the other vector.
     * @return {Number} the distance
     */
    distance(rhs) {
        let x = rhs.x - this.x;
        let y = rhs.y - this.y;
        let z = rhs.z - this.z;

        return Math.sqrt(x*x + y*y + z*z);
    }


    /**
     * Normalizes this vector.
     * @return {RS.Math.Vector3} this
     */
    normalize() {
        let len = this.length();

        if (len) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }


    /**
     * Uniformly scales this vector.
     * @param {Number} scale the scaling factor
     * @return {RS.Math.Vector3} this
     * @example
     * const vec = new RS.Math.Vector3(1,2,3);
     * vec.scale(2);
     * // vec is now {x:2,y:4,z:6}
     */
    scale(scale) {
        this.x *= scale;
        this.y *= scale;
        this.z *= scale;
        return this;
    }


    /**
     * Adds another vector to this vector.
     * @param {(RS.Math.Vector4|RS.Math.Vector3)} rhs the other vector
     * @return {RS.Math.Vector3} this
     * @example
     * const vec = new RS.Math.Vector3(1,2,3);
     * vec.add(new RS.Math.Vector3(7,-3,0));
     * // vec is now {x:8,y:-1,z:3}
     */
    add(rhs) {
        this.x += rhs.x;
        this.y += rhs.y;
        this.z += rhs.z;
        return this;
    }

    /**
     * Subtracts another vector from this vector.
     * @param {(RS.Math.Vector4|RS.Math.Vector3)} rhs the other vector
     * @return {RS.Math.Vector3} this
     * @example
     * const vec = new RS.Math.Vector3(1,2,3);
     * vec.subtract(new RS.Math.Vector3(7,-3,0));
     * // vec is now {x:-6,y:5,z:3}
     */
    subtract(rhs) {
        this.x -= rhs.x;
        this.y -= rhs.y;
        this.z -= rhs.z;
        return this;
    }

    /**
     * Multiplies another vector with this vector per-component.
     * @param {(RS.Math.Vector4|RS.Math.Vector3)} rhs the other vector
     * @return {RS.Math.Vector3} this
     * @example
     * const vec = new RS.Math.Vector3(1,2,3);
     * vec.multiply(new RS.Math.Vector3(7,-3,1));
     * // vec is now {x:7,y:-6,z:3}
     */
    multiply(rhs) {
        this.x *= rhs.x;
        this.y *= rhs.y;
        this.z *= rhs.z;
        return this;
    }

    /**
     * Divides another vector into this vector per-component.
     * @param {(RS.Math.Vector4|RS.Math.Vector3)} rhs the other vector
     * @return {RS.Math.Vector3} this
     * @example
     * const vec = new RS.Math.Vector3(1,2,3);
     * vec.divide(new RS.Math.Vector3(7,-3,1));
     * // vec is now {x:0.1428,y:-0.6667,z:3}
     */
    divide(rhs) {
        this.x /= rhs.x;
        this.y /= rhs.y;
        this.z /= rhs.z;
        return this;
    }

    /**
     * Returns whether this vector and another are colinear (point in the same direction.
     * @param {(RS.Math.Vector4|RS.Math.Vector3)} rhs the other vector
     * @return {Boolean} `true` if colinear, `false` if not
     * @example
     * const vec = new RS.Math.Vector3(1,2,3);
     * vec.is_colinear(new RS.Math.Vector3(2,4,6));
     * // returns true
     * vec.is_colinear(new RS.Math.Vector3(1,0,0));
     * // returns false
     * vec.is_colinear(new RS.Math.Vector3(-2,-4,-6));
     * // returns false since they point in opposite directions
     */
    is_colinear(rhs) {
        let vec = this.cross(rhs);
        return (Math.abs(vec.x) < Const.ALMOST_ZERO &&
                   Math.abs(vec.y) < Const.ALMOST_ZERO &&
                   Math.abs(vec.z) < Const.ALMOST_ZERO);
    }


    /**
     * Returns whether this vector is the null vector
     * @param {Number=} tolerance - if provided then this level of tolerance is used.
     * @return {Boolean} `true` if null, `false` if not
     * @example
     * let vec = new RS.Math.Vector3(0.01,-0.05,0.03);
     * vec.is_null_vector();
     * // returns false
     * vec.is_null_vector(0.1);
     * // returns true due to tolerance
     * vec = new RS.Math.Vector3();
     * vec.is_null_vector();
     * // returns true
     */
    is_null_vector(tolerance) {
        if (tolerance === undefined) {
            return this.x === 0 && this.y === 0 && this.z === 0;
        } else {
            return Math.abs(this.x) < tolerance && Math.abs(this.y) < tolerance && Math.abs(this.z) < tolerance;
        }
    }

    /**
     * Returns whether this vector is equal to another vector.
     * @param {RS.Math.Vector3} rhs - the vector to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used.
     * @return {Boolean} `true` if equal, `false` if not
     * @example
     * let vec = new RS.Math.Vector3(0.01,-0.05,0.03);
     * vec.equal(vec);
     * // returns true
     * vec.equal(new RS.Math.Vector3(0.02,-0.05,0.03));
     * // returns false
     * vec.equal(new RS.Math.Vector3(0.02,-0.05,0.03),0.1);
     * // returns true due to tolerance
     */
    equal(rhs, tolerance) {
        if (tolerance) {
            return this.equal_with_tolerance(rhs,tolerance);
        }

        return this.x === rhs.x && this.y === rhs.y && this.z === rhs.z;
    }

    /**
     * Returns whether this vector is equal to another vector within a tolerance.
     * @param {RS.Math.Vector3} rhs - the vector to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used, otherwise
     * tolerance is `10e-5`
     * @return {Boolean} `true` if equal, `false` if not
     * @example
     * let vec = new RS.Math.Vector3(0.01,-0.05,0.03);
     * vec.equal_with_tolerance(vec);
     * // returns true
     * vec.equal_with_tolerance(new RS.Math.Vector3(0.02,-0.05,0.03));
     * // returns false
     * vec.equal_with_tolerance(new RS.Math.Vector3(0.01001,-0.05,0.03));
     * // returns true due to default tolerance
     * vec.equal_with_tolerance(new RS.Math.Vector3(0.02,-0.05,0.03),0.1);
     * // returns true due to tolerance
     */
    equal_with_tolerance(rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }
        return (Math.abs(this.x - rhs.x) < tolerance &&
                Math.abs(this.y - rhs.y) < tolerance &&
                Math.abs(this.z - rhs.z) < tolerance);
    }

    /**
     * Returns a string describing this Object.
     * @return {String} A String describing this Object.
     */
    toString() {
        return '[x: ' + this.x + ', y: ' + this.y + ', z:' + this.z + ']';
    }
}

module.exports = Vector3;
