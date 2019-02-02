/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
const RenderedImageHandler = require('./RenderedImageHandler');

class HTMLImageDisplay extends RenderedImageHandler {
    constructor(image,urlCreator) {
        super();
        this.image = image;
        try {
            this.urlCreator = urlCreator || window.URL || window.webkitURL;
        } catch (e) {}
        if (!this.urlCreator) {
            throw 'No URL creator available.';
        }
    }
    /**
     * Called whenever an image is rendered.
     * @param image Uint8Array a Uint8Array containing the image
     * @param mime_type String the mime type of the image
     * @return String A String describing this Object.
     */
    imageRendered(image, mime_type) {
        if (this.lastUrl) {
            this.urlCreator.revokeObjectURL(this.lastUrl);
        }
        let blob = new Blob( [ image ], { type: mime_type } );
        this.lastUrl = this.urlCreator.createObjectURL( blob );
        this.image.src = this.lastUrl;
    };
}

module.exports = HTMLImageDisplay;
