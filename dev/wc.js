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

            The format is pb:[ID]:[data]:, where ID is the thread ID, or 'r' in
            case it's just a reporter that got clicked.

    pv  → Pin Value. We should update some value in the board watcher.

    rt  → Runnning Thread. A thread has just come alive.

            The format is rc:[ID]:[data]:, where data is optional. This
            thread should be highlighted and possibly do something with
            the data it has just received.

    dt  → Dead Thread. A thread has ended.

            The format is dc:[ID]:[data]:, where data is optional. This
            thread should be un-highlighted and possibly do something with
            the data it has just received.
*/

// Global utils

var debugMode = true;

var fs = require('fs');

var log = function(d) {
    if (!debugMode) { return }
    print = {
        'darwin' : function(d) { process.stdout.write(d + '\n') },
        'win32'  : function(d) { console.log(d) },
        'linux'  : function(d) { process.stdout.write(d + '\n') }
    }
    print[process.platform](d);
};

function luaAutoEscape(something) {
    // automatically escapes, or not, a possible string
    if (!isNaN(Number(something))
            || typeof(something) === 'object') {
        return something;
    } else if (typeof something === 'string') { 
        return '"' + luaEscape(something) + '"';
    } else {
        return 'tostring(' + something + ')';
    }
};

function luaEscape(aString) {
    return (aString.toString().replace("'","\\'")).replace('"', '\\"')
};

function randomFace() {
    // just a little goodie
    function expression() { 
        var expressions = ['~_~', '-_-', 'U_U', 'º_º', 'ɵ_ɵ', '˚O˚', '˚o˚', '~˷~'];
        return expressions[Math.floor(Math.random() * expressions.length)];
    };
    return 'ͼ(' + expression() + ')ͽ';
};

// Threads map into Lua functions that can be run by the WhiteCat scheduler
var Thread;

Thread.prototype = {};
Thread.prototype.constructor = Thread;
Thread.uber = Object.prototype;

function Thread(id, topBlock) {
    this.init(id, topBlock);
};

Thread.prototype.init = function(id, topBlock) {
    this.id = id;
    this.topBlock = topBlock;
};

Thread.prototype.setBody = function(body) {
    this.body = 't' + this.id + ' = ' + this.wrap(body);
};

Thread.prototype.updateBody = function(body) {
    this.setBody(body);
};

Thread.prototype.wrap = function(body) {
    return 'function()\r\n\tprints("\\r\\nrt:' + this.id + '::\\r\\n")\r\n\t' + body + '\r\n\tprints("\\r\\ndt:' + this.id + '::\\r\\n")\r\nend\r\n';
};

Thread.prototype.start = function() {
    return 't_' + this.id + ' = thread.start(t' + this.id + ')\r\n'
};

Thread.prototype.stop = function() {
    return 'thread.stop(t_' + this.id + ')\r\n'
};

Thread.prototype.restart = function() {
    return this.stop() + this.start();
};

// LuaExpression 

var LuaExpression;
LuaExpression.prototype = {};
LuaExpression.prototype.constructor = LuaExpression;
LuaExpression.uber = Object.prototype;

function LuaExpression(topBlock, board) {
    this.init(topBlock, board)
};

LuaExpression.prototype.init = function(topBlock, board) {
    if (!topBlock) { return };

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
            var contents = input.nestedBlock();
            if (contents) {
                args.push(new LuaExpression(contents, board));
            } else {
                args.push(null);
            }
        } else if (input instanceof MultiArgMorph) {
            // If it's a variadic input, let's recursively traverse its inputs
            input.inputs().forEach(function(each) { translateInput(each) });
        } else if (input instanceof TemplateSlotMorph) {
            // It it's an upVar, let's take the variable name as an argument
            args.push(input.contents());
        } else {
            // Otherwise, it's a reporter, so we need to translate it into a LuaExpression 
            args.push(new LuaExpression(input, board));
        }
    }

    topBlock.inputs().forEach(function(each) { translateInput(each) });

    if (nextBlock && topBlock.selector === 'subscribeToMQTTmessage') {
        args.push((new LuaExpression(nextBlock, board)).toString());
    } 

    this[topBlock.selector].apply(this, args);

    if (nextBlock && topBlock.selector !== 'subscribeToMQTTmessage') {
        this.code += (new LuaExpression(nextBlock, board)).toString();
    }
};

LuaExpression.prototype.toString = function() {
    return this.code;
};

/////////////// Lua blocks ////////////////////

//// Control

// Hat Blocks

LuaExpression.prototype.receiveGo = function () {
    // This guy does nothing actually
};

// Iterators

LuaExpression.prototype.doForever = function (body) {
    if (body) {
        this.code = 'while (true) do\r\n' + body + '\r\ntmr.delayus(1); end\r\n';
    }
};

LuaExpression.prototype.doRepeat = function (times, body) {
    if (body) {
        this.code = 'for i=1,' + times + ' do\r\n' + body + 'end\r\n';
    }
};

// Conditionals

LuaExpression.prototype.doIf = function (condition, body) {
    if (body) {
        this.code = 'if ' + condition + ' then\r\n' + body + '\r\nend\r\n';
    }
};

LuaExpression.prototype.doIfElse = function (condition, ifTrue, ifFalse) {
    if (ifTrue && ifFalse) {
        this.code = 'if ' + condition + ' then\r\n' + ifTrue + '\r\nelse\r\n' + ifFalse + '\r\nend\r\n';
    }
};

// Others

LuaExpression.prototype.doReport = function (body) {
    // Not yet implemented
};

LuaExpression.prototype.doWait = function (delay, timeScale) {
    switch (timeScale) {
        case localize('milliseconds'):
            this.code = 'tmr.delayms(' + delay + ')\r\n';
            break;
        case localize('microseconds'):
            this.code = 'tmr.delayus(' + delay + ')\r\n';
            break;
        case localize('seconds'):
        default:
            this.code = 'tmr.delayms(' + delay + ' * 1000)\r\n';
            break;
    }
};


//// Operators

LuaExpression.prototype.reportSum = function (a, b) {
    this.code = '(' + a + ' + ' + b + ')';
};

LuaExpression.prototype.reportDifference = function (a, b) {
    this.code = '(' + a + ' - ' + b + ')';
};

LuaExpression.prototype.reportProduct = function (a, b) {
    this.code = '(' + a + ' * ' + b + ')';
};

LuaExpression.prototype.reportQuotient = function (a, b) {
    this.code = '(' + a + ' / ' + b + ')';
};

LuaExpression.prototype.reportModulus = function (a, b) {
    this.code = '(' + a + ' % ' + b + ')';
};

LuaExpression.prototype.reportMonadic = function (func, a) {
    var specialFunctions = { 
        ln: 'math.log',
        log: 'math.log10',
        'e^': 'math.exp',
        '10^': '10^'
    };

    specialFunctions[localize('abs')] = 'math.abs';
    specialFunctions[localize('floor')] = 'math.floor';
    specialFunctions[localize('sqrt')] = 'math.sqrt';

    this.code = '(';

    if (specialFunctions.hasOwnProperty(func)) {
        this.code += specialFunctions[func];
    } else {
        this.code += 'math.' + func;
    }

    this.code += '(' + a + '))';
};

LuaExpression.prototype.reportRandom = function (a, b) {
    this.code = '(math.random(' + a + ',' + b + '))';
};

LuaExpression.prototype.reportLessThan = function (a, b) {
    this.code = '(toNumber(' + a + ') < toNumber(' + b + '))';
};

LuaExpression.prototype.reportEquals = function (a, b) {
    this.code = '(' + luaAutoEscape(a) + ' == ' + luaAutoEscape(b) + ')';
};

LuaExpression.prototype.reportGreaterThan = function (a, b) {
    this.code = '(toNumber(' + a + ') > toNumber(' + b + '))';
};

LuaExpression.prototype.reportAnd = function (a, b) {
    this.code = '(toDigital(' + a + ') and toDigital(' + b +'))';
};

LuaExpression.prototype.reportOr = function (a, b) {
    this.code = '(toDigital(' + a + ') or toDigital( ' + b + '))';
};

LuaExpression.prototype.reportNot = function (a) {
    this.code = '(not (toDigital(' + a + ')))';
};

LuaExpression.prototype.reportTrue = function () {
    this.code = 'true';
};

LuaExpression.prototype.reportFalse = function () {
    this.code = 'false';
};

LuaExpression.prototype.reportJoinWords = function () {
    var myself = this;

    this.code = '(""';

    Array.prototype.slice.call(arguments).forEach(function(eachWord) {
        myself.code += '..' + luaAutoEscape(eachWord);
    });

    this.code += ')';
};

LuaExpression.prototype.reportTimer = function() {
    this.code = '(os.clock())';
}

LuaExpression.prototype.runLua = function(code) {
    this.code = 'local f = (function() ' + code + ' end)(); if (f) then prints("\\r\\npb:' + this.topBlock.thread.id + ':" .. f .. ":\\r\\n") end;\r\n';
};

//// Data

LuaExpression.prototype.doSetVar = function(varName, value) {
    this.code = 'local v = ' + luaAutoEscape(value) + '; vars.' + varName + ' = v; prints("\\r\\nvv:'
            + varName + ':"..printVar(v)..":\\r\\n")\r\n';
};

LuaExpression.prototype.doChangeVar = function(varName, delta) {
    this.code = 'vars.' + varName + ' = vars.' + varName + ' + ' + delta
        + '; prints("\\r\\nvv:' + varName + ':"..printVar(vars.' + varName + ')..":\\r\\n")\r\n';
};

LuaExpression.prototype.reportGetVar = function() {
    this.code = 'vars.' + this.topBlock.blockSpec;
};

LuaExpression.prototype.reportGetMessage = function() {
    this.code = 'msg.' + this.topBlock.blockSpec;
};

LuaExpression.prototype.reportNewList = function() {
    var myself = this;

    this.code = '(function() local l={';
    Array.prototype.slice.call(arguments).forEach(function(eachItem) {
        myself.code += luaAutoEscape(eachItem) + ',';
    });
    this.code += '}; l.length = ' + arguments.length + '; return l; end)()';
};

LuaExpression.prototype.reportListItem = function(index, list) {
    this.code = '(' + list + '[' + index + '])';
};

LuaExpression.prototype.reportListLength = function(list) {
    this.code = '((' + list + ').length)';
};

LuaExpression.prototype.reportListContainsItem = function(list, item) {
    this.code = '(function() local l = ' + list + '; for i=1,l.length do if (l[i] == ' + luaAutoEscape(item) + ') then return(true) end end return false end)()';
};

LuaExpression.prototype.addListItem = function(item, list) {
    this.code = list + '[' + list + '.length + 1] = ' + luaAutoEscape(item) + '; ' + list + '.length = ' + list + '.length + 1\n\r';
};

LuaExpression.prototype.deleteListItem = function(index, list) {
    this.code = 'if (toNumber( ' + index + ') <= ' + list + '.length and toNumber(' + index + ') > 0) then for i = toNumber(' + index + '),'
        + list + '.length - 1 do ' + list + '[i] = ' + list + '[i + 1] end; ' + list + '[' + list + '.length] = nil; ' + list + '.length = ' + list
        + '.length - 1; end\n\r';
};

LuaExpression.prototype.insertListItem = function(item, index, list) {
    this.code = 'if (toNumber(' + index + ') <= ' + list + '.length and toNumber(' + index + ') > 0) then for i = ' 
        + list + '.length, toNumber(' + index + '),-1 do ' + list + '[i + 1] = ' + list + '[i] end; ' + list + 
        '[toNumber(' + index + ')] = ' + luaAutoEscape(item) + '; ' + list + '.length = ' + list + '.length + 1; end\n\r';
};

LuaExpression.prototype.replaceListItem = function(index, list, item) {
    this.code = list + '[toNumber(' + index + ')] = ' + luaAutoEscape(item) + '\n\r';
};

//// Input/Output

LuaExpression.prototype.setPinDigital = function(pinNumber, value) {
    var pin = BoardMorph.pinOut.digital[pinNumber];
    // pio.OUTPUT is 0
    this.code =  'setPinConfig(' + pinNumber + ', ' + pin + ', "d", 0); prints("\\r\\npv:' + pinNumber + ':".. tostring(toDigital(' + value + '))..":\\r\\n"); pio.pin.setval(digitalToNumber(toDigital(' + value + ')), ' + pin + ')\r\n';
    this.board.updatePinConfig(pinNumber, 'o', 'd');
};

LuaExpression.prototype.getPinDigital = function(pinNumber) {
    // We need to wrap this one into a lambda, because it needs to first set the pin direction before reporting its value
    // pio.INPUT is 1
    var pin = BoardMorph.pinOut.digital[pinNumber];
    this.code = '(function() setPinConfig(' + pinNumber + ', ' + pin + ', "d", 1); local v = pio.pin.getval(' + pin + '); prints("\\r\\npv:' + pinNumber + ':"..v..":\\r\\n"); return v; end)()\r\n';
    this.board.updatePinConfig(pinNumber, 'i', 'd');
};

LuaExpression.prototype.setPinAnalog = function(pinNumber, value) {
    var pin = BoardMorph.pinOut.pwm[pinNumber];
    this.code = 'setPinConfig(' + pinNumber + ', ' + pin + ', "a", 0); local v = toNumber(' + value + '); pwm.write(' + pin + ', v); prints("\\r\\npv:' + pinNumber + ':"..v..":\\r\\n");\r\n';
    this.board.updatePinConfig(pinNumber, 'o', 'a');
};

LuaExpression.prototype.getPinAnalog = function(pinNumber) {
    // We need to wrap this one into a lambda, because it needs to first setup ADC before reporting its value
    var pin = BoardMorph.pinOut.analog[pinNumber];
    this.code = '(function() setPinConfig(' + pinNumber + ', ' + pin + ', "a", 1); local v = cfg.p[' + pinNumber + '][3]:read(); prints("\\r\\npv:' + pinNumber + ':"..v..":\\r\\n"); return v; end)()'
    this.board.updatePinConfig(pinNumber, 'i', 'a');
};

LuaExpression.prototype.setServo = function(pinNumber, value) {
    var pin = BoardMorph.pinOut.pwm[pinNumber],
        rawValue;

    switch (value) {
        case localize('clockwise'):
            rawValue = 1200;
            break;
        case localize('counter-clockwise'):
            rawValue = 1800;
            break;
        case localize('stopped'):
            rawValue = 1500;
        default:
            rawValue = 'toNumber(' + value + ')';
            break;
    }

    this.code 
            = 'setPinConfig(' + pinNumber + ', ' + pin + ', "s", 0); local v = ' + rawValue 
            + '; if (v <= 180) then v = v / 180 * 1820 + 580; end; pwm.setduty(' + pin + ', v / 20000);\r\n'
}

//// Comm

LuaExpression.prototype.subscribeToMQTTmessage = function(upvar, topic, body) {
    if (!body) { return };
    this.code 
            = 'prints("\\r\\ndt:' + this.topBlock.thread.id + '::\\r\\n"); local subscribed = (cfg.callback' + this.topBlock.thread.id
            + ' ~= nil); cfg.callback' + this.topBlock.thread.id + ' = (function(l, p) msg.' + upvar + ' = p; prints("\\r\\nrt:'
            + this.topBlock.thread.id + ':"..p..":\\r\\n"); ' + body + 'prints("\\r\\ndt:' + this.topBlock.thread.id
            + ':"..p..":\\r\\n"); end); if (not subscribed) then cfg.m:subscribe(' + luaAutoEscape(topic) + ', mqtt.QOS0, function(l, p) cfg.callback' 
            + this.topBlock.thread.id + '(l, p) end) end\r\n';
};

LuaExpression.prototype.publishMQTTmessage = function(message, topic) {
    this.code
            = 'cfg.m:publish(' + luaAutoEscape(topic) + ', ' + luaAutoEscape(message) + ', mqtt.QOS0)\r\n'
};


// Dialog that lets us configure an Internet connection

var InternetDialogMorph;

InternetDialogMorph.prototype = new DialogBoxMorph();
InternetDialogMorph.prototype.constructor = InternetDialogMorph;
InternetDialogMorph.uber = DialogBoxMorph.prototype;

function InternetDialogMorph(target, action, environment) {
    this.init(target, action, environment);
};

InternetDialogMorph.prototype.init = function (target, action, environment) {
    var myself = this;

    // initialize inherited properties:
    InternetDialogMorph.uber.init.call(
        this,
        target,
        action,
        environment
    );

    this.labelString = localize('Connect to the Internet');
    this.createLabel();

    this.addBody(new AlignmentMorph('column', 4));
    this.body.alignment = 'left';

    this.interfaceRow = new AlignmentMorph('row', this.padding);

    // For now we're only supporting DHCP, so these are not yet relevant

    /*
    this.methodRow = new AlignmentMorph('row', this.padding);
    this.ipRow = new AlignmentMorph('row', this.padding);
    this.gatewayRow = new AlignmentMorph('row', this.padding);
    this.maskRow = new AlignmentMorph('row', this.padding);
    */

    this.createInterfaceRow();

    /*
    this.createMethodRow();
    this.createIpRow();
    this.createGatewayRow();
    this.createMaskRow();
    */

    this.body.add(this.interfaceRow);

    /*
    this.body.add(this.methodRow);
    this.body.add(this.ipRow);
    this.body.add(this.gatewayRow);
    this.body.add(this.maskRow);
    */

    this.reactToChoice = function(choice) {
        if (choice == 'gprs') {
            if (!myself.apnRow) {
                myself.apnRow = new AlignmentMorph('row', this.padding);
                myself.pinRow = new AlignmentMorph('row', this.padding);
                myself.createApnRow();
                myself.createPinRow();
                myself.body.add(myself.apnRow);
                myself.body.add(myself.pinRow);
                myself.body.drawNew();
                myself.body.fixLayout();
                myself.drawNew();
                myself.fixLayout();
            }
        } else {
            if (myself.apnRow) {
                myself.apnRow.destroy();
                myself.pinRow.destroy();
                myself.apnRow = null;
                myself.pinRow = null;
                myself.body.drawNew();
                myself.body.fixLayout();
                myself.drawNew();
                myself.fixLayout();
            }
        }
    };

    this.body.drawNew();
    this.body.fixLayout();

    this.addButton('ok', 'Ok');
    this.addButton('cancel', 'Cancel');

    this.fixLayout();
    this.drawNew();
};

InternetDialogMorph.prototype.createApnRow = function() {
    this.apnField = new InputFieldMorph(this.target.internet.apn || '');
    this.apnRow.add(new TextMorph(localize('APN:')));
    this.apnRow.add(this.apnField);
    this.apnRow.fixLayout();
};

InternetDialogMorph.prototype.createPinRow = function() {
    this.pinField = new InputFieldMorph(this.target.internet.pin || 0000);
    this.pinRow.add(new TextMorph(localize('PIN:')));
    this.pinRow.add(this.pinField);
    this.pinRow.fixLayout();
};


InternetDialogMorph.prototype.createInterfaceRow = function() {
    this.interfaceField = new InputFieldMorph(this.target.internet.interface || {ethernet: 'en'}, false, {'ethernet':'en', 'GPRS':'gprs'}, true);
    this.interfaceRow.add(new TextMorph(localize('Interface:')));
    this.interfaceRow.add(this.interfaceField);
    this.interfaceRow.fixLayout();
};

InternetDialogMorph.prototype.ok = function() {
    this.target.internet.interface = this.interfaceField.getValue();

    if (this.apnField) {
        this.target.internet.apn = this.apnField.getValue();
        this.target.internet.pin = this.pinField.getValue();
    }

    this.target.configureInternet();
    this.accept();
};

// Dialog that lets us configure an MQTT broker connection

var MQTTDialogMorph;

MQTTDialogMorph.prototype = new DialogBoxMorph();
MQTTDialogMorph.prototype.constructor = MQTTDialogMorph;
MQTTDialogMorph.uber = DialogBoxMorph.prototype;

function MQTTDialogMorph(target, action, environment) {
    this.init(target, action, environment);
};

MQTTDialogMorph.prototype.init = function (target, action, environment) {
    // initialize inherited properties:
    MQTTDialogMorph.uber.init.call(
        this,
        target,
        action,
        environment
    );

    this.labelString = localize('Connect to MQTT broker');
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
    this.urlRow.add(new TextMorph(localize('Broker url:')));
    this.urlRow.add(this.urlField);
    this.urlRow.fixLayout();
};

MQTTDialogMorph.prototype.createPortRow = function() {
    this.portRow.add(new TextMorph(localize('Port:')));
    this.portField = new InputFieldMorph(this.target.broker.port || '1883');
    this.portRow.add(this.portField);
    this.portRow.fixLayout();
};

MQTTDialogMorph.prototype.createIdRow = function() {
    this.idField = new InputFieldMorph(this.target.broker.deviceID || ('WhiteCat' + Math.floor(Math.random() * 100)));
    this.idRow.add(new TextMorph(localize('Board ID:')));
    this.idRow.add(this.idField);
    this.idRow.fixLayout();
};

MQTTDialogMorph.prototype.createUsernameRow = function() {
    this.usernameField = new InputFieldMorph(this.target.broker.username || '');
    this.usernameRow.add(new TextMorph(localize('Username:')));
    this.usernameRow.add(this.usernameField);
    this.usernameRow.fixLayout();
};

MQTTDialogMorph.prototype.createPasswordRow = function() {
    this.passwordField = new InputFieldMorph(this.target.broker.password || '');
    this.passwordField.contents().text.toggleIsPassword(); 
    this.passwordRow.add(new TextMorph(localize('Password:')));
    this.passwordRow.add(this.passwordField);
    this.passwordRow.fixLayout();
};

MQTTDialogMorph.prototype.ok = function() {
    this.target.configureBroker(this.urlField.getValue(), this.portField.getValue(), this.idField.getValue(), this.usernameField.getValue(), this.passwordField.getValue());
    this.accept();
};
