/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
; (function () {

    const RealityServer = {
        Command: require('./Command'),
        HTMLImageDisplay: require('./HTMLImageDisplay'),
        Math: require('./Math/index.js'),
        RenderLoopStateData: require('./RenderLoopStateData'),
        RenderedImageHandler: require('./RenderedImageHandler'),
        Service: require('./Service'),
        StateData: require('./StateData'),
    };

    module.exports = Object.assign(RealityServer,RealityServer.Math);
})();
