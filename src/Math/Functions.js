/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

module.exports = {
    ALMOST_ZERO: 10e-5,

    radians: function(degrees) {
        return degrees * 0.017453292519943295769236907684886;
    },

    degrees: function(radians) {
        return radians * 57.295779513082320876798154814105;
    }
};
