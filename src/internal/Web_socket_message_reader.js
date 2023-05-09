/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
import Utf8 from './Utf8';
import Class_hinting from './Class_hinting';

class Web_socket_message_reader {
    /**
   * @private Helper for reading binary messages
   * @ctor
   */
    constructor(data, initial_offset, little_endian) {
        this.data = data;
        this.offset = initial_offset || 0;
        this.le = little_endian || true;
        this.decoder = Utf8.decoder();
    }

    /**
   * @private
   */
    getUint8() {
        let r= this.data.getUint8(this.offset, this.le);
        this.offset += 1;
        return r;
    }

    /**
   * @private
   */
    getSint8() {
        let r= this.data.getInt8(this.offset, this.le);
        this.offset += 1;
        return r;
    }

    /**
   * @private
   */
    getUint16() {
        let r= this.data.getUint16(this.offset, this.le);
        this.offset += 2;
        return r;
    }

    /**
   * @private
   */
    getSint16() {
        let r= this.data.getInt16(this.offset, this.le);
        this.offset += 2;
        return r;
    }

    /**
   * @private
   */
    getUint32() {
        let r= this.data.getUint32(this.offset, this.le);
        this.offset += 4;
        return r;
    }

    /**
   * @private
   */
    getSint32() {
        let r= this.data.getInt32(this.offset, this.le);
        this.offset += 4;
        return r;
    }

    /**
   * @private
   */
    getSint64() {
        // split 64-bit number into two 32-bit (4-byte) parts
        let low;
        let high;
        if (this.le) {
            low = this.getUint32();
            high = this.getUint32();
        } else {
            high = this.getUint32();
            low = this.getUint32();
        }
        high |= 0; // a trick to get signed

        // combine the two 32-bit values
        let combined = low + Math.pow(2, 32) * high;

        if (!Number.isSafeInteger(combined)) {
            console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');
        }

        return combined;
    }

    /**
   * @private
   */
    getUint64() {
        // split 64-bit number into two 32-bit (4-byte) parts
        let low;
        let high;
        if (this.le) {
            low = this.getUint32();
            high = this.getUint32();
        } else {
            high = this.getUint32();
            low = this.getUint32();
        }
        // combine the two 32-bit values
        let combined = low + Math.pow(2, 32) * high;

        if (!Number.isSafeInteger(combined)) {
            console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');
        }

        return combined;
    }

    /**
   * @private
   */
    getFloat32() {
        let r= this.data.getFloat32(this.offset, this.le);
        this.offset += 4;
        return r;
    }

    /**
   * @private
   */
    getFloat64() {
        let r= this.data.getFloat64(this.offset, this.le);
        this.offset += 8;
        return r;
    }

    /**
   * @private
   */
    getString() {
        let char_size = this.getUint8();
        let length = this.getUint32();
        let r = '';
        if (char_size === 1) {
            // utf8
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

    /**
   * @private
   */
    getUint8Array(length) {
        let r = new Uint8Array(this.data.buffer, this.offset, length);
        this.offset += length;
        return r;
    }

    /**
   * @private
   */
    getUint8ClampedArray(length) {
        let r = new Uint8ClampedArray(this.data.buffer, this.offset, length);
        this.offset += length;
        return r;
    }

    /**
   * @private
   */
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
        };
        case 0x0c: {
            let count = this.getUint32();
            let r = [];
            for (let i=0;i<count;i++) {
                let value = this.getTypedValue();
                r.push(value);
            }
            return r;
        };
        case 0x0d: return null;
        case 0x0e: return true;
        case 0x0f: return false;
        case 0x10: return {}; // void
        case 0x11: return this.getUint64();
        case 0x12: return this.getSint64();
        case 0x13: {
            let binary = {};
            binary.mime_type = this.getString();
            let byte_count = this.getUint64();
            binary.data = this.getUint8Array(byte_count);
            return binary;
        };
        case 0x14: {
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
        };
        }
        throw 'unsupported typed value type ' + type;
    }
}

export default Web_socket_message_reader;
