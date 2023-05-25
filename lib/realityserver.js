/******************************************************************************
* Copyright 2010-2021 migenius pty ltd, Australia. All rights reserved.
******************************************************************************/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.RS = global.RS || {}));
}(this, (function (exports) { 'use strict';

    class Command {
        constructor(name, parameters) {
            this.name = name;
            this.params = Object.assign({}, parameters);
            Object.keys(this.params).forEach(k => this.params[k] === undefined && delete this.params[k]);
        }
    }

    class RealityServerError extends Error {
        constructor() {
            super(...arguments);
            this.name = 'RealityServerError';
        }
    }

    class Command_error extends RealityServerError {
        constructor(error) {
            super(error.message);
            this.error = error;
            this.name = 'CommandError';
        }
        get code() {
            return this.error.code;
        }
        get data() {
            return this.error.data;
        }
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var eventemitter3 = createCommonjsModule(function (module) {
    var has = Object.prototype.hasOwnProperty
      , prefix = '~';
    function Events() {}
    if (Object.create) {
      Events.prototype = Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
      }
      var listener = new EE(fn, context || emitter, once)
        , evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = []
        , events
        , name;
      if (this._eventsCount === 0) return names;
      for (name in (events = this._events)) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event
        , handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event
        , listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt]
        , len = arguments.length
        , args
        , i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);
        switch (len) {
          case 1: return listeners.fn.call(listeners.context), true;
          case 2: return listeners.fn.call(listeners.context, a1), true;
          case 3: return listeners.fn.call(listeners.context, a1, a2), true;
          case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len -1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length
          , j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);
          switch (len) {
            case 1: listeners[i].fn.call(listeners[i].context); break;
            case 2: listeners[i].fn.call(listeners[i].context, a1); break;
            case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
            case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
            default:
              if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (
          listeners.fn === fn &&
          (!once || listeners.once) &&
          (!context || listeners.context === context)
        ) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (
            listeners[i].fn !== fn ||
            (once && !listeners[i].once) ||
            (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
    EventEmitter.prefixed = prefix;
    EventEmitter.EventEmitter = EventEmitter;
    {
      module.exports = EventEmitter;
    }
    });

    function uidArr() {
        return [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
            'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z' ];
    }
    function create_random_string(length=8) {
        let charsArr = uidArr();
        let id = '';
        let len = charsArr.length;
        for (let i=0; i<length; i++) {
            let n = Math.floor((Math.random()*len));
            id += charsArr[n];
        }
        return id;
    }
    function extract_url_details(url) {
        const result = {
            secure: false
        };
        if (url.indexOf('file://') === 0) {
            result.host = '127.0.0.1';
            result.port = 8080;
        } else if (url.indexOf('http://') === 0) {
            const bracketIndex = url.indexOf(']', 7);
            let colonIndex = -1;
            if (bracketIndex !== -1) {
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
    function html_image_display(image, url_creator) {
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
    function html_video_display(video, media_source, url_creator) {
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
        bind_to.source = new media_source();
        bind_to.source_buffer = undefined;
        video.src = url_creator.createObjectURL(bind_to.source);
        bind_to.source.addEventListener('sourceopen', function() {
            bind_to.source_buffer = bind_to.source.addSourceBuffer('video/mp4; codecs="avc1.64001E"');
        });
        bind_to.source.addEventListener('webkitsourceopen', function() {
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
                    this.source_buffer.appendBuffer(accum_buffer);
                }
            }
        }
        video.play();
        return display_video.bind(bind_to);
    }

    var Utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        EventEmitter: eventemitter3,
        create_random_string: create_random_string,
        extract_url_details: extract_url_details,
        html_image_display: html_image_display,
        html_video_display: html_video_display
    });

    const ALMOST_ZERO = 10e-5;
    function radians(degrees) {
        return degrees * 0.017453292519943295769236907684886;
    }
    function degrees(radians) {
        return radians * 57.295779513082320876798154814105;
    }

    class Spectrum {
        constructor(initial) {
            this.c = [ 0, 0, 0 ];
            if (initial !== undefined) {
                this.set(...arguments);
            }
        }
        set(source) {
            if (source instanceof Spectrum) {
                this.c[0] = source.c[0];
                this.c[1] = source.c[1];
                this.c[2] = source.c[2];
            } else if (source instanceof Array) {
                if (source.length < 3) {
                    throw new Error('Array needs at least 3 elements.');
                }
                this.c[0] = parseFloat(source[0]);
                this.c[1] = parseFloat(source[1]);
                this.c[2] = parseFloat(source[2]);
            } else if (!isNaN(source)) {
                this.c[0] = parseFloat(arguments[0]);
                this.c[1] = parseFloat(arguments[1]);
                this.c[2] = parseFloat(arguments[2]);
            } else {
                this.c[0] = parseFloat(source.r);
                this.c[1] = parseFloat(source.g);
                this.c[2] = parseFloat(source.b);
            }
            if (Number.isNaN(this.c[0])) {
                this.c[0] = 0;
            }
            if (Number.isNaN(this.c[1])) {
                this.c[1] = 0;
            }
            if (Number.isNaN(this.c[2])) {
                this.c[2] = 0;
            }
        }
        clone() {
            return new Spectrum(this);
        }
        scale(scale) {
            this.c[0] *= scale;
            this.c[1] *= scale;
            this.c[2] *= scale;
            return this;
        }
        add(rhs) {
            this.c[0] += rhs.c[0];
            this.c[1] += rhs.c[1];
            this.c[2] += rhs.c[2];
            return this;
        }
        subtract(rhs) {
            this.c[0] -= rhs.c[0];
            this.c[1] -= rhs.c[1];
            this.c[2] -= rhs.c[2];
            return this;
        }
        tint(rhs) {
            this.c[0] *= rhs.c[0];
            this.c[1] *= rhs.c[1];
            this.c[2] *= rhs.c[2];
            return this;
        }
        linear_intensity() {
            return (this.c[0] + this.c[1] + this.c[2]) / 3;
        }
        ntsc_intensity() {
            return this.c[0] * 0.299 + this.c[1] * 0.587 + this.c[2] * 0.114;
        }
        cie_intensity() {
            return this.c[0] * 0.212671 + this.c[1] * 0.71516 + this.c[2] * 0.072169;
        }
        gamma_correct(gamma_factor) {
            const f = 1 / gamma_factor;
            return new Spectrum(
                Math.pow( this.c[0], f),
                Math.pow( this.c[1], f),
                Math.pow( this.c[2], f));
        }
        is_black(tolerance) {
            if (tolerance === undefined) {
                return this.c[0] === 0 && this.c[1] === 0 && this.c[2] === 0;
            } else {
                return Math.abs(this.c[0]) < tolerance &&
                        Math.abs(this.c[1]) < tolerance &&
                        Math.abs(this.c[2]) < tolerance;
            }
        }
        equal(rhs, tolerance) {
            if (tolerance) {
                return this.equal_with_tolerance(rhs, tolerance);
            }
            return Array.isArray(rhs.c) && this.c[0] === rhs.c[0] && this.c[1] === rhs.c[1] && this.c[2] === rhs.c[2];
        }
        equal_with_tolerance(rhs, tolerance) {
            if (tolerance === undefined) {
                tolerance = ALMOST_ZERO;
            }
            return (Array.isArray(rhs.c) &&
                    Math.abs(this.c[0] - rhs.c[0]) < tolerance &&
                    Math.abs(this.c[1] - rhs.c[1]) < tolerance &&
                    Math.abs(this.c[2] - rhs.c[2]) < tolerance);
        }
        toString() {
            return '[' + this.c[0] + ',' + this.c[1] + ',' + this.c[2] + ']';
        }
    }

    class Color {
        constructor(color) {
            if (color !== undefined) {
                this.set(...arguments);
            } else {
                this.set(0, 0, 0);
            }
        }
        set(source) {
            if (source instanceof Color) {
                this.r = source.r;
                this.g = source.g;
                this.b = source.b;
                this.a = source.a;
            } if (source instanceof Spectrum) {
                this.r = source.c[0];
                this.g = source.c[1];
                this.b = source.c[2];
                this.a = 1;
            } else if (source instanceof Array) {
                if (source.length < 3) {
                    throw new Error('Array needs at least 3 elements.');
                }
                this.r = parseFloat(source[0]);
                this.g = parseFloat(source[1]);
                this.b = parseFloat(source[2]);
                if (source.length > 3) {
                    this.a = parseFloat(source[3]);
                } else {
                    this.a = 1;
                }
            } else if (!isNaN(source)) {
                this.r = parseFloat(arguments[0]);
                this.g = parseFloat(arguments[1]);
                this.b = parseFloat(arguments[2]);
                if (arguments.length > 3) {
                    this.a = parseFloat(arguments[3]);
                } else {
                    this.a = 1;
                }
            } else {
                this.r = parseFloat(source.r);
                this.g = parseFloat(source.g);
                this.b = parseFloat(source.b);
                if (source.a !== undefined) {
                    this.a = parseFloat(source.a);
                } else {
                    this.a = 1;
                }
            }
            if (Number.isNaN(this.r)) {
                this.r = 0;
            }
            if (Number.isNaN(this.g)) {
                this.g = 0;
            }
            if (Number.isNaN(this.b)) {
                this.b = 0;
            }
            if (Number.isNaN(this.a)) {
                this.b = 1;
            }
        }
        clone() {
            return new Color(this);
        }
        scale(scale) {
            this.r *= scale;
            this.g *= scale;
            this.b *= scale;
            return this;
        }
        add(rhs) {
            this.r += rhs.r;
            this.g += rhs.g;
            this.b += rhs.b;
            return this;
        }
        subtract(rhs) {
            this.r -= rhs.r;
            this.g -= rhs.g;
            this.b -= rhs.b;
            return this;
        }
        tint(rhs) {
            this.r *= rhs.r;
            this.g *= rhs.g;
            this.b *= rhs.b;
            return this;
        }
        linear_intensity() {
            return (this.r + this.g + this.b) / 3;
        }
        ntsc_intensity() {
            return this.r * 0.299 + this.g * 0.587 + this.b * 0.114;
        }
        cie_intensity() {
            return this.r * 0.212671 + this.g * 0.715160 + this.b * 0.072169;
        }
        gamma_correct(factor) {
            const f = 1 / factor;
            return new Color(
                Math.pow( this.r, f),
                Math.pow( this.g, f),
                Math.pow( this.b, f),
                this.a);
        }
        is_black(tolerance) {
            if (tolerance === undefined) {
                return this.r === 0 && this.g === 0 && this.b === 0;
            } else {
                return Math.abs(this.r) < tolerance && Math.abs(this.g) < tolerance && Math.abs(this.b) < tolerance;
            }
        }
        equal(rhs, tolerance) {
            if (tolerance) {
                return this.equal_with_tolerance(rhs, tolerance);
            }
            return this.r === rhs.r && this.g === rhs.g && this.b === rhs.b && this.a === rhs.a;
        }
        equal_with_tolerance(rhs, tolerance) {
            if (tolerance === undefined) {
                tolerance = ALMOST_ZERO;
            }
            return (Math.abs(this.r - rhs.r) < tolerance &&
                    Math.abs(this.g - rhs.g) < tolerance &&
                    Math.abs(this.b - rhs.b) < tolerance &&
                    Math.abs(this.a - rhs.a) < tolerance);
        }
        toString() {
            return '[r: ' + this.r + ', g: ' + this.g + ', b:' + this.b + ', a: ' + this.a + ']';
        }
    }

    class Matrix4x4 {
        constructor(matrix) {
            if (matrix !== undefined) {
                this.set(...arguments);
            } else {
                this.set_identity();
            }
        }
        set(source) {
            if (source instanceof Array) {
                if (source.length >= 16) {
                    this.xx = source[0];
                    this.xy = source[1];
                    this.xz = source[2];
                    this.xw = source[3];
                    this.yx = source[4];
                    this.yy = source[5];
                    this.yz = source[6];
                    this.yw = source[7];
                    this.zx = source[8];
                    this.zy = source[9];
                    this.zz = source[10];
                    this.zw = source[11];
                    this.wx = source[12];
                    this.wy = source[13];
                    this.wz = source[14];
                    this.ww = source[15];
                } else if (source.length === 4 &&
                            source[0] instanceof Array &&
                            source[1] instanceof Array &&
                            source[2] instanceof Array &&
                            source[3] instanceof Array) {
                    this.xx = source[0][0];
                    this.xy = source[0][1];
                    this.xz = source[0][2];
                    this.xw = source[0][3];
                    this.yx = source[1][0];
                    this.yy = source[1][1];
                    this.yz = source[1][2];
                    this.yw = source[1][3];
                    this.zx = source[2][0];
                    this.zy = source[2][1];
                    this.zz = source[2][2];
                    this.zw = source[2][3];
                    this.wx = source[3][0];
                    this.wy = source[3][1];
                    this.wz = source[3][2];
                    this.ww = source[3][3];
                } else {
                    throw new Error('Invalid array arguments.');
                }
            } else if (!isNaN(source)) {
                if (arguments.length === 1) {
                    this.xx = this.yy = this.zz = this.ww = source;
                    this.xy = this.xz = this.xw =
                    this.yx = this.yz = this.yw =
                    this.zx = this.zy = this.zw =
                    this.wx = this.wy = this.wz = 0;
                } else if (arguments.length >= 16) {
                    this.xx = arguments[0];
                    this.xy = arguments[1];
                    this.xz = arguments[2];
                    this.xw = arguments[3];
                    this.yx = arguments[4];
                    this.yy = arguments[5];
                    this.yz = arguments[6];
                    this.yw = arguments[7];
                    this.zx = arguments[8];
                    this.zy = arguments[9];
                    this.zz = arguments[10];
                    this.zw = arguments[11];
                    this.wx = arguments[12];
                    this.wy = arguments[13];
                    this.wz = arguments[14];
                    this.ww = arguments[15];
                } else {
                    throw new Error('Invalid # of numeric arguments.');
                }
            } else {
                this.xx = source.xx;
                this.xy = source.xy;
                this.xz = source.xz;
                this.xw = source.xw;
                this.yx = source.yx;
                this.yy = source.yy;
                this.yz = source.yz;
                this.yw = source.yw;
                this.zx = source.zx;
                this.zy = source.zy;
                this.zz = source.zz;
                this.zw = source.zw;
                this.wx = source.wx;
                this.wy = source.wy;
                this.wz = source.wz;
                this.ww = source.ww;
            }
        }
        clone() {
            return new Matrix4x4(this);
        }
        clear() {
            this.xx = this.xy = this.xz = this.xw =
            this.yx = this.yy = this.yz = this.yw =
            this.zx = this.zy = this.zz = this.zw =
            this.wx = this.wy = this.wz = this.ww = 0;
        }
        set_identity() {
            this.clear();
            this.xx = this.yy = this.zz = this.ww = 1;
        }
        set_rotation(axis, angle) {
            this.set_identity();
            let c = Math.cos(angle);
            let s = Math.sin(angle);
            let t = 1-c;
            let X = axis.x;
            let Y = axis.y;
            let Z = axis.z;
            this.xx = t * X * X + c;
            this.xy = t * X * Y + s * Z;
            this.xz = t * X * Z - s * Y;
            this.yx = t * X * Y - s * Z;
            this.yy = t * Y * Y + c;
            this.yz = t * Y * Z + s * X;
            this.zx = t * X * Z + s * Y;
            this.zy = t * Y * Z - s * X;
            this.zz = t * Z * Z + c;
        }
        set_scaling(x, y, z) {
            this.set_identity();
            this.xx = x;
            this.yy = y;
            this.zz = z;
        }
        multiply(matrix) {
            let _mat = this.clone();
            this.xx = _mat.xx * matrix.xx
                    + _mat.xy * matrix.yx
                    + _mat.xz * matrix.zx
                    + _mat.xw * matrix.wx;
            this.xy = _mat.xx * matrix.xy
                    + _mat.xy * matrix.yy
                    + _mat.xz * matrix.zy
                    + _mat.xw * matrix.wy;
            this.xz = _mat.xx * matrix.xz
                    + _mat.xy * matrix.yz
                    + _mat.xz * matrix.zz
                    + _mat.xw * matrix.wz;
            this.xw = _mat.xx * matrix.xw
                    + _mat.xy * matrix.yw
                    + _mat.xz * matrix.zw
                    + _mat.xw * matrix.ww;
            this.yx = _mat.yx * matrix.xx
                    + _mat.yy * matrix.yx
                    + _mat.yz * matrix.zx
                    + _mat.yw * matrix.wx;
            this.yy = _mat.yx * matrix.xy
                    + _mat.yy * matrix.yy
                    + _mat.yz * matrix.zy
                    + _mat.yw * matrix.wy;
            this.yz = _mat.yx * matrix.xz
                    + _mat.yy * matrix.yz
                    + _mat.yz * matrix.zz
                    + _mat.yw * matrix.wz;
            this.yw = _mat.yx * matrix.xw
                    + _mat.yy * matrix.yw
                    + _mat.yz * matrix.zw
                    + _mat.yw * matrix.ww;
            this.zx = _mat.zx * matrix.xx
                    + _mat.zy * matrix.yx
                    + _mat.zz * matrix.zx
                    + _mat.zw * matrix.wx;
            this.zy = _mat.zx * matrix.xy
                    + _mat.zy * matrix.yy
                    + _mat.zz * matrix.zy
                    + _mat.zw * matrix.wy;
            this.zz = _mat.zx * matrix.xz
                    + _mat.zy * matrix.yz
                    + _mat.zz * matrix.zz
                    + _mat.zw * matrix.wz;
            this.zw = _mat.zx * matrix.xw
                    + _mat.zy * matrix.yw
                    + _mat.zz * matrix.zw
                    + _mat.zw * matrix.ww;
            this.wx = _mat.wx * matrix.xx
                    + _mat.wy * matrix.yx
                    + _mat.wz * matrix.zx
                    + _mat.ww * matrix.wx;
            this.wy = _mat.wx * matrix.xy
                    + _mat.wy * matrix.yy
                    + _mat.wz * matrix.zy
                    + _mat.ww * matrix.wy;
            this.wz = _mat.wx * matrix.xz
                    + _mat.wy * matrix.yz
                    + _mat.wz * matrix.zz
                    + _mat.ww * matrix.wz;
            this.ww = _mat.wx * matrix.xw
                    + _mat.wy * matrix.yw
                    + _mat.wz * matrix.zw
                    + _mat.ww * matrix.ww;
            return this;
        }
        transpose() {
            let _mat = this.clone();
            this.xy = _mat.yx;
            this.xz = _mat.zx;
            this.xw = _mat.wx;
            this.yx = _mat.xy;
            this.yz = _mat.zy;
            this.yw = _mat.wy;
            this.zx = _mat.xz;
            this.zy = _mat.yz;
            this.zw = _mat.wz;
            this.wx = _mat.xw;
            this.wy = _mat.yw;
            this.wz = _mat.zw;
            return this;
        }
        get_determinant() {
            let det = 0;
            det =  this.xx * this.determinant_rc(0, 0);
            det += this.xy * this.determinant_rc(0, 1) * -1;
            det += this.xz * this.determinant_rc(0, 2);
            det += this.xw * this.determinant_rc(0, 3) * -1;
            return det;
        }
        determinant_rc(row, col) {
            let data = new Array(9);
            let current = 0;
            if (row !== 0) {
                if (col !== 0) data[current++] = this.xx;
                if (col !== 1) data[current++] = this.xy;
                if (col !== 2) data[current++] = this.xz;
                if (col !== 3) data[current++] = this.xw;
            }
            if (row !== 1) {
                if (col !== 0) data[current++] = this.yx;
                if (col !== 1) data[current++] = this.yy;
                if (col !== 2) data[current++] = this.yz;
                if (col !== 3) data[current++] = this.yw;
            }
            if (row !== 2) {
                if (col !== 0) data[current++] = this.zx;
                if (col !== 1) data[current++] = this.zy;
                if (col !== 2) data[current++] = this.zz;
                if (col !== 3) data[current++] = this.zw;
            }
            if (row !== 3) {
                if (col !== 0) data[current++] = this.wx;
                if (col !== 1) data[current++] = this.wy;
                if (col !== 2) data[current++] = this.wz;
                if (col !== 3) data[current++] = this.ww;
            }
            current = data[0]*(data[4]*data[8] - data[7]*data[5]) -
                      data[1]*(data[3]*data[8] - data[6]*data[5]) +
                      data[2]*(data[3]*data[7] - data[6]*data[4]);
            return current;
        }
        invert() {
            let det = this.get_determinant();
            if (det === 0 || Number.isNaN(det)) {
                throw new Error('Determinant is 0 or NaN');
            }
            let mat = this.clone();
            this.xx = mat.determinant_rc(0, 0) / det;
            this.yx = mat.determinant_rc(0, 1) / -det;
            this.zx = mat.determinant_rc(0, 2) / det;
            this.wx = mat.determinant_rc(0, 3) / -det;
            this.xy = mat.determinant_rc(1, 0) / -det;
            this.yy = mat.determinant_rc(1, 1) / det;
            this.zy = mat.determinant_rc(1, 2) / -det;
            this.wy = mat.determinant_rc(1, 3) / det;
            this.xz = mat.determinant_rc(2, 0) / det;
            this.yz = mat.determinant_rc(2, 1) / -det;
            this.zz = mat.determinant_rc(2, 2) / det;
            this.wz = mat.determinant_rc(2, 3) / -det;
            this.xw = mat.determinant_rc(3, 0) / -det;
            this.yw = mat.determinant_rc(3, 1) / det;
            this.zw = mat.determinant_rc(3, 2) / -det;
            this.ww = mat.determinant_rc(3, 3) / det;
            return this;
        }
        equal_with_tolerance(rhs, tolerance) {
            if (tolerance === undefined) {
                tolerance = ALMOST_ZERO;
            }
            if (Math.abs(this.xx - rhs.xx) > tolerance ||
                Math.abs(this.xy - rhs.xy) > tolerance ||
                Math.abs(this.xz - rhs.xz) > tolerance ||
                Math.abs(this.xw - rhs.xw) > tolerance ||
                Math.abs(this.yx - rhs.yx) > tolerance ||
                Math.abs(this.yy - rhs.yy) > tolerance ||
                Math.abs(this.yz - rhs.yz) > tolerance ||
                Math.abs(this.yw - rhs.yw) > tolerance ||
                Math.abs(this.zx - rhs.zx) > tolerance ||
                Math.abs(this.zy - rhs.zy) > tolerance ||
                Math.abs(this.zz - rhs.zz) > tolerance ||
                Math.abs(this.zw - rhs.zw) > tolerance ||
                Math.abs(this.wx - rhs.wx) > tolerance ||
                Math.abs(this.wy - rhs.wy) > tolerance ||
                Math.abs(this.wz - rhs.wz) > tolerance ||
                Math.abs(this.ww - rhs.ww) > tolerance) {
                return false;
            }
            return true;
        }
        equal(rhs, tolerance) {
            if (tolerance) {
                return this.equal_with_tolerance(rhs, tolerance);
            }
            if (rhs.xx === this.xx && rhs.xy === this.xy && rhs.xz === this.xz && rhs.xw === this.xw &&
                rhs.yx === this.yx && rhs.yy === this.yy && rhs.yz === this.yz && rhs.yw === this.yw &&
                rhs.zx === this.zx && rhs.zy === this.zy && rhs.zz === this.zz && rhs.zw === this.zw &&
                rhs.wx === this.wx && rhs.wy === this.wy && rhs.wz === this.wz && rhs.ww === this.ww) {
                return true;
            }
            return false;
        }
        set_translation(x, y, z) {
            this.wx = x;
            this.wy = y;
            this.wz = z;
        }
        translate(dx, dy, dz) {
            this.wx += dx;
            this.wy += dy;
            this.wz += dz;
        }
        toString() {
            return '[' + this.xx + ', ' + this.xy + ', ' + this.xz + ', ' + this.xw + ', ' +
                         this.yx + ', ' + this.yy + ', ' + this.yz + ', ' + this.yw + ', ' +
                         this.zx + ', ' + this.zy + ', ' + this.zz + ', ' + this.zw + ', ' +
                         this.wx + ', ' + this.wy + ', ' + this.wz + ', ' + this.ww + ']';
        }
    }

    class Vector2 {
        constructor(initial) {
            if (initial !== undefined) {
                this.set(...arguments);
            } else {
                this.set(0, 0, 0);
            }
        }
        set(source) {
            if (source instanceof Vector2) {
                this.x = source.x;
                this.y = source.y;
            } else if (source instanceof Array) {
                if (source.length < 2) {
                    throw new Error('Array needs at least 2 elements.');
                }
                this.x = parseFloat(source[0]);
                this.y = parseFloat(source[1]);
            } else if (!isNaN(source)) {
                this.x = parseFloat(arguments[0]);
                this.y = parseFloat(arguments[1]);
            } else {
                this.x = parseFloat(source.x);
                this.y = parseFloat(source.y);
            }
            if (Number.isNaN(this.x)) {
                this.x = 0;
            }
            if (Number.isNaN(this.y)) {
                this.y = 0;
            }
        }
        clone() {
            return new Vector2(this);
        }
        dot(rhs) {
            return (this.x*rhs.x + this.y*rhs.y);
        }
        length() {
            let lsq = this.dot(this);
            return Math.sqrt(lsq);
        }
        distance(rhs) {
            let x = rhs.x - this.x;
            let y = rhs.y - this.y;
            return Math.sqrt(x*x + y*y);
        }
        normalize() {
            let len = this.length();
            if (len) {
                this.x /= len;
                this.y /= len;
            }
            return this;
        }
        scale(scale) {
            this.x *= scale;
            this.y *= scale;
            return this;
        }
        add(rhs) {
            this.x += rhs.x;
            this.y += rhs.y;
            return this;
        }
        subtract(rhs) {
            this.x -= rhs.x;
            this.y -= rhs.y;
            return this;
        }
        multiply(rhs) {
            this.x *= rhs.x;
            this.y *= rhs.y;
            return this;
        }
        divide(rhs) {
            this.x /= rhs.x;
            this.y /= rhs.y;
            return this;
        }
        is_colinear(rhs) {
            let x = Math.abs(this.x) - Math.abs(rhs.x);
            let y = Math.abs(this.y) - Math.abs(rhs.y);
            return (Math.abs(x) < ALMOST_ZERO &&
                       Math.abs(y) < ALMOST_ZERO);
        }
        is_null_vector(tolerance) {
            if (tolerance === undefined) {
                return this.x === 0 && this.y === 0;
            } else {
                return Math.abs(this.x) < tolerance && Math.abs(this.y) < tolerance;
            }
        }
        equal(rhs, tolerance) {
            if (tolerance) {
                return this.equal_with_tolerance(rhs, tolerance);
            }
            return this.x === rhs.x && this.y === rhs.y;
        }
        equal_with_tolerance(rhs, tolerance) {
            if (tolerance === undefined) {
                tolerance = ALMOST_ZERO;
            }
            return (Math.abs(this.x - rhs.x) < tolerance &&
                    Math.abs(this.y - rhs.y) < tolerance);
        }
        toString() {
            return '[x: ' + this.x + ', y: ' + this.y + ']';
        }
    }

    class Vector3 {
        constructor(initial) {
            if (initial !== undefined) {
                this.set(...arguments);
            } else {
                this.set(0, 0, 0);
            }
        }
        set(source) {
            if (source instanceof Vector3) {
                this.x = source.x;
                this.y = source.y;
                this.z = source.z;
            } else if (source instanceof Array) {
                if (source.length < 3) {
                    throw new Error('Array needs at least 3 elements.');
                }
                this.x = parseFloat(source[0]);
                this.y = parseFloat(source[1]);
                this.z = parseFloat(source[2]);
            } else if (!isNaN(source)) {
                this.x = parseFloat(arguments[0]);
                this.y = parseFloat(arguments[1]);
                this.z = parseFloat(arguments[2]);
            } else {
                this.x = parseFloat(source.x);
                this.y = parseFloat(source.y);
                this.z = parseFloat(source.z);
            }
            if (Number.isNaN(this.x)) {
                this.x = 0;
            }
            if (Number.isNaN(this.y)) {
                this.y = 0;
            }
            if (Number.isNaN(this.z)) {
                this.z = 0;
            }
        }
        clone() {
            return new Vector3(this);
        }
        transform(matrix) {
            let vec = this.clone();
            this.x =    vec.x * matrix.xx +
                        vec.y * matrix.yx +
                        vec.z * matrix.zx;
            this.y =    vec.x * matrix.xy +
                        vec.y * matrix.yy +
                        vec.z * matrix.zy;
            this.z =    vec.x * matrix.xz +
                        vec.y * matrix.yz +
                        vec.z * matrix.zz;
            return this;
        }
        transform_to(matrix, out) {
            if (out === undefined || out === null) {
                out = new Vector3();
            }
            out.x =     this.x * matrix.xx +
                        this.y * matrix.yx +
                        this.z * matrix.zx;
            out.y =     this.x * matrix.xy +
                        this.y * matrix.yy +
                        this.z * matrix.zy;
            out.z =     this.x * matrix.xz +
                        this.y * matrix.yz +
                        this.z * matrix.zz;
            return out;
        }
        transform_transpose(matrix) {
            let vec = this.clone();
            this.x =     vec.x * matrix.xx +
                        vec.y * matrix.xy +
                        vec.z * matrix.xz;
            this.y =     vec.x * matrix.yx +
                        vec.y * matrix.yy +
                        vec.z * matrix.yz;
            this.z =     vec.x * matrix.zx +
                        vec.y * matrix.zy +
                        vec.z * matrix.zz;
            return this;
        }
        transform_transpose_to(matrix, out) {
            if (out === undefined || out === null) {
                out = new Vector3();
            }
            out.x =     this.x * matrix.xx +
                        this.y * matrix.xy +
                        this.z * matrix.xz;
            out.y =     this.x * matrix.yx +
                        this.y * matrix.yy +
                        this.z * matrix.yz;
            out.z =     this.x * matrix.zx +
                        this.y * matrix.zy +
                        this.z * matrix.zz;
            return out;
        }
        rotate(matrix) {
            return this.transform(matrix);
        }
        rotate_transpose(matrix) {
            return this.transform_transpose(matrix);
        }
        rotate_to(matrix, out) {
            return this.transform_to(matrix, out);
        }
        rotate_transpose_to(matrix, out) {
            return this.transform_transpose_to(matrix, out);
        }
        dot(rhs) {
            return (this.x*rhs.x + this.y*rhs.y + this.z*rhs.z);
        }
        cross(rhs) {
            let cp = new Vector3();
            cp.x = this.y*rhs.z - this.z*rhs.y;
            cp.y = this.z*rhs.x - this.x*rhs.z;
            cp.z = this.x*rhs.y - this.y*rhs.x;
            return cp;
        }
        length() {
            let lsq = this.dot(this);
            return Math.sqrt(lsq);
        }
        distance(rhs) {
            let x = rhs.x - this.x;
            let y = rhs.y - this.y;
            let z = rhs.z - this.z;
            return Math.sqrt(x*x + y*y + z*z);
        }
        normalize() {
            let len = this.length();
            if (len) {
                this.x /= len;
                this.y /= len;
                this.z /= len;
            }
            return this;
        }
        scale(scale) {
            this.x *= scale;
            this.y *= scale;
            this.z *= scale;
            return this;
        }
        add(rhs) {
            this.x += rhs.x;
            this.y += rhs.y;
            this.z += rhs.z;
            return this;
        }
        subtract(rhs) {
            this.x -= rhs.x;
            this.y -= rhs.y;
            this.z -= rhs.z;
            return this;
        }
        multiply(rhs) {
            this.x *= rhs.x;
            this.y *= rhs.y;
            this.z *= rhs.z;
            return this;
        }
        divide(rhs) {
            this.x /= rhs.x;
            this.y /= rhs.y;
            this.z /= rhs.z;
            return this;
        }
        is_colinear(rhs) {
            let vec = this.cross(rhs);
            return (Math.abs(vec.x) < ALMOST_ZERO &&
                       Math.abs(vec.y) < ALMOST_ZERO &&
                       Math.abs(vec.z) < ALMOST_ZERO);
        }
        is_null_vector(tolerance) {
            if (tolerance === undefined) {
                return this.x === 0 && this.y === 0 && this.z === 0;
            } else {
                return Math.abs(this.x) < tolerance && Math.abs(this.y) < tolerance && Math.abs(this.z) < tolerance;
            }
        }
        equal(rhs, tolerance) {
            if (tolerance) {
                return this.equal_with_tolerance(rhs, tolerance);
            }
            return this.x === rhs.x && this.y === rhs.y && this.z === rhs.z;
        }
        equal_with_tolerance(rhs, tolerance) {
            if (tolerance === undefined) {
                tolerance = ALMOST_ZERO;
            }
            return (Math.abs(this.x - rhs.x) < tolerance &&
                    Math.abs(this.y - rhs.y) < tolerance &&
                    Math.abs(this.z - rhs.z) < tolerance);
        }
        toString() {
            return '[x: ' + this.x + ', y: ' + this.y + ', z:' + this.z + ']';
        }
    }

    class Vector4 {
        constructor(initial) {
            if (initial !== undefined) {
                this.set(...arguments);
            } else {
                this.set(0, 0, 0);
            }
        }
        set(source) {
            if (source instanceof Vector4) {
                this.x = source.x;
                this.y = source.y;
                this.z = source.z;
                this.w = source.w;
            } else if (source instanceof Array) {
                if (source.length < 3) {
                    throw new Error('Array needs at least 3 elements.');
                }
                this.x = parseFloat(source[0]);
                this.y = parseFloat(source[1]);
                this.z = parseFloat(source[2]);
                if (source.length > 3) {
                    this.w = parseFloat(source[3]);
                } else {
                    this.w = 1;
                }
            } else if (!isNaN(source)) {
                this.x = parseFloat(arguments[0]);
                this.y = parseFloat(arguments[1]);
                this.z = parseFloat(arguments[2]);
                if (arguments.length > 3) {
                    this.w = parseFloat(arguments[3]);
                } else {
                    this.w = 1;
                }
            } else {
                this.x = parseFloat(source.x);
                this.y = parseFloat(source.y);
                this.z = parseFloat(source.z);
                if (source.w !== undefined) {
                    this.w = parseFloat(source.w);
                } else {
                    this.w = 1;
                }
            }
            if (Number.isNaN(this.x)) {
                this.x = 0;
            }
            if (Number.isNaN(this.y)) {
                this.y = 0;
            }
            if (Number.isNaN(this.z)) {
                this.z = 0;
            }
            if (Number.isNaN(this.w)) {
                this.w = 1;
            }
        }
        clone() {
            return new Vector4(this);
        }
        transform(matrix) {
            const vec = this.clone();
            this.x =    vec.x * matrix.xx +
                        vec.y * matrix.yx +
                        vec.z * matrix.zx +
                        vec.w * matrix.wx;
            this.y =    vec.x * matrix.xy +
                        vec.y * matrix.yy +
                        vec.z * matrix.zy +
                        vec.w * matrix.wy;
            this.z =    vec.x * matrix.xz +
                        vec.y * matrix.yz +
                        vec.z * matrix.zz +
                        vec.w * matrix.wz;
            this.w =    vec.x * matrix.xw +
                        vec.y * matrix.yw +
                        vec.z * matrix.zw +
                        vec.w * matrix.ww;
            if (this.w) {
                this.scale(1.0/this.w);
                this.w = 1;
            }
            return this;
        }
        transform_to(matrix, out) {
            if (out === undefined || out === null) {
                out = new Vector4();
            }
            out.x =     this.x * matrix.xx +
                        this.y * matrix.yx +
                        this.z * matrix.zx +
                        this.w * matrix.wx;
            out.y =     this.x * matrix.xy +
                        this.y * matrix.yy +
                        this.z * matrix.zy +
                        this.w * matrix.wy;
            out.z =     this.x * matrix.xz +
                        this.y * matrix.yz +
                        this.z * matrix.zz +
                        this.w * matrix.wz;
            out.w =     this.x * matrix.xw +
                        this.y * matrix.yw +
                        this.z * matrix.zw +
                        this.w * matrix.ww;
            if (out.w) {
                out.scale(1.0/out.w);
                out.w = 1;
            }
            return out;
        }
        transform_transpose(matrix) {
            let vec = this.clone();
            this.x =     vec.x * matrix.xx +
                        vec.y * matrix.xy +
                        vec.z * matrix.xz +
                        vec.w * matrix.xw;
            this.y =     vec.x * matrix.yx +
                        vec.y * matrix.yy +
                        vec.z * matrix.yz +
                        vec.w * matrix.yw;
            this.z =     vec.x * matrix.zx +
                        vec.y * matrix.zy +
                        vec.z * matrix.zz +
                        vec.w * matrix.zw;
            this.w =     vec.x * matrix.wx +
                        vec.y * matrix.wy +
                        vec.z * matrix.wz +
                        vec.w * matrix.ww;
            if (this.w) {
                this.scale(1.0/this.w);
                this.w = 1;
            }
            return this;
        }
        transform_transpose_to(matrix, out) {
            if (out === undefined || out === null) {
                out = new Vector4();
            }
            out.x =     this.x * matrix.xx +
                        this.y * matrix.xy +
                        this.z * matrix.xz +
                        this.w * matrix.xw;
            out.y =     this.x * matrix.yx +
                        this.y * matrix.yy +
                        this.z * matrix.yz +
                        this.w * matrix.yw;
            out.z =     this.x * matrix.zx +
                        this.y * matrix.zy +
                        this.z * matrix.zz +
                        this.w * matrix.zw;
            out.w =     this.x * matrix.wx +
                        this.y * matrix.wy +
                        this.z * matrix.wz +
                        this.w * matrix.ww;
            if (out.w) {
                out.scale(1.0/out.w);
                out.w = 1;
            }
            return out;
        }
        rotate(matrix) {
            let vec = this.clone();
            this.x =     vec.x * matrix.xx +
                        vec.y * matrix.yx +
                        vec.z * matrix.zx;
            this.y =     vec.x * matrix.xy +
                        vec.y * matrix.yy +
                        vec.z * matrix.zy;
            this.z =     vec.x * matrix.xz +
                        vec.y * matrix.yz +
                        vec.z * matrix.zz;
            this.w = 1;
            return this;
        }
        rotate_transpose(matrix) {
            const vec = this.clone();
            this.x =     vec.x * matrix.xx +
                        vec.y * matrix.xy +
                        vec.z * matrix.xz;
            this.y =     vec.x * matrix.yx +
                        vec.y * matrix.yy +
                        vec.z * matrix.yz;
            this.z =     vec.x * matrix.zx +
                        vec.y * matrix.zy +
                        vec.z * matrix.zz;
            this.w = 1;
            return this;
        }
        rotate_to(matrix, out) {
            if (out === undefined || out === null) {
                out = new Vector4();
            }
            const vec = this.clone();
            out.x =     vec.x * matrix.xx +
                        vec.y * matrix.yx +
                        vec.z * matrix.zx;
            out.y =     vec.x * matrix.xy +
                        vec.y * matrix.yy +
                        vec.z * matrix.zy;
            out.z =     vec.x * matrix.xz +
                        vec.y * matrix.yz +
                        vec.z * matrix.zz;
            out.w = 1;
            return out;
        }
        rotate_transpose_to(matrix, out) {
            if (out === undefined || out === null) {
                out = new Vector4();
            }
            const vec = this.clone();
            out.x =     vec.x * matrix.xx +
                        vec.y * matrix.xy +
                        vec.z * matrix.xz;
            out.y =     vec.x * matrix.yx +
                        vec.y * matrix.yy +
                        vec.z * matrix.yz;
            out.z =     vec.x * matrix.zx +
                        vec.y * matrix.zy +
                        vec.z * matrix.zz;
            out.w = 1;
            return out;
        }
        dot(rhs) {
            return (this.x*rhs.x + this.y*rhs.y + this.z*rhs.z);
        }
        cross(rhs) {
            let cp = new Vector4();
            cp.x = this.y*rhs.z - this.z*rhs.y;
            cp.y = this.z*rhs.x - this.x*rhs.z;
            cp.z = this.x*rhs.y - this.y*rhs.x;
            return cp;
        }
        length() {
            let lsq = this.dot(this);
            return Math.sqrt(lsq);
        }
        distance(rhs) {
            let x = rhs.x - this.x;
            let y = rhs.y - this.y;
            let z = rhs.z - this.z;
            return Math.sqrt(x*x + y*y + z*z);
        }
        normalize() {
            let len = this.length();
            if (len) {
                this.x /= len;
                this.y /= len;
                this.z /= len;
            }
            return this;
        }
        scale(scale) {
            this.x *= scale;
            this.y *= scale;
            this.z *= scale;
            return this;
        }
        add(rhs) {
            this.x += rhs.x;
            this.y += rhs.y;
            this.z += rhs.z;
            return this;
        }
        subtract(rhs) {
            this.x -= rhs.x;
            this.y -= rhs.y;
            this.z -= rhs.z;
            return this;
        }
        multiply(rhs) {
            this.x *= rhs.x;
            this.y *= rhs.y;
            this.z *= rhs.z;
            return this;
        }
        divide(rhs) {
            this.x /= rhs.x;
            this.y /= rhs.y;
            this.z /= rhs.z;
            return this;
        }
        is_colinear(rhs) {
            let vec = this.cross(rhs);
            return (Math.abs(vec.x) < ALMOST_ZERO &&
                       Math.abs(vec.y) < ALMOST_ZERO &&
                       Math.abs(vec.z) < ALMOST_ZERO);
        }
        is_null_vector(tolerance) {
            if (tolerance === undefined) {
                return this.x === 0 && this.y === 0 && this.z === 0;
            } else {
                return Math.abs(this.x) < tolerance && Math.abs(this.y) < tolerance && Math.abs(this.z) < tolerance;
            }
        }
        equal(rhs, tolerance) {
            if (tolerance) {
                return this.equal_with_tolerance(rhs, tolerance);
            }
            return this.x === rhs.x && this.y === rhs.y && this.z === rhs.z && this.w === rhs.w;
        }
        equal_with_tolerance(rhs, tolerance) {
            if (tolerance === undefined) {
                tolerance = ALMOST_ZERO;
            }
            return (Math.abs(this.x - rhs.x) < tolerance &&
                    Math.abs(this.y - rhs.y) < tolerance &&
                    Math.abs(this.z - rhs.z) < tolerance &&
                    Math.abs(this.w - rhs.w) < tolerance);
        }
        toString() {
            return '[x: ' + this.x + ', y: ' + this.y + ', z:' + this.z + ', w: ' + this.w + ']';
        }
    }



    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Color: Color,
        Matrix4x4: Matrix4x4,
        Spectrum: Spectrum,
        Vector2: Vector2,
        Vector3: Vector3,
        Vector4: Vector4,
        ALMOST_ZERO: ALMOST_ZERO,
        radians: radians,
        degrees: degrees
    });

    /*! https://mths.be/utf8js v3.0.0 by @mathias */
        const root = {};
        let stringFromCharCode = String.fromCharCode;
        function ucs2decode(string) {
            let output = [];
            let counter = 0;
            let length = string.length;
            let value;
            let extra;
            while (counter < length) {
                value = string.charCodeAt(counter++);
                if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                    extra = string.charCodeAt(counter++);
                    if ((extra & 0xFC00) == 0xDC00) {
                        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                    } else {
                        output.push(value);
                        counter--;
                    }
                } else {
                    output.push(value);
                }
            }
            return output;
        }
        function ucs2encode(array) {
            let length = array.length;
            let index = -1;
            let value;
            let output = '';
            while (++index < length) {
                value = array[index];
                if (value > 0xFFFF) {
                    value -= 0x10000;
                    output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
                    value = 0xDC00 | value & 0x3FF;
                }
                output += stringFromCharCode(value);
            }
            return output;
        }
        function checkScalarValue(codePoint) {
            if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
                throw Error(
                    'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
                    ' is not a scalar value'
                );
            }
        }
        function createByte(codePoint, shift) {
            return ((codePoint >> shift) & 0x3F) | 0x80;
        }
        function encodeCodePoint(codePoint) {
            if ((codePoint & 0xFFFFFF80) == 0) {
                return [codePoint];
            }
            let symbol = [];
            if ((codePoint & 0xFFFFF800) == 0) {
                symbol.push(((codePoint >> 6) & 0x1F) | 0xC0);
            } else if ((codePoint & 0xFFFF0000) == 0) {
                checkScalarValue(codePoint);
                symbol.push(((codePoint >> 12) & 0x0F) | 0xE0);
                symbol.push(createByte(codePoint, 6));
            } else if ((codePoint & 0xFFE00000) == 0) {
                symbol.push(((codePoint >> 18) & 0x07) | 0xF0);
                symbol.push(createByte(codePoint, 12));
                symbol.push(createByte(codePoint, 6));
            }
            symbol.push((codePoint & 0x3F) | 0x80);
            return symbol;
        }
        function utf8encode(string) {
            let codePoints = ucs2decode(string);
            let length = codePoints.length;
            let index = -1;
            let codePoint;
            let byteArray = [];
            byteArray.length = Math.ceil(length);
            let byteSize = 0;
            while (++index < length) {
                codePoint = codePoints[index];
                const encoded = encodeCodePoint(codePoint);
                if (encoded.length + byteSize > byteArray.length) {
                    byteArray.length = byteArray.length + 65536;
                }
                while (encoded.length) {
                    byteArray[byteSize++] = encoded.shift();
                }
            }
            byteArray.length = byteSize;
            return Uint8Array.from(byteArray);
        }
        function readContinuationByte() {
            if (byteIndex >= byteCount) {
                throw Error('Invalid byte index');
            }
            let continuationByte = byteArray[byteIndex] & 0xFF;
            byteIndex++;
            if ((continuationByte & 0xC0) == 0x80) {
                return continuationByte & 0x3F;
            }
            throw Error('Invalid continuation byte');
        }
        function decodeSymbol() {
            let byte1;
            let byte2;
            let byte3;
            let byte4;
            let codePoint;
            if (byteIndex > byteCount) {
                throw Error('Invalid byte index');
            }
            if (byteIndex == byteCount) {
                return false;
            }
            byte1 = byteArray[byteIndex] & 0xFF;
            byteIndex++;
            if ((byte1 & 0x80) == 0) {
                return byte1;
            }
            if ((byte1 & 0xE0) == 0xC0) {
                byte2 = readContinuationByte();
                codePoint = ((byte1 & 0x1F) << 6) | byte2;
                if (codePoint >= 0x80) {
                    return codePoint;
                } else {
                    throw Error('Invalid continuation byte');
                }
            }
            if ((byte1 & 0xF0) == 0xE0) {
                byte2 = readContinuationByte();
                byte3 = readContinuationByte();
                codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
                if (codePoint >= 0x0800) {
                    checkScalarValue(codePoint);
                    return codePoint;
                } else {
                    throw Error('Invalid continuation byte');
                }
            }
            if ((byte1 & 0xF8) == 0xF0) {
                byte2 = readContinuationByte();
                byte3 = readContinuationByte();
                byte4 = readContinuationByte();
                codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
                    (byte3 << 0x06) | byte4;
                if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
                    return codePoint;
                }
            }
            throw Error('Invalid UTF-8 detected');
        }
        let byteArray;
        let byteCount;
        let byteIndex;
        function utf8decode(byteString) {
            if (byteString instanceof Uint8Array) {
                byteArray = byteString;
                byteCount = byteString.length;
            } else {
                byteArray = ucs2decode(byteString);
                byteCount = byteArray.length;
            }
            byteIndex = 0;
            let codePoints = [];
            let tmp;
            while ((tmp = decodeSymbol()) !== false) {
                codePoints.push(tmp);
            }
            return ucs2encode(codePoints);
        }
        root.version = '3.0.0';
        root.encode = utf8encode;
        root.decode = utf8decode;
        try {
            root.text_encoder = new TextEncoder;
            if (!root.text_encoder.encode) {
                root.text_encoder = undefined;
            }
        } catch(e) {}
        try {
            root.text_decoder = new TextDecoder;
            if (!root.text_decoder.decode) {
                root.text_decoder = undefined;
            }
        } catch(e) {}
        root.decoder = () => root.text_decoder || root;
        root.encoder = () => root.text_encoder || root;

    const constructors = {
        'Color': Color,
        'Float32<2>': Vector2,
        'Float32<3>': Vector3,
        'Float32<4>': Vector4,
        'Float64<4,4>': Matrix4x4,
        'Spectrum': Spectrum
    };
    class Class_hinting {
        static resolve(object) {
            if (object && object['__jsonclass__'] && object['__jsonclass__'][0]) {
                const ctor = constructors[object['__jsonclass__'][0]];
                if (ctor) {
                    return new ctor(object);
                }
            }
            return object;
        }
        static reviver(key, value) {
            return Class_hinting.resolve(value);
        }
    }

    class Web_socket_message_reader {
        constructor(data, initial_offset, little_endian) {
            this.data = data;
            this.offset = initial_offset || 0;
            this.le = little_endian || true;
            this.decoder = root.decoder();
        }
        getUint8() {
            let r= this.data.getUint8(this.offset, this.le);
            this.offset += 1;
            return r;
        }
        getSint8() {
            let r= this.data.getInt8(this.offset, this.le);
            this.offset += 1;
            return r;
        }
        getUint16() {
            let r= this.data.getUint16(this.offset, this.le);
            this.offset += 2;
            return r;
        }
        getSint16() {
            let r= this.data.getInt16(this.offset, this.le);
            this.offset += 2;
            return r;
        }
        getUint32() {
            let r= this.data.getUint32(this.offset, this.le);
            this.offset += 4;
            return r;
        }
        getSint32() {
            let r= this.data.getInt32(this.offset, this.le);
            this.offset += 4;
            return r;
        }
        getSint64() {
            let low;
            let high;
            if (this.le) {
                low = this.getUint32();
                high = this.getUint32();
            } else {
                high = this.getUint32();
                low = this.getUint32();
            }
            high |= 0;
            let combined = low + Math.pow(2, 32) * high;
            if (!Number.isSafeInteger(combined)) {
                console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');
            }
            return combined;
        }
        getUint64() {
            let low;
            let high;
            if (this.le) {
                low = this.getUint32();
                high = this.getUint32();
            } else {
                high = this.getUint32();
                low = this.getUint32();
            }
            let combined = low + Math.pow(2, 32) * high;
            if (!Number.isSafeInteger(combined)) {
                console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');
            }
            return combined;
        }
        getFloat32() {
            let r= this.data.getFloat32(this.offset, this.le);
            this.offset += 4;
            return r;
        }
        getFloat64() {
            let r= this.data.getFloat64(this.offset, this.le);
            this.offset += 8;
            return r;
        }
        getString() {
            let char_size = this.getUint8();
            let length = this.getUint32();
            let r = '';
            if (char_size === 1) {
                let string_bytes = new Uint8Array(this.data.buffer, this.data.byteOffset+this.offset, length);
                r = this.decoder.decode(string_bytes);
                this.offset += length;
            } else if (char_size === 2) {
                for (let i=0;i<length;i++) {
                    r += String.fromCharCode(this.getUint16());
                }
            } else {
                throw 'unsupported character size';
            }
            return r;
        }
        getUint8Array(length) {
            let r = new Uint8Array(this.data.buffer, this.offset, length);
            this.offset += length;
            return r;
        }
        getUint8ClampedArray(length) {
            let r = new Uint8ClampedArray(this.data.buffer, this.offset, length);
            this.offset += length;
            return r;
        }
        getTypedValue() {
            let type = this.getUint8();
            switch (type) {
            case 0x00:  return undefined;
            case 0x01: return this.getUint8() ? true : false;
            case 0x02: return this.getUint8();
            case 0x03: return this.getSint8();
            case 0x04: return this.getUint16();
            case 0x05: return this.getSint16();
            case 0x06: return this.getUint32();
            case 0x07: return this.getSint32();
            case 0x08: return this.getFloat32();
            case 0x09: return this.getFloat64();
            case 0x0a: return this.getString();
            case 0x0b: {
                let count = this.getUint32();
                let r = {};
                for (let i=0;i<count;i++) {
                    let key = this.getString();
                    let value = this.getTypedValue();
                    r[key] = value;
                }
                return Class_hinting.resolve(r);
            }        case 0x0c: {
                let count = this.getUint32();
                let r = [];
                for (let i=0;i<count;i++) {
                    let value = this.getTypedValue();
                    r.push(value);
                }
                return r;
            }        case 0x0d: return null;
            case 0x0e: return true;
            case 0x0f: return false;
            case 0x10: return {};
            case 0x11: return this.getUint64();
            case 0x12: return this.getSint64();
            case 0x13: {
                let binary = {};
                binary.mime_type = this.getString();
                let byte_count = this.getUint64();
                binary.data = this.getUint8Array(byte_count);
                return binary;
            }        case 0x14: {
                let canvas = {};
                canvas.num_layers = this.getUint32();
                if (canvas.num_layers === 0) {
                    return canvas;
                }
                canvas.resolution_x = this.getUint32();
                canvas.resolution_y = this.getUint32();
                canvas.pixel_format = this.getString();
                canvas.bytes_per_component = this.getUint32();
                canvas.components_per_pixel = this.getUint32();
                canvas.gamma = this.getFloat32();
                let canvas_size = canvas.bytes_per_component * canvas.components_per_pixel *
                                    canvas.resolution_x * canvas.resolution_y;
                canvas.layers = [];
                for (let l=0;l<canvas.num_layers;l++) {
                    canvas.layers.push(this.getUint8Array(canvas_size));
                }
                return canvas;
            }        }
            throw 'unsupported typed value type ' + type;
        }
    }

    class Web_socket_message_writer {
        constructor(little_endian) {
            this.buffers = [];
            this.push_buffer(0);
            this.totalLength = 0;
            this.le = little_endian || true;
            this.encoder = root.encoder();
        }
        push_buffer(size) {
            if (this.data) {
                this.finalise_data();
            }
            size = size || 0;
            this.buffers.push(
                {
                    buffer: new ArrayBuffer(size < 1024 ? 1024 : size+1024)
                }
            );
            this.data = new DataView(this.buffers[this.buffers.length-1].buffer);
            this.offset = 0;
        }
        validate_data(size) {
            if (this.data && this.offset + size < this.data.byteLength) {
                return;
            }
            this.push_buffer(size);
        }
        finalise_data() {
            if (!this.data) {
                return;
            }
            this.buffers[this.buffers.length-1].length = this.offset;
            this.totalLength += this.offset;
            this.offset = 0;
            this.data = undefined;
        }
        finalise() {
            this.finalise_data();
            let result = new Uint8Array(this.totalLength);
            let offset = 0;
            for (let i=0;i<this.buffers.length;i++) {
                result.set(new Uint8Array(this.buffers[i].buffer, 0, this.buffers[i].length), offset);
                offset += this.buffers[i].length;
            }
            this.buffers = [];
            this.totalLength = 0;
            return result.buffer;
        }
        pushUint8(val) {
            this.validate_data(1);
            this.data.setUint8(this.offset, val);
            this.offset += 1;
        }
        pushSint8(val) {
            this.validate_data(1);
            this.data.setInt8(this.offset, val);
            this.offset += 1;
        }
        pushUint16(val) {
            this.validate_data(2);
            this.data.setUint16(this.offset, val, this.le);
            this.offset += 2;
        }
        pushSint16(val) {
            this.validate_data(2);
            this.data.setInt16(this.offset, val, this.le);
            this.offset += 2;
        }
        pushUint32(val) {
            this.validate_data(4);
            this.data.setUint32(this.offset, val, this.le);
            this.offset += 4;
        }
        pushSint32(val) {
            this.validate_data(4);
            this.data.setInt32(this.offset, val, this.le);
            this.offset += 4;
        }
        pushUint64(val) {
            let low = val | 0;
            let high = val / Math.pow(2, 32);
            if (this.le) {
                this.pushUint32(low);
                this.pushUint32(high);
            } else {
                this.pushUint32(high);
                this.pushUint32(low);
            }
        }
        pushSint64(val) {
            let low;
            let high;
            if (val < 0) {
                low = (-val) | 0;
                high = (-val / Math.pow(2, 32)) | 0;
                low = ~low;
                high = ~high;
                let a48 = high >>> 16;
                let a32 = high & 0xFFFF;
                let a16 = low >>> 16;
                let a00 = low & 0xFFFF;
                let c48 = 0, c32 = 0, c16 = 0, c00 = 0;
                c00 += a00 + 1;
                c16 += c00 >>> 16;
                c00 &= 0xFFFF;
                c16 += a16;
                c32 += c16 >>> 16;
                c16 &= 0xFFFF;
                c32 += a32;
                c48 += c32 >>> 16;
                c32 &= 0xFFFF;
                c48 += a48;
                c48 &= 0xFFFF;
                low = (c16 << 16) | c00;
                high = (c48 << 16) | c32;
            } else {
                low = val | 0;
                high = (val / Math.pow(2, 32)) | 0;
            }
            if (this.le) {
                this.pushUint32(low);
                this.pushUint32(high);
            } else {
                this.pushUint32(high);
                this.pushUint32(low);
            }
        }
        pushFloat32(val) {
            this.validate_data(4);
            this.data.setFloat32(this.offset, val, this.le);
            this.offset += 4;
        }
        pushFloat64(val) {
            this.validate_data(8);
            this.data.setFloat64(this.offset, val, this.le);
            this.offset += 8;
        }
        pushString(val) {
            let utf8_array = this.encoder.encode(val);
            this.validate_data(1 + 4 + utf8_array.byteLength);
            this.data.setUint8(this.offset++, 1);
            this.data.setUint32(this.offset, utf8_array.byteLength, this.le);
            this.offset += 4;
            this.pushArrayBuffer(utf8_array.buffer);
        }
        pushArrayBuffer(value) {
            let arr = new Uint8Array(value);
            this.validate_data(arr.byteLength);
            let set_arr = new Uint8Array(this.data.buffer, this.offset);
            set_arr.set(arr);
            this.offset += arr.byteLength;
        }
        static get typenames() {
            return {
                'Boolean': 0x01,
                'Uint8': 0x02,
                'Sint8': 0x03,
                'Uint16': 0x04,
                'Sint16': 0x05,
                'Uint32': 0x06,
                'Sint32': 0x07,
                'Float32': 0x08,
                'Float64': 0x09,
                'String': 0x0a,
                'Map': 0x0b,
                'Array': 0x0c,
                'Null': 0x0d,
                'True': 0x0e,
                'False': 0x0f,
                'Void': 0x10,
                'Uint64': 0x11,
                'Sint64': 0x12,
                'Binary': 0x13,
                'Canvas': 0x14
            };
        }
        static get bytes_per_component() {
            return {
                'Sint8': 1,
                'Sint32': 4,
                'Float32': 4,
                'Float32<2>': 4,
                'Float32<3>': 4,
                'Float32<4>': 4,
                'Rgb': 1,
                'Rgba': 1,
                'Rgbe': 1,
                'Rgbea': 1,
                'Rgb_16': 2,
                'Rgba_16': 2,
                'Rgb_fp': 4,
                'Color': 4
            };
        };
        static get components_per_pixel() {
            return {
                'Sint8': 1,
                'Sint32': 1,
                'Float32': 1,
                'Float32<2>': 2,
                'Float32<3>': 3,
                'Float32<4>': 4,
                'Rgb': 3,
                'Rgba': 4,
                'Rgbe': 4,
                'Rgbea': 5,
                'Rgb_16': 3,
                'Rgba_16': 4,
                'Rgb_fp': 3,
                'Color': 4
            };
        };
        pushTypedValue(value, type) {
            let type_byte = 0x0;
            if (value === undefined || typeof value === 'function') {
                type = 'Null';
            }
            if (!type) {
                if (typeof value === 'number') {
                    if (Number.isInteger(value)) {
                        if (value < 0) {
                            if (value < -2147483648) {
                                type_byte = Web_socket_message_writer.typenames['Sint64'];
                            } else {
                                type_byte = Web_socket_message_writer.typenames['Sint32'];
                            }
                        } else {
                            if (value > 4294967295) {
                                type_byte = Web_socket_message_writer.typenames['Uint64'];
                            } else {
                                type_byte = Web_socket_message_writer.typenames['Uint32'];
                            }
                        }
                    } else {
                        type_byte = Web_socket_message_writer.typenames['Float64'];
                    }
                } else if (value === true) {
                    type_byte = Web_socket_message_writer.typenames['True'];
                } else if (value === false) {
                    type_byte = Web_socket_message_writer.typenames['False'];
                } else if (value === null) {
                    type_byte = Web_socket_message_writer.typenames['Null'];
                } else if (value.constructor === String) {
                    type_byte = Web_socket_message_writer.typenames['String'];
                } else if (Array.isArray(value)) {
                    type_byte = Web_socket_message_writer.typenames['Array'];
                } else if (value instanceof ArrayBuffer) {
                    type_byte = Web_socket_message_writer.typenames['Binary'];
                    value = {
                        data: value
                    };
                } else if (typeof value != 'object') {
                    throw 'Invalid type';
                } else {
                    type_byte = Web_socket_message_writer.typenames['Map'];
                }
            } else {
                type_byte = Web_socket_message_writer.typenames[type];
                if (type_byte === undefined) {
                    throw 'Unknown type ' + type;
                }
            }
            this.pushUint8(type_byte);
            switch (type_byte) {
            case 0x00: return;
            case 0x01: this.pushUint8(!!value); return;
            case 0x02: this.pushUint8(value); return;
            case 0x03: this.pushSint8(value); return;
            case 0x04: this.pushUint16(value); return;
            case 0x05: this.pushSint16(value); return;
            case 0x06: this.pushUint32(value); return;
            case 0x07: this.pushSint32(value); return;
            case 0x08: this.pushFloat32(value); return;
            case 0x09: this.pushFloat64(value); return;
            case 0x0a: this.pushString(value); return;
            case 0x0b: {
                let keys = Object.keys(value);
                this.pushUint32(keys.length);
                let self = this;
                keys.forEach(function(key) {
                    self.pushString(key);
                    self.pushTypedValue(value[key]);
                });
                return;
            }        case 0x0c: {
                this.pushUint32(value.length);
                for (let i=0;i<value.length;i++) {
                    this.pushTypedValue(value[i]);
                }
                return;
            }        case 0x0d: return;
            case 0x0e: return;
            case 0x0f: return;
            case 0x10: return;
            case 0x11: this.pushUint64(value);return;
            case 0x12: this.pushSint64(value);return;
            case 0x13: {
                if (!value.data) {
                    throw 'Binary type does not have a data property';
                }
                if (value.mime_type) {
                    this.pushString(value.mime_type);
                } else {
                    this.pushString('');
                }
                this.pushUint64(value.data.byteLength);
                if (value.data instanceof ArrayBuffer) {
                    this.pushArrayBuffer(value.data);
                } else {
                    this.pushArrayBuffer(value.data.buffer);
                }
                return;
            }        case 0x14: {
                if (value.num_layers === undefined ||
                      value.resolution_x === undefined || value.resolution_y === undefined ||
                      value.pixel_format === undefined || !Array.isArray(value.layers)) {
                    throw 'Supplied canvas does not appear to be a canvas';
                }
                if (Web_socket_message_writer.bytes_per_component[value.pixel_format] === undefined) {
                    throw 'Unsupported canvas pixel format ' + value.pixel_format;
                }
                this.pushUint32(value.num_layers);
                if (!value.num_layers) {
                    return;
                }
                this.pushUint32(value.resolution_x);
                this.pushUint32(value.resolution_y);
                this.pushString(value.pixel_format);
                this.pushUint32(Web_socket_message_writer.bytes_per_component[value.pixel_format]);
                this.pushUint32(Web_socket_message_writer.components_per_pixel[value.pixel_format]);
                if (value.gamma !== undefined) {
                    this.pushFloat32(value.gamma);
                } else {
                    this.pushFloat32(2.2);
                }
                let expected_length = value.resolution_x * value.resolution_y *
                                        Web_socket_message_writer.bytes_per_component[value.pixel_format] *
                                        Web_socket_message_writer.components_per_pixel[value.pixel_format];
                for (let l=0;l<value.num_layers;l++) {
                    if (value.layers[l].buffer.byteLength !== expected_length) {
                        throw 'Canvas layer ' + l + ' incorrect size. Is ' + value.layers[l].buffer.byteLength +
                              'bytes, expected ' + expected_length;
                    }
                    this.pushArrayBuffer(value.layers[l].buffer);
                }
                return;
            }        }
            throw 'unsupported typed value type ' + type_byte;
        }
    }

    class Delayed_promise {
        constructor() {
            this._promise = new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
            });
        }
        get promise() {
            return this._promise;
        }
        get resolve() {
            return this._resolve;
        }
        get reject() {
            return this._reject;
        }
    }

    class State_data {
        constructor(scope_name=null) {
            this._state_commands = null;
            this.scope_name = scope_name || undefined;
        }
        get scope_name() {
            return this._scope_name;
        }
        set scope_name(value) {
            if (value !== this._scope_name) {
                this._scope_name = value;
                if (value) {
                    this._state_commands = [
                        new Command('use_scope', { scope_name: value })
                    ];
                } else {
                    this._state_commands = null;
                }
            }
        }
        get state_commands() {
            return this._state_commands;
        }
    }

    class Command_queue {
        constructor(service, wait_for_render, state_data, options) {
            this.service = service;
            this.wait_for_render = wait_for_render;
            this.state_data = state_data;
            this.options = options || {};
            this.commands = [];
        }
        get length() {
            return this.commands.length;
        }
        queue(command, want_response=false) {
            this.commands.push({
                command,
                response_promise: want_response ? new Delayed_promise() : undefined
            });
            return this;
        }
        send() {
            this.resolve_all = false;
            return this.service.send_command_queue(this);
        }
        execute() {
            this.resolve_all = true;
            return this.service.send_command_queue(this);
        }
    }

    class Render_loop_state_data {
        constructor(render_loop_name, cancel=undefined, continue_on_error=true) {
            this._render_loop_name = render_loop_name;
            this._cancel = cancel;
            this._continue_on_error = continue_on_error;
            if (this._cancel !== 0 && this._cancel !== 1) {
                this._cancel = -1;
            }
            if (this._continue_on_error === null || this._continue_on_error === undefined) {
                this._continue_on_error = true;
            }
            this._continue_on_error = !!this._continue_on_error;
        }
        get render_loop_name() {
            return this._render_loop_name;
        }
        set render_loop_name(value) {
            this._render_loop_name = value;
        }
        get cancel() {
            return this._cancel;
        }
        set cancel(value) {
            if (value !== 0 && value !== 1) {
                this._cancel = -1;
            } else {
                this._cancel = value;
            }
        }
        get continue_on_error() {
            return this._continue_on_error;
        }
        set continue_on_error(value) {
            this._continue_on_error = !!value;
        }
    }

    class Stream extends eventemitter3 {
        constructor(service) {
            super();
            this.service = service;
            this.sequence_promises = [];
            this.pause_count = 0;
            this._render_loop_name = undefined;
            this.state_data = new Render_loop_state_data();
        }
        get render_loop_name() {
            return this._render_loop_name;
        }
        get paused() {
            return this.pause_count;
        }
        get streaming() {
            return this.render_loop_name && this.service.streaming(this.render_loop_name);
        }
        get cancel_level() {
            return this.state_data.cancel;
        }
        set cancel_level(value) {
            this.state_data.cancel = value;
        }
        get continue_on_error() {
            return this.state_data.continue_on_error;
        }
        set continue_on_error(value) {
            this.state_data.continue_on_error = value;
        }
        start(render_loop) {
            return new Promise((resolve, reject) => {
                if (!this.service.validate(reject)) {
                    return;
                }
                if (this.streaming) {
                    reject(new RealityServerError('Render loop is already streaming.'));
                }
                if (typeof render_loop === 'string' || render_loop instanceof String) {
                    render_loop = {
                        render_loop_name: render_loop
                    };
                }
                this.service.send_ws_command('start_stream', render_loop, response => {
                    if (response.error) {
                        reject(new RealityServerError(response.error.message));
                    } else {
                        this._render_loop_name = render_loop.render_loop_name;
                        this.state_data.render_loop_name = this.render_loop_name;
                        this.service.add_stream(this);
                        resolve();
                    }
                });
            });
        }
        stop() {
            return new Promise((resolve, reject) => {
                if (!this.service.validate(reject)) {
                    return;
                }
                if (!this.streaming) {
                    reject(new RealityServerError('Not streaming.'));
                }
                this.service.send_ws_command('stop_stream', { render_loop_name: this.render_loop_name }, response => {
                    if (response.error) {
                        reject(new RealityServerError(response.error.message));
                    } else {
                        this.service.remove_stream(this.render_loop_name);
                        this.state_data.render_loop_name = undefined;
                        resolve(response.result);
                    }
                });
            });
        }
        pause() {
            return ++this.pause_count;
        }
        resume(force=false) {
            if (this.pause_count > 0) {
                if (!!force) {
                    this.pause_count = 0;
                } else {
                    this.pause_count--;
                }
            }
            return this.pause_count;
        }
        set_parameters(parameters) {
            return new Promise((resolve, reject) => {
                if (!this.service.validate(reject)) {
                    return;
                }
                if (!this.streaming) {
                    reject(new RealityServerError('Not streaming.'));
                }
                const args = Object.assign(
                    {
                        render_loop_name: this.render_loop_name
                    },
                    parameters
                );
                this.service.send_ws_command('set_stream_parameters', args, response => {
                    if (response.error) {
                        reject(new RealityServerError(response.error.message));
                    } else {
                        resolve(response.result);
                    }
                });
            });
        }
        update_camera(data) {
            const promise = new Delayed_promise();
            if (!this.service.validate(promise.reject)) {
                return promise.promise;
            }
            if (!this.streaming) {
                promise.reject(new RealityServerError('Not streaming.'));
                return promise.promise;
            }
            if (!data) {
                promise.reject(new RealityServerError('No data object provided.'));
                return promise.promise;
            }
            const args = {
                render_loop_name: this.render_loop_name,
                camera: data.camera,
                camera_instance: data.camera_instance,
                cancel_level: data.cancel_level
            };
            if (data.wait_for_render) {
                if (this.service.protocol_version < 5) {
                    promise.reject(new RealityServerError('Connected RealityServer does not support wait for render ' +
                                            'with camera updates. Update to RealityServer 6 to use ' +
                                            'this feature.'));
                    return promise.promise;
                }
                args.sequence_id = ++Service.sequence_id;
                this.sequence_promises.push({
                    sequence_id: args.sequence_id,
                    delayed_promise: promise
                });
            }
            this.service.send_ws_command('set_camera', args, response => {
                if (response.error) {
                    promise.reject(new RealityServerError(response.error.message));
                } else {
                    if (!data.wait_for_render) {
                        promise.resolve(response.result);
                    }
                }
            });
            return promise.promise;
        }
        pick(pick, cancel_level = null) {
            const promise = new Delayed_promise();
            if (!this.service.validate(promise.reject)) {
                return promise.promise;
            }
            if (this.service.protocol_version < 6) {
                promise.reject(new RealityServerError(
                    'Connected RealityServer does not support pick command. ' +
    				'Update to RealityServer 6.2 to use this feature.'));
                return promise.promise;
            }
            if (!this.streaming) {
                promise.reject(new RealityServerError('Not streaming.'));
                return promise.promise;
            }
            if (!pick.position) {
                pick = {
                    position: arguments[0],
                    size: arguments[1]
                };
                cancel_level = arguments[2];
            }
            if (!pick.position) {
                promise.reject(new RealityServerError('No position provided.'));
                return promise.promise;
            }
            const args = {
                render_loop_name: this.render_loop_name,
                position: pick.position
            };
            if (pick.size !== null && pick.size !== undefined) {
                args.size = pick.size;
            }
            if (pick.max_levels !== null && pick.max_levels !== undefined) {
                args.max_levels = pick.max_levels;
            }
            if (pick.params !== null && pick.params !== undefined) {
                args.params = pick.params;
            }
            if (cancel_level !== null && cancel_level !== undefined) {
                args.cancel_level = cancel_level;
            }
            this.service.send_ws_command('pick', args, response => {
                if (response.error) {
                    promise.reject(new RealityServerError(response.error.message));
                } else {
                    promise.resolve(response.result);
                }
            });
            return promise.promise;
        }
        get_state_data(cancel_level=null, continue_on_error=null) {
            let state_data = this.state_data;
            if ((cancel_level !== null && cancel_level !== this.cancel_level) ||
                (continue_on_error !== null && !!continue_on_error !== this.continue_on_error)) {
                state_data = new Render_loop_state_data(
                    this.render_loop_name,
                    cancel_level !== null ? cancel_level : this.cancel_level,
                    continue_on_error !== null ? continue_on_error : this.continue_on_error);
            }
            return state_data;
        }
        queue_commands({ wait_for_render=false, cancel_level=null, continue_on_error=null }={}) {
            return new Command_queue(this.service, wait_for_render, this.get_state_data(cancel_level, continue_on_error));
        }
        execute_command(command, {
            want_response=false,
            wait_for_render=false,
            cancel_level=null,
            continue_on_error=null
        } = {}) {
            return new Command_queue(this.service, wait_for_render, this.get_state_data(cancel_level, continue_on_error))
                .queue(command, want_response)
                .execute();
        }
        send_command(command, {
            want_response=false,
            wait_for_render=false,
            cancel_level=null,
            continue_on_error=null
        } = {}) {
            return new Command_queue(this.service, wait_for_render, this.get_state_data(cancel_level, continue_on_error))
                .queue(command, want_response)
                .send(wait_for_render);
        }
    }

    let sequence_id=0;
    const now_function = function(){
        try {
            if (window && window.performance && performance.now) {
                return function() {
                    return performance.now() / 1000;
                };
            }
        } catch (e) {
            try {
                if (process && process.hrtime) {
                    return function() {
                        const time = process.hrtime();
                        return time[0] + time[1] / 1e9;
                    };
                }
            } catch (e) {}
        }
        return function() {
            return Date.now() / 1000;
        };
    }();
    let Websocket_impl = function() {
        try {
            return window ? window.WebSocket : undefined;
        } catch (e) {}
        return undefined;
    }();
    class Service extends eventemitter3 {
        constructor() {
            super();
            this.default_state_data = new State_data();
            this.binary_commands = true;
            this.emit_command_events = false;
        }
        get default_scope_name() {
            return this.default_state_data.scope_name;
        }
        set default_scope_name(value) {
            this.default_state_data.scope_name = value;
        }
        get connector_name() {
            return 'WS';
        }
        static get sequence_id() {
            return sequence_id;
        }
        static set sequence_id(value) {
            sequence_id = value;
        }
        static get websocket() {
            return Websocket_impl;
        }
        static set websocket(value) {
            Websocket_impl = value;
        }
        static get supported() {
            return !!Websocket_impl;
        }
        static now() {
            return now_function();
        };
        static get MESSAGE_ID_IMAGE() {
            return 0x01;
        };
        static get MESSAGE_ID_IMAGE_ACK() {
            return 0x02;
        };
        static get MESSAGE_ID_TIME_REQUEST() {
            return 0x03;
        };
        static get MESSAGE_ID_TIME_RESPONSE() {
            return 0x04;
        };
        static get MESSAGE_ID_COMMAND() {
            return 0x05;
        };
        static get MESSAGE_ID_RESPONSE() {
            return  0x06;
        };
        static get MESSAGE_ID_PREFER_STRING() {
            return 0x07;
        };
        static get MESSAGE_ID_PROGRESS() {
            return 0x08;
        };
        static get MAX_SUPPORTED_PROTOCOL() {
            return 9;
        };
        get connected_protocol_version() {
            return this.protocol_version;
        }
        connect(url, extra_constructor_args=null) {
            return new Promise((resolve, reject) => {
                if (url !== undefined && url !== null && url.constructor === String) {
                    if (!Service.supported) {
                        reject(new RealityServerError('Websockets not supported.'));
                        return;
                    }
                    try {
                        if (extra_constructor_args) {
                            this.web_socket = new Websocket_impl(...[ url, undefined ].concat(
                                Array.isArray(extra_constructor_args) ?
                                    extra_constructor_args :
                                    [ extra_constructor_args ]));
                        } else {
                            this.web_socket = new Websocket_impl(url);
                        }
                    } catch (e) {
                        reject(e instanceof Error ? e : new RealityServerError(e));
                        return;
                    }
                } else {
                    this.web_socket = url;
                }
                this.protocol_state = 'prestart';
                this.web_socket_littleendian = true;
                this.command_id = 0;
                this.response_handlers = {};
                this.streams = {};
                this.web_socket.binaryType = 'arraybuffer';
                let scope = this;
                this.web_socket.onopen = event => {
                    scope.emit('open', event);
                };
                this.web_socket.onclose = event => {
                    scope.protocol_state = 'prestart';
                    scope.web_socket.onopen = undefined;
                    scope.web_socket.onerror = undefined;
                    scope.web_socket.onmessage = undefined;
                    scope.web_socket = undefined;
                    scope.protocol_version = undefined;
                    scope.emit('close', event);
                };
                this.web_socket.onerror = error => {
                    scope.emit('error', error);
                    reject(new RealityServerError('WebSocket connection error.'));
                };
                function process_response(response) {
                    if (scope.response_handlers[response.id] !== undefined) {
                        let handler_scope = scope.response_handlers[response.id].scope;
                        if (handler_scope === undefined) {
                            handler_scope = scope;
                        }
                        scope.response_handlers[response.id].handler.call(handler_scope, response);
                        delete scope.response_handlers[response.id];
                    }
                }
                function emit_image_event(stream, data) {
                    if (!stream.pause_count) {
                        scope.emit('image', data);
                        stream.emit('image', data);
                    }
                }
                function process_received_render(message, now) {
                    const result = message.getSint32();
                    const n_canvases = scope.protocol_version <= 7 ? 1 : message.getUint32();
                    const render_loop_name = message.getString();
                    const stream = scope.streams[render_loop_name];
                    if (stream === undefined) {
                        return;
                    }
                    if (result >= 0) {
                        const images = [];
                        for (let canvas_index=0; canvas_index<n_canvases; canvas_index++) {
                            const have_image = message.getUint32();
                            if (have_image === 0) {
                                const img_width = message.getUint32();
                                const img_height = message.getUint32();
                                const mime_type = message.getString();
                                const render_type = message.getString();
                                const img_size = message.getUint32();
                                const image = message.getUint8Array(img_size);
                                const data = {
                                    width: img_width,
                                    height: img_height,
                                    mime_type: mime_type,
                                    render_type: render_type,
                                    image: image
                                };
                                images.push(data);
                            }
                        }
                        const have_stats = message.getUint8();
                        let stats;
                        if (have_stats) {
                            stats = message.getTypedValue();
                        }
                        if (stream.last_render_time) {
                            stats['fps'] = 1 / (now - stream.last_render_time);
                        }
                        stream.last_render_time = now;
                        const data = {
                            images: images,
                            result: result,
                            render_loop_name: stream.render_loop_name,
                            statistics: stats
                        };
                        const sequence_promises = [];
                        if (stats.sequence_id > 0) {
                            while (stream.sequence_promises.length &&
                            stream.sequence_promises[0].sequence_id <= stats.sequence_id) {
                                const handler = stream.sequence_promises.shift();
                                handler.delayed_promise.resolve(data);
                                sequence_promises.push(handler.promise);
                            }
                        }
                        if (sequence_promises.length) {
                            Promise.all(sequence_promises).then(() => {
                                emit_image_event(stream, data);
                            });
                        } else {
                            emit_image_event(stream, data);
                        }
                    } else {
                        emit_image_event(stream, { result });
                    }
                }
                function web_socket_stream(event) {
                    if (event.data instanceof ArrayBuffer) {
                        const now = Service.now();
                        const data = new DataView(event.data);
                        const message = data.getUint32(0, scope.web_socket_littleendian);
                        if (message === Service.MESSAGE_ID_IMAGE) {
                            let img_msg = new Web_socket_message_reader(data, 4, scope.web_socket_littleendian);
                            let header_size = img_msg.getUint32();
                            if (this.protocol_version <= 7 && header_size !== 16) {
                                return;
                            }
                            if (this.protocol_version > 7 && header_size !== 20) {
                                return;
                            }
                            let image_id = img_msg.getUint32();
                            process_received_render(img_msg, now);
                            let buffer = new ArrayBuffer(16);
                            let response = new DataView(buffer);
                            response.setUint32(0, Service.MESSAGE_ID_IMAGE_ACK, scope.web_socket_littleendian);
                            response.setUint32(4, image_id, scope.web_socket_littleendian);
                            response.setFloat64(8, now, scope.web_socket_littleendian);
                            scope.web_socket.send(buffer);
                        } else if (message === Service.MESSAGE_ID_TIME_REQUEST) {
                            let buffer = new ArrayBuffer(12);
                            let response = new DataView(buffer);
                            response.setUint32(0, Service.MESSAGE_ID_TIME_RESPONSE, scope.web_socket_littleendian);
                            response.setFloat64(4, now, scope.web_socket_littleendian);
                            scope.web_socket.send(buffer);
                        } else if (message === Service.MESSAGE_ID_RESPONSE) {
                            let response_msg = new Web_socket_message_reader(data, 4, scope.web_socket_littleendian);
                            let id = response_msg.getTypedValue();
                            let response = response_msg.getTypedValue();
                            response.id = id;
                            if (response.id !== undefined) {
                                process_response(response);
                            }
                        } else if (message === Service.MESSAGE_ID_PROGRESS) {
                            let progress_msg = new Web_socket_message_reader(data, 4, scope.web_socket_littleendian);
                            let id = progress_msg.getString();
                            let value = progress_msg.getFloat64();
                            let area = progress_msg.getString();
                            let message = progress_msg.getString();
                            scope.emit('progress', {
                                id, value, area, message
                            });
                        }
                    } else {
                        const data = JSON.parse(event.data, Class_hinting.reviver);
                        if (data.id !== undefined) {
                            process_response(data);
                        }
                    }
                }
                function web_socket_handshaking(event) {
                    if (event.data instanceof ArrayBuffer) {
                        let data = new DataView(event.data);
                        let hs_header = String.fromCharCode(data.getUint8(0), data.getUint8(1),
                            data.getUint8(2), data.getUint8(3),
                            data.getUint8(4), data.getUint8(5),
                            data.getUint8(6), data.getUint8(7));
                        if (hs_header !== 'RSWSRLIS') {
                            scope.web_socket.close(1002, 'Invalid handshake response');
                            reject(new RealityServerError('Unexpected handshake header, ' +
                                                'does not appear to be a RealityServer connection.'));
                        } else {
                            const protocol_version = data.getUint32(8, scope.web_socket_littleendian);
                            if (protocol_version < 2 || protocol_version > Service.MAX_SUPPORTED_PROTOCOL) {
                                scope.web_socket.close(1002, protocol_version < 2 ?
                                    'RealityServer WebSocket protocol too old.' :
                                    'RealityServer WebSocket protocol too new.');
                                reject(new RealityServerError(protocol_version < 2 ?
                                    'RealityServer version unsupported, upgrade your RealityServer.' :
                                    'RealityServer WebSocket protocol version not supported.'));
                            } else {
                                scope.protocol_version = protocol_version;
                                scope.protocol_state = 'started';
                                scope.web_socket.onmessage = web_socket_stream;
                                if (scope.debug_commands) {
                                    scope.debug_commands = true;
                                }
                                scope.on('close', () => {
                                    Object.keys(scope.response_handlers).forEach(id => {
                                        process_response({
                                            id,
                                            error: {
                                                message: 'WebSocket connection closed.'
                                            }
                                        });
                                    });
                                });
                                resolve();
                            }
                        }
                    } else {
                        scope.web_socket.close(1002, 'Handshake response not binary');
                        reject(new RealityServerError('unexpected data during handshake'));
                    }
                }
                function web_socket_prestart(event) {
                    scope.web_socket.onerror = error => scope.emit('error', error);
                    if (event.data instanceof ArrayBuffer) {
                        let now = Service.now();
                        if (event.data.byteLength !== 40) {
                            scope.web_socket.close(1002, 'Invalid handshake size');
                            reject(new RealityServerError('Invalid handshake header size'));
                            return;
                        }
                        let data = new DataView(event.data);
                        let hs_header = String.fromCharCode(data.getUint8(0), data.getUint8(1),
                            data.getUint8(2), data.getUint8(3),
                            data.getUint8(4), data.getUint8(5),
                            data.getUint8(6), data.getUint8(7));
                        if (hs_header !== 'RSWSRLIS') {
                            scope.web_socket.close(1002, 'Not a RealityServer handshake');
                            reject(new RealityServerError('Invalid handshake header, ' +
                                                'does not appear to be a RealityServer connection.'));
                        } else {
                            scope.web_socket_littleendian = data.getUint8(8) === 1 ? true : false;
                            let protocol_version = data.getUint32(12, scope.web_socket_littleendian);
                            if (protocol_version < 3) {
                                scope.web_socket.close(1002, 'RealityServer too old.');
                                reject(new RealityServerError('RealityServer version is too old, ' +
                                                'client lirary requires at least version 5.2 2272.266.'));
                                return;
                            }
                            if (protocol_version > Service.MAX_SUPPORTED_PROTOCOL) {
                                protocol_version = Service.MAX_SUPPORTED_PROTOCOL;
                            }
                            scope.protocol_state = 'handshaking';
                            let buffer = new ArrayBuffer(40);
                            let response = new DataView(buffer);
                            for (let i = 0; i < hs_header.length; ++i) {
                                response.setUint8(i, hs_header.charCodeAt(i));
                            }
                            response.setUint32(8, protocol_version, scope.web_socket_littleendian);
                            response.setUint32(12, 0, scope.web_socket_littleendian);
                            response.setFloat64(16, now, scope.web_socket_littleendian);
                            for (let i = 0; i < 16; ++i) {
                                response.setUint8(i + 24, data.getUint8(i + 24), scope.web_socket_littleendian);
                            }
                            scope.web_socket.onmessage = web_socket_handshaking;
                            scope.web_socket.send(buffer);
                        }
                    } else {
                        scope.web_socket.close(1002, 'Handshake header not binary');
                        reject(new RealityServerError('Unexpected data during handshake, ' +
                                                'does not appear to be a RealityServer connection.'));
                    }
                }
                this.web_socket.onmessage = web_socket_prestart;
            });
        }
        close(code=1000, reason='User request') {
            if (this.web_socket) {
                this.web_socket.close(code, reason);
            }
        }
        send_ws_command(command, args, handler, scope) {
            let command_id = handler !== undefined ? this.command_id : undefined;
            if (command_id !== undefined) {
                this.response_handlers[command_id] = { handler: handler, scope: scope };
                this.command_id++;
            }
            let payload = {
                command: command,
                arguments: args,
                id: command_id
            };
            if (this.binary_commands && this.protocol_version > 1) {
                let buffer = new Web_socket_message_writer(this.web_socket_littleendian);
                buffer.pushUint32(Service.MESSAGE_ID_COMMAND);
                buffer.pushTypedValue(payload);
                buffer = buffer.finalise();
                this.web_socket.send(buffer);
            } else {
                this.web_socket.send(JSON.stringify(payload));
            }
        }
        create_stream() {
            return new Stream(this);
        }
        validate(reject=null) {
            if (!this.web_socket) {
                if (reject) {
                    reject(new RealityServerError('Web socket not connected.'));
                }
                return false;
            }
            if (this.protocol_state !== 'started') {
                if (reject) {
                    reject(new RealityServerError('Web socket not started.'));
                }
                return false;
            }
            return true;
        }
        add_stream(stream) {
            this.streams[stream.render_loop_name] = stream;
        }
        remove_stream(render_loop_name) {
            delete this.streams[render_loop_name];
        }
        streaming(render_loop_name) {
            return !!this.streams[render_loop_name];
        }
        queue_commands({ scope_name=null, longrunning=false }={}) {
            return new Command_queue(this,
                false,
                scope_name ? new State_data(scope_name) : this.default_state_data,
                { longrunning });
        }
        execute_command(command, { want_response=false, scope_name=null, longrunning=false }={}) {
            return new Command_queue(this,
                false,
                scope_name ? new State_data(scope_name) : this.default_state_data,
                { longrunning })
                .queue(command, want_response)
                .execute();
        }
        send_command(command, { want_response=false, scope_name=null, longrunning=false }={}) {
            return new Command_queue(this,
                false,
                scope_name ? new State_data(scope_name) : this.default_state_data,
                { longrunning })
                .queue(command, want_response)
                .send();
        }
        send_command_queue(command_queue) {
            const { wait_for_render, resolve_all } = command_queue;
            function throw_or_reject(arg) {
                if (resolve_all) {
                    return Promise.reject(arg);
                }
                throw arg;
            }
            if (!command_queue) {
                return throw_or_reject(new RealityServerError('No command queue provided'));
            }
            if (!this.web_socket) {
                return throw_or_reject(new RealityServerError('Web socket not connected.'));
            }
            if (this.protocol_state !== 'started') {
                return throw_or_reject(new RealityServerError('Web socket not started.'));
            }
            if (command_queue.commands.length === 0) {
                return resolve_all ? Promise.all([]) : [];
            }
            let execute_args;
            const commands = command_queue.commands.map(c => c.command);
            const promises = command_queue.commands.reduce((result, { response_promise }) => {
                if (response_promise) {
                    result.push(response_promise.promise);
                }
                return result;
            }, []);
            if (command_queue.state_data.render_loop_name) {
                execute_args = {
                    commands,
                    render_loop_name: command_queue.state_data.render_loop_name,
                    continue_on_error: command_queue.state_data.continue_on_error,
                    cancel: command_queue.state_data.cancel
                };
                if (wait_for_render) {
                    let stream = this.streams[execute_args.render_loop_name];
                    if (stream) {
                        const promise = new Delayed_promise();
                        execute_args.sequence_id = ++Service.sequence_id;
                        stream.sequence_promises.push({
                            sequence_id: execute_args.sequence_id,
                            delayed_promise: promise
                        });
                        promises.push(promise.promise);
                    } else {
                        promises.push(Promise.resolve());
                    }
                }
            } else {
                if (wait_for_render) {
                    return throw_or_reject(new RealityServerError('Commands want to wait for a rendered image but ' +
                                                        'are not executing on a render loop'));
                }
                execute_args = {
                    commands: command_queue.state_data.state_commands ?
                        command_queue.state_data.state_commands.concat(commands) :
                        commands,
                    longrunning: command_queue.options && command_queue.options.longrunning
                };
            }
            const scope = this;
            function resolve_responses(response) {
                if (scope.emit_command_events) {
                    scope.emit('command_results', {
                        id: response.id,
                        results: response.result,
                        commands: execute_args.commands,
                        render_loop_name: this.state_data.render_loop_name
                    });
                }
                if (response.error) {
                    Object.values(this.commands).forEach(handler => {
                        if (handler.response_promise) {
                            handler.response_promise.resolve(new Command_error(response.error));
                        }
                    });
                    return;
                }
                let response_offset = this.state_data.state_commands ? this.state_data.state_commands.length : 0;
                for (let i=response_offset;i<response.result.length;++i) {
                    let cmd_idx = i - response_offset;
                    if (this.commands[cmd_idx].response_promise) {
                        const server_response = response.result[i];
                        if ((!!server_response.error && server_response.error.code !== 0)) {
                            this.commands[cmd_idx].response_promise.resolve(new Command_error(server_response.error));
                        } else {
                            this.commands[cmd_idx].response_promise.resolve(server_response.result);
                        }
                    }
                }
            }
            if ((wait_for_render && promises.length > 1) || promises.length || this.emit_command_events) {
                if (this.emit_command_events) {
                    this.emit('command_requests', {
                        id: this.command_id,
                        commands: execute_args.commands,
                        render_loop_name: command_queue.state_data.render_loop_name
                    });
                }
                this.send_ws_command('execute', execute_args, resolve_responses, command_queue);
            } else {
                this.send_ws_command('execute', execute_args);
            }
            return resolve_all ? Promise.all(promises) : promises;
        }
        set debug_commands(enable) {
            this.binary_commands = !enable;
            if (this.web_socket && this.protocol_state === 'started') {
                let buffer = new ArrayBuffer(8);
                let message = new DataView(buffer);
                message.setUint32(0, Service.MESSAGE_ID_PREFER_STRING, this.web_socket_littleendian);
                message.setUint32(4, !!enable ? 1 : 0, this.web_socket_littleendian);
                this.web_socket.send(buffer);
            }
        }
        get debug_commands() {
            return !this.binary_commands;
        }
        set log_commands(enable) {
            this.emit_command_events = !!enable;
        }
        get log_commands() {
            return this.emit_command_events;
        }
        set_max_rate(max_rate) {
            return new Promise((resolve, reject) => {
                if (!this.web_socket) {
                    reject(new RealityServerError('Web socket not connected.'));
                    return;
                }
                if (this.protocol_state !== 'started') {
                    reject(new RealityServerError('Web socket not started.'));
                    return;
                }
                if (!max_rate) {
                    max_rate = 0;
                }
                let args = {
                    rate: max_rate
                };
                this.send_ws_command('set_transfer_rate', args, response => {
                    if (response.error) {
                        reject(new RealityServerError(response.error.message));
                    } else {
                        resolve(response.result);
                    }
                }
                );
            });
        }
        associate_scope(scope_name) {
            return new Promise((resolve, reject) => {
                if (!this.web_socket) {
                    reject(new RealityServerError('Web socket not connected.'));
                    return;
                }
                if (this.protocol_state !== 'started') {
                    reject(new RealityServerError('Web socket not started.'));
                    return;
                }
                if (this.protocol_version < 4) {
                    reject(new RealityServerError('Connected RealityServer does not support associating scopes ' +
                                        'with Service connections. Update to RealityServer 6 to use ' +
                                        'this feature.'));
                    return;
                }
                this.send_ws_command('associate_scope', scope_name, response => {
                    if (response.error) {
                        reject(new RealityServerError(response.error.message));
                    } else {
                        resolve(response.result);
                    }
                }
                );
            });
        }
    }

    exports.ALMOST_ZERO = ALMOST_ZERO;
    exports.Color = Color;
    exports.Command = Command;
    exports.Command_error = Command_error;
    exports.Error = RealityServerError;
    exports.Math = index;
    exports.Matrix4x4 = Matrix4x4;
    exports.Service = Service;
    exports.Spectrum = Spectrum;
    exports.Stream = Stream;
    exports.Utils = Utils;
    exports.Vector2 = Vector2;
    exports.Vector3 = Vector3;
    exports.Vector4 = Vector4;
    exports.degrees = degrees;
    exports.radians = radians;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=realityserver.js.map
