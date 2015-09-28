serialLib = require('serialport');
SerialPort = serialLib.SerialPort;
serialPort = new SerialPort('/dev/ttyUSB0', { baudrate: 115200 });

serialPort.on('open', function () {
    serialPort.on('data', function(data) {
        console.log('data received: ' + data);
    });
});
