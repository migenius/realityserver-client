/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const Const = require('./Functions');

/**
 * Class representing a 3 component color spectrum.
 * @memberof RS.Math
 * @example
 * let s = new RS.Math.Spectrum();
 * s = new RS.Math.Spectrum(1,0.5,0.7);
 * s = new RS.Math.Spectrum([0.2,0.3,0.5]);
 * s = new RS.Math.Spectrum({r: 0.1, r: 0.53, b: 0.2});
 * s = new RS.Math.Spectrum(new RS.Math.Spectrum([0.2,0.7,0.5]);
 */
class Spectrum {
    /**
     * Creates a new Spectrum. Accepts any arguments that
     * {@link RS.Math.Spectrum#set} accepts.
     * @param {(RS.Math.Spectrum|RS.Math.Color|Array|Object|...Number)=} initial - initial value.
     */
    constructor(initial) {
        /**
         * A 3 element `Array` containing the components of the Spectrum
         * @member {Number[]}
         */
        this.c = [ 0,0,0 ];

        if (initial !== undefined) {
            this.set(...arguments);
        }
    }

    /**
     * Sets this spectrum. The source may be of the
     * following types:
     * - {@link RS.Math.Spectrum}
     * - {@link RS.Math.Color}
     * - an `Array` with 3 or more members
     * - individual arguments for elements 0, 1 and 2.
     *
     * In the case of an object being supplied it should have the
     * members `r`, `g` and `b` Parsing failures on any element will set it to 0.
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
        if (source instanceof Spectrum) {
            this.c[0] = source.c[0];
            this.c[1] = source.c[1];
            this.c[2] = source.c[2];
        } else if (source instanceof Array) {
            if (source.length < 3) {
                throw new Error('Array needs at least 3 elements.');
            }
            this.c[0] = parseFloat(source[0]);
            this.c[1] = parseFloat(source[1]);
            this.c[2] = parseFloat(source[2]);
        } else if (!isNaN(source)) {
            this.c[0] = parseFloat(arguments[0]);
            this.c[1] = parseFloat(arguments[1]);
            this.c[2] = parseFloat(arguments[2]);
        } else {
            this.c[0] = parseFloat(source.r);
            this.c[1] = parseFloat(source.g);
            this.c[2] = parseFloat(source.b);
        }
        if (Number.isNaN(this.c[0])) {
            this.c[0] = 0;
        }
        if (Number.isNaN(this.c[1])) {
            this.c[1] = 0;
        }
        if (Number.isNaN(this.c[2])) {
            this.c[2] = 0;
        }
    }

    /**
     * returns a copy of this spectrum.
     * @return {RS.Math.Spectrum}
     */
    clone() {
        return new Spectrum(this);
    }

    /**
     * Uniformly scales this spectrum.
     * @param {Number} scale the scaling factor
     * @return {RS.Math.Color} this
     * @example
     * const spec = new RS.Math.Spectrum(1,0.5,0.6);
     * spec.scale(0.5);
     * // spec.c is now [0.5,0.25,0.3]
     */
    scale(scale) {
        this.c[0] *= scale;
        this.c[1] *= scale;
        this.c[2] *= scale;
        return this;
    }

    /**
     * Adds another spectrum to this spectrum.
     * @param {RS.Math.Spectrum} rhs the other spectrum
     * @return {RS.Math.Spectrum} this
     * @example
     * const spec = new RS.Math.Spectrum(0.2,0.2,0.3);
     * spec.add(new RS.Math.Spectrum(0.3,0,0.1));
     * // spec.c is now [0.5,0.2,0.4]
     */
    add(rhs) {
        this.c[0] += rhs.c[0];
        this.c[1] += rhs.c[1];
        this.c[2] += rhs.c[2];
        return this;
    }

    /**
     * Subtracts another spectrum from this spectrum.
     * @param {RS.Math.Spectrum} rhs the other spectrum
     * @return {RS.Math.Spectrum} this
     * @example
     * const spec = new RS.Math.Spectrum(0.2,0.2,0.3);
     * spec.subtract(new RS.Math.Spectrum(0.1,0,0.1));
     * // spec.c is now [0.1,0.2,0.2]
     */
    subtract(rhs) {
        this.c[0] -= rhs.c[0];
        this.c[1] -= rhs.c[1];
        this.c[2] -= rhs.c[2];
        return this;
    }

    /**
     * Tints this spectrum by another.
     * @param {RS.Math.Spectrum} rhs the spectrum to tint with
     * @return {RS.Math.Spectrum} this
     * @example
     * const spec = new RS.Math.Spectrum(0.8,0.8,0.8);
     * spec.tint(new RS.Math.Spectrum(1,0.5,0.6));
     * // spec.c is now [0.8,0.4,0.48]
     */
    tint(rhs) {
        this.c[0] *= rhs.c[0];
        this.c[1] *= rhs.c[1];
        this.c[2] *= rhs.c[2];
        return this;
    }

    /**
     * Returns the intensity of the components, equally weighted.
     * @return {Number} the intensity
     */
    linear_intensity() {
        return (this.c[0] + this.c[1] + this.c[2]) / 3;
    }

    /**
     * Returns the intensity of the components, weighted according to the NTSC standard.
     * @return {Number} the intensity
     */
    ntsc_intensity() {
        return this.c[0] * 0.299 + this.c[1] * 0.587 + this.c[2] * 0.114;
    }

    /**
     * Returns the intensity of the components, weighted according to the CIE standard.
     * @return {Number} the intensity
     */    cie_intensity() {
        return this.c[0] * 0.212671 + this.c[1] * 0.71516 + this.c[2] * 0.072169;
    }

    /**
     * Returns a gamma corrected copy of this spectrum. Equivalent to
     * `this ^ (1/factor)`
     * @param {Number} factor the gamma factor
     * @return {RS.Math.Spectrum} the gamma corrected spectrum
     */
    gamma_correct(gamma_factor) {
        f = 1 / gamma_factor;
        return new Spectrum(
            Math.pow( this.c[0], f),
            Math.pow( this.c[1], f),
            Math.pow( this.c[2], f));
    }
    /**
     * Checks if the spectrum is black.
     * @param {Number=} tolerance. A Number used to approximate the comparison.
     * @return {Boolean} `true` if black, `false` if not
     */
    is_black(tolerance) {
        if (tolerance === undefined) {
            return this.c[0] === 0 && this.c[1] === 0 && this.c[2] === 0;
        } else {
            return Math.abs(this.c[0]) < tolerance &&
                    Math.abs(this.c[1]) < tolerance &&
                    Math.abs(this.c[2]) < tolerance;
        }
    }

    /**
     * Returns whether this spectrum is equal to another spectrum.
     * @param {RS.Math.Spectrum} rhs - the spectrum to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used.
     * @return {Boolean} `true` if equal, `false` if not
     * @example
     * let spec = new RS.Math.Spectrum(0.01,0.05,0.03);
     * spec.equal(spec);
     * // returns true
     * spec.equal(new RS.Math.Spectrum(0.02,0.05,0.03));
     * // returns false
     * spec.equal(new RS.Math.Spectrum(0.02,0.05,0.03),0.1);
     * // returns true due to tolerance
     */
    equal(rhs, tolerance) {
        if (tolerance) {
            return this.equal_with_tolerance(rhs,tolerance);
        }

        return Array.isArray(rhs.c) && this.c[0] === rhs.c[0] && this.c[1] === rhs.c[1] && this.c[2] === rhs.c[2];
    }

    /**
     * Returns whether this spectrum is equal to another spectrum within a tolerance.
     * @param {RS.Math.Spectrum} rhs - the spectrum to compare to
     * @param {Number=} tolerance - if provided then this level of tolerance is used, otherwise
     * tolerance is `10e-5`
     * @return {Boolean} `true` if equal, `false` if not
     * @example
     * let spec = new RS.Math.Spectrum(0.01,0.05,0.03);
     * spec.equal_with_tolerance(spec);
     * // returns true
     * spec.equal_with_tolerance(new RS.Math.Spectrum(0.02,0.05,0.03));
     * // returns false
     * spec.equal_with_tolerance(new RS.Math.Spectrum(0.01001,0.05,0.03));
     * // returns true due to default tolerance
     * spec.equal_with_tolerance(new RS.Math.Spectrum(0.02,0.05,0.03),0.1);
     * // returns true due to tolerance
     */
    equal_with_tolerance(rhs, tolerance) {
        if (tolerance === undefined) {
            tolerance = Const.ALMOST_ZERO;
        }
        return (Array.isArray(rhs.c) &&
                Math.abs(this.c[0] - rhs.c[0]) < tolerance &&
                Math.abs(this.c[1] - rhs.c[1]) < tolerance &&
                Math.abs(this.c[2] - rhs.c[2]) < tolerance);
    }

    /**
     * Returns a string describing this Object.
     * @return {String} A String describing this Object.
     */
    toString() {
        return '[' + this.c[0] + ',' + this.c[1] + ',' + this.c[2] + ']';
    }
}

module.exports = Spectrum;
