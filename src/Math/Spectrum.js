/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Const = require('./Functions');

/** \ingroup mi_v8_modules_math
    @{
*/
/// \mig_inside_class RS.Math
/// A Spectrum.
class Spectrum {
    /// @param color Object|Array|Color|Spectrum initial value
    constructor(color) {
        this.c = [ 0,0,0 ];
        if (color !== undefined) {
            Spectrum.prototype.set.apply(this,arguments);
        }
    }

    /// Sets this vector from an object. The object may be of the
    /// following types: Spectrum, and Array with 3 or more members
    /// or an Object. In the case of an object it must have the
    /// members x, y, z, and optionally w. If w is omitted then
    /// w will be set to 1.
    /// @param rhs Spectrum|Array|Object the object to set from
    set(rhs) {
        if (rhs instanceof Spectrum) {
            this.c[0] = rhs.c[0];
            this.c[1] = rhs.c[1];
            this.c[2] = rhs.c[2];
        } else if (rhs instanceof Array) {
            if (rhs.length < 3) {
                throw new Error('Array needs at least 3 elements.');
            }
            this.c[0] = parseFloat(rhs[0]);
            this.c[1] = parseFloat(rhs[1]);
            this.c[2] = parseFloat(rhs[2]);
        } else if (!isNaN(rhs)) {
            this.c[0] = parseFloat(arguments[0]);
            this.c[1] = parseFloat(arguments[1]);
            this.c[2] = parseFloat(arguments[2]);
        } else {
            this.c[0] = parseFloat(rhs.r);
            this.c[1] = parseFloat(rhs.g);
            this.c[2] = parseFloat(rhs.b);
        }
    }

    /// returns a copy of this color.
    clone() {
        return new Spectrum(this);
    }

    /// Scales this color.
    ///
    /// @param scale Number Scale the scalar to apply.
    /// @return Spectrum this
    scale(scale) {
        this.c[0] *= scale;
        this.c[1] *= scale;
        this.c[2] *= scale;
        return this;
    }

    /// Adds rhs to this color and stores the result in
    /// this color.
    /// @param rhs Spectrum the color to add.
    /// @return Spectrum this
    add(rhs) {
        this.c[0] += rhs.c[0];
        this.c[1] += rhs.c[1];
        this.c[2] += rhs.c[2];
        return this;
    }

    /// Subtracts rhs from this color and stores the result in
    /// this color.
    ///
    /// @param rhs Spectrum the color to subtract.
    /// @return Spectrum this
    subtract(rhs) {
        this.c[0] -= rhs.c[0];
        this.c[1] -= rhs.c[1];
        this.c[2] -= rhs.c[2];
        return this;
    }

    /// Tints this color by rhs
    ///
    /// @param rhs Spectrum the color to subtract.
    /// @return Spectrum this
    tint(rhs) {
        this.c[0] *= rhs.c[0];
        this.c[1] *= rhs.c[1];
        this.c[2] *= rhs.c[2];
        return this;
    }

    /// Returns the intensity of the RGB components, equally weighted.
    linear_intensity() {
        return (this.c[0] + this.c[1] + this.c[2]) / 3;
    }

    /// Returns the intensity of the RGB components, weighted according to the NTSC standard.
    ntsc_intensity() {
        return this.c[0] * 0.299 + this.c[1] * 0.587 + this.c[2] * 0.114;
    }

    /// Returns the intensity of the RGB components, weighted according to the CIE standard.
    cie_intensity() {
        return this.c[0] * 0.212671 + this.c[1] * 0.71516 + this.c[2] * 0.072169;
    }

    /// Returns a gamma corrected color. Does not affect this colour.
    gamma_correct(gamma_factor) {
        f = 1 / gamma_factor;
        return new Spectrum(
            Math.pow( this.c[0], f),
            Math.pow( this.c[1], f),
            Math.pow( this.c[2], f));
    }
    /// Checks if the color is black.
    /// @param tolerance Number Optional. A Number used to approximate the comparison.
    /// @return Boolean
    is_black(tolerance) {
        if (tolerance === undefined) {
            return this.c[0] === 0 && this.c[1] === 0 && this.c[2] === 0;
        } else {
            return Math.abs(this.c[0]) < tolerance &&
                    Math.abs(this.c[1]) < tolerance &&
                    Math.abs(this.c[2]) < tolerance;
        }
    }


    /// Returns true if this spectrum equals rhs.
    /// @param rhs Spectrum The spectrum to compare with.
    /// @param use_tolerance Boolean if supplied and \c true then use tolerance
    /// @return Boolean
    equal(rhs, use_tolerance) {
        if (use_tolerance) {
            return this.equal_with_tolerance(rhs);
        }

        return Array.isArray(rhs.c) && this.c[0] === rhs.c[0] && this.c[1] === rhs.c[1] && this.c[2] === rhs.c[2];
    }

    /// Returns true if this vector equals rhs using tolerance
    /// @param rhs Spectrum The vector to compare with.
    /// @param tolerance Number The tolerance to use or RS.Math.ALMOST_ZERO if not supplied.
    /// @return Boolean
    equal_with_tolerance(rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }
        return (Array.isArray(rhs.c) &&
                Math.abs(this.c[0] - rhs.c[0]) < tolerance &&
                Math.abs(this.c[1] - rhs.c[1]) < tolerance &&
                Math.abs(this.c[2] - rhs.c[2]) < tolerance);
    }

    /// Returns a string describing this Object.
    /// @return String A String describing this Object.
    toString() {
        return '[' + this.c[0] + ',' + this.c[1] + ',' + this.c[2] + ']';
    }
}

/// @}

module.exports = Spectrum;
