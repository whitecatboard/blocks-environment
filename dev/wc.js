/*
    Copyright (C) 2015 by Bernat Romagosa
    Edutec Research Group, Citilab - Cornellà de Llobregat (Barcelona)
    bromagosa@citilab.eu
    
    This file is part of WhiteCat.
    WhiteCat is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of
    the License, or (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Global utils

console.log = function (d) {
    process.stdout.write(d + '\n');
}

function toLuaDigital(val) {
    return '((' + val + ' == true or ' + val + ' == 1) and 1 or 0)'
}

function luaEscape(string) {
    return (string.toString().replace("'","\\'")).replace('"', '\\"')
}

// Coroutines map into Lua coroutines
var Coroutine;

Coroutine.prototype = {};
Coroutine.prototype.constructor = Coroutine;
Coroutine.uber = Object.prototype;

function Coroutine(id, topBlock) {
    this.init(id, topBlock);
}

Coroutine.prototype.init = function(id, topBlock) {
    this.id = id;
    this.topBlock = topBlock;
}

Coroutine.prototype.setBody = function(body) {
    this.body = 'c = coroutine; c' + this.id + ' = ' + this.wrap(body);
}

Coroutine.prototype.wrap = function(body) {
    return 'c.create(function() ' + body + ' end);\r';
}

// Scheduler handles coroutine threads
var Scheduler;

Scheduler.prototype = {};
Scheduler.prototype.constructor = Scheduler;
Scheduler.uber = Object.prototype;

function Scheduler(coroutines) {
    this.init(coroutines);
}

Scheduler.prototype.init = function(coroutines) {
    var myself = this;

    this.coroutines = coroutines;
    this.header = 'cr={};cn=0;';

    this.coroutines.forEach(function(coroutine) {
        myself.header += 'cr[' + coroutine.id + ']=c' + coroutine.id + ';cn=cn+1;';
    });

    this.body = 'while (cn>0) do\rfor k,v in pairs(cr) do if (c.status(v)~="dead") then\rc.resume(v) else\rprint("dc:"..k..":");cn=cn-1;end;end;end;';
}

Scheduler.prototype.toString = function() {
    return this.header + this.body
}

// LuaExpression 

var LuaExpression;
LuaExpression.prototype = {};
LuaExpression.prototype.constructor = LuaExpression;
LuaExpression.uber = Object.prototype;

function LuaExpression(topBlock, board) {
    this.init(topBlock, board)
}

LuaExpression.prototype.init = function(topBlock, board) {
    if (topBlock === null) { return };

    var args = [],
        nextBlock = topBlock.nextBlock ? topBlock.nextBlock() : null;

    this.topBlock = topBlock;
    this.code = '';
    this.board = board;

    if (!topBlock) { return };

    function translateInput(input) {
        if (input instanceof InputSlotMorph) {
            // If input is an InputSlotMorph, get its contents
            args.push(input.contents().text);
        } else if (input instanceof CSlotMorph) {
            // If it's a CSlotMorph, get its nested block
            args.push(new LuaExpression(input.nestedBlock(), board));
        } else if (input instanceof MultiArgMorph) {
            // If it's a variadic input, let's recursivelly traverse its inputs
            input.inputs().forEach(function(each) { translateInput(each) });
        } else {
            // Otherwise, it's a reporter, so we need to translate it into a LuaExpression 
            args.push(new LuaExpression(input, board));
        }
    }

    topBlock.inputs().forEach(function(each) { translateInput(each) });

    this[topBlock.selector].apply(this, args);

    if (nextBlock) {
        this.code += (new LuaExpression(nextBlock, board)).toString();
    }
}

LuaExpression.prototype.toString = function() {
    return this.code;
}

/////////////// Lua blocks ////////////////////

//// Control

// Hat Blocks

LuaExpression.prototype.receiveGo = function () {
    // This guy does nothing actually
}

// Iterators

LuaExpression.prototype.doForever = function (body) {
    this.code = 'while (true) do\r' + body + '\rc.yield(); end\r';
};

LuaExpression.prototype.doRepeat = function (times, body) {
    this.code = 'for i=1,' + times + ' do\r' + body + '\rc.yield(); end\r';
};

// Conditionals

LuaExpression.prototype.doIf = function (condition, body) {
    this.code = 'if ' + condition + ' then\r' + body + '\rend\r';
}

LuaExpression.prototype.doIfElse = function (condition, trueBody, falseBody) {
    this.code = 'if ' + condition + ' then\r' + trueBody + '\relse\r' + falseBody + '\rend; c.yield()\r';
}

// Others

LuaExpression.prototype.doReport = function (body) {
    this.code = 'local result = ' + body + '; print("wc:' + this.topBlock.coroutine.id + ':" .. tostring(result)); return result\r';
}

LuaExpression.prototype.doWait = function (secs) {
    this.code = 'local t = tmr.read(); while (tmr.getdiffnow(nil, t) < (' + secs + ' * 100000000)) do c.yield(); end local t = nil\r';
}


//// Operators

LuaExpression.prototype.reportSum = function (a, b) {
    this.code = '(' + a + ' + ' + b + ')';
}

LuaExpression.prototype.reportDifference = function (a, b) {
    this.code = '(' + a + ' - ' + b + ')';
}

LuaExpression.prototype.reportProduct = function (a, b) {
    this.code = '(' + a + ' * ' + b + ')';
}

LuaExpression.prototype.reportQuotient = function (a, b) {
    this.code = '(' + a + ' / ' + b + ')';
}

LuaExpression.prototype.reportModulus = function (a, b) {
    this.code = '(' + a + ' % ' + b + ')';
}

LuaExpression.prototype.reportMonadic = function (func, a) {
    var specialFunctions = { ln: 'math.log', log: 'math.log10', 'e^': 'math.exp', '10^': '10^' };

    this.code = '(';

    if (specialFunctions.hasOwnProperty(func)) {
        this.code += specialFunctions[func];
    } else {
        this.code += 'math.' + func;
    }

    this.code += '(' + a + '))';
}

LuaExpression.prototype.reportRandom = function (a, b) {
    this.code = '(math.random(' + a + ',' + b + '))';
}

LuaExpression.prototype.reportLessThan = function (a, b) {
    this.code = '(' + a + ' < ' + b + ')';
}

LuaExpression.prototype.reportEquals = function (a, b) {
    this.code = '(' + a + ' == ' + b + ')';
}

LuaExpression.prototype.reportGreaterThan = function (a, b) {
    this.code = '(' + a + ' > ' + b + ')';
}

LuaExpression.prototype.reportAnd = function (a, b) {
    this.code = '(' + a + ' and ' + b + ')';
}

LuaExpression.prototype.reportOr = function (a, b) {
    this.code = '(' + a + ' or ' + b + ')';
}

LuaExpression.prototype.reportNot = function (a) {
    this.code = '(not ' + a + ')';
}

LuaExpression.prototype.reportTrue = function () {
    this.code = 'true';
}

LuaExpression.prototype.reportFalse = function () {
    this.code = 'false';
}

LuaExpression.prototype.reportJoinWords = function () {
    var myself = this;

    this.code = '(""';

    Array.prototype.slice.call(arguments).forEach(function(eachWord) {
        if (typeof eachWord === 'string') { 
            myself.code += '.. "' + luaEscape(eachWord) + '"';
        } else {
            myself.code += '.. tostring(' + eachWord + ')';
        }
    });

    this.code += ')';
}

//// Data

LuaExpression.prototype.reportNewList = function() {
    var myself = this;

    this.code = '({';
    Array.prototype.slice.call(arguments).forEach(function(eachItem) {
        if (typeof eachItem === 'string') { 
            myself.code += '"' + luaEscape(eachItem) + '",';
        } else {
            myself.code += eachItem + ',';
        } 
    });
    this.code += '})';
}

LuaExpression.prototype.reportListItem = function(index, list) {
    this.code = '(' + list + '[' + index + '])';
}

//// Input/Output

LuaExpression.prototype.setPinDigital = function(pinNumber, value) {
    var pin = this.board.pinOut.digitalOutput[pinNumber];
    // pio.OUTPUT is 0
    this.code = 'pio.pin.setdir(0, pio.' + pin + '); pio.pin.setval(' + toLuaDigital(value) + ', pio.' + pin + '); c.yield()\r'
}

LuaExpression.prototype.getPinDigital = function(pinNumber) {
    // We need to wrap this one into a lambda, because it needs to first set the pin direction before reporting its value
    // pio.INPUT is 1
    var pin = this.board.pinOut.digitalInput[pinNumber];
    this.code = '(function () pio.pin.setdir(1, pio.' + pin + '); return pio.pin.getval(pio.' + pin + ') end)()'
}

LuaExpression.prototype.setPinAnalog = function(pinNumber, value) {
    // ToDo when we have PWM
}

LuaExpression.prototype.getPinAnalog = function(pinNumber) {
    // We need to wrap this one into a lambda, because it needs to first set the pin direction before reporting its value
    // pio.INPUT is 1
    var pin = this.board.pinOut.analogOutput[pinNumber];
    this.code = '(function () local v = a:setupchan(12, ' + pin + '); return v:read(); end)()'
}
