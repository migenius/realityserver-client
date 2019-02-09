/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
; (function () {

    const RS_math = {
        Color: require('./Color'),
        Matrix4x4: require('./Matrix4x4'),
        Spectrum: require('./Spectrum'),
        Vector2: require('./Vector2'),
        Vector3: require('./Vector3'),
        Vector4: require('./Vector4')
    };

    module.exports = Object.assign(RS_math,require('./Functions'));
})();
