/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
import Utf8 from './Utf8';

class Web_socket_message_writer {
    /**
   * @private Helper for writing binary messages
   * @ctor
   */
    constructor(little_endian) {
        // initial buffer
        this.buffers = [];
        this.push_buffer(0);

        this.totalLength = 0;
        this.le = little_endian || true;

        this.encoder = Utf8.encoder();
    }


    /**
   * @private
   * creates a new buffer that will hold at least \p size bytes
   * @param size the number of bytes we will add
   */
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

    /**
   * @private
   * ensures this.data has enough room to hold \p size more bytes
   * @param size the number of bytes we will add
   */
    validate_data(size) {
        if (this.data && this.offset + size < this.data.byteLength) {
            return;
        }
        this.push_buffer(size);
    }

    /**
   * @private
   * finalises this.data and undefines it.
   */
    finalise_data() {
        if (!this.data) {
            return;
        }
        this.buffers[this.buffers.length-1].length = this.offset;
        this.totalLength += this.offset;

        this.offset = 0;
        this.data = undefined;
    }

    /**
   * finalises the writer and returns an ArrayBuffer containing the data
   */
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

    /**
   * pushes a uint8
   * @param val the value to push
   */
    pushUint8(val) {
        this.validate_data(1);
        this.data.setUint8(this.offset, val);
        this.offset += 1;
    }

    /**
   * pushes a sint8
   * @param val the value to push
   */
    pushSint8(val) {
        this.validate_data(1);
        this.data.setInt8(this.offset, val);
        this.offset += 1;
    }

    /**
   * pushes a uint16
   * @param val the value to push
   */
    pushUint16(val) {
        this.validate_data(2);
        this.data.setUint16(this.offset, val, this.le);
        this.offset += 2;
    }

    /**
   * pushes a sint16
   * @param val the value to push
   */
    pushSint16(val) {
        this.validate_data(2);
        this.data.setInt16(this.offset, val, this.le);
        this.offset += 2;
    }

    /**
   * pushes a uint32
   * @param val the value to push
   */
    pushUint32(val) {
        this.validate_data(4);
        this.data.setUint32(this.offset, val, this.le);
        this.offset += 4;
    }

    /**
   * pushes a sint32
   * @param val the value to push
   */
    pushSint32(val) {
        this.validate_data(4);
        this.data.setInt32(this.offset, val, this.le);
        this.offset += 4;
    }

    /**
   * pushes a uint64
   * @param val the value to push
   */
    pushUint64(val) {
        // split 64-bit number into two 32-bit (4-byte) parts
        let low = val | 0; // bitwise ops convert to 32 bit
        let high = val / Math.pow(2, 32);
        if (this.le) {
            this.pushUint32(low);
            this.pushUint32(high);
        } else {
            this.pushUint32(high);
            this.pushUint32(low);
        }
    }

    /**
   * pushes a sint64
   * @param val the value to push
   */
    pushSint64(val) {
        // split 64-bit number into two 32-bit (4-byte) parts
        let low;
        let high;

        if (val < 0) {
            // from https://github.com/dcodeIO/long.js
            // make positive and extract bits.
            // then negate by doing not().add(1)
            low = (-val) | 0; // bitwise ops convert to 32 bit
            high = (-val / Math.pow(2, 32)) | 0;

            // not
            low = ~low;
            high = ~high;

            // add 1
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
            low = val | 0; // bitwise ops convert to 32 bit
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

    /**
   * pushes a float32
   * @param val the value to push
   */
    pushFloat32(val) {
        this.validate_data(4);
        this.data.setFloat32(this.offset, val, this.le);
        this.offset += 4;
    }

    /**
   * pushes a float64
   * @param val the value to push
   */
    pushFloat64(val) {
        this.validate_data(8);
        this.data.setFloat64(this.offset, val, this.le);
        this.offset += 8;
    }

    /**
   * pushes a string
   * @param val the string to push
   */
    pushString(val) {
        let utf8_array = this.encoder.encode(val);
        this.validate_data(1 + 4 + utf8_array.byteLength);
        // character size
        this.data.setUint8(this.offset++, 1);
        this.data.setUint32(this.offset, utf8_array.byteLength, this.le);
        this.offset += 4;

        this.pushArrayBuffer(utf8_array.buffer);
    }

    /**
   * Pushes an ArrayBuffer as an array of uint8
   * @param value the ArrayBuffer to push
   */
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

    /**
   * Pushes a typed value. \p type gives the typename to push as, if
   * undefined then a type is derived from value. We can derive types for
   * booleans, numbers, strings, arrays, null and ArrayBuffer. Any other type
   * will derive as Map.
   * \param value the value to push
   * \type the type to use
   */
    pushTypedValue(value, type) {
        let type_byte = 0x0;
        // coerce undefined values to null
        if (value === undefined || typeof value === 'function') {
            type = 'Null';
        }
        if (!type) {
            // derive type
            if (typeof value === 'number') {
                if (Number.isInteger(value)) {
                    if (value < 0) {
                        // negative
                        if (value < -2147483648) {
                            type_byte = Web_socket_message_writer.typenames['Sint64'];
                        } else {
                            type_byte = Web_socket_message_writer.typenames['Sint32'];
                        }
                    } else {
                        // positive
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
        case 0x00: return; // undefined
        case 0x01: this.pushUint8(!!value); return; // boolean
        case 0x02: this.pushUint8(value); return;
        case 0x03: this.pushSint8(value); return;
        case 0x04: this.pushUint16(value); return;
        case 0x05: this.pushSint16(value); return;
        case 0x06: this.pushUint32(value); return;
        case 0x07: this.pushSint32(value); return;
        case 0x08: this.pushFloat32(value); return;
        case 0x09: this.pushFloat64(value); return;
        case 0x0a: this.pushString(value); return;
        case 0x0b: { //map/object
            let keys = Object.keys(value);
            this.pushUint32(keys.length);
            let self = this;
            keys.forEach(function(key) {
                self.pushString(key);
                self.pushTypedValue(value[key]);
            });
            return;
        };
        case 0x0c: { // array
            this.pushUint32(value.length);
            for (let i=0;i<value.length;i++) {
                this.pushTypedValue(value[i]);
            }
            return;
        };
        case 0x0d: return; // null
        case 0x0e: return; // true
        case 0x0f: return; // false;
        case 0x10: return; // void
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
        };
        case 0x14: {
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
        };
        }
        throw 'unsupported typed value type ' + type_byte;
    }
}

export default Web_socket_message_writer;
