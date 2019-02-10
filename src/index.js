/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * @namespace RS
 */

; (function () {

    const RealityServer = {
        Command: require('./Command'),
        Helpers: require('./Helpers'),
        Math: require('./Math/index.js'),
        RenderLoopStateData: require('./RenderLoopStateData'),
        Service: require('./Service'),
        StateData: require('./StateData'),
    };

    module.exports = Object.assign(RealityServer,RealityServer.Math);
})();
