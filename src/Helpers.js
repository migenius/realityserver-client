/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * Provides assorted helpers useful to RealityServer users.
 * @memberof RS
 */
class Helpers {
    /**
     * Characters to use in random strings.
     * @access private
     * @type {Char[]}
     */
    static get uidArr() {
        return [ '0','1','2','3','4','5','6','7','8','9',
            'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','x','y','z' ];
    };

    /**
     * Creates a random string of the given length using characters 0-9 and a-z.
     * Useful for creating random scope, scene or render loop names.
     * @param {Number} length - The length of the string
     * @return {String} The random string
     */
    static create_random_string(length=8) {
        let charsArr = this.uidArr;

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
     * default port for the protocol is used.
     * - `secure` whether a secure connection should be made.
     * @param {String} url - The url to extract from.
     * @return {Object}
     * @throws {String} Throws if the URL protocol is unsupported.
     * @example
     * const url_info = RS.Helpers.extract_url_details(document.location.toString());
     * const ws_url = (url_info.secure ? 'wss://' : 'ws://') +
     *                 url_info.host + ':' + url_info.port +
     *                 '/render_loop_stream/';
     */
    static extract_url_details(url) {
        const result = {
            secure: false
        };
        if (url.indexOf('file://') === 0) {
            // File URL defaults to using local host. Mostly useful
            // during development.
            result.host = '127.0.0.1';
            result.port = 8080;
        } else if (url.indexOf('http://') === 0) {
            let bracketIndex = url.indexOf(']', 7);
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
                let portStr = url.substring(colonIndex+1, url.indexOf('/', 7));
                result.port = parseInt(portStr);
            }
        } else if (url.indexOf('https://') === 0) {
            let bracketIndex = url.indexOf(']', 8);
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
                let portStr = url.substring(colonIndex+1, url.indexOf('/', 8));
                result.port = parseInt(portStr);
            }
            result.secure = true;
        } else {
            throw 'Unsupported URL schema';
        }
        return result;
    }

    /**
     * Returns a function that can be used as a callback for render loop streams
     * to display rendered images via an HTML Image element. The provided
     * callback handler will be called after displaying the image.
     * @param {Image} element - the image element to use
     * @param {Object} url_creator - an object that implements `URL.createObjectUrl(blob)` and
     * `URL.revokeObjectURL(String)`. If not provided then `window.URL` or
     * `window.webkitURL` will be used.
     * @param {Function} callback - the function to call after displaying the image.
     * @see RS.Service#stream
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
     *          console.error(`Start render loop failed ${JSON.stringify(err)}`)
     *      }
     *      // get image to display in
     *      const image = Document.getElementById('rs_display');
     *
     *      // stream rendered results back from the render loop and display them in
     *      // rs_display
     *      try {
     *          await service.stream(
     *              {
     *                  render_loop_name: 'meyemii_render_loop',
     *                  image_format: 'jpg',
     *                  quality: '100'
     *              },
     *              RS.Helpers.HTMLImageDisplay(image,(data) => {
     *                  if (data.result < 0) {
     *                      console.error(`Render error: ${data.result}`)
     *                      return; // error on render
     *                  }
     *                  console.log('Image rendered.');
     *              })
     *          );
     *      } catch (err) {
     *          console.error(`Start render loop stream failed ${JSON.stringify(err)}`)
     *      };
     *  }
     */
    static HTMLImageDisplay(image,url_creator,callback) {
        const bind_to = {
            image
        };
        if (typeof url_creator === 'function') {
            callback = url_creator;
            url_creator = undefined;
        }
        try {
            bind_to.url_creator = url_creator || window.URL || window.webkitURL;
        } catch (e) {}
        if (!bind_to.url_creator) {
            throw 'No URL creator available.';
        }
        bind_to.callback = callback;

        function display_image(data) {
            if (data.image && data.mime_type) {
                if (this.lastUrl) {
                    this.url_creator.revokeObjectURL(this.lastUrl);
                }
                const blob = new Blob( [ data.image ], { type: data.mime_type } );
                this.lastUrl = this.url_creator.createObjectURL( blob );
                this.image.src = this.lastUrl;
            }
            if (this.callback) {
                this.callback(data);
            }
        }
        return display_image.bind(bind_to);
    }
}

module.exports = Helpers;
