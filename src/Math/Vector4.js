/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
import * as Const from './Functions';

/**
 * Class representing a 4D Vector with components x, y, z and w.
 * @memberof RS.Math
 * @example
 * let v = new RS.Math.Vector4();
 * v = new RS.Math.Vector4(1,2,3);
 * v = new RS.Math.Vector4([0.2,-0.3,0.5,0.4]);
 * v = new RS.Math.Vector4({x: 0.1, y: 0.53, z: -0.2});
 */
class Vector4 {
    /**
     * Creates a new Vector4. Accepts any arguments that
     * {@link RS.Math.Vector4#set} accepts.
     * @param {(RS.Math.Vector4|Array|Object|...Number)=} initial - initial value.
     */
    constructor(initial) {
        if (initial !== undefined) {
            this.set(...arguments);
        } else {
            this.set(0, 0, 0);
        }
    }
    /**
     * Sets this vector. The source may be of the
     * following types:
     * - {@link RS.Math.Vector4}
     * - an `Array` with 3 or more members
     * - an `Object`.
     * - individual arguments for `x`, `y`, `z` and `w`
     *
     * In the case of an object being supplied it should have the
     * members `x`, `y`, `z`, and optionally `w`. If `w` is omitted or parses
     * as `NaN` then `w` will be set to `1`. Parsing failures on `x`, `y` or
     * `z` will set them to `0`.
     * @example
     * const v = new RS.Math.Vector4();
     * v.set(1,2,3);
     * v.set([0.2,-0.3,0.5]);
     * v.set({x: 0.1, y: 0.53, z: -0.2});
     * @param {(RS.Math.Vector4|Array|Object|...Number)} source - the object to set from or a set
     * of numbers.
     */
    set(source) {
        if (source instanceof Vector4) {
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
            /**
             * The W component of the vector
             * @member {Number}
             */
            this.w = source.w;
        } else if (source instanceof Array) {
            if (source.length < 3) {
                throw new Error('Array needs at least 3 elements.');
            }

            this.x = parseFloat(source[0]);
            this.y = parseFloat(source[1]);
            this.z = parseFloat(source[2]);

            if (source.length > 3) {
                this.w = parseFloat(source[3]);
            } else {
                this.w = 1;
            }
        } else if (!isNaN(source)) {
            this.x = parseFloat(arguments[0]);
            this.y = parseFloat(arguments[1]);
            this.z = parseFloat(arguments[2]);
            if (arguments.length > 3) {
                this.w = parseFloat(arguments[3]);
            } else {
                this.w = 1;
            }
        } else {
            this.x = parseFloat(source.x);
            this.y = parseFloat(source.y);
            this.z = parseFloat(source.z);
            if (source.w !== undefined) {
                this.w = parseFloat(source.w);
            } else {
                this.w = 1;
            }
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
        if (Number.isNaN(this.w)) {
            this.w = 1;
        }
    }

    /**
     * returns a copy of this vector.
     * @return {RS.Math.Vector4}
     */
    clone() {
        return new Vector4(this);
    }

    /**
     * Transforms this vector by multiplying the provided matrix on
     * the right hand side.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @return {RS.Math.Vector4} this
     */
    transform(matrix) {
        const vec = this.clone();

        this.x =    vec.x * matrix.xx +
                    vec.y * matrix.yx +
                    vec.z * matrix.zx +
                    vec.w * matrix.wx;

        this.y =    vec.x * matrix.xy +
                    vec.y * matrix.yy +
                    vec.z * matrix.zy +
                    vec.w * matrix.wy;

        this.z =    vec.x * matrix.xz +
                    vec.y * matrix.yz +
                    vec.z * matrix.zz +
                    vec.w * matrix.wz;

        this.w =    vec.x * matrix.xw +
                    vec.y * matrix.yw +
                    vec.z * matrix.zw +
                    vec.w * matrix.ww;

        if (this.w) {
            this.scale(1.0/this.w);
            this.w = 1;
        }
        return this;
    }

    /**
     * Transforms this vector by multiplying the provided matrix on
     * the right hand side and copies the result into the out vector.
     * This vector is not modified.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @param {RS.Math.Vector4=} out - The vector to receive the result. If not provided
     * a new vector is created.
     * @return {RS.Math.Vector4} the transformed vector.
     */
    transform_to(matrix, out) {
        if (out === undefined || out === null) {
            out = new Vector4();
        }
        out.x =     this.x * matrix.xx +
                    this.y * matrix.yx +
                    this.z * matrix.zx +
                    this.w * matrix.wx;

        out.y =     this.x * matrix.xy +
                    this.y * matrix.yy +
                    this.z * matrix.zy +
                    this.w * matrix.wy;

        out.z =     this.x * matrix.xz +
                    this.y * matrix.yz +
                    this.z * matrix.zz +
                    this.w * matrix.wz;

        out.w =     this.x * matrix.xw +
                    this.y * matrix.yw +
                    this.z * matrix.zw +
                    this.w * matrix.ww;

        if (out.w) {
            out.scale(1.0/out.w);
            out.w = 1;
        }
        return out;
    }

    /**
     * Transforms this vector by multiplying the transpose of the provided matrix on
     * the right hand side.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @return {RS.Math.Vector4} this
     */
    transform_transpose(matrix) {
        let vec = this.clone();

        this.x =     vec.x * matrix.xx +
                    vec.y * matrix.xy +
                    vec.z * matrix.xz +
                    vec.w * matrix.xw;

        this.y =     vec.x * matrix.yx +
                    vec.y * matrix.yy +
                    vec.z * matrix.yz +
                    vec.w * matrix.yw;

        this.z =     vec.x * matrix.zx +
                    vec.y * matrix.zy +
                    vec.z * matrix.zz +
                    vec.w * matrix.zw;

        this.w =     vec.x * matrix.wx +
                    vec.y * matrix.wy +
                    vec.z * matrix.wz +
                    vec.w * matrix.ww;

        if (this.w) {
            this.scale(1.0/this.w);
            this.w = 1;
        }
        return this;
    }


    /**
     * Transforms this vector by multiplying the transpose of the provided matrix on
     * the right hand side and copies the result into the out vector.
     * This vector is not modified.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @param {RS.Math.Vector4=} out - The vector to receive the result. If not provided
     * a new vector is created.
     * @return {RS.Math.Vector4} the transformed vector.
     */
    transform_transpose_to(matrix, out) {
        if (out === undefined || out === null) {
            out = new Vector4();
        }
        out.x =     this.x * matrix.xx +
                    this.y * matrix.xy +
                    this.z * matrix.xz +
                    this.w * matrix.xw;

        out.y =     this.x * matrix.yx +
                    this.y * matrix.yy +
                    this.z * matrix.yz +
                    this.w * matrix.yw;

        out.z =     this.x * matrix.zx +
                    this.y * matrix.zy +
                    this.z * matrix.zz +
                    this.w * matrix.zw;

        out.w =     this.x * matrix.wx +
                    this.y * matrix.wy +
                    this.z * matrix.wz +
                    this.w * matrix.ww;

        if (out.w) {
            out.scale(1.0/out.w);
            out.w = 1;
        }
        return out;
    }

    /**
     * Transforms this vector by multiplying the rotation portion
     * of the provided matrix on the right hand side.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @return {RS.Math.Vector4} this
     */
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

        this.w = 1;
        return this;
    }


    /**
     * Transforms this vector by multiplying the rotation portion
     * of the transposed provided matrix on the right hand side.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @return {RS.Math.Vector4} this
     */
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

        this.w = 1;
        return this;
    }

    /**
     * Transforms this vector by multiplying the rotation portion of the provided matrix on
     * the right hand side and copies the result into the out vector.
     * This vector is not modified.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @param {RS.Math.Vector4=} out - The vector to receive the result. If not provided
     * a new vector is created.
     * @return {RS.Math.Vector4} the transformed vector.
     */
    rotate_to(matrix, out) {
        if (out === undefined || out === null) {
            out = new Vector4();
        }
        out.x =     vec.x * matrix.xx +
                    vec.y * matrix.yx +
                    vec.z * matrix.zx;

        out.y =     vec.x * matrix.xy +
                    vec.y * matrix.yy +
                    vec.z * matrix.zy;

        out.z =     vec.x * matrix.xz +
                    vec.y * matrix.yz +
                    vec.z * matrix.zz;

        out.w = 1;
        return out;
    }

    /**
     * Transforms this vector by multiplying the rotation portion of the tranposed provided matrix on
     * the right hand side and copies the result into the out vector.
     * This vector is not modified.
     * @param {RS.Math.Matrix4x4} matrix - The matrix to transform the vector by.
     * @param {RS.Math.Vector4=} out - The vector to receive the result. If not provided
     * a new vector is created.
     * @return {RS.Math.Vector4} the transformed vector.
     */
    rotate_transpose_to(matrix, out) {
        if (out === undefined || out === null) {
            out = new Vector4();
        }
        out.x =     vec.x * matrix.xx +
                    vec.y * matrix.xy +
                    vec.z * matrix.xz;

        out.y =     vec.x * matrix.yx +
                    vec.y * matrix.yy +
                    vec.z * matrix.yz;

        out.z =     vec.x * matrix.zx +
                    vec.y * matrix.zy +
                    vec.z * matrix.zz;

        out.w = 1;
        return out;
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
     * @return {RS.Math.Vector4} the cross product
     */
    cross(rhs) {
        let cp = new Vector4();

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
     * @return {RS.Math.Vector4} this
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
     * @return {RS.Math.Vector4} this
     * @example
     * const vec = new RS.Math.Vector4(1,2,3);
     * vec.scale(2);
     * // vec is now {x:2,y:4,z:6,w:1}
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
     * @return {RS.Math.Vector4} this
     * @example
     * const vec = new RS.Math.Vector4(1,2,3);
     * vec.add(new RS.Math.Vector4(7,-3,0));
     * // vec is now {x:8,y:-1,z:3,w:1}
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
     * @return {RS.Math.Vector4} this
     * @example
     * const vec = new RS.Math.Vector4(1,2,3);
     * vec.subtract(new RS.Math.Vector4(7,-3,0));
     * // vec is now {x:-6,y:5,z:3,w:1}
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
     * @return {RS.Math.Vector4} this
     * @example
     * const vec = new RS.Math.Vector4(1,2,3);
     * vec.multiply(new RS.Math.Vector4(7,-3,1));
     * // vec is now {x:7,y:-6,z:3,w:1}
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
     * @return {RS.Math.Vector4} this
     * @example
     * const vec = new RS.Math.Vector4(1,2,3);
     * vec.divide(new RS.Math.Vector4(7,-3,1));
     * // vec is now {x:0.1428,y:-0.6667,z:3,w:1}
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
     * const vec = new RS.Math.Vector4(1,2,3);
     * vec.is_colinear(new RS.Math.Vector4(2,4,6));
     * // returns true
     * vec.is_colinear(new RS.Math.Vector4(1,0,0));
     * // returns false
     * vec.is_colinear(new RS.Math.Vector4(-2,-4,-6));
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
     * let vec = new RS.Math.Vector4(0.01,-0.05,0.03);
     * vec.is_null_vector();
     * // returns false
     * vec.is_null_vector(0.1);
     * // returns true due to tolerance
     * vec = new RS.Math.Vector4();
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
     * @param {RS.Math.Vector4} rhs - the vector to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used.
     * @return {Boolean} `true` if equal, `false` if not
     * @example
     * let vec = new RS.Math.Vector4(0.01,-0.05,0.03);
     * vec.equal(vec);
     * // returns true
     * vec.equal(new RS.Math.Vector4(0.02,-0.05,0.03));
     * // returns false
     * vec.equal(new RS.Math.Vector4(0.02,-0.05,0.03),0.1);
     * // returns true due to tolerance
     */
    equal(rhs, tolerance) {
        if (tolerance) {
            return this.equal_with_tolerance(rhs, tolerance);
        }

        return this.x === rhs.x && this.y === rhs.y && this.z === rhs.z && this.w === rhs.w;
    }

    /**
     * Returns whether this vector is equal to another vector within a tolerance.
     * @param {RS.Math.Vector4} rhs - the vector to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used, otherwise
     * tolerance is `10e-5`
     * @return {Boolean} `true` if equal, `false` if not
     * @example
     * let vec = new RS.Math.Vector4(0.01,-0.05,0.03);
     * vec.equal_with_tolerance(vec);
     * // returns true
     * vec.equal_with_tolerance(new RS.Math.Vector4(0.02,-0.05,0.03));
     * // returns false
     * vec.equal_with_tolerance(new RS.Math.Vector4(0.01001,-0.05,0.03));
     * // returns true due to default tolerance
     * vec.equal_with_tolerance(new RS.Math.Vector4(0.02,-0.05,0.03),0.1);
     * // returns true due to tolerance
     */
    equal_with_tolerance(rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }
        return (Math.abs(this.x - rhs.x) < tolerance &&
                Math.abs(this.y - rhs.y) < tolerance &&
                Math.abs(this.z - rhs.z) < tolerance &&
                Math.abs(this.w - rhs.w) < tolerance);
    }

    /**
     * Returns a string describing this Object.
     * @return {String} A String describing this Object.
     */
    toString() {
        return '[x: ' + this.x + ', y: ' + this.y + ', z:' + this.z + ', w: ' + this.w + ']';
    }
}

export default Vector4;
