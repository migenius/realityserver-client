/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
; (function () {

    const RealityServer = {
        Command: require('./Command'),
        HTMLImageDisplay: require('./HTMLImageDisplay'),
        RenderLoopStateData: require('./RenderLoopStateData'),
        RenderedImageHandler: require('./RenderedImageHandler'),
        Service: require('./Service'),
        StateData: require('./StateData'),
        Matrix4x4: require('./Math/Matrix4x4'),
        Vector4: require('./Math/Vector4')
    };

    module.exports = RealityServer;
})();
