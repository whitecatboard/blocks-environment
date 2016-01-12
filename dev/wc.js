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

            The format is pb:[ID]:[data], where ID is the thread ID, or 'r' in
            case it's just a reporter that got clicked.

    pv  → Pin Value. We should update some value in the board watcher.

    rt  → Runnning Thread. A thread has just come alive.

            The format is rc:[ID]:[data], where data is optional. This
            thread should be highlighted and possibly do something with
            the data it has just received.

    dt  → Dead Thread. A thread has ended.

            The format is dc:[ID]:[data], where data is optional. This
            thread should be un-highlighted and possibly do something with
            the data it has just received.
*/

// Global utils

debugMode = true;

log = function(d) {
    if (!debugMode) { return }
    print = {
        'darwin' : function(d) { process.stdout.write(d + '\n') },
        'win32'  : function(d) { console.log(d) },
        'linux'  : function(d) { process.stdout.write(d + '\n') }
    }
    print[process.platform](d);
};

function toLuaDigital(val) {
    // makes sure val is understood as a boolean by Lua
    return '((' + val + ' == true or ' + val + ' == 1) and 1 or 0)'
};

function toLuaNumber(val) {
    return '(' + val + ' + 0)';
};

function luaVarToString(varName) {
    return '(function() if (type(' + varName + ') == "string") then return ' + varName 
            + ' elseif (type(' + varName + ') == "table") then return ' + luaTableVarToString(varName)
            + ' else return tostring(' + varName + ') end end)()';
};

function luaTableVarToString(varName) {
    return '(function() local s = "List("; for i=1,' + varName + '.length do s = s..' + varName + '[i]..", " end; return(string.sub(s,0,-3)..")") end)()'
}

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
    return 'function()\r\n\tprint("\\r\\nrt:' + this.id + ':\\r\\n")\r\n\t' + body + '\r\n\tprint("\\r\\ndt:' + this.id + ':\\r\\n")\r\nend\r\n';
};

Thread.prototype.start = function() {
    return 't_' + this.id + ' = thread.start(t' + this.id + ')\r\n'
};
/*
Thread.prototype.suspend = function() {
    return 'if (thread.status(t_' + this.id + ' or -1)) then thread.suspend(t_' + this.id + ') end\r\n'
};

Thread.prototype.resume = function() {
    return 'if (thread.status(t_' + this.id + ' or -1)) then thread.resume(t_' + this.id + ') end\r\n'
};
*/
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
            args.push(new LuaExpression(input.nestedBlock(), board));
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
    this.code = 'while (true) do\r\n' + body + 'end\r\n';
};

LuaExpression.prototype.doRepeat = function (times, body) {
    this.code = 'for i=1,' + times + ' do\r\n' + body + 'end\r\n';
};

// Conditionals

LuaExpression.prototype.doIf = function (condition, body) {
    this.code = 'if ' + condition + ' then\r\n' + body + '\r\nend\r\n';
};

LuaExpression.prototype.doIfElse = function (condition, ifTrue, ifFalse) {
    this.code = 'if ' + condition + ' then\r\n' + ifTrue + '\r\nelse\r\n' + ifFalse + '\r\nend\r\n';
};

// Others

LuaExpression.prototype.doReport = function (body) {
    this.code = 'local result = ' + body + '; print("\\r\\npb:' + this.topBlock.thread.id + ':"..' + luaVarToString('body') + '); return result\r\n';
};

LuaExpression.prototype.doWait = function (secs) {
    this.code = 'tmr.delayms(' + secs + ' * 1000)\r\n'
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
    var specialFunctions = { ln: 'math.log', log: 'math.log10', 'e^': 'math.exp', '10^': '10^' };

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
    this.code = '(' + toLuaNumber(a) + ' < ' + toLuaNumber(b) + ')';
};

LuaExpression.prototype.reportEquals = function (a, b) {
    this.code = '(' + a + ' == ' + b + ')';
};

LuaExpression.prototype.reportGreaterThan = function (a, b) {
    this.code = '(' + toLuaNumber(a) + ' > ' + toLuaNumber(b) + ')';
};

LuaExpression.prototype.reportAnd = function (a, b) {
    this.code = '(' + toLuaDigital(a) + ' and ' + toLuaDigital(b) + ')';
};

LuaExpression.prototype.reportOr = function (a, b) {
    this.code = '(' + toLuaDigital(a) + ' or ' + toLuaDigital(b) + ')';
};

LuaExpression.prototype.reportNot = function (a) {
    this.code = '(not ' + toLuaDigital(a) + ')';
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

LuaExpression.prototype.runLua = function(code) {
    this.code = 'local f = (function() ' + code + ' end)(); if (f) then print("\\r\\npb:' + this.topBlock.thread.id + ':" .. f .. "\\r\\n") end;\r\n';
};

//// Data

LuaExpression.prototype.doSetVar = function(varName, value) {
    this.code = 'local v = ' + luaAutoEscape(value) + '; vars.' + varName + ' = v; print("\\r\\nvv:'
            + varName + ':"..' + luaVarToString('v') + '.."\\r\\n")\r\n';
};

LuaExpression.prototype.doChangeVar = function(varName, delta) {
    this.code = 'vars.' + varName + ' = vars.' + varName + ' + ' + delta
        + '; print("\\r\\nvv:' + varName + ':"..' + luaVarToString('vars.' + varName) + '.."\\r\\n")\r\n';
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
    this.code = 'if (' + toLuaNumber(index) + ' <= ' + list + '.length and ' + toLuaNumber(index) + ' > 0) then for i = ' + toLuaNumber(index) + ','
        + list + '.length - 1 do ' + list + '[i] = ' + list + '[i + 1] end; ' + list + '[' + list + '.length] = nil; ' + list + '.length = ' + list
        + '.length - 1; end\n\r';
};

LuaExpression.prototype.insertListItem = function(item, index, list) {
    this.code = 'if (' + toLuaNumber(index) + ' <= ' + list + '.length and ' + toLuaNumber(index) + ' > 0) then for i = ' + list + '.length,'
        + toLuaNumber(index) + ',-1 do ' + list + '[i + 1] = ' + list + '[i] end; ' + list + '[' + toLuaNumber(index) + '] = ' + luaAutoEscape(item) + '; '
        + list + '.length = ' + list + '.length + 1; end\n\r';
};

LuaExpression.prototype.replaceListItem = function(index, list, item) {
    this.code = list + '[' + toLuaNumber(index) + '] = ' + luaAutoEscape(item) + '\n\r';
};

//// Input/Output

LuaExpression.prototype.setDigitalPinConfig = function(pinNumber, pin, direction) {
    return 'if (cfg and (cfg.p[' + pinNumber + '] == nil or cfg.p[' + pinNumber + '][1] ~= "d" or cfg.p[' + pinNumber + '][2] ~= ' + direction + ')) then cfg.p[' + pinNumber + '] = {"d", ' + direction + '}; pwm.stop(' + BoardMorph.pinOut.pwm[pinNumber] + '); pio.pin.setdir(' + direction + ', pio.' + pin + '); end; '
};

LuaExpression.prototype.setPinDigital = function(pinNumber, value) {
    var pin = BoardMorph.pinOut.digital[pinNumber];
    // pio.OUTPUT is 0
    this.code =  this.setDigitalPinConfig(pinNumber, pin, 0) + 'print("\\r\\npv:' + pinNumber + ':"..' + toLuaDigital(value) + '.."\\r\\n"); pio.pin.setval(' + toLuaDigital(value) + ', pio.' + pin + ')\r\n';
    this.board.updatePinConfig(pinNumber, 'o', 'd');
};

LuaExpression.prototype.getPinDigital = function(pinNumber) {
    // We need to wrap this one into a lambda, because it needs to first set the pin direction before reporting its value
    // pio.INPUT is 1
    var pin = BoardMorph.pinOut.digital[pinNumber];
    this.code = '(function() ' + this.setDigitalPinConfig(pinNumber, pin, 1) + ' local v = pio.pin.getval(pio.' + pin + '); print("\\r\\npv:' + pinNumber + ':"..v.."\\r\\n"); return v; end)()\r\n';
    this.board.updatePinConfig(pinNumber, 'i', 'd');
};

LuaExpression.prototype.setPWMPinConfig = function(pinNumber, pin) {
    return 'if (cfg.p[' + pinNumber +'] == nil or cfg.p[' + pinNumber + '][1] ~= "a" or cfg.p[' + pinNumber + '][2] ~= 0) then cfg.p[' + pinNumber + '] = {"a", 0}; pwm.setup(' + pin +', pwm.DAC, 8, 0); end; '
};

LuaExpression.prototype.setPinAnalog = function(pinNumber, value) {
    var pin = BoardMorph.pinOut.pwm[pinNumber];
    this.code = this.setPWMPinConfig(pinNumber, pin) + 'local v = ' + toLuaNumber(value) + '; pwm.write(' + pin + ', v); print("\\r\\npv:' + pinNumber + ':"..v.."\\r\\n");\r\n';
    this.board.updatePinConfig(pinNumber, 'o', 'a');
};

LuaExpression.prototype.getPinAnalog = function(pinNumber) {
    // We need to wrap this one into a lambda, because it needs to first setup ADC before reporting its value
    var pin = BoardMorph.pinOut.analog[pinNumber];
    this.code = '(function() if (cfg) then cfg.p[' + pinNumber + '] = {"a", 1} end local v = adc.setup(adc.ADC1, adc.AVDD, 3220); v = v:setupchan(12, ' + pin + '); v = v:read(); print("\\r\\npv:' + pinNumber + ':"..v.."\\r\\n"); return v; end)()'
    this.board.updatePinConfig(pinNumber, 'i', 'a');
};

//// Comm

LuaExpression.prototype.assertInternet = function() {
    return 'if (not cfg.i) then cfg.i = net.start("en") end\r\n'
};

LuaExpression.prototype.assertMQTT = function() {
    return this.assertInternet() + 'if (cfg.m == nil) then ' + this.board.mqttConnectionCode() + ' end\r\n';
};

LuaExpression.prototype.subscribeToMQTTmessage = function(upvar, topic, body) {
    if (!body) { return };
    this.code 
        = 'print("\\r\\ndt:' + this.topBlock.thread.id + ':\\r\\n"); ' + this.assertMQTT() + 'cfg.m:subscribe(' + luaAutoEscape(topic) 
        + ', mqtt.QOS0, (function(l, p) msg.' + upvar + ' = p; print("\\r\\nrt:' + this.topBlock.thread.id + ':"..p.."\\r\\n");' + body + 'print("\\r\\ndt:' + this.topBlock.thread.id + ':"..p.."\\r\\n"); end))\r\n';
};

LuaExpression.prototype.publishMQTTmessage = function(message, topic) {
    this.code
        = this.assertMQTT() + 'cfg.m:publish(' + luaAutoEscape(topic) 
        + ', ' + luaAutoEscape(message) + ', mqtt.QOS0)\r\n'
};


// Dialog that lets us connect to an MQTT broker

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
};

MQTTDialogMorph.prototype.createPortRow = function() {
    this.portRow.add(new TextMorph('Port:'));
    this.portField = new InputFieldMorph(this.target.broker.port || '1883');
    this.portRow.add(this.portField);
    this.portRow.fixLayout();
};

MQTTDialogMorph.prototype.createIdRow = function() {
    this.idField = new InputFieldMorph(this.target.broker.deviceID || ('WhiteCat' + Math.floor(Math.random() * 100)));
    this.idRow.add(new TextMorph('Board ID:'));
    this.idRow.add(this.idField);
    this.idRow.fixLayout();
};

MQTTDialogMorph.prototype.createUsernameRow = function() {
    this.usernameField = new InputFieldMorph(this.target.broker.username || '');
    this.usernameRow.add(new TextMorph('username:'));
    this.usernameRow.add(this.usernameField);
    this.usernameRow.fixLayout();
};

MQTTDialogMorph.prototype.createPasswordRow = function() {
    this.passwordField = new InputFieldMorph(this.target.broker.password || '');
    this.passwordField.contents().text.toggleIsPassword(); 
    this.passwordRow.add(new TextMorph('Password:'));
    this.passwordRow.add(this.passwordField);
    this.passwordRow.fixLayout();
};

MQTTDialogMorph.prototype.ok = function() {
    this.target.broker = {
        url: this.urlField.getValue(),
        port: this.portField.getValue(),
        deviceID: this.idField.getValue(),
        username: this.usernameField.getValue(),
        password: this.passwordField.getValue()
    };
    this.accept();
};
