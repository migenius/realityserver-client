/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Const = require('./Functions');

/** \ingroup mi_v8_modules_math
    @{
*/
/// \mig_inside_class RS.Math
/// A 2 Component vector.
class Vector2 {
    /// @param vector Object|Array|Vector2 initial value
    constructor(vector) {
        if (vector !== undefined) {
            Vector2.prototype.set.apply(this,arguments);
        } else {
            this.set(0,0);
        }
    }

    /// Sets this vector from an object. The object may be of the
    /// following types: Vector2, and Array with 3 or more members
    /// or an Object. In the case of an object it must have the
    /// members x, y, and z.
    /// @param rhs Vector2|Array|Object the object to set from
    set(rhs) {
        if (rhs instanceof Vector2) {
            this.x = rhs.x;
            this.y = rhs.y;
        } else if (rhs instanceof Array) {
            if (rhs.length < 2) {
                throw new Error('Array needs at least 2 elements.');
            }

            this.x = parseFloat(rhs[0]);
            this.y = parseFloat(rhs[1]);
        } else if (!isNaN(rhs)) {
            this.x = parseFloat(arguments[0]);
            this.y = parseFloat(arguments[1]);
        } else {
            this.x = parseFloat(rhs.x);
            this.y = parseFloat(rhs.y);
        }
    }

    /// returns a copy of this vector.
    clone() {
        return new Vector2(this);
    }

    /// Returns the dot product between this vector and rhs.
    /// @param rhs Vector2
    /// @return Number
    dot(rhs) {
        return (this.x*rhs.x + this.y*rhs.y);
    }

    /// Returns the length of this vector.
    /// @return Number
    length() {
        let lsq = this.dot(this);
        return Math.sqrt(lsq);
    }


    /// Returns the distance between the point specified by this
    /// vector and rhs.
    /// @param rhs Vector2
    /// @return Number
    distance(rhs) {
        let x = rhs.x - this.x;
        let y = rhs.y - this.y;

        return Math.sqrt(x*x + y*y);
    }


    /// Normalizes this vector.
    /// @return Vector2 this
    normalize() {
        let len = this.length();

        if (len) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }


    /// Scales this vector.
    ///
    /// @param scale Number Scale the scalar to apply.
    /// @return Vector2 this
    scale(scale) {
        this.x *= scale;
        this.y *= scale;
        return this;
    }

    /// Adds rhs to this vector and stores the result in
    /// this vector.
    /// @param rhs Vector2 the vector to add.
    /// @return Vector2 this
    add(rhs) {
        this.x += rhs.x;
        this.y += rhs.y;
        return this;
    }


    /// Subtracts rhs from this vector and stores the result in
    /// this vector.
    ///
    /// @param rhs Vector2 the vector to subtract.
    /// @return Vector2 this
    subtract(rhs) {
        this.x -= rhs.x;
        this.y -= rhs.y;
        return this;
    }

    /// Multiplies rhs with this vector and stores the result in
    /// this vector.
    ///
    /// @param rhs Vector2 the vector to multiply.
    /// @return Vector2 this
    multiply(rhs) {
        this.x *= rhs.x;
        this.y *= rhs.y;
        return this;
    }

    /// Divide rhs into this vector and stores the result in
    /// this vector.
    ///
    /// @param rhs Vector2 the vector to multiply.
    /// @return Vector2 this
    divide(rhs) {
        this.x /= rhs.x;
        this.y /= rhs.y;
        return this;
    }
    /// Returns true if this vector and rhs are colinear.
    /// @param rhs Vector2
    /// @return Boolean True if this vector and rhs are colinear
    is_colinear(rhs) {
        let x = Math.abs(this.x) - Math.abs(rhs.x);
        let y = Math.abs(this.y) - Math.abs(rhs.y);
        return (Math.abs(x) < Const.ALMOST_ZERO &&
                   Math.abs(y) < Const.ALMOST_ZERO);
    }


    /// Checks if the vector is the null vector.
    /// @param tolerance Number Optional. A Number used to approximate the comparison.
    /// @return Boolean
    is_null_vector(tolerance) {
        if (tolerance === undefined) {
            return this.x === 0 && this.y === 0;
        } else {
            return Math.abs(this.x) < tolerance && Math.abs(this.y) < tolerance;
        }
    }

    /// Returns true if this vector equals rhs.
    /// @param rhs Vector2 The vector to compare with.
    /// @param use_tolerance Boolean if supplied and \c true then use tolerance
    /// @return Boolean
    equal(rhs, use_tolerance) {
        if (use_tolerance) {
            return this.equal_with_tolerance(rhs);
        }

        return this.x === rhs.x && this.y === rhs.y;
    }

    /// Returns true if this vector equals rhs using tolerance
    /// @param rhs Vector2 The vector to compare with.
    /// @param tolerance Number The tolerance to use or RS.Math.ALMOST_ZERO if not supplied.
    /// @return Boolean
    equal_with_tolerance(rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }
        return (Math.abs(this.x - rhs.x) < tolerance &&
                Math.abs(this.y - rhs.y) < tolerance);
    }

    /// Returns a string describing this Object.
    /// @return String A String describing this Object.
    toString() {
        return '[x: ' + this.x + ', y: ' + this.y + ']';
    }
}

/// @}
module.exports = Vector2;
