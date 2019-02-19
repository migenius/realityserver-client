/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * @namespace RS
 */

; (function () {

    const RealityServer = {
        Command: require('./Command'),
        Error: require('./Error'),
        Helpers: require('./Helpers'),
        Math: require('./Math/index'),
        Service: require('./Service'),
        State_data: require('./State_data'),
        Stream: require('./Stream'),
    };

    module.exports = Object.assign(RealityServer,RealityServer.Math);
})();
