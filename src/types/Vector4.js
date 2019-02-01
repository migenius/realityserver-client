/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/
/**
 * @file Vector4.js
 * This file defines the Vector4 class.
 */

/**
 * @class Vector4
 * Vector 4 class.
 */
const ALMOST_ZERO=10e-5;
/**
 * @ctor
 * Creates a %Vector4 object.
 * @param vector Object An object with the initial values for the Vector4.
 * Can be either an Array, Object or Vector4.
 */
class Vector4 {
	/// @param vector Object|Array|Vector4 initial value
	constructor(vector) {
		if(vector !== undefined) {
			Vector4.prototype.set.apply(this,arguments);
		} else {
			this.set(0,0,0);
		}
    }

	/// Sets this vector from an object. The object may be of the 
	/// following types: Vector4, and Array with 3 or more members
	/// or an Object. In the case of an object it must have the 
	/// members x, y, z, and optionally w. If w is omitted then
	/// w will be set to 1. 
	/// @param rhs Vector4|Array|Object the object to set from
	set(rhs)
	{
		if(rhs instanceof Vector4) {
			this.x = rhs.x;
			this.y = rhs.y;
			this.z = rhs.z;
			this.w = rhs.w; 
		} else if(rhs instanceof Array) {
			if(rhs.length < 3) {
				throw new Error("Array needs at least 3 elements.");
			}

			this.x = parseFloat(rhs[0]);
			this.y = parseFloat(rhs[1]);
			this.z = parseFloat(rhs[2]);

			if(rhs.length > 3) {
				this.w = parseFloat(rhs[3]);
			} else {
				this.w = 1;
			}
		} else if (!isNaN(rhs)) {
			this.x = parseFloat(arguments[0]);
			this.y = parseFloat(arguments[1]);
			this.z = parseFloat(arguments[2]);
			if (arguments.length > 3) {
				this.w = parseFloat(arguments[3]);
			} else {
				this.w = 1;
			}
		} else {
			this.x = parseFloat(rhs.x);
			this.y = parseFloat(rhs.y);
			this.z = parseFloat(rhs.z);
			if(rhs.w !== undefined) {
				this.w = parseFloat(rhs.w);
			} else {
				this.w = 1;
			}
		}
	}

	/// returns a copy of this vector.
	clone() {
		return new Vector4(this);
	}

	/// Transforms this vector by applying the provided matrix.
	/// @param matrix Matrix4x4 The matrix to apply.
	/// @return Vector4 this
	transform(matrix)
	{
		var vec = this.clone();

		this.x = 	vec.x * matrix.xx +
					vec.y * matrix.yx +
					vec.z * matrix.zx +
					vec.w * matrix.wx;

		this.y = 	vec.x * matrix.xy +
					vec.y * matrix.yy +
					vec.z * matrix.zy +
					vec.w * matrix.wy;

		this.z = 	vec.x * matrix.xz +
					vec.y * matrix.yz +
					vec.z * matrix.zz +
					vec.w * matrix.wz;

		this.w = 	vec.x * matrix.xw +
					vec.y * matrix.yw +
					vec.z * matrix.zw +
					vec.w * matrix.ww;

		if(this.w)
		{
			this.scale(1.0/this.w);
			this.w = 1;
		}
	    
	    return this;
	}

	/// Transforms this vector by applying the given matrix and copies 
	/// the result into the out vector.
	/// @param matrix Matrix4x4 The matrix to apply.
	/// @param out Vector4 Vector to write to
	/// @return Vector4 the result
	transform_to(matrix, out)
	{
		out.x = 	this.x * matrix.xx +
					this.y * matrix.yx +
					this.z * matrix.zx +
					this.w * matrix.wx;

		out.y = 	this.x * matrix.xy +
					this.y * matrix.yy +
					this.z * matrix.zy +
					this.w * matrix.wy;

		out.z = 	this.x * matrix.xz +
					this.y * matrix.yz +
					this.z * matrix.zz +
					this.w * matrix.wz;

		out.w = 	this.x * matrix.xw +
					this.y * matrix.yw +
					this.z * matrix.zw +
					this.w * matrix.ww; 

		if(out.w)
		{
			out.scale(1.0/out.w);
			out.w = 1;
		}
		return out;
	}

	/// Transforms this vector by the transpose of the matrix passed in.
	/// @param matrix Matrix4x4 The matrix to apply.
	/// @return Vector4 this
	transform_transpose(matrix)
	{
		var vec = this.clone();

		this.x = 	vec.x * matrix.xx +
					vec.y * matrix.xy +
					vec.z * matrix.xz +
					vec.w * matrix.xw;

		this.y = 	vec.x * matrix.yx +
					vec.y * matrix.yy +
					vec.z * matrix.yz +
					vec.w * matrix.yw;

		this.z = 	vec.x * matrix.zx +
					vec.y * matrix.zy +
					vec.z * matrix.zz +
					vec.w * matrix.zw;

		this.w = 	vec.x * matrix.wx +
					vec.y * matrix.wy +
					vec.z * matrix.wz +
					vec.w * matrix.ww;

		if(this.w)
		{
			this.scale(1.0/this.w);
			this.w = 1;
		}
		return this;
	}


	/// Transforms this vector by the transpose of the matrix passed in and copies 
	/// the result into the out vector.
	/// @param matrix Matrix4x4 The matrix to apply.
	/// @param out Vector4 Vector to write to
	/// @return Vector4 out
	transform_transpose_to(matrix, out)
	{
		out.x = 	this.x * matrix.xx +
					this.y * matrix.xy +
					this.z * matrix.xz +
					this.w * matrix.xw;

		out.y = 	this.x * matrix.yx +
					this.y * matrix.yy +
					this.z * matrix.yz +
					this.w * matrix.yw;

		out.z = 	this.x * matrix.zx +
					this.y * matrix.zy +
					this.z * matrix.zz +
					this.w * matrix.zw;

		out.w = 	this.x * matrix.wx +
					this.y * matrix.wy +
					this.z * matrix.wz +
					this.w * matrix.ww;

		if(out.w)
		{
			out.scale(1.0/out.w);
			out.w = 1;
		}
		return out;
	}

	/// Rotates this vector by applying the provided matrix.
	/// @param matrix Matrix4x4 The matrix to apply.
	/// @return Vector4 this
	rotate(matrix)
	{
		var vec = this.clone();

		this.x = 	vec.x * matrix.xx +
					vec.y * matrix.yx +
					vec.z * matrix.zx;

		this.y = 	vec.x * matrix.xy +
					vec.y * matrix.yy +
					vec.z * matrix.zy;

		this.z = 	vec.x * matrix.xz +
					vec.y * matrix.yz +
					vec.z * matrix.zz;

		this.w = 1;
		return this;
	}


	/// Rotates this vector by the transpose of the provided matrix.
	/// @param matrix Matrix4x4 The matrix to apply.
	/// @return Vector4 this
	rotate_transpose(matrix)
	{
		var vec = this.clone();

		this.x = 	vec.x * matrix.xx +
					vec.y * matrix.xy +
					vec.z * matrix.xz;

		this.y = 	vec.x * matrix.yx +
					vec.y * matrix.yy +
					vec.z * matrix.yz;

		this.z = 	vec.x * matrix.zx +
					vec.y * matrix.zy +
					vec.z * matrix.zz;

		this.w = 1;
		return this;
	}

	/// Rotates this vector by applying the provided matrix.
	/// @param matrix Matrix4x4 The matrix to apply.
	/// @param out Vector4 Vector to write to
	/// @return Vector4 out
	rotate_to(matrix,out)
	{
		out.x = 	vec.x * matrix.xx +
					vec.y * matrix.yx +
					vec.z * matrix.zx;

		out.y = 	vec.x * matrix.xy +
					vec.y * matrix.yy +
					vec.z * matrix.zy;

		out.z = 	vec.x * matrix.xz +
					vec.y * matrix.yz +
					vec.z * matrix.zz;

		out.w = 1;
		return out;
	}


	/// Rotates this vector by the transpose of the provided matrix.
	/// @param matrix Matrix4x4 The matrix to apply.
	/// @param out Vector4 Vector to write to
	/// @return Vector4 this
	rotate_transpose_to(matrix,out)
	{
		out.x = 	vec.x * matrix.xx +
					vec.y * matrix.xy +
					vec.z * matrix.xz;

		out.y = 	vec.x * matrix.yx +
					vec.y * matrix.yy +
					vec.z * matrix.yz;

		out.z = 	vec.x * matrix.zx +
					vec.y * matrix.zy +
					vec.z * matrix.zz;

		out.w = 1;
		return out;
	}	

	/// Returns the dot product between this vector and rhs.
	/// @param rhs Vector4
	/// @return Number
	dot(rhs)
	{
		return (this.x*rhs.x + this.y*rhs.y + this.z*rhs.z);
	}	


	/// Returns the cross product between this vector and rhs.
	/// @param rhs Vector4
	/// @return Vector4 
	cross(rhs)
	{
		var cp = new Vector4();

		cp.x = this.y*rhs.z - this.z*rhs.y;
		cp.y = this.z*rhs.x - this.x*rhs.z;
		cp.z = this.x*rhs.y - this.y*rhs.x;
		return cp;
	}


	/// Returns the length of this vector.
	/// @return Number
	length()
	{
		var lsq = this.dot(this);
		return Math.sqrt(lsq);
	}


	/// Returns the distance between the point specified by this 
	/// vector and rhs.
	/// @param rhs Vector4
	/// @return Number 
	distance(rhs)
	{
		var x = rhs.x - this.x;
		var y = rhs.y - this.y;
		var z = rhs.z - this.z;

		return Math.sqrt(x*x + y*y + z*z);
	}


	/// Normalizes this vector.
	/// @return Vector4 this
	normalize()
	{
		var len = this.length();

		if(len)
		{
			this.x /= len;
			this.y /= len;
			this.z /= len;
		}
		return this;
	}


	/// Scales this vector.
	/// 
	/// @param scale Number Scale the scalar to apply.
	/// @return Vector4 this
	scale(scale)
	{
		this.x *= scale;
		this.y *= scale;
		this.z *= scale;
		return this;
	}

	/// Adds rhs to this vector and stores the result in 
	/// this vector.
	/// @param rhs Vector4 the vector to add.
	/// @return Vector4 this
	add(rhs)
	{
		this.x += rhs.x;
		this.y += rhs.y;
		this.z += rhs.z;
		return this;
	}


	/// Subtracts rhs from this vector and stores the result in 
	/// this vector.
	/// 
	/// @param rhs Vector4 the vector to subtract.
	/// @return Vector4 this 
	subtract(rhs)
	{
		this.x -= rhs.x;
		this.y -= rhs.y;
		this.z -= rhs.z;
		return this;
	}

	/// Multiplies rhs with this vector and stores the result in 
	/// this vector.
	/// 
	/// @param rhs Vector4 the vector to multiply.
	/// @return Vector4 this 
	multiply(rhs)
	{
		this.x *= rhs.x;
		this.y *= rhs.y;
		this.z *= rhs.z;
		return this;
	}

	/// Divide rhs into this vector and stores the result in 
	/// this vector.
	/// 
	/// @param rhs Vector4 the vector to multiply.
	/// @return Vector4 this 
	divide(rhs)
	{
		this.x /= rhs.x;
		this.y /= rhs.y;
		this.z /= rhs.z;
		return this;
	}

	/// Returns true if this vector and rhs are colinear.
	/// @param rhs Vector4
	/// @return Boolean True if this vector and rhs are colinear 
	is_colinear(rhs)
	{
		var vec = this.cross(rhs);
		return (Math.abs(vec.x) < ALMOST_ZERO && 
		   		Math.abs(vec.y) < ALMOST_ZERO && 
		   		Math.abs(vec.z) < ALMOST_ZERO);
	}

	 
	/// Checks if the vector is the null vector.
	/// @param tolerance Number Optional. A Number used to approximate the comparison.
	/// @return Boolean
	is_null_vector(tolerance)
	{
		if(tolerance === undefined)
		{
			return this.x == 0 && this.y == 0 && this.z == 0;
		}
		else
		{
			return Math.abs(this.x) < tolerance && Math.abs(this.y) < tolerance && Math.abs(this.z) < tolerance;
		}
	}

	/// Returns true if this vector equals rhs.
	/// @param rhs Vector4 The vector to compare with.
	/// @param use_tolerance Boolean if supplied and \c true then use tolerance
	/// @return Boolean 
	equal(rhs, use_tolerance)
	{
		if (use_tolerance)
			return this.equal_with_tolerance(rhs);

		return this.x == rhs.x && this.y == rhs.y && this.z == rhs.z && this.w == rhs.w;
	}

	/// Returns true if this vector equals rhs using tolerance
	/// @param rhs Vector4 The vector to compare with.
	/// @param tolerance Number The tolerance to use or RS.Math.ALMOST_ZERO if not supplied.
	/// @return Boolean 
	equal_with_tolerance(rhs, tolerance)
	{
		if(tolerance === undefined)
			tolerance = ALMOST_ZERO;
		return (Math.abs(this.x - rhs.x) < tolerance &&
				Math.abs(this.y - rhs.y) < tolerance &&
				Math.abs(this.z - rhs.z) < tolerance &&
				Math.abs(this.w - rhs.w) < tolerance);
	}	

	/// Returns a string describing this Object.
	/// @return String A String describing this Object.
	toString()
	{
		return "[x: " + this.x + ", y: " + this.y + ", z:" + this.z + ", w: " + this.w + "]";
	}
}

module.exports = Vector4;