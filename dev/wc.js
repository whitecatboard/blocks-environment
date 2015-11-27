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

    --

    BASED ON SNAP!
    ==============
    WhiteCat is based on a stripped-down version of Snap!, by Jens Mönig,
    and reuses its whole Morphic system, its blocks rendering engine, many
    of its widgets and, in general, several parts of its graphic user
    interface.

    --

    NOTE ABOUT LEGIBILITY
    =====================
    The generated Lua code is meant to be as small as possible while still
    being reasonably understandable, but lots of names have been drastically
    abbreviated, making some resulting scripts hard to follow.

    The reason for this is that we want to transfer as few bytes as possible
    over the wire in order to keep the illusion of liveness and real-time.

    In the future, we may go even further and automatically minify the
    resulting code before sending it over to the board.

    --

    SERIAL PROTOCOL
    ===============
    These are the messages we can get back from the board, and their
    interpretation:

    C   → Chunk. The board is ready for the next chunk of data

            When sending scripts over to the board, we need to split them
            into manageable chunks and wait for the serial buffer to be empty
            before sending the next one.

    pb  → Popup Bubble. A piece of data that should show up in a bubble.

            The format is pb:[ID]:[data], where ID is the coroutine's ID, or
            'r' in case it's just a reporter that got clicked.

    rc  → Runnning Coroutine. A coroutine has just come alive.

            The format is rc:[ID]:[data], where data is optional. This
            coroutine should be highlighted and possibly do something with
            the data it has just received.

    dc  → Dead Coroutine. A coroutine has ended.

            The format is dc:[ID]:[data], where data is optional. This
            coroutine should be un-highlighted and possibly do something with
            the data it has just received.
*/

// Global utils

console.log = function (d) {
    process.stdout.write(d + '\n');
};

function toLuaDigital(val) {
    return '((' + val + ' == true or ' + val + ' == 1) and 1 or 0)'
};

function luaAutoEscape(aString) {
    if (typeof aString === 'string') { 
        return '"' + luaEscape(aString) + '"';
    } else {
        return 'tostring(' + aString + ')';
    }
};

function luaEscape(aString) {
    return (aString.toString().replace("'","\\'")).replace('"', '\\"')
};

function yieldIf(condition) {
    return condition ? ';c.yield();' : '';
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
    this.wasRunning = false;
    this.topBlock = topBlock;
}

Coroutine.prototype.setBody = function(body) {
    this.body = 'c = coroutine; c' + this.id + ' = ' + this.wrap(body);
}

Coroutine.prototype.wrap = function(body) {
    return 'c.create(function() print("rc:' + this.id + ':");' + body + '; c.yield(); end);\r';
}

Coroutine.prototype.setRunning = function(running) {
    this.wasRunning = running == true;
}

// Scheduler handles coroutine threads
var Scheduler;

Scheduler.prototype = {};
Scheduler.prototype.constructor = Scheduler;
Scheduler.uber = Object.prototype;

function Scheduler() {
    this.init();
}

Scheduler.prototype.init = function() {
    var myself = this;

    this.coroutines = [];
    this.rewriteHeader();

    this.body = 'while (cn>0) do\rfor k,v in pairs(cr) do if (c.status(v)~="dead") then\rc.resume(v) else\rprint("dc:"..k..":");cn=cn-1;end;end;end;';
}

Scheduler.prototype.rewriteHeader = function() {
    this.header = 'if (cr == null) then cr={};cn=0; end;';
    this.coroutines.forEach(function(coroutine) {
        myself.addCoroutine(coroutine);
    });
}

Scheduler.prototype.addCoroutine = function(coroutine) {
    if (!this.hasCoroutine(coroutine)) {
        this.header += 'cr[' + coroutine.id + ']=c' + coroutine.id + ';cn=cn+1;';
    }
}

Scheduler.prototype.removeCoroutine = function(coroutine) {
    if (this.hasCoroutine(coroutine)) {
        this.coroutines.splice(this.coroutines(indexOf(coroutine)), 1);
        this.rewriteHeader();
    }
}

Scheduler.prototype.hasCoroutine = function(coroutine) {
    return detect(this.coroutines, function(each) { return each.id == coroutine.id });
}

Scheduler.prototype.toString = function() {
    return this.header + this.body
}

// LuaExpression 

var LuaExpression;
LuaExpression.prototype = {};
LuaExpression.prototype.constructor = LuaExpression;
LuaExpression.uber = Object.prototype;

function LuaExpression(topBlock, board, shouldYield) {
    this.init(topBlock, board, shouldYield)
}

LuaExpression.prototype.init = function(topBlock, board, shouldYield) {
    if (!topBlock) { return };

    var args = [],
        nextBlock = topBlock.nextBlock ? topBlock.nextBlock() : null;

    this.shouldYield = shouldYield;
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
            args.push(new LuaExpression(input.nestedBlock(), board, shouldYield));
        } else if (input instanceof MultiArgMorph) {
            // If it's a variadic input, let's recursively traverse its inputs
            input.inputs().forEach(function(each) { translateInput(each) });
        } else {
            // Otherwise, it's a reporter, so we need to translate it into a LuaExpression 
            args.push(new LuaExpression(input, board, shouldYield));
        }
    }

    topBlock.inputs().forEach(function(each) { translateInput(each) });

    if (topBlock.selector === 'subscribeToMQTTmessage') {
        if (nextBlock) {
            // Blocks fired by an MQTT event should never yield!
            args.push((new LuaExpression(nextBlock, board, false)).toString());
        }
    } 

    this[topBlock.selector].apply(this, args);

    if (nextBlock && topBlock.selector !== 'subscribeToMQTTmessage') {
        this.code += (new LuaExpression(nextBlock, board, shouldYield)).toString();
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
    this.code = 'while (true) do\r' + body + yieldIf(this.shouldYield) + 'end\r';
};

LuaExpression.prototype.doRepeat = function (times, body) {
    this.code = 'for i=1,' + times + ' do\r' + body + yieldIf(this.shouldYield) + 'end\r';
};

// Conditionals

LuaExpression.prototype.doIf = function (condition, body) {
    this.code = 'if ' + condition + ' then\r' + body + '\rend\r';
}

LuaExpression.prototype.doIfElse = function (condition, ifTrue, ifFalse) {
    this.code = 'if ' + condition + ' then\r' + ifTrue + '\relse\r' + ifFalse + '\rend' + yieldIf(this.shouldYield);
}

// Others

LuaExpression.prototype.doReport = function (body) {
    this.code = 'local result = ' + body + '; print("pb:' + this.topBlock.coroutine.id + ':" .. tostring(result)); return result\r';
}

LuaExpression.prototype.doWait = function (secs) {
    if (this.shouldYield) {
        this.code
            = 'local t = tmr.read(); while (tmr.getdiffnow(nil, t) < ('
            + secs + ' * 100000000)) do c.yield(); end local t = nil\r';
    } else {
        this.code = 'tmr.delay(tmr.SYS_TIMER, ' + secs + ' * tmr.SEC)'
    }
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
        myself.code += '..' + luaAutoEscape(eachWord);
    });

    this.code += ')';
}

LuaExpression.prototype.runLua = function(code) {
    this.code = 'local f = (function() ' + code + ' end)(); if (f) then print("pb:' + this.topBlock.coroutine.id + ':" .. f) end;\r';
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
    this.code = 'pio.pin.setdir(0, pio.' + pin + '); pio.pin.setval(' + toLuaDigital(value) + ', pio.' + pin + ');' + yieldIf(this.shouldYield)
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
    var pin = this.board.pinOut.analogInput[pinNumber];
    this.code = '(function () a = adc.setup(adc.ADC1, adc.AVDD, 3220); local v = a:setupchan(12, ' + pin + '); return v:read(); end)()'
}

//// Comm

LuaExpression.prototype.subscribeToMQTTmessage = function(message, topic, body) {
    this.code 
        = 'if (m == nil) then ' + this.board.mqttConnectionCode() + ' c.yield() end m:subscribe(' + luaAutoEscape(topic) 
        + ', mqtt.QOS0, (function(l, p) if (p == ' + luaAutoEscape(message)
        + ') then print("rc:' + this.topBlock.coroutine.id + ':"..p);'
        + body + ' print("dc:' + this.topBlock.coroutine.id + ':"..p); end end))\r';
}

LuaExpression.prototype.publishMQTTmessage = function(message, topic) {
    this.code
        = 'if (m == nil) do ' + this.board.mqttConnectionCode() + ' end m:publish(' + luaAutoEscape(topic) 
        + ', ' + luaAutoEscape(message) + ', mqtt.QOS0)'
        + yieldIf(this.shouldYield);
}


// Dialog that lets us connect to an MQTT broker

var MQTTDialogMorph;

MQTTDialogMorph.prototype = new DialogBoxMorph();
MQTTDialogMorph.prototype.constructor = MQTTDialogMorph;
MQTTDialogMorph.uber = DialogBoxMorph.prototype;

function MQTTDialogMorph(target, action, environment) {
    this.init(target, action, environment);
}

MQTTDialogMorph.prototype.init = function (target, action, environment) {
    // initialize inherited properties:
    MQTTDialogMorph.uber.init.call(
        this,
        target,
        action,
        environment
    );

    this.labelString = 'Connect to MQTT broker';
    this.createLabel();

    this.addBody(new AlignmentMorph('column', 4));
    this.body.alignment = 'left';

    this.urlRow = new AlignmentMorph('row', this.padding);
    this.portRow = new AlignmentMorph('row', this.padding);
    this.idRow = new AlignmentMorph('row', this.padding);
    this.usernameRow = new AlignmentMorph('row', this.padding);
    this.passwordRow = new AlignmentMorph('row', this.padding);

    this.createUrlRow();
    this.createPortRow();
    this.createIdRow();
    this.createUsernameRow();
    this.createPasswordRow();

    this.body.add(this.urlRow);
    this.body.add(this.portRow);
    this.body.add(this.idRow);
    this.body.add(this.usernameRow);
    this.body.add(this.passwordRow);

    this.body.drawNew();
    this.body.fixLayout();

    this.addButton('ok', 'Ok');
    this.addButton('cancel', 'Cancel');

    this.fixLayout();
    this.drawNew();
};

MQTTDialogMorph.prototype.createUrlRow = function() {
    this.urlField = new InputFieldMorph(this.target.broker.url || 'whitecatboard.org');
    this.urlRow.add(new TextMorph('Broker url:'));
    this.urlRow.add(this.urlField);
    this.urlRow.fixLayout();
}

MQTTDialogMorph.prototype.createPortRow = function() {
    this.portRow.add(new TextMorph('Port:'));
    this.portField = new InputFieldMorph(this.target.broker.port || '1883');
    this.portRow.add(this.portField);
    this.portRow.fixLayout();
}

MQTTDialogMorph.prototype.createIdRow = function() {
    this.idField = new InputFieldMorph(this.target.broker.deviceID || ('WhiteCat' + Math.floor(Math.random() * 100)));
    this.idRow.add(new TextMorph('Board ID:'));
    this.idRow.add(this.idField);
    this.idRow.fixLayout();
}

MQTTDialogMorph.prototype.createUsernameRow = function() {
    this.usernameField = new InputFieldMorph(this.target.broker.username || '');
    this.usernameRow.add(new TextMorph('username:'));
    this.usernameRow.add(this.usernameField);
    this.usernameRow.fixLayout();
}

MQTTDialogMorph.prototype.createPasswordRow = function() {
    this.passwordField = new InputFieldMorph(this.target.broker.password || '');
    this.passwordField.contents().text.toggleIsPassword(); 
    this.passwordRow.add(new TextMorph('Password:'));
    this.passwordRow.add(this.passwordField);
    this.passwordRow.fixLayout();
}

MQTTDialogMorph.prototype.ok = function() {
    this.target.broker = {
        url: this.urlField.getValue(),
        port: this.portField.getValue(),
        deviceID: this.idField.getValue(),
        username: this.usernameField.getValue(),
        password: this.passwordField.getValue()
    };
    this.accept();
}
