import Utf8 from '../src/internal/Utf8';
const fs = require('fs');

let str = fs.readFileSync('./utf8test.html','utf-8');

str += str;
str += str;
/*str += str;
str += str;
str += str;
str += str;
str += str;
str += str;
str += str; 
*/
//console.log(str.length);
let start = new Date();
// We'll accept TextEncoder as a source of truth
const check = new TextEncoder().encode(str);
//console.log(`${new Date() - start}`);

start = new Date();
let test = Utf8.encode(str);
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
    let new_str = Utf8.decode(check);
  //  console.log(`${new Date() - start}`);
    if (new_str != str) {
        console.log('decode failed');
        errs++;
    }
}
if (!errs) {
    console.log('Passed');
}
//console.log(str);