/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Const = require('./Functions');
const Spectrum = require('./Spectrum');

/**
 * Class representing an RGBA Color.
 * @memberof RS.Math
 * @example
 * let c = new RS.Math.Color();
 * c = new RS.Math.Color(1,0.5,0.7);
 * c = new RS.Math.Color([0.2,0.3,0.5]);
 * c = new RS.Math.Color({r: 0.1, r: 0.53, b: 0.2});
 * c = new RS.Math.Color(new RS.Math.Spectrum([0.2,0.7,0.5]);
 */
class Color {
    /**
     * Creates a new Color. Accepts any arguments that
     * {@link RS.Math.Color#set} accepts.
     * @param {(RS.Math.Color|RS.Math.Spectrum|Array|Object|...Number)=} initial - initial value.
     */
    constructor(color) {
        if (color !== undefined) {
            this.set(...arguments);
        } else {
            this.set(0,0,0);
        }
    }

    /**
     * Sets this color. The source may be of the
     * following types:
     * - {@link RS.Math.Color}
     * - {@link RS.Math.Spectrum}
     * - an `Array` with 3 or more members
     * - an `Object`.
     * - individual arguments for `r`, `g`, `b` and `a`
     *
     * In the case of an object being supplied it should have the
     * members `r`, `g`, `b`, and optionally `a`. If `a` is omitted or parses
     * as `NaN` then `a` will be set to `1`. Parsing failures on `r`, `g` or
     * `b` will set them to `0`.
     * @example
     * const c = new RS.Math.Color();
     * c.set(1,0.5,0.7);
     * c.set([0.2,0.3,0.5]);
     * c.set({r: 0.1, r: 0.53, b: 0.2});
     * c.set(new RS.Math.Spectrum([0.2,0.7,0.5]);
     * @param {(RS.Math.Color|RS.Math.Spectrum|Array|Object|...Number)} source - the object to set from or a set
     * of numbers.
     */
    set(source) {
        if (source instanceof Color) {
            /**
             * The red component of the color
             * @member {Number}
             */
            this.r = source.r;
            /**
             * The green component of the color
             * @member {Number}
             */
            this.g = source.g;
            /**
             * The blue component of the color
             * @member {Number}
             */
            this.b = source.b;
            /**
             * The alpha component of the color
             * @member {Number}
             */
            this.a = source.a;
        } if (source instanceof Spectrum) {
            this.r = source.c[0];
            this.g = source.c[1];
            this.b = source.c[2];
            this.a = 1;
        } else if (source instanceof Array) {
            if (source.length < 3) {
                throw new Error('Array needs at least 3 elements.');
            }

            this.r = parseFloat(source[0]);
            this.g = parseFloat(source[1]);
            this.b = parseFloat(source[2]);

            if (source.length > 3) {
                this.a = parseFloat(source[3]);
            } else {
                this.a = 1;
            }
        } else if (!isNaN(source)) {
            this.r = parseFloat(arguments[0]);
            this.g = parseFloat(arguments[1]);
            this.b = parseFloat(arguments[2]);
            if (arguments.length > 3) {
                this.a = parseFloat(arguments[3]);
            } else {
                this.a = 1;
            }
        } else {
            this.r = parseFloat(source.r);
            this.g = parseFloat(source.g);
            this.b = parseFloat(source.b);
            if (source.a !== undefined) {
                this.a = parseFloat(source.a);
            } else {
                this.a = 1;
            }
        }
        if (Number.isNaN(this.r)) {
            this.r = 0;
        }
        if (Number.isNaN(this.g)) {
            this.g = 0;
        }
        if (Number.isNaN(this.b)) {
            this.b = 0;
        }
        if (Number.isNaN(this.a)) {
            this.b = 1;
        }
    }

    /**
     * returns a copy of this color.
     * @return {RS.Math.Color}
     */
    clone() {
        return new Color(this);
    }

    /**
     * Uniformly scales this color.
     * @param {Number} scale the scaling factor
     * @return {RS.Math.Color} this
     * @example
     * const col = new RS.Math.Color(1,0.5,0.6);
     * col.scale(0.5);
     * // col is now {r:0.5,g:0.25,z:0.3,a:1}
     */
    scale(scale) {
        this.r *= scale;
        this.g *= scale;
        this.b *= scale;
        return this;
    }

    /**
     * Adds another color to this color.
     * @param {RS.Math.Color} rhs the other color
     * @return {RS.Math.Color} this
     * @example
     * const col = new RS.Math.Color(0.2,0.2,0.3);
     * col.add(new RS.Math.Color(0.3,0,0.1));
     * // col is now {r:0.5,g:0.2,b:0.4,a:1}
     */
    add(rhs) {
        this.r += rhs.r;
        this.g += rhs.g;
        this.b += rhs.b;
        return this;
    }

    /**
     * Subtracts another color from this color.
     * @param {RS.Math.Color} rhs the other color
     * @return {RS.Math.Color} this
     * @example
     * const col = new RS.Math.Color(0.2,0.2,0.3);
     * col.subtract(new RS.Math.Color(0.1,0,0.1));
     * // col is now {r:0.1,g:0.2,b:0.2,a:1}
     */
    subtract(rhs) {
        this.r -= rhs.r;
        this.g -= rhs.g;
        this.b -= rhs.b;
        return this;
    }

    /**
     * Tints this color by another.
     * @param {RS.Math.Color} rhs the color to tint with
     * @return {RS.Math.Color} this
     * @example
     * const col = new RS.Math.Color(0.8,0.8,0.8);
     * col.tint(new RS.Math.Color(1,0.5,0.6));
     * // col is now {r:0.8,g:0.4,b:0.48,a:1}
     */
    tint(rhs) {
        this.r *= rhs.r;
        this.g *= rhs.g;
        this.b *= rhs.b;
        return this;
    }

    /**
     * Returns the intensity of the RGB components, equally weighted.
     * @return {Number} the intensity
     */
    linear_intensity() {
        return (this.r + this.g + this.b) / 3;
    }

    /**
     * Returns the intensity of the RGB components, weighted according to the NTSC standard.
     * @return {Number} the intensity
     */
    ntsc_intensity() {
        return this.r * 0.299 + this.g * 0.587 + this.b * 0.114;
    }

    /**
     * Returns the intensity of the RGB components, weighted according to the CIE standard.
     * @return {Number} the intensity
     */
    cie_intensity() {
        return this.r * 0.212671 + this.g * 0.715160 + this.b * 0.072169;
    }

    /**
     * Returns a gamma corrected copy of this color. Equivalent to
     * `this ^ (1/factor)`
     * @param {Number} factor the gamma factor
     * @return {RS.Math.Color} the gamma corrected color
     */
    gamma_correct(factor) {
        f = 1 / factor;
        return new Color(
            Math.pow( this.r, f),
            Math.pow( this.g, f),
            Math.pow( this.b, f),
            this.a);
    }
    /**
     * Checks if the color is black.
     * @param {Number=} tolerance. A Number used to approximate the comparison.
     * @return {Boolean} `true` if black, `false` if not
     */
    is_black(tolerance) {
        if (tolerance === undefined) {
            return this.r === 0 && this.g === 0 && this.b === 0;
        } else {
            return Math.abs(this.r) < tolerance && Math.abs(this.g) < tolerance && Math.abs(this.b) < tolerance;
        }
    }

    /**
     * Returns whether this color is equal to another color.
     * @param {RS.Math.Color} rhs - the color to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used.
     * @return {Boolean} `true` if equal, `false` if not
     * @example
     * let col = new RS.Math.Color(0.01,0.05,0.03);
     * col.equal(col);
     * // returns true
     * col.equal(new RS.Math.Color(0.02,0.05,0.03));
     * // returns false
     * col.equal(new RS.Math.Color(0.02,0.05,0.03),0.1);
     * // returns true due to tolerance
     */
    equal(rhs, tolerance) {
        if (tolerance) {
            return this.equal_with_tolerance(rhs, tolerance);
        }

        return this.r === rhs.r && this.g === rhs.g && this.b === rhs.b && this.a === rhs.a;
    }

    /**
     * Returns whether this color is equal to another color within a tolerance.
     * @param {RS.Math.Color} rhs - the color to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used, otherwise
     * tolerance is `10e-5`
     * @return {Boolean} `true` if equal, `false` if not
     * @example
     * let col = new RS.Math.Color(0.01,0.05,0.03);
     * col.equal_with_tolerance(col);
     * // returns true
     * col.equal_with_tolerance(new RS.Math.Color(0.02,0.05,0.03));
     * // returns false
     * col.equal_with_tolerance(new RS.Math.Color(0.01001,0.05,0.03));
     * // returns true due to default tolerance
     * col.equal_with_tolerance(new RS.Math.Color(0.02,0.05,0.03),0.1);
     * // returns true due to tolerance
     */
    equal_with_tolerance(rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }
        return (Math.abs(this.r - rhs.r) < tolerance &&
                Math.abs(this.g - rhs.g) < tolerance &&
                Math.abs(this.b - rhs.b) < tolerance &&
                Math.abs(this.a - rhs.a) < tolerance);
    }

    /**
     * Returns a string describing this Object.
     * @return {String} A String describing this Object.
     */
    toString() {
        return '[r: ' + this.r + ', g: ' + this.g + ', b:' + this.b + ', a: ' + this.a + ']';
    }
}

/** @} */

module.exports = Color;
