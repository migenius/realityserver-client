/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/// Returns a function that can be used as a data handler for render loop streams
/// to display rendered images using an HTML Image element. The provided
/// onData handler will be called after displaying the image.
/// @param element the image element to use
/// @param urlCreator an object that implements URL.createObjectUrl(blob) and
/// URL.revokeObjectURL(String). If not provided then window.URL or
/// window.webkitURL will be used.
/// onData Function the function to call after displaying the image
function HTMLImageDisplay(image,urlCreator,onData) {
    const bind_to = {
        image
    };
    if (typeof urlCreator === 'function') {
        onData = urlCreator;
        urlCreator = undefined;
    }
    try {
        bind_to.urlCreator = urlCreator || window.URL || window.webkitURL;
    } catch (e) {}
    if (!bind_to.urlCreator) {
        throw 'No URL creator available.';
    }
    bind_to.onData = onData;

    function display_image(data) {
        if (data.image && data.mime_type) {
            if (this.lastUrl) {
                this.urlCreator.revokeObjectURL(this.lastUrl);
            }
            const blob = new Blob( [ data.image ], { type: data.mime_type } );
            this.lastUrl = this.urlCreator.createObjectURL( blob );
            this.image.src = this.lastUrl;
        }
        if (this.onData) {
            this.onData(data);
        }
    }
    return display_image.bind(bind_to);
}

module.exports = HTMLImageDisplay;
