/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
import * as RS_math from '../Math/index';

/* eslint new-cap: off */

/// Known classes
const constructors = {
    'Color': RS_math.Color,
    'Float32<2>': RS_math.Vector2,
    'Float32<3>': RS_math.Vector3,
    'Float32<4>': RS_math.Vector4,
    'Float64<4,4>': RS_math.Matrix4x4,
    'Spectrum': RS_math.Spectrum
};

/// Resolves JSON-RPC style class hinting. It's not a pure implementation of
/// class hinting however it acheives the same result.
/// @access private
class Class_hinting {
    /// Resolves the given object to an actual class if one is available
    static resolve(object) {
        if (object && object['__jsonclass__'] && object['__jsonclass__'][0]) {
            const ctor = constructors[object['__jsonclass__'][0]];
            if (ctor) {
                return new ctor(object);
            }
        }
        return object;
    }

    /// Can be used as a JSON reviver
    static reviver(key, value) {
        return Class_hinting.resolve(value);
    }
}

export default Class_hinting;
