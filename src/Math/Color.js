/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Const = require('./Functions');
const Spectrum = require('./Spectrum');

/** \ingroup mi_v8_modules_math
    @{
*/
/// \mig_inside_class RS.Math
/// A Color.
class Color {
    /// @param color Object|Array|Color|Spectrum initial value
    constructor(color) {
        if (color !== undefined) {
            Color.prototype.set.apply(this,arguments);
        } else {
            this.set(0,0,0);
        }
    }

    /// Sets this vector from an object. The object may be of the
    /// following types: Color, and Array with 3 or more members
    /// or an Object. In the case of an object it must have the
    /// members x, y, z, and optionally w. If w is omitted then
    /// w will be set to 1.
    /// @param rhs Color|Array|Object the object to set from
    set(rhs) {
        if (rhs instanceof Color) {
            this.r = rhs.r;
            this.g = rhs.g;
            this.b = rhs.b;
            this.a = rhs.a;
        } if (rhs instanceof Spectrum) {
            this.r = rhs.c[0];
            this.g = rhs.c[1];
            this.b = rhs.c[2];
            this.a = 1;
        } else if (rhs instanceof Array) {
            if (rhs.length < 3) {
                throw new Error('Array needs at least 3 elements.');
            }

            this.r = parseFloat(rhs[0]);
            this.g = parseFloat(rhs[1]);
            this.b = parseFloat(rhs[2]);

            if (rhs.length > 3) {
                this.a = parseFloat(rhs[3]);
            } else {
                this.a = 1;
            }
        } else if (!isNaN(rhs)) {
            this.r = parseFloat(arguments[0]);
            this.g = parseFloat(arguments[1]);
            this.b = parseFloat(arguments[2]);
            if (arguments.length > 3) {
                this.a = parseFloat(arguments[3]);
            } else {
                this.a = 1;
            }
        } else {
            this.r = parseFloat(rhs.r);
            this.g = parseFloat(rhs.g);
            this.b = parseFloat(rhs.b);
            if (rhs.a !== undefined) {
                this.a = parseFloat(rhs.a);
            } else {
                this.a = 1;
            }
        }
    }

    /// returns a copy of this color.
    /// \return RS.Math.Color
    clone() {
        return new Color(this);
    }

    /// Scales this color.
    ///
    /// @param scale Number Scale the scalar to apply.
    /// @return Color this
    scale(scale) {
        this.r *= scale;
        this.g *= scale;
        this.b *= scale;
        return this;
    }

    /// Adds rhs to this color and stores the result in
    /// this color.
    /// @param rhs Color the color to add.
    /// @return Color this
    add(rhs) {
        this.r += rhs.r;
        this.g += rhs.g;
        this.b += rhs.b;
        return this;
    }

    /// Subtracts rhs from this color and stores the result in
    /// this color.
    ///
    /// @param rhs Color the color to subtract.
    /// @return Color this
    subtract(rhs) {
        this.r -= rhs.r;
        this.g -= rhs.g;
        this.b -= rhs.b;
        return this;
    }

    /// Tints this color by rhs
    ///
    /// @param rhs Color the color to subtract.
    /// @return Color this
    tint(rhs) {
        this.r *= rhs.r;
        this.g *= rhs.g;
        this.b *= rhs.b;
        return this;
    }

    /// Returns the intensity of the RGB components, equally weighted.
    linear_intensity() {
        return (this.r + this.g + this.b) / 3;
    }

    /// Returns the intensity of the RGB components, weighted according to the NTSC standard.
    ntsc_intensity() {
        return this.r * 0.299 + this.g * 0.587 + this.b * 0.114;
    }

    /// Returns the intensity of the RGB components, weighted according to the CIE standard.
    cie_intensity() {
        return this.r * 0.212671 + this.g * 0.715160 + this.b * 0.072169;
    }

    /// Returns a gamma corrected color. Does not affect this colour.
    gamma_correct(gamma_factor) {
        f = 1 / gamma_factor;
        return new Color(
            Math.pow( this.r, f),
            Math.pow( this.g, f),
            Math.pow( this.b, f),
            this.a);
    }
    /// Checks if the color is black.
    /// @param tolerance Number Optional. A Number used to approximate the comparison.
    /// @return Boolean
    is_black(tolerance) {
        if (tolerance === undefined) {
            return this.r === 0 && this.g === 0 && this.b === 0;
        } else {
            return Math.abs(this.r) < tolerance && Math.abs(this.g) < tolerance && Math.abs(this.b) < tolerance;
        }
    }


    /// Returns true if this vector equals rhs.
    /// @param rhs Color The vector to compare with.
    /// @param use_tolerance Boolean if supplied and \c true then use tolerance
    /// @return Boolean
    equal(rhs, use_tolerance) {
        if (use_tolerance) {
            return this.equal_with_tolerance(rhs);
        }

        return this.r === rhs.r && this.g === rhs.g && this.b === rhs.b && this.a === rhs.a;
    }

    /// Returns true if this vector equals rhs using tolerance
    /// @param rhs Color The vector to compare with.
    /// @param tolerance Number The tolerance to use or RS.Math.ALMOST_ZERO if not supplied.
    /// @return Boolean
    equal_with_tolerance(rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }
        return (Math.abs(this.r - rhs.r) < tolerance &&
                Math.abs(this.g - rhs.g) < tolerance &&
                Math.abs(this.b - rhs.b) < tolerance &&
                Math.abs(this.a - rhs.a) < tolerance);
    }

    /// Returns a string describing this Object.
    /// @return String A String describing this Object.
    toString() {
        return '[r: ' + this.r + ', g: ' + this.g + ', b:' + this.b + ', a: ' + this.a + ']';
    }
}

/** @} */

module.exports = Color;
