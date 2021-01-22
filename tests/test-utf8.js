/******************************************************************************
 * Copyright 2010-2021 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
// A simple test just to ensure basic functionality of the UTF-8 encoding
import Utf8 from '../src/internal/Utf8';
const fs = require('fs');
let text_encoder;
try {
    text_encoder = TextEncoder;
} catch(e) {
    text_encoder = require('util').TextEncoder;
}

let str = fs.readFileSync('./utf8test.html','utf-8');

str += str;
str += str;
str += str;
str += str;
str += str;
str += str;
str += str;
str += str;
str += str; 

//console.log(str.length);
let start = new Date();
// We'll accept TextEncoder as a source of truth
const check = new text_encoder().encode(str);
//console.log(`${new Date() - start}`);

start = new Date();
let test = Utf8.encoder().encode(str);
//console.log(`${new Date() - start}`);
let errs=0;
if  (test.length != check.length) {
    console.error('lengths different');
    errs++;
} else {
    check.forEach((v,i) => {
        if (v != test[i]) {
            console.error(`${i} different ${v} != ${test[i]}`);
            errs++;
        }
    })
}
if (!errs) {
    start = new Date();
    let new_str = Utf8.decoder().decode(check);
    //console.log(`${new Date() - start}`);
    if (new_str != str) {
        console.log('decode failed');
        errs++;
    }
}
if (!errs) {
    console.log('Utf8 Passed');
}
//console.log(str);