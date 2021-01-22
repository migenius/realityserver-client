/******************************************************************************
 * Copyright 2010-2021 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/
// A simple test just to ensure command parameter processing works as expected
import Command from '../src/Command';

let errs = 0;
let tests = 0;

function check(value,expected,message) {
    if (value !== expected) {
        console.log('failed: ' + message);
        errs++;
    }
    tests++
}
let c = new Command('name',{a:'b'});

check(c.name,'name','name incorrect');
check(Object.keys(c.params).length,1,'one param');
check(Object.keys(c.params)[0],'a','param called a');
check(c.params['a'],'b','param is b');

// check undefined stripping
c = new Command('name2',{a:'b',b:1,c:{c1:'a'},d:[3,4],e:true,u:undefined,f:0,g:false,h:null,i: new ArrayBuffer(10)});

check(c.name,'name2','name incorrect');
check(Object.keys(c.params).length,9,'9 params (removed undefined)');
check(c.params['a'],'b','param a');
check(c.params['b'],1,'param b');
check(Object.keys(c.params['c']).length,1,'param c has 1 property');
check(c.params['c']['c1'],'a','param c has 1 property');
check(Array.isArray(c.params['d']),true,'param d is an array');
check(c.params['d'].length,2,'param d is length 2');
check(c.params['d'][0],3,'param d[0] is 3');
check(c.params['d'][1],4,'param d[1] is 4');
check(c.params['e'],true,'param e');
check(c.params['f'],0,'param f');
check(c.params['g'],false,'param g');
check(c.params['h'],null,'param h');
check(c.params['i'] instanceof ArrayBuffer,true,'param i');
check(c.params['u'],undefined,'param u is undefined');
check(c.params.hasOwnProperty('u'),false,'param u actually does not exists');

if (!errs) {
    console.log('Command passed');
}
