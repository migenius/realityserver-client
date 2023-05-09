/*! https://mths.be/utf8js v3.0.0 by @mathias */
//;(function(root) {
    const root = {}
    let stringFromCharCode = String.fromCharCode;

    // Taken from https://mths.be/punycode
    function ucs2decode(string) {
        let output = [];
        let counter = 0;
        let length = string.length;
        let value;
        let extra;
        while (counter < length) {
            value = string.charCodeAt(counter++);
            if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                // high surrogate, and there is a next character
                extra = string.charCodeAt(counter++);
                if ((extra & 0xFC00) == 0xDC00) { // low surrogate
                    output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                } else {
                    // unmatched surrogate; only append this code unit, in case the next
                    // code unit is the high surrogate of a surrogate pair
                    output.push(value);
                    counter--;
                }
            } else {
                output.push(value);
            }
        }
        return output;
    }

    // Taken from https://mths.be/punycode
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
    /*--------------------------------------------------------------------------*/

    function createByte(codePoint, shift) {
        return ((codePoint >> shift) & 0x3F) | 0x80;
    }

    function encodeCodePoint(codePoint) {
        if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
            return [codePoint];
        }
        let symbol = [];
        if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
            symbol.push(((codePoint >> 6) & 0x1F) | 0xC0);
        } else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
            checkScalarValue(codePoint);
            symbol.push(((codePoint >> 12) & 0x0F) | 0xE0);
            symbol.push(createByte(codePoint, 6));
        } else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
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
        // assume just 7 bit ascii to start with, which
        // given our use case isn't a bad thing.
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

    /*--------------------------------------------------------------------------*/

    function readContinuationByte() {
        if (byteIndex >= byteCount) {
            throw Error('Invalid byte index');
        }

        let continuationByte = byteArray[byteIndex] & 0xFF;
        byteIndex++;

        if ((continuationByte & 0xC0) == 0x80) {
            return continuationByte & 0x3F;
        }

        // If we end up here, it’s not a continuation byte
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

        // Read first byte
        byte1 = byteArray[byteIndex] & 0xFF;
        byteIndex++;

        // 1-byte sequence (no continuation bytes)
        if ((byte1 & 0x80) == 0) {
            return byte1;
        }

        // 2-byte sequence
        if ((byte1 & 0xE0) == 0xC0) {
            byte2 = readContinuationByte();
            codePoint = ((byte1 & 0x1F) << 6) | byte2;
            if (codePoint >= 0x80) {
                return codePoint;
            } else {
                throw Error('Invalid continuation byte');
            }
        }

        // 3-byte sequence (may include unpaired surrogates)
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

        // 4-byte sequence
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

    /*--------------------------------------------------------------------------*/

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

    export default root;
//}(typeof exports === 'undefined' ? this.utf8 = {} : exports));
