/*
serialLib = require('serialport');
SerialPort = serialLib.SerialPort;
serialPort = new SerialPort('/dev/ttyUSB0', { baudrate: 115200 });

serialPort.on('open', function () {
    serialPort.on('data', function(data) {
        console.log('data received: ' + data);
    });
});
*/
var Coroutine;

Coroutine.prototype = {};
Coroutine.prototype.constructor = Coroutine;
Coroutine.uber = Object.prototype;

function Coroutine(id, body) {
    this.init(id, body);
}

Coroutine.prototype.init = function(id, body) {
    this.id = id;
    this.body = 'co' + id  + ' = ' + this.wrap(body);
}

Coroutine.prototype.wrap = function(body) {
    return 'coroutine.create(function()\n\t' + body + '\nend)';
}

// LuaExpression 

var LuaExpression;
LuaExpression.prototype = {};
LuaExpression.prototype.constructor = LuaExpression;
LuaExpression.uber = Object.prototype;

function LuaExpression(block) {
    this.init(block)
}

LuaExpression.prototype.init = function(block) {
    var args = [];
    block.inputs().forEach(function(input){
        // If input is an InputSlotMorph, get its contents
        // Otherwise, it's a reporter, so we need to translate it into a LuaExpression 
        if (input instanceof InputSlotMorph) {
            args.push(input.contents().text)
        } else {
            // ToDo!
            // args.push()
        }
    });
    this.block = block;
    this.opening = '';
    this.body = '';
    this.closing = '';

    this[block.selector].apply(this, args);
}

LuaExpression.prototype.doForever = function (body) {
    this.opening = 'while (true) do\n';
    // do something with body?
    this.closing = 'end';
};

LuaExpression.prototype.reportSum = function (a, b) {
    this.opening = a;
    this.body = ' + ';
    this.closing = b;
}

LuaExpression.prototype.toString = function() {
    return this.opening + this.body + this.closing;
}
