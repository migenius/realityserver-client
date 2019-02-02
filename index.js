/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/
; (function () {
	
	const RealityServer = {
		Command: require('./src/Command'),
		WebSocketStreamer: require('./src/WebSocketStreamer'),
		StateData: require('./src/StateData'),
		RenderLoopStateData: require('./src/RenderLoopStateData'),
		RenderedImageHandler: require('./src/RenderedImageHandler'),
		HTMLImageDisplay: require('./src/HTMLImageDisplay'),
		Vector4: require('./src/types/Vector4'),
		Matrix4x4: require('./src/types/Matrix4x4')
	};

	module.exports = RealityServer;
})();
