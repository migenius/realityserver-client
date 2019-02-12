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
        Render_loop_state_data: require('./Render_loop_state_data'),
        Service: require('./Service'),
        State_data: require('./State_data'),
    };

    module.exports = Object.assign(RealityServer,RealityServer.Math);
})();
