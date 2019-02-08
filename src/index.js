/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
; (function () {

    const RealityServer = {
        Command: require('./Command'),
        HTMLImageDisplay: require('./HTMLImageDisplay'),
        Math: require('./Math/index'),
        RenderLoopStateData: require('./RenderLoopStateData'),
        RenderedImageHandler: require('./RenderedImageHandler'),
        Service: require('./Service'),
        StateData: require('./StateData'),
    };

    module.exports = RealityServer;
})();
