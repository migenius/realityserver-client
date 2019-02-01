/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

class RenderedImageHandler {
    /**
     * Called whenever an image is rendered.
     * @param image Uint8Array a Uint8Array containing the image
     * @param mime_type String the mime type of the image
     * @return String A String describing this Object.
     */
    imageRendered(image, mime_type) {
        throw "Implement me";
    };
}

module.exports = RenderedImageHandler;