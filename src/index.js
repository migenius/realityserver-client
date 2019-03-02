/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * @namespace RS
 */

; (function () {

    const RealityServer = {
        Command: require('./Command'),
        Command_error: require('./Command_error'),
        Error: require('./Error'),
        Utils: require('./Utils'),
        Math: require('./Math/index'),
        Service: require('./Service'),
        Stream: require('./Stream'),
    };

    module.exports = Object.assign(RealityServer, RealityServer.Math);
})();
