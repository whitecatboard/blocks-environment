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

Coroutine.prototype = new Object();
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
