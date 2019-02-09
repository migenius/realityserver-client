/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Const = require('./Functions');

/**
 * Class representing a 2D Vector with components x and y.
 * @memberof RS.Math
 * @property {Number} x The x component of the vector
 * @property {Number} y The y component of the vector
 */
class Vector2 {
    /**
     * Creates a new Vector2. Accepts any arguments that
     * {@link RS.Math.Vector2#set} accepts.
     * @example
     * const v = new RS.Math.Vector2();
     * const v = new RS.Math.Vector2(1,2);
     * const v = new RS.Math.Vector2([0.2,-0.3]);
     * const v = new RS.Math.Vector2({x: 0.1, y: 0.53});
     * @param {(RS.Math.Vector2|Array|Object|...Number)=} initial - initial value.
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
     * - {@link RS.Math.Vector2}
     * - an `Array` with 2 or more members
     * - an `Object`.
     * - individual arguments for `x` and `y`
     *
     * In the case of an object being supplied it should have the
     * members `x` and `y`. Parsing failures on `x` or `y`
     * will set them to `0`.
     * @example
     * const v = new RS.Math.Vector2();
     * v.set(1,2);
     * v.set([0.2,-0.3]);
     * v.set({x: 0.1, y: 0.53});
     * @param {(RS.Math.Vector2|Array|Object|...Number)} source - the object to set from or a set
     * of numbers.
     */
    set(source) {
        if (source instanceof Vector2) {
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
        } else if (source instanceof Array) {
            if (source.length < 2) {
                throw new Error('Array needs at least 2 elements.');
            }

            this.x = parseFloat(source[0]);
            this.y = parseFloat(source[1]);
        } else if (!isNaN(source)) {
            this.x = parseFloat(arguments[0]);
            this.y = parseFloat(arguments[1]);
        } else {
            this.x = parseFloat(source.x);
            this.y = parseFloat(source.y);
        }
        if (Number.isNaN(this.x)) {
            this.x = 0;
        }
        if (Number.isNaN(this.y)) {
            this.y = 0;
        }
    }

    /**
     * returns a copy of this vector.
     * @return {RS.Math.Vector2}
     */
    clone() {
        return new Vector2(this);
    }

    /**
     * Returns the dot product between this vector and another.
     * @param {(RS.Math.Vector4|RS.Math.Vector3|RS.Math.Vector2)} rhs the other vector.
     * @return {Number} the dot product
     */
    dot(rhs) {
        return (this.x*rhs.x + this.y*rhs.y);
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
     * @param {(RS.Math.Vector4|RS.Math.Vector3|RS.Math.Vector2)} rhs the other vector.
     * @return {Number} the distance
     */
    distance(rhs) {
        let x = rhs.x - this.x;
        let y = rhs.y - this.y;

        return Math.sqrt(x*x + y*y);
    }

    /**
     * Normalizes this vector.
     * @return {RS.Math.Vector2} this
     */
    normalize() {
        let len = this.length();

        if (len) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }


    /**
     * Uniformly scales this vector.
     * @param {Number} scale the scaling factor
     * @return {RS.Math.Vector2} this
     * @example
     * const vec = new RS.Math.Vector2(1,2);
     * vec.scale(2);
     * // vec is now {x:2,y:4}
     */
    scale(scale) {
        this.x *= scale;
        this.y *= scale;
        return this;
    }

    /**
     * Adds another vector to this vector.
     * @param {(RS.Math.Vector4|RS.Math.Vector3|RS.Math.Vector2)} rhs the other vector
     * @return {RS.Math.Vector2} this
     * @example
     * const vec = new RS.Math.Vector2(1,2);
     * vec.add(new RS.Math.Vector2(7,-3));
     * // vec is now {x:8,y:-1}
     */
    add(rhs) {
        this.x += rhs.x;
        this.y += rhs.y;
        return this;
    }


    /**
     * Subtracts another vector from this vector.
     * @param {(RS.Math.Vector4|RS.Math.Vector3|RS.Math.Vector2)} rhs the other vector
     * @return {RS.Math.Vector2} this
     * @example
     * const vec = new RS.Math.Vector2(1,2);
     * vec.subtract(new RS.Math.Vector2(7,-3));
     * // vec is now {x:-6,y:5}
     */
    subtract(rhs) {
        this.x -= rhs.x;
        this.y -= rhs.y;
        return this;
    }

    /**
     * Multiplies another vector with this vector per-component.
     * @param {(RS.Math.Vector4|RS.Math.Vector3|RS.Math.Vector2)} rhs the other vector
     * @return {RS.Math.Vector2} this
     * @example
     * const vec = new RS.Math.Vector2(1,2);
     * vec.multiply(new RS.Math.Vector2(7,-3);
     * // vec is now {x:7,y:-6}
     */
    multiply(rhs) {
        this.x *= rhs.x;
        this.y *= rhs.y;
        return this;
    }

    /**
     * Divides another vector into this vector per-component.
     * @param {(RS.Math.Vector4|RS.Math.Vector3|RS.Math.Vector2)} rhs the other vector
     * @return {RS.Math.Vector2} this
     * @example
     * const vec = new RS.Math.Vector2(1,2);
     * vec.divide(new RS.Math.Vector2(7,-3));
     * // vec is now {x:0.1428,y:-0.6667}
     */
    divide(rhs) {
        this.x /= rhs.x;
        this.y /= rhs.y;
        return this;
    }

    /**
     * Returns whether this vector and another are colinear (point in the same direction.
     * @param {(RS.Math.Vector4|RS.Math.Vector3|RS.Math.Vector2)} rhs the other vector
     * @return {Boolean} `true` if colinear, `false` if not
     * @example
     * const vec = new RS.Math.Vector2(1,2);
     * vec.is_colinear(new RS.Math.Vector2(2,4));
     * // returns true
     * vec.is_colinear(new RS.Math.Vector2(1,0));
     * // returns false
     * vec.is_colinear(new RS.Math.Vector2(-2,-4));
     * // returns false since they point in opposite directions
     */
    is_colinear(rhs) {
        let x = Math.abs(this.x) - Math.abs(rhs.x);
        let y = Math.abs(this.y) - Math.abs(rhs.y);
        return (Math.abs(x) < Const.ALMOST_ZERO &&
                   Math.abs(y) < Const.ALMOST_ZERO);
    }


    /**
     * Returns whether this vector is the null vector
     * @param {Number=} tolerance - if provided then this level of tolerance is used.
     * @return {Boolean} `true` if null, `false` if not
     * @example
     * let vec = new RS.Math.Vector2(0.01,-0.05);
     * vec.is_null_vector();
     * // returns false
     * vec.is_null_vector(0.1);
     * // returns true due to tolerance
     * vec = new RS.Math.Vector2();
     * vec.is_null_vector();
     * // returns true
     */
    is_null_vector(tolerance) {
        if (tolerance === undefined) {
            return this.x === 0 && this.y === 0;
        } else {
            return Math.abs(this.x) < tolerance && Math.abs(this.y) < tolerance;
        }
    }

    /**
     * Returns whether this vector is equal to another vector.
     * @param {RS.Math.Vector2} rhs - the vector to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used.
     * @return {Boolean} `true` if equal, `false` if not
     * @example
     * let vec = new RS.Math.Vector2(0.01,-0.05);
     * vec.equal(vec);
     * // returns true
     * vec.equal(new RS.Math.Vector2(0.02,-0.05));
     * // returns false
     * vec.equal(new RS.Math.Vector2(0.02,-0.05),0.1);
     * // returns true due to tolerance
     */
    equal(rhs, tolerance) {
        if (tolerance) {
            return this.equal_with_tolerance(rhs,tolerance);
        }

        return this.x === rhs.x && this.y === rhs.y;
    }

    /**
     * Returns whether this vector is equal to another vector within a tolerance.
     * @param {RS.Math.Vector2} rhs - the vector to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used, otherwise
     * tolerance is `10e-5`
     * @return {Boolean} `true` if equal, `false` if not
     * @example
     * let vec = new RS.Math.Vector2(0.01,-0.05);
     * vec.equal_with_tolerance(vec);
     * // returns true
     * vec.equal_with_tolerance(new RS.Math.Vector2(0.02,-0.05));
     * // returns false
     * vec.equal_with_tolerance(new RS.Math.Vector2(0.01001,-0.05));
     * // returns true due to default tolerance
     * vec.equal_with_tolerance(new RS.Math.Vector2(0.02,-0.05),0.1);
     * // returns true due to tolerance
     */
    equal_with_tolerance(rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }
        return (Math.abs(this.x - rhs.x) < tolerance &&
                Math.abs(this.y - rhs.y) < tolerance);
    }

    /**
     * Returns a string describing this Object.
     * @return {String} A String describing this Object.
     */
    toString() {
        return '[x: ' + this.x + ', y: ' + this.y + ']';
    }
}

/// @}
module.exports = Vector2;
