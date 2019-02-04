/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
; (function () {

    const RealityServer = {
        Command: require('./src/Command'),
        HTMLImageDisplay: require('./src/HTMLImageDisplay'),
        Matrix4x4: require('./src/types/Matrix4x4'),
        RenderLoopStateData: require('./src/RenderLoopStateData'),
        RenderedImageHandler: require('./src/RenderedImageHandler'),
        Service: require('./src/Service'),
        StateData: require('./src/StateData'),
        Vector4: require('./src/types/Vector4')
    };

    module.exports = RealityServer;
})();
