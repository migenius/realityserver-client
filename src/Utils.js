/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
import EventEmitter from 'eventemitter3';

/**
 * Provides assorted utilities useful to RealityServer users.
 * @namespace Utils
 * @memberof RS
 */

/**
 * @see {@link https://github.com/primus/eventemitter3}
 *
 * @class EventEmitter
 * @memberof RS.Utils
 * @type {EventEmitter}
 */
export { EventEmitter as EventEmitter };


/**
 * Characters to use in random strings.
 * @access private
 * @memberof RS.Utils
 * @type {Char[]}
 */
function uidArr() {
    return [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
        'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z' ];
}

/**
 * Creates a random string of the given length using characters 0-9 and a-z.
 * Useful for creating random scope, scene or render loop names.
 * @memberof RS.Utils
 * @alias create_random_string
 * @param {Number} length - The length of the string
 * @return {String} The random string
 */
export function create_random_string(length=8) {
    let charsArr = uidArr();

    let id = '';
    let len = charsArr.length;
    for (let i=0; i<length; i++) {
        let n = Math.floor((Math.random()*len));
        id += charsArr[n];
    }

    return id;
}

/**
 * Extracts details from the provided URL which can be used to create the
 * web socket connection URL. Useful when the webpage is served directly
 * from the RealityServer we wish to connect to. Supports the following
 * protocols:
 * - `file`
 * - `http`
 * - `https`
 *
 * If a file URL is supplied the we assume RealityServer is running on
 * `localhost` port `8080`.
 *
 * The returned object has the following properties:
 * - `host` the hostname portion of the url. Supports hostnames, IPv4 and
 * IPv6 addresses.
 * - `port` the port used by the url. If no port was specified then the
 * default port for the protocol is returned.
 * - `secure` whether a secure protocol was supplied.
 * @memberof RS.Utils
 * @alias extract_url_details
 * @param {String} url - The url to extract from.
 * @return {Object}
 * @throws {String} Throws if the URL protocol is unsupported.
 * @example
 * const url_info = RS.Utils.extract_url_details(document.location.toString());
 * const ws_url = (url_info.secure ? 'wss://' : 'ws://') +
 *                 url_info.host + ':' + url_info.port +
 *                 '/service/';
 */
export function extract_url_details(url) {
    const result = {
        secure: false
    };
    if (url.indexOf('file://') === 0) {
        // File URL defaults to using local host. Mostly useful
        // during development.
        result.host = '127.0.0.1';
        result.port = 8080;
    } else if (url.indexOf('http://') === 0) {
        const bracketIndex = url.indexOf(']', 7);
        let colonIndex = -1;
        if (bracketIndex !== -1) {
            /** Brackets are only used for numerical IPv6, check for port after brackets. */
            colonIndex = url.indexOf(':', bracketIndex);
        } else {
            colonIndex = url.indexOf(':', 7);
        }
        if (colonIndex < 0) {
            result.port = 80;
            result.host = url.substring(7, url.indexOf('/', 7));
        } else {
            result.host = url.substring(7, colonIndex);
            const portStr = url.substring(colonIndex+1, url.indexOf('/', 7));
            result.port = parseInt(portStr);
        }
    } else if (url.indexOf('https://') === 0) {
        const bracketIndex = url.indexOf(']', 8);
        let colonIndex = -1;
        if (bracketIndex !== -1) {
            /** Brackets are only used for numerical IPv6, check for port after brackets. */
            colonIndex = url.indexOf(':', bracketIndex);
        } else {
            colonIndex = url.indexOf(':', 8);
        }
        if (colonIndex < 0) {
            result.port = 443;
            result.host = url.substring(8, url.indexOf('/', 8));
        } else {
            result.host = url.substring(8, colonIndex);
            const portStr = url.substring(colonIndex+1, url.indexOf('/', 8));
            result.port = parseInt(portStr);
        }
        result.secure = true;
    } else {
        throw 'Unsupported URL schema';
    }
    return result;
}

/**
 * Returns a function that can be used as a event handler for render loop stream image events
 * to display rendered images via an HTML Image element (or any object that can process a
 * URL assigned to it's `src` property).
 * @memberof RS.Utils
 * @alias html_image_display
 * @param {Image} image - the image element to use
 * @param {Object=} url_creator - an object that implements `URL.createObjectUrl(Blob)` and
 * `URL.revokeObjectURL(String)`. If not provided then `window.URL` or
 * `window.webkitURL` will be used.
 * @example
 * // Assumptions: There exists a DOM element &lt;img src="" id="rs_display"&gt;
 *
 * async start_render_loop(service) {
 *     // start the render loop
 *     try {
 *         await service.execute_command(
 *                  new RS.Command('start_render_loop',{
 *                      render_loop_name: 'meyemii_render_loop',
 *                      render_loop_handler_name: 'default',
 *                      scene_name: 'meyemii',
 *                      render_loop_handler_parameters: [ 'renderer', 'iray' ],
 *                      timeout: 30
 *                  }),true);
 *      } catch(err) {
 *          console.error(`Start render loop failed ${JSON.stringify(err)}`);
 *          return;
 *      }
 *      // get image to display in
 *      const image_element = Document.getElementById('rs_display');
 *
 *      // stream rendered results back from the render loop and display them in
 *      // rs_display
 *      try {
 *          const stream = await service.stream(
 *              {
 *                  render_loop_name: 'meyemii_render_loop',
 *                  image_format: 'jpg',
 *                  quality: '100'
 *              });
 *          stream.on('image',RS.Utils.html_image_display(image_element));
 *          stream.on('image',image => {
 *                  if (image.result < 0) {
 *                      console.error(`Render error: ${image.result}`)
 *                      return; // error on render
 *                  }
 *                  console.log('Image rendered.');
 *          });
 *      } catch (err) {
 *          console.error(`Start render loop stream failed ${JSON.stringify(err)}`)
 *      };
 *  }
 */

export function html_image_display(image, url_creator) {

    const bind_to = {
        image
    };
    try {
        bind_to.url_creator = url_creator || (window ? (window.URL || window.webkitURL) : undefined);
    } catch (e) {}
    if (!bind_to.url_creator) {
        throw 'No URL creator available.';
    }

    function display_image(data) {
        if (!data.images || data.images.length === 0) {
            return;
        }

        data = data.images[0];

        if (data.image && data.mime_type) {
            if (this.lastUrl) {
                this.url_creator.revokeObjectURL(this.lastUrl);
            }
            const blob = new Blob( [ data.image ], { type: data.mime_type } );
            this.lastUrl = this.url_creator.createObjectURL( blob );
            this.image.src = this.lastUrl;
        }
    }
    return display_image.bind(bind_to);
}

/**
 * Returns a function that can be used as a event handler for render loop stream image events
 * to display MP4 encoded rendered images via an HTML Video element and MediaSource
 * compatible decoder.
 * @memberof RS.Utils
 * @alias html_video_display
 * @param {Video} video - the video element to use
 * @param {Object=} media_source - a constructor that returns an object  that implements the
 * MediaSource API as defined in
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API}.
 * If not provided then the `MediaSource` constructor will be used.
 * @param {Object=} url_creator - an object that implements `URL.createObjectUrl(Blob)` and
 * `URL.revokeObjectURL(String)`. If not provided then `window.URL` or
 * `window.webkitURL` will be used.
 */
export function html_video_display(video, media_source, url_creator) {
    const bind_to = {
        video,
        buffer: [],
        data_size: 0
    };
    media_source = media_source || MediaSource;
    url_creator = url_creator ||  (window ? (window.URL || window.webkitURL) : undefined);

    if (!media_source || !url_creator) {
        throw 'No nedia source or URL creator available.';
    }

    bind_to.source = new media_source(); // eslint-disable-line new-cap
    bind_to.source_buffer = undefined;
    video.src = url_creator.createObjectURL(bind_to.source);

    bind_to.source.addEventListener('sourceopen', function() {
        // get a source buffer to contain video data that we'll receive from the server
        bind_to.source_buffer = bind_to.source.addSourceBuffer('video/mp4; codecs="avc1.64001E"');
    });

    bind_to.source.addEventListener('webkitsourceopen', function() {
        // get a source buffer to contain video data that we'll receive from the server
        bind_to.source_buffer = bind_to.source.addSourceBuffer('video/mp4;codecs="avc1.64001E"');
    });

    function display_video(data) {
        if (data.image && data.mime_type) {
            this.buffer.push(data.image);
            this.data_size += data.image.length;

            if (!this.source_buffer.updating) {
                const accum_buffer = new Uint8Array(this.data_size);
                let i=0;
                while (this.buffer.length > 0) {
                    const b = this.buffer.shift();
                    accum_buffer.set(b, i);
                    i += b.length;
                }
                this.data_size = 0;
                // Add the received data to the source buffer
                this.source_buffer.appendBuffer(accum_buffer);
            }
        }
    }
    video.play();
    return display_video.bind(bind_to);
}
