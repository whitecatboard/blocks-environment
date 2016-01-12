/*
    based on Snap! by Jens Mönig
    jens@moenig.org

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

var BoardMorph;
var BoardBubbleMorph;
var WatcherMorph;

// BoardMorph /////////////////////////////////////////////////////////

// I am a scriptable object

// BoardMorph inherits from Morph:

BoardMorph.prototype = new Morph();
BoardMorph.prototype.constructor = BoardMorph;
BoardMorph.uber = Morph.prototype;

// BoardMorph settings

BoardMorph.prototype.categories =
    [
        'control',
        'operators',
        'data',
        'input / output',
        'comm',
        'custom blocks'
    ];

BoardMorph.prototype.blockColor = {
    control : new Color(230, 168, 34),
    operators : new Color(98, 194, 19),
    data : new Color(243, 118, 29),
    'input / output' : new Color(207, 74, 217),
    comm: new Color(80, 180, 255),
    'custom blocks' : new Color(150, 150, 150)
};

BoardMorph.prototype.paletteColor = new Color(255, 255, 230);
BoardMorph.prototype.paletteTextColor = new Color(255, 255, 250);
BoardMorph.prototype.sliderColor
    = BoardMorph.prototype.paletteColor.lighter(30);
BoardMorph.prototype.isCachingPrimitives = true;

BoardMorph.prototype.initBlocks = function () {
    BoardMorph.prototype.blocks = {
        // Control
        receiveGo: {
            type: 'hat',
            category: 'control',
            spec: 'when %greenflag clicked'
        },
        doWait: {
            type: 'command',
            category: 'control',
            spec: 'wait %n secs',
            defaults: [1]
        },
        doWaitUntil: {
            type: 'command',
            category: 'control',
            spec: 'wait until %b'
        },
        doForever: {
            type: 'command',
            category: 'control',
            spec: 'forever %c'
        },
        doRepeat: {
            type: 'command',
            category: 'control',
            spec: 'repeat %n %c',
            defaults: [10]
        },
        doIf: {
            type: 'command',
            category: 'control',
            spec: 'if %s %c'
        },
        doIfElse: {
            type: 'command',
            category: 'control',
            spec: 'if %s %c else %c'
        },
        doStopThis: {
            type: 'command',
            category: 'control',
            spec: 'stop %stopChoices'
        },
        doStopOthers: {
            type: 'command',
            category: 'control',
            spec: 'stop %stopOthersChoices'
        },
        doRun: {
            type: 'command',
            category: 'control',
            spec: 'run %cmdRing %inputs'
        },
        fork: {
            type: 'command',
            category: 'control',
            spec: 'launch %cmdRing %inputs'
        },
        evaluate: {
            type: 'reporter',
            category: 'control',
            spec: 'call %repRing %inputs'
        },
        doReport: {
            type: 'command',
            category: 'control',
            spec: 'report %s'
        },
        // Operators
        reifyScript: {
            type: 'ring',
            category: 'custom blocks',
            spec: '%rc %ringparms',
            alias: 'command ring lambda'
        },
        reifyReporter: {
            type: 'ring',
            category: 'custom blocks',
            spec: '%rr %ringparms',
            alias: 'reporter ring lambda'
        },
        reportSum: {
            type: 'reporter',
            category: 'operators',
            spec: '%n + %n'
        },
        reportDifference: {
            type: 'reporter',
            category: 'operators',
            spec: '%n \u2212 %n',
            alias: '-'
        },
        reportProduct: {
            type: 'reporter',
            category: 'operators',
            spec: '%n \u00D7 %n',
            alias: '*'
        },
        reportQuotient: {
            type: 'reporter',
            category: 'operators',
            spec: '%n / %n' // '%n \u00F7 %n'
        },
        reportMonadic: {
            type: 'reporter',
            category: 'operators',
            spec: '%fun of %n',
            defaults: [null, 10]
        },
        reportModulus: {
            type: 'reporter',
            category: 'operators',
            spec: '%n mod %n'
        },
        reportRandom: {
            type: 'reporter',
            category: 'operators',
            spec: 'pick random %n to %n',
            defaults: [1, 10]
        },
        reportLessThan: {
            type: 'reporter',
            category: 'operators',
            spec: '%n < %n'
        },
        reportEquals: {
            type: 'reporter',
            category: 'operators',
            spec: '%s = %s'
        },
        reportGreaterThan: {
            type: 'reporter',
            category: 'operators',
            spec: '%n > %n'
        },
        reportAnd: {
            type: 'reporter',
            category: 'operators',
            spec: '%s and %s'
        },
        reportOr: {
            type: 'reporter',
            category: 'operators',
            spec: '%s or %s'
        },
        reportNot: {
            type: 'reporter',
            category: 'operators',
            spec: 'not %s'
        },
        reportTrue: {
            type: 'reporter',
            category: 'operators',
            spec: 'true'
        },
        reportFalse: {
            type: 'reporter',
            category: 'operators',
            spec: 'false'
        },
        reportJoinWords: {
            type: 'reporter',
            category: 'operators',
            spec: 'join %words',
            defaults: [localize('hello') + ' ', localize('world')]
        },
        runLua: {
            type: 'command',
            category: 'operators',
            spec: 'run lua %s',
            defaults: ['return net.stat()']
        },

        // Variables
        doSetVar: {
            type: 'command',
            category: 'data',
            spec: 'set %var to %s',
            defaults: [null, 0]
        },
        doChangeVar: {
            type: 'command',
            category: 'data',
            spec: 'change %var by %n',
            defaults: [null, 1]
        },
        // Lists
        reportNewList: {
            type: 'reporter',
            category: 'data',
            spec: 'list %exp'
        },
        reportListItem: {
            type: 'reporter',
            category: 'data',
            spec: 'item %s of %l'
        },
        reportListLength: {
            type: 'reporter',
            category: 'data',
            spec: 'length of %l'
        },
        reportListContainsItem: {
            type: 'reporter',
            category: 'data',
            spec: '%l contains %s ?',
            defaults: [null, 'thing']
        },
        addListItem: {
            type: 'command',
            category: 'data',
            spec: 'add %s to %l',
            defaults: ['thing']
        },
        deleteListItem: {
            type: 'command',
            category: 'data',
            spec: 'delete item %n of %l',
            defaults: [1, null]
        },
        insertListItem: {
            type: 'command',
            category: 'data',
            spec: 'insert %s at %n of %l',
            defaults: ['thing', 1, null]
        },

        replaceListItem: {
            type: 'command',
            category: 'data',
            spec: 'replace item %n of %l with %s',
            defaults: [1, null, 'thing']
        },

        // Input/Output
        setPinDigital: {
            type: 'command',
            category: 'input / output',
            spec: 'set pin %digitalPin to digital %s',
            defaults: [14, true]
        },
        setPinAnalog: {
            type: 'command',
            category: 'input / output',
            spec: 'set pin %pwmPin to analog %s',
            defaults: [10, 128]
        },
        getPinDigital: {
            type: 'reporter',
            category: 'input / output',
            spec: 'get digital value from pin %digitalPin',
            defaults: [16]
        },
        getPinAnalog: {
            type: 'reporter',
            category: 'input / output',
            spec: 'get analog value from pin %analogPin',
            defaults: [11]
        },
        // Comm
        subscribeToMQTTmessage: {
            type: 'hat',
            category: 'comm',
            spec: 'when I receive %upvar at topic %s',
            defaults: ['message', '/test']
        },
        publishMQTTmessage: {
            type: 'command',
            category: 'comm',
            spec: 'broadcast %s at topic %s',
            defaults: ['hello network', '/test']
        }
    };
};

BoardMorph.prototype.initBlocks();

BoardMorph.prototype.initBlockMigrations = function () {
    BoardMorph.prototype.blockMigrations = {
        doStopAll: {
            selector: 'doStopThis',
            inputs: [['all']]
        },
        doStop: {
            selector: 'doStopThis',
            inputs: [['this script']]
        },
        doStopBlock: {
            selector: 'doStopThis',
            inputs: [['this block']]
        }
    };
};

BoardMorph.prototype.initBlockMigrations();

BoardMorph.prototype.blockAlternatives = {
    // control:
    doIf: ['doIfElse', 'doUntil'],
    doIfElse: ['doIf', 'doUntil'],

    // operators:
    reportSum: ['reportDifference', 'reportProduct', 'reportQuotient'],
    reportDifference: ['reportSum', 'reportProduct', 'reportQuotient'],
    reportProduct: ['reportDifference', 'reportSum', 'reportQuotient'],
    reportQuotient: ['reportDifference', 'reportProduct', 'reportSum'],
    reportLessThan: ['reportEquals', 'reportGreaterThan'],
    reportEquals: ['reportLessThan', 'reportGreaterThan'],
    reportGreaterThan: ['reportEquals', 'reportLessThan'],
    reportAnd: ['reportOr'],
    reportOr: ['reportAnd'],
    reportTrue: ['reportFalse'],
    reportFalse: ['reportTrue'],

    // variables
    doSetVar: ['doChangeVar'],
    doChangeVar: ['doSetVar'],

    // input / output
    setPinDigital: ['setPinAnalog'],
    setPinAnalog: ['setPinDigital'],
    getPinDigital: ['getPinAnalog'],
    getPinAnalog: ['getPinDigital']
};

// BoardMorph instance creation

function BoardMorph(ide) {
    this.init(ide);
}

BoardMorph.prototype.init = function (ide) {
    if (this.name) { return };

    this.ide = ide;

    this.name = localize('Board');
    this.scripts = new ScriptsMorph(this);
    this.customBlocks = [];
    this.version = Date.now(); // for observer optimization

    this.variables = {};

    this.blocksCache = {}; // not to be serialized (!)
    this.paletteCache = {}; // not to be serialized (!)
    this.idx = 0; // not to be serialized (!) - used for de-serialization
    
    this.threads = [];
    this.reporterBlock = null;

    this.broker = { 
        url: 'cssiberica.com',
        port: '1883',
        deviceID: 'WhiteCat' + Math.floor(Math.random() * 100),
        username: '',
        password: ''
    };

    this.serialLib = require('serialport');
    this.SerialPort = this.serialLib.SerialPort;

    // PinOut depends on the board
    // For now we're supporting the WhiteCat board, but adding a menu
    // option for other boards is easy.
    this.loadPinOut('whitecat');

    if (!this.serialPort) { this.serialConnect() };

    BoardMorph.uber.init.call(this);

    this.fixLayout();
};

BoardMorph.prototype.fixLayout = function() {
    var myself = this,
        fieldWidth,
        column = 0,
        row = 2;

    if (this.pinMorphs) {
        this.pinMorphs.forEach(function(m) { m.destroy() });
    }

    this.pinMorphs = [];

    this.setWidth(194);
    this.setHeight(260);
    this.setColor(new Color(0, 0, 0, 0));

    fieldWidth = 92;

    if (!BoardMorph.pinOut) { return };

    var pins = Object.keys(BoardMorph.pinOut.digital);

    pins.forEach(function(pin) {
        var field = new Morph();

        field.pinNumber = pin;

        field.setColor(new Color(250,250,10));
        field.setWidth(fieldWidth);
        field.setHeight(14);
        field.setLeft(myself.left() + column * fieldWidth + column * 5 + 2);
        field.setTop(myself.top() + row * 16 + 2);

        field.label = new TextMorph(pin);
        field.label.setTop(field.top());
        field.label.setLeft(field.left() + 20);
        field.add(field.label);

        var configHolder = new Morph();
        configHolder.setPosition(field.position());
        configHolder.setColor(new Color(255,255,255));
        configHolder.setWidth(16);
        configHolder.setHeight(16);
        field.config = new TextMorph('? -');
        field.config.setPosition(configHolder.position());
        configHolder.add(field.config);
        field.add(configHolder);

        field.updateConfig = function(isInput, isAnalog) {
            var content = isAnalog ? 'A' : 'D';
            content += isInput ? '►' : '◄';
            field.config.text = content;
            field.config.changed();
            field.config.drawNew();
            field.config.changed();
        }

        field.valueHolder = new Morph();
        field.valueHolder.setTop(field.top());
        field.valueHolder.setLeft(field.left() + 38);
        field.valueHolder.setWidth(field.width() - 38);
        field.valueHolder.setHeight(field.height());
        field.valueHolder.setColor(new Color(255,255,255));
        field.value = new TextMorph('-');
        field.value.setTop(field.valueHolder.top());
        field.value.setLeft(field.valueHolder.left() + 2);
        field.valueHolder.add(field.value);
        field.add(field.valueHolder);

        field.updateValue = function(value) {
            if (value === true) {
                field.valueHolder.setColor(new Color(0,250,0));
                field.value.text = '';
            } else if (value === false) {
                field.valueHolder.setColor(new Color(250,0,0));
                field.value.text = '';
            } else {
                field.valueHolder.setColor(new Color(255,255,255));
                field.value.text = value;
            }
            field.value.changed();
            field.value.drawNew();
            field.value.changed();
        }

        myself.pinMorphs.push(field);
        myself.add(field);

        if (pin < 21) { 
            row ++;
        } else {
            row --;
        }

        if (pin == 21) {
            column ++;
            row += 3;
        }
    })
}

BoardMorph.prototype.updatePinConfig = function(pin, inputOrOutput, analogOrDigital) {
    var watcher = detect(this.pinMorphs, function(each){ return each.pinNumber == pin});
    if (watcher) {
        watcher.updateConfig(inputOrOutput === 'i', analogOrDigital === 'a');
    }
}

BoardMorph.prototype.updatePinValue = function(pin, value) {
    var watcher = detect(this.pinMorphs, function(each){ return each.pinNumber == pin});
    if (watcher) {
        if (watcher.config.text.slice(0,1) === 'D') {
            value = value == 1;
        }
        watcher.updateValue(value);
    }
}

BoardMorph.prototype.findThread = function(id) {
    return detect(this.threads, function(thread) { return thread.id === id });
}

BoardMorph.prototype.discoverPorts = function(callback) {
    var myself = this,
        portList = [],
        portcheck = /usb|DevB|rfcomm|acm|^com/i;

    this.serialLib.list(function (err, ports) { 
        if (ports) { 
            ports.forEach(function(each) { 
                if (each && portcheck.test(each.comName)) {
                    portList[each.comName] = each.comName; 
                }
            });
        }
        callback(portList);
    });
}

BoardMorph.prototype.serialConnect = function(port, baudrate) {
    var myself = this;

    if (!baudrate) { baudrate = 115200 };

    if (!port) { 
        var ports = this.discoverPorts(function(ports) {
            if (Object.keys(ports).length == 0) {
                world.prompt(
                        'No boards found.\nPlease enter the serial port name\nor leave blank to retry discovery\nand press OK', 
                        function(port){
                            myself.serialConnect(port, baudrate)
                        },
                        this,
                        port
                        );
                return;
            } else if (Object.keys(ports).length == 1) {
                myself.serialConnect(ports[Object.keys(ports)[0]], baudrate);
            } else if (Object.keys(ports).length > 1) { 
                var portMenu = new MenuMorph(this, 'select a port');
                Object.keys(ports).forEach(function(each) {
                    portMenu.addItem(each, function() { 
                        myself.serialConnect(each, baudrate);
                    })
                });
                portMenu.popUpCenteredInWorld(world);
            }
        });

    } else {

        this.serialPort = new this.SerialPort(
                port, 
                { 
                    baudrate: baudrate, 
                    buffersize: 256,
                    parser: this.serialLib.parsers.readline('\n')
                });

        this.serialPort.on('open', function (err) {
            if (err) { log(err) };
            myself.startUp();
            myself.ide.showModalMessage('Board connected at ' + port + '.\nWaiting for board to be ready...');
            myself.startUpInterval = 
                setInterval(function() {
                    myself.ide.showModalMessage('Waiting for board to be ready...\n' + randomFace()
                            + '\nIf this takes too long, try resetting the board\nby connecting P04 (GND) and P05 (MCLR) together.');
                    myself.startUp() 
                }, 
                2000);
            myself.serialPort.on('data', function(data) {
                myself.parseSerialResponse(data);
            });
            myself.serialPort.on('disconnect', function() {
                myself.serialPort.close(function() { myself.serialConnect() });
            });
        });
    }
};

BoardMorph.prototype.parseSerialResponse = function(data) {
    var myself = this;
    if (data === 'C') {
        // We've been given permission to send the next chunk of a script (_C_hunk)
        log('→ next chunk please');
        if (this.outputData) {
            if (this.outputIndex >= this.outputData.length) {
                log('← all done');
                // we're done
                this.previousData = this.outputData;
                this.outputData = null;
                this.outputIndex = 0;
                var buffer = new Buffer(30);
                buffer[0] = 0;
                buffer.write('\r\ndofile("/sd/autorun.lua")\r\n', 1);
                this.serialWrite(buffer);
            } else {
                var chunk = this.outputData.slice(this.outputIndex, this.outputIndex + 254),
                    buffer = new Buffer(chunk.length + 1);

                buffer[0] = chunk.length;
                buffer.write(chunk, 1);

                log('← sending a ' + chunk.length + ' bytes long chunk');

                this.serialWrite(buffer);

                this.outputIndex += 254;
            }
        } 
    } else if (data.slice(0,2) === 'pb') {
        // This piece of data should show up in a bubble (_P_op up _B_alloon)
        try {
            var id = data.match(/^pb:(.*?):/, '$1')[1],
                contents = data.match(/^pb:.*?:(.*)/, '$1')[1];

            if (id === 'r') {
                // It's a reporter block
                myself.reporterBlock.showBubble(contents);
                myself.reporterBlock.removeHighlight();
            }  else {
                // It's a report command block
                myself.findThread(Number.parseInt(id)).topBlock.showBubble(contents);
            }

        } catch (err) {
            myself.ide.showMessage('Error parsing data back from the board:\n' + data + '\n' + err, 5);
        }
    } else if (data.search('rt:') > -1) {
        // It's a thread that just came alive and its corresponding stack should be highlighted
        try {
            var id = data.match(/rt:(.*?):/)[1],
                thread = myself.findThread(Number.parseInt(id));
            // This thread may not exist anymore
            if (thread) { thread.topBlock.addHighlight(thread.topBlock.removeHighlight()) };
        } catch(err) {
            log(err);
        }
    } else if (data.search('dt:') > -1) {
        // It's a dead thread and its corresponding stack should be un-highlighted
        try {
            var id = data.match(/dt:(.*?):/)[1],
                thread = myself.findThread(Number.parseInt(id));
            // This thread may not exist anymore
            if (thread) {
                thread.topBlock.removeHighlight();
            };
        } catch (err) {
            log(err);
        }
    } else if (data.slice(0,2) === 'pv') {
        // We're getting pin values back
        try {
            var pin = data.match(/^pv:(.*?):/, '$1')[1],
                contents = data.match(/^pv:.*?:(.*)/, '$1')[1];
            this.updatePinValue(pin, contents);
        } catch (err) {
            log(err);
        }
    } else if (data.slice(0,2) === 'vv') {
        // We're getting variable values back
        try {
            var varName = data.match(/^vv:(.*?):/, '$1')[1],
                contents = data.match(/^vv:.*?:(.*)/, '$1')[1];
            this.setVariableWatcherValue(varName, contents);
        } catch (err) {
            log(err);
        }
    } else if (this.startUpInterval && data.search('>') > -1) {
        clearInterval(this.startUpInterval);
        this.startUpInterval = null;
        // INTERVAL for reading inputs:
        // for key in pairs(cfg.p) do if (cfg.p[key][2] == 1) then print(key) end end end)(); if (f) then print(\"pb:2:\" .. f) end;\r\n
        myself.ide.showMessage('Board ready.', 2);
    } else {
        log(data);
    }
};

BoardMorph.prototype.serialWrite = function(data) {
    var myself = this;

    if (this.serialPort.writing) {
        this.serialPort.writeAttempts += 1;
        log('retry serial write: attempt #' + this.serialPort.writeAttempts);
        if (this.serialPort.writeAttempts > 9) {
            log('I am done retrying. Please reset the board...');
            return;
        };
        this.serialWrite(data);
    };

    this.serialPort.writing = true;

    this.serialPort.write(data,
        function() { 
            myself.serialPort.writeAttempts = 0;
            myself.serialPort.writing = false 
        });
}

BoardMorph.prototype.loadPinOut = function(boardName) {
    var myself = this,
        fs = require('fs');

    fs.readFile('boards/' + boardName + '.json', function(error, data) {
        if (error) {
            myself.parentThatIsA(IDE_Morph).showMessage(error + '\nCould not find pinout specs file for\n' 
                + boardName + ' board. Input / output blocks\nare not going to work!');
        } else {
            try {
                BoardMorph.pinOut = JSON.parse(data);
                myself.fixLayout();
            } catch (error) {
                myself.parentThatIsA(IDE_Morph).showMessage(error + '\nCould not parse pinout specs file for\n' 
                    + boardName + ' board. Input / output blocks\nare not going to work!');
            }
        }
    });
}

BoardMorph.prototype.suspendAll = function() {
    this.serialWrite('thread.suspend()\r\n');
}

BoardMorph.prototype.resumeAll = function() {
    this.serialWrite('thread.resume()\r\n');
}

BoardMorph.prototype.startUp = function() {
    this.serialWrite('\r\n\r\n');
}

BoardMorph.prototype.stopAll = function() {
    this.outputData = null;
    this.previousData = null;
    this.serialWrite('thread.stop()\r\n');
}

BoardMorph.prototype.reset = function() {
    //this.serialWrite('thread.stop();os.exit()\r\n');
    this.stopAll();
}

// Thread handling

BoardMorph.prototype.threadForBlock = function(topBlock, topBlocksToRun) {
    var thread, 
    id = 0;

    if (topBlock.thread && contains(topBlocksToRun, topBlock)) {
        topBlock.thread.setBody(new LuaExpression(topBlock, this));
        thread = topBlock.thread;
        log('I am updating thread ' + thread.id);
    } else if (!topBlock.thread) {
        if (this.threads.length > 0) {
            id = this.threads[this.threads.length - 1].id + 1;
        }
        log('I am creating thread ' + id);
        thread = new Thread(id, topBlock);
        topBlock.thread = thread;
        thread.setBody(new LuaExpression(topBlock, this));
        this.addThread(thread);
    } else {
        thread = topBlock.thread;
        log('I found thread ' + thread.id + ' but I am not changing it');
    }

    return thread;
}

BoardMorph.prototype.addThread = function(thread) {
    this.threads.push(thread);
    return thread;
}

BoardMorph.prototype.clearThreads = function() {
    this.threads = [];
}

BoardMorph.prototype.buildThreads = function(topBlocksToRun, forceRun) {
    // Build all threads based on the block stacks on the scripts canvas
    // Fire up the threads that correspond with topBlocksToRun
    // Add all that to autorun.lua so it's persistent upon reset

    var myself = this;

    this.outputData = 'if (not vars) then vars = {} end\r\nif (not msg) then msg = {} end\r\nif (not cfg) then cfg = {}; cfg.p = {} end\r\nthread.stop()\r\n';
    this.outputIndex = 0;

    this.scripts.children.forEach(function(topBlock) {

        if (!(topBlock instanceof BlockMorph)
                || topBlock instanceof ReporterBlockMorph 
                || topBlock instanceof WatcherMorph) { 
            return 
        };

        // If the thread is already there, we'll update it
        var thread = myself.threadForBlock(topBlock, topBlocksToRun);
            myself.outputData += thread.body;
            if (contains(topBlocksToRun, topBlock) || topBlock.getHighlight()) { 
                myself.outputData += thread.start();
            };
            if (!topBlock.getHighlight() && !topBlock.selector == 'subscribeToMQTTmessage') {
                topBlock.addHighlight()
            };
    })

    if (this.outputData == this.previousData && !forceRun) { return }; 

    log('← sending ' + this.outputData.length + ' bytes');

    if (debugMode && process.platform != 'win32') {
        require('fs').writeFileSync('/tmp/autorun.lua', this.outputData);
    }

    // We start writing
    // BoardMorph.prototype.parseSerialResponse takes over

    this.serialWrite('\rio.receive("/sd/autorun.lua")\r');
}

BoardMorph.prototype.getReporterResult = function (block) {
    this.reporterBlock = block;
    if (block.selector === 'reportNewList') {
        this.serialWrite('print("pb:r:"..' + luaTableVarToString(new LuaExpression(block, this)) + ')\r\n');
    } else {
        this.serialWrite('print("pb:r:"..tostring(' + new LuaExpression(block, this) + '))\r\n');
    }
}

// Variables
BoardMorph.prototype.addVariable = function(name) {
    this.variables[name] = 0;
}

BoardMorph.prototype.deleteVariable = function(name) {
    delete this.variables[name];
    this.deleteVariableWatcher(name);
    this.variableBlock('name').destroy();
    ide = this.parentThatIsA(IDE_Morph);
    ide.flushBlocksCache('data'); // b/c of inheritance
    ide.refreshPalette();
}

BoardMorph.prototype.findVariableWatcher = function (varName) {
    var myself = this;
    return detect(
        myself.scripts.children,
        function (morph) {
            return morph instanceof WatcherMorph
                    && (morph.board === myself)
                    && morph.getter === varName;
        }
    );
};

BoardMorph.prototype.setVariableWatcherValue = function (varName, value) {
    var watcher = this.findVariableWatcher(varName);
    if (watcher) {
        watcher.cellMorph.contents = value;
        watcher.changed();
        watcher.cellMorph.drawNew();
        watcher.fixLayout();
    }
};

BoardMorph.prototype.toggleVariableWatcher = function (varName) {
    var watcher,
        others;

    watcher = this.findVariableWatcher(varName);

    if (watcher !== null) {
        if (watcher.isVisible) {
            watcher.hide();
        } else {
            watcher.show();
            watcher.fixLayout(); // re-hide hidden parts
            watcher.keepWithin(this.scripts);
        }
        return;
    }

    // if no watcher exists, create a new one
    watcher = new WatcherMorph(
        varName, // label
        this.blockColor.data, // color
        this, // board
        varName // getter
    );
    watcher.setPosition(this.scripts.position().add(10));
    others = this.scripts.watchers();
    if (others.length > 0) {
        watcher.setTop(others[others.length - 1].bottom() + 5);
    }
    this.scripts.add(watcher);
    watcher.fixLayout();
    watcher.keepWithin(this.scripts);
};

BoardMorph.prototype.showingVariableWatcher = function (varName) {
    var watcher;
    watcher = this.findVariableWatcher(varName);
    if (watcher) {
        return watcher.isVisible;
    }
    return false;
};

BoardMorph.prototype.deleteVariableWatcher = function (varName) {
    var watcher;
    watcher = this.findVariableWatcher(varName);
    if (watcher !== null) {
        watcher.destroy();
    }
};

BoardMorph.prototype.variableBlock = function (varName) {
    var block = new ReporterBlockMorph(false);
    block.selector = 'reportGetVar';
    block.color = this.blockColor.data;
    block.category = 'data';
    block.setSpec(varName);
    block.isDraggable = true;
    return block;
};

// MQTT

BoardMorph.prototype.mqttConnectionCode = function() {
    return ('cfg.m = mqtt.client("' 
            + this.broker.deviceID + '", "' + this.broker.url + '", ' + this.broker.port + ', false); cfg.m:connect("' 
            + this.broker.username + '","' + this.broker.password + '");\r\n');
}

// BoardMorph versioning

BoardMorph.prototype.setName = function (string) {
    this.name = string || this.name;
    this.version = Date.now();
};

// BoardMorph block instantiation

BoardMorph.prototype.blockForSelector = function (selector, setDefaults) {
    var migration, info, block, defaults, inputs, i;
    migration = this.blockMigrations[selector];
    info = this.blocks[migration ? migration.selector : selector];
    if (!info) {return null; }
    block = info.type === 'command' ? new CommandBlockMorph()
        : info.type === 'hat' ? new HatBlockMorph()
            : info.type === 'ring' ? new RingMorph()
                : new ReporterBlockMorph(info.type === 'predicate');
    block.color = this.blockColor[info.category];
    block.category = info.category;
    block.selector = migration ? migration.selector : selector;
    if (block.selector === 'reifyReporter') {
        block.isStatic = true;
    }
    block.setSpec(localize(info.spec));
    if ((setDefaults && info.defaults) || (migration && migration.inputs)) {
        defaults = migration ? migration.inputs : info.defaults;
        block.defaults = defaults;
        inputs = block.inputs();
        if (inputs[0] instanceof MultiArgMorph) {
            inputs[0].setContents(defaults);
            inputs[0].defaults = defaults;
        } else {
            for (i = 0; i < defaults.length; i += 1) {
                if (defaults[i] !== null) {
                    inputs[i].setContents(defaults[i], true);
                }
            }
        }
    }
    return block;
};

// BoardMorph block templates

BoardMorph.prototype.blockTemplates = function (category) {
    var blocks = [], myself = this, button,
        cat = category || 'control', txt;

    function block(selector) {
        var newBlock = BoardMorph.prototype.blockForSelector(selector, true);
        newBlock.isTemplate = true;
        return newBlock;
    }

    function variableBlock(varName) {
        var newBlock = BoardMorph.prototype.variableBlock(varName);
        newBlock.isDraggable = false;
        newBlock.isTemplate = true;
        return newBlock;
    }

    function helpMenu() {
        var menu = new MenuMorph(this);
        menu.addItem('help...', 'showHelp');
        return menu;
    }

    function addVar(name) {
        var ide;
        if (name) {
            if (contains(Object.keys(myself.variables), name)) {
                myself.inform('that name is already in use');
            } else {
                ide = myself.parentThatIsA(IDE_Morph);
                myself.addVariable(name);
                if (!myself.showingVariableWatcher(name)) {
                    myself.toggleVariableWatcher(name);
                }
                ide.flushBlocksCache('data'); // b/c of inheritance
                ide.refreshPalette();
            }
        }
    }

    function variableWatcherToggle(varName) {
        return new ToggleMorph(
            'checkbox',
            this,
            function () {
                myself.toggleVariableWatcher(varName);
            },
            null,
            function () {
                return myself.showingVariableWatcher(varName);
            },
            null
        );
    }

    if (cat === 'control') {

        blocks.push(block('receiveGo'));
        blocks.push('-');
        blocks.push(block('doWait'));
        blocks.push('-');
        blocks.push(block('doForever'));
        blocks.push(block('doRepeat'));
        blocks.push('-');
        blocks.push(block('doIf'));
        blocks.push(block('doIfElse'));
        blocks.push('-');
        blocks.push(block('doReport'));
        // Not yet implemented
        /*
        blocks.push('-');
        blocks.push(block('doStopThis'));
        blocks.push(block('doStopOthers'));
        blocks.push('-');
        blocks.push(block('doRun'));
        blocks.push(block('fork'));
        blocks.push(block('evaluate'));
        blocks.push('-');
        */
        

    } else if (cat === 'operators') {

        // Not yet implemented
        /*
        blocks.push(block('reifyScript'));
        blocks.push(block('reifyReporter'));
        blocks.push('#');
        blocks.push('-');
        */
        blocks.push(block('reportSum'));
        blocks.push(block('reportDifference'));
        blocks.push(block('reportProduct'));
        blocks.push(block('reportQuotient'));
        blocks.push('-');
        blocks.push(block('reportModulus'));
        blocks.push(block('reportMonadic'));
        blocks.push(block('reportRandom'));
        blocks.push('-');
        blocks.push(block('reportLessThan'));
        blocks.push(block('reportEquals'));
        blocks.push(block('reportGreaterThan'));
        blocks.push('-');
        blocks.push(block('reportAnd'));
        blocks.push(block('reportOr'));
        blocks.push(block('reportNot'));
        blocks.push('-');
        blocks.push(block('reportTrue'));
        blocks.push(block('reportFalse'));
        blocks.push('-');
        blocks.push(block('reportJoinWords'));
        blocks.push('-');
        blocks.push(block('runLua'));

    } else if (cat === 'data') {

        button = new PushButtonMorph(
            null,
            function () {
                new VariableDialogMorph(
                    null,
                    addVar,
                    myself
                ).prompt(
                    'Variable name',
                    null,
                    myself.world()
                );
            },
            'Make a variable'
        );
        button.selector = 'addVariable';
        blocks.push(button);

        if (Object.keys(this.variables).length > 0) {
            button = new PushButtonMorph(
                null,
                function () {
                    var menu = new MenuMorph(
                        myself.deleteVariable,
                        null,
                        myself
                    );
                    Object.keys(myself.variables).forEach(function (name) {
                        menu.addItem(name, name);
                    });
                    menu.popUpAtHand(myself.world());
                },
                'Delete a variable'
            );
            button.selector = 'deleteVariable';
            blocks.push(button);
        }

        blocks.push('-');

        varNames = Object.keys(this.variables);
        if (varNames.length > 0) {
            varNames.forEach(function (name) {
                blocks.push(variableWatcherToggle(name));
                blocks.push(variableBlock(name));
            });
            blocks.push('-');
        }

        blocks.push(block('doSetVar'));
        blocks.push(block('doChangeVar'));

        blocks.push('=');

        blocks.push(block('reportNewList'));
        blocks.push('-');
        blocks.push(block('reportListItem'));
        blocks.push('-');
        blocks.push(block('reportListLength'));
        blocks.push(block('reportListContainsItem'));
        blocks.push('-');
        blocks.push(block('addListItem'));
        blocks.push(block('deleteListItem'));
        blocks.push(block('insertListItem'));
        blocks.push(block('replaceListItem'));

    } else if (cat === 'input / output') {

        blocks.push(block('setPinDigital'));
        blocks.push(block('setPinAnalog'));
        blocks.push('-');
        blocks.push(block('getPinDigital'));
        blocks.push(block('getPinAnalog'));

    } else if (cat === 'comm') {

        button = new PushButtonMorph(
            null,
            function () {
                new MQTTDialogMorph(
                    myself,
                    nop,
                    myself
                ).popUp(this.world);
            },
            'Connect to MQTT broker'
        );
        button.userMenu = helpMenu;
        blocks.push(button);
        blocks.push('-');
        blocks.push(block('subscribeToMQTTmessage'));
        blocks.push(block('publishMQTTmessage'));

    } else if (cat === 'custom blocks') {

        button = new PushButtonMorph(
            null,
            function () {
                new BlockDialogMorph(
                    null,
                    function (definition) {
                        if (definition.spec !== '') {
                            myself.customBlocks.push(definition);
                            myself.ide.flushPaletteCache();
                            myself.ide.refreshPalette();
                            new BlockEditorMorph(definition, myself).popUp();
                        }
                    },
                    myself
                ).prompt(
                    'Make a block',
                    null,
                    myself.world()
                );
            },
            'Make a block'
        );
        button.userMenu = helpMenu;
        button.selector = 'addCustomBlock';
        button.showHelp = BlockMorph.prototype.showHelp;
        // Not yet implemented
        /*
        blocks.push(button);
        */
        blocks.push(new TextMorph('Not available yet'))
    }
    return blocks;
};

BoardMorph.prototype.palette = function (category) {
    if (!this.paletteCache[category]) {
        this.paletteCache[category] = this.freshPalette(category);
    }
    return this.paletteCache[category];
};

BoardMorph.prototype.freshPalette = function (category) {
    var palette = new ScrollFrameMorph(null, null, this.sliderColor),
        unit = SyntaxElementMorph.prototype.fontSize,
        x = 0,
        y = 5,
        ry = 0,
        blocks,
        hideNextSpace = false,
        myself = this,
        oldFlag = Morph.prototype.trackChanges;

    Morph.prototype.trackChanges = false;

    palette.owner = this;
    palette.padding = unit / 2;
    palette.color = this.paletteColor;
    palette.growth = new Point(0, MorphicPreferences.scrollBarSize);

    // menu:

    palette.userMenu = function () {
        var menu = new MenuMorph(),
            more = {
                operators:
                    ['reifyScript', 'reifyReporter'],
                control:
                    ['doWarp'],
                variables: ['reportNewList']
            };

        menu.addItem('find blocks...', function () {myself.searchBlocks(); });
        return menu;
    };

    // primitives:

    blocks = this.blocksCache[category];
    if (!blocks) {
        blocks = myself.blockTemplates(category);
        if (this.isCachingPrimitives) {
            myself.blocksCache[category] = blocks;
        }
    }

    blocks.forEach(function (block) {
        if (block === null) {
            return;
        }
        if (block === '-') {
            if (hideNextSpace) {return; }
            y += unit * 0.8;
            hideNextSpace = true;
        } else if (block === '=') {
            if (hideNextSpace) {return; }
            y += unit * 1.6;
            hideNextSpace = true;
        } else if (block === '#') {
            x = 0;
            y = ry;
        } else {
            hideNextSpace = false;
            if (x === 0) {
                y += unit * 0.3;
            }
            block.setPosition(new Point(x, y));
            palette.addContents(block);
            if (block instanceof ToggleMorph
                    || (block instanceof RingMorph)) {
                x = block.right() + unit / 2;
                ry = block.bottom();
            } else {
                if (block.fixLayout) {block.fixLayout(); }
                x = 0;
                y += block.height();
            }
        }
    });

    // local custom blocks:

    y += unit * 1.6;
    this.customBlocks.forEach(function (definition) {
        var block;
        if (definition.category === category ||
                (category === 'data'
                    && contains(
                        ['custom blocks'],
                        definition.category
                    ))) {
            block = definition.templateInstance();
            y += unit * 0.3;
            block.setPosition(new Point(x, y));
            palette.addContents(block);
            x = 0;
            y += block.height();
        }
    });

    //layout

    palette.scrollX(palette.padding);
    palette.scrollY(palette.padding);

    Morph.prototype.trackChanges = oldFlag;
    return palette;
};

// BoardMorph blocks searching

BoardMorph.prototype.blocksMatching = function (
    searchString,
    strictly,
    types // optional, ['hat', 'command', 'reporter', 'predicate']
) {
    // answer an array of block templates whose spec contains
    // the given search string, ordered by descending relevance
    // types is an optional array containing block types the search
    // is limited to, e.g. "command", "hat", "reporter", "predicate".
    // Note that "predicate" is not subsumed by "reporter" and has
    // to be specified explicitly.
    // if no types are specified all blocks are searched
    var blocks = [],
        blocksDict,
        myself = this,
        search = searchString.toLowerCase();

    if (!types || !types.length) {
        types = ['hat', 'command', 'reporter', 'ring'];
    }

    function labelOf(aBlockSpec) {
        var words = (BlockMorph.prototype.parseSpec(aBlockSpec)),
            filtered = words.filter(
                function (each) {return (each.indexOf('%') !== 0); }
            );
        return filtered.join(' ');
    }

    function fillDigits(anInt, totalDigits, fillChar) {
        var ans = String(anInt);
        while (ans.length < totalDigits) {ans = fillChar + ans; }
        return ans;
    }

    function relevance(aBlockLabel, aSearchString) {
        var lbl = ' ' + aBlockLabel,
            idx = lbl.indexOf(aSearchString),
            atWord;
        if (idx === -1) {return -1; }
        atWord = (lbl.charAt(idx - 1) === ' ');
        if (strictly && !atWord) {return -1; }
        return (atWord ? '1' : '2') + fillDigits(idx, 4, '0');
    }

    function primitive(selector) {
        var newBlock = BoardMorph.prototype.blockForSelector(selector, true);
        newBlock.isTemplate = true;
        return newBlock;
    }

    // custom blocks
    this.customBlocks.forEach(function (definition) {
        if (contains(types, definition.type)) {
            var spec = localize(definition.blockSpec()).toLowerCase(),
                rel = relevance(labelOf(spec), search);
            if (rel !== -1) {
                blocks.push([definition.templateInstance(), rel + '2']);
            }
        }
    });
    // primitives
    blocksDict = BoardMorph.prototype.blocks;
    Object.keys(blocksDict).forEach(function (selector) {
        if (contains(types, blocksDict[selector].type)) {
            var block = blocksDict[selector],
                spec = localize(block.alias || block.spec).toLowerCase(),
                rel = relevance(labelOf(spec), search);
            if (
                (rel !== -1) &&
                    (!block.dev) &&
                    (!block.only || (block.only === myself.constructor))
            ) {
                blocks.push([primitive(selector), rel + '3']);
            }
        }
    });
    blocks.sort(function (x, y) {return x[1] < y[1] ? -1 : 1; });
    return blocks.map(function (each) {return each[0]; });
};

BoardMorph.prototype.searchBlocks = function (
    searchString,
    types,
    scriptFocus
) {
    var myself = this,
        unit = SyntaxElementMorph.prototype.fontSize,
        oldSearch = '',
        searchBar = new InputFieldMorph(searchString || ''),
        searchPane = myself.ide.createPalette('forSearch'),
        blocksList = [],
        selection,
        focus;

    function showSelection() {
        if (focus) {focus.destroy(); }
        if (!selection || !scriptFocus) {return; }
        focus = selection.outline(
            new Color(150, 200, 255),
            2
        );
        searchPane.contents.add(focus);
        focus.scrollIntoView();
    }

    function show(blocks) {
        var oldFlag = Morph.prototype.trackChanges,
            x = searchPane.contents.left() + 5,
            y = (searchBar.bottom() + unit);
        blocksList = blocks;
        selection = null;
        if (blocks.length && scriptFocus) {
            selection = blocks[0];
        }
        Morph.prototype.trackChanges = false;
        searchPane.contents.children = [searchPane.contents.children[0]];
        blocks.forEach(function (block) {
            block.setPosition(new Point(x, y));
            searchPane.addContents(block);
            y += block.height();
            y += unit * 0.3;
        });
        Morph.prototype.trackChanges = oldFlag;
        showSelection();
        searchPane.changed();
    }

    searchPane.owner = this;
    searchPane.color = myself.paletteColor;
    searchPane.contents.color = myself.paletteColor;
    searchPane.addContents(searchBar);
    searchBar.drawNew();
    searchBar.setWidth(myself.ide.logo.width() - 30);
    searchBar.contrast = 90;
    searchBar.setPosition(
        searchPane.contents.topLeft().add(new Point(10, 10))
    );
    searchBar.drawNew();

    searchPane.accept = function () {
        var search;
        if (scriptFocus) {
            searchBar.cancel();
            if (selection) {
                scriptFocus.insertBlock(selection);
            }
        } else {
            search = searchBar.getValue();
            if (search.length > 0) {
                show(myself.blocksMatching(search));
            }
        }
    };

    searchPane.reactToKeystroke = function (evt) {
        var search, idx, code = evt ? evt.keyCode : 0;
        switch (code) {
        case 38: // up arrow
            if (!scriptFocus || !selection) {return; }
            idx = blocksList.indexOf(selection) - 1;
            if (idx < 0) {
                idx = blocksList.length - 1;
            }
            selection = blocksList[idx];
            showSelection();
            return;
        case 40: // down arrow
            if (!scriptFocus || !selection) {return; }
            idx = blocksList.indexOf(selection) + 1;
            if (idx >= blocksList.length) {
                idx = 0;
            }
            selection = blocksList[idx];
            showSelection();
            return;
        default:
            search = searchBar.getValue();
            if (search !== oldSearch) {
                oldSearch = search;
                show(myself.blocksMatching(
                    search,
                    search.length < 2,
                    types
                ));
            }
        }
    };

    searchBar.cancel = function () {
        myself.ide.refreshPalette();
        myself.ide.palette.adjustScrollBars();
    };

    this.ide.fixLayout('refreshPalette');
    searchBar.edit();
    if (searchString) {searchPane.reactToKeystroke(); }
};

// BoardMorph primitives

// BoardMorph message broadcasting

BoardMorph.prototype.allHatBlocksFor = function (message) {
    return this.scripts.children.filter(function (morph) {
        var event;
        if (morph.selector) {
            if (morph.selector === 'receiveGo') {
                return message === '__shout__go__';
            }
            if (morph.selector === 'subscribeToMQTTmessage') {
                return message === '__postal__service__';
            }
        }
        return false;
    });
};

// BoardMorph custom blocks

BoardMorph.prototype.deleteAllBlockInstances = function (definition) {
    this.allBlockInstances(definition).forEach(function (each) {
        each.deleteBlock();
    });
    this.customBlocks.forEach(function (def) {
        if (def.body && def.body.expression.isCorpse) {
            def.body = null;
        }
    });
};

BoardMorph.prototype.allBlockInstances = function (definition) {
    var objects, blocks = [], inDefinitions;
    return this.allLocalBlockInstances(definition);
};

BoardMorph.prototype.allLocalBlockInstances = function (definition) {
    var inScripts, inDefinitions, inBlockEditors, inPalette, result;

    inScripts = this.scripts.allChildren().filter(function (c) {
        return c.definition && (c.definition === definition);
    });

    inDefinitions = [];
    this.customBlocks.forEach(function (def) {
        if (def.body) {
            def.body.expression.allChildren().forEach(function (c) {
                if (c.definition && (c.definition === definition)) {
                    inDefinitions.push(c);
                }
            });
        }
    });

    inBlockEditors = this.allEditorBlockInstances(definition);
    inPalette = this.paletteBlockInstance(definition);

    result = inScripts.concat(inDefinitions).concat(inBlockEditors);
    if (inPalette) {
        result.push(inPalette);
    }
    return result;
};

BoardMorph.prototype.allEditorBlockInstances = function (definition) {
    var inBlockEditors = [],
        world = this.world();

    if (!world) {return []; } // when copying a board

    this.world().children.forEach(function (morph) {
        if (morph instanceof BlockEditorMorph) {
            morph.body.contents.allChildren().forEach(function (block) {
                if (!block.isPrototype
                        && !(block instanceof PrototypeHatBlockMorph)
                        && (block.definition === definition)) {
                    inBlockEditors.push(block);
                }
            });
        }
    });
    return inBlockEditors;
};


BoardMorph.prototype.paletteBlockInstance = function (definition) {
    var myself = this;
    if (!this.ide) {return null; }
    return detect(
        myself.ide.palette.contents.children,
        function (block) {
            return block.definition === definition;
        }
    );
};

BoardMorph.prototype.usesBlockInstance = function (definition) {
    var inDefinitions,
        inScripts = detect(
            this.scripts.allChildren(),
            function (c) {
                return c.definition && (c.definition === definition);
            }
        );

    if (inScripts) {return true; }

    inDefinitions = [];
    this.customBlocks.forEach(function (def) {
        if (def.body) {
            def.body.expression.allChildren().forEach(function (c) {
                if (c.definition && (c.definition === definition)) {
                    inDefinitions.push(c);
                }
            });
        }
    });
    return (inDefinitions.length > 0);
};

BoardMorph.prototype.doubleDefinitionsFor = function (definition) {
    var spec = definition.blockSpec(),
        blockList,
        idx;

    blockList = this.customBlocks;
    idx = blockList.indexOf(definition);
    if (idx === -1) {return []; }
    return blockList.filter(function (def, i) {
        return def.blockSpec() === spec && (i !== idx);
    });
};

BoardMorph.prototype.replaceDoubleDefinitionsFor = function (definition) {
    var doubles = this.doubleDefinitionsFor(definition),
        myself = this;
    doubles.forEach(function (double) {
        myself.allBlockInstances(double).forEach(function (block) {
            block.definition = definition;
            block.refresh();
        });
    });
    
    this.customBlocks = this.customBlocks.filter(function (def) {
        return !contains(doubles, def);
    });
    if (this.ide) {
        this.ide.flushPaletteCache();
        this.ide.refreshPalette();
    }
};

// BoardMorph Boolean visual representation

BoardMorph.prototype.booleanMorph = function (bool) {
    // answer a block which can be shown in watchers, speech bubbles etc.
    var block = new ReporterBlockMorph(true);
    block.color = BoardMorph.prototype.blockColor.operators;
    block.setSpec(localize(bool.toString()));
    return block;
};

// BoardBubbleMorph ////////////////////////////////////////////////////////

/*
    I am a board's scaleable speech bubble. I rely on BoardMorph
    for my preferences settings
*/

// BoardBubbleMorph inherits from SpeechBubbleMorph:

BoardBubbleMorph.prototype = new SpeechBubbleMorph();
BoardBubbleMorph.prototype.constructor = BoardBubbleMorph;
BoardBubbleMorph.uber = SpeechBubbleMorph.prototype;

// BoardBubbleMorph instance creation:

function BoardBubbleMorph(data, scale, isThought, isQuestion) {
    this.init(data, scale, isThought, isQuestion);
}

BoardBubbleMorph.prototype.init = function (
    data,
    scale,
    isThought,
    isQuestion
) {
    var board = BoardMorph.prototype;
    this.scale = scale || 1;
    this.data = data;
    this.isQuestion = isQuestion;

    BoardBubbleMorph.uber.init.call(
        this,
        this.dataAsMorph(data),
        board.bubbleColor,
        null,
        null,
        isQuestion ? board.blockColor.sensing : board.bubbleBorderColor,
        null,
        isThought
    );
};

// BoardBubbleMorph contents formatting

BoardBubbleMorph.prototype.dataAsMorph = function (data) {
    var contents,
        board = BoardMorph.prototype,
        isText,
        img,
        scaledImg,
        width;

    if (data instanceof Morph) {
        contents = data;
    } else if (isString(data)) {
        isText = true;
        contents = new TextMorph(
            data,
            board.bubbleFontSize * this.scale,
            null, // fontStyle
            board.bubbleFontIsBold,
            false, // italic
            'center'
        );
    } else if (typeof data === 'boolean') {
        img = board.booleanMorph(data).fullImage();
        contents = new Morph();
        contents.silentSetWidth(img.width);
        contents.silentSetHeight(img.height);
        contents.image = img;
    } else if (data instanceof HTMLCanvasElement) {
        contents = new Morph();
        contents.silentSetWidth(data.width);
        contents.silentSetHeight(data.height);
        contents.image = data;
    } else if (data instanceof List) {
        contents = new ListWatcherMorph(data);
        contents.isDraggable = false;
        contents.update(true);
        contents.step = contents.update;
    } else if (data instanceof Context) {
        img = data.image();
        contents = new Morph();
        contents.silentSetWidth(img.width);
        contents.silentSetHeight(img.height);
        contents.image = img;
    } else {
        contents = new TextMorph(
            data.toString(),
            board.bubbleFontSize * this.scale,
            null, // fontStyle
            board.bubbleFontIsBold,
            false, // italic
            'center'
        );
    }
    if (contents instanceof TextMorph) {
        // reflow text boundaries
        width = Math.max(
            contents.width(),
            board.bubbleCorner * 2 * this.scale
        );
        if (isText) {
            width = Math.min(width, board.bubbleMaxTextWidth * this.scale);
        }
        contents.setWidth(width);
    } else if (!(data instanceof List)) {
        // scale contents image
        scaledImg = newCanvas(contents.extent().multiplyBy(this.scale));
        scaledImg.getContext('2d').drawImage(
            contents.image,
            0,
            0,
            scaledImg.width,
            scaledImg.height
        );
        contents.image = scaledImg;
        contents.bounds = contents.bounds.scaleBy(this.scale);
    }
    return contents;
};

// BoardBubbleMorph scaling

BoardBubbleMorph.prototype.setScale = function (scale) {
    this.scale = scale;
    this.changed();
    this.drawNew();
    this.changed();
};

// BoardBubbleMorph drawing:

BoardBubbleMorph.prototype.drawNew = function () {
    var board = BoardMorph.prototype;

    // scale my settings
    this.edge = board.bubbleCorner * this.scale;
    this.border = board.bubbleBorder * this.scale;
    this.padding = board.bubbleCorner / 2 * this.scale;

    // re-build my contents
    if (this.contentsMorph) {
        this.contentsMorph.destroy();
    }
    this.contentsMorph = this.dataAsMorph(this.data);
    this.add(this.contentsMorph);

    // adjust my layout
    this.silentSetWidth(this.contentsMorph.width()
        + (this.padding ? this.padding * 2 : this.edge * 2));
    this.silentSetHeight(this.contentsMorph.height()
        + this.edge
        + this.border * 2
        + this.padding * 2
        + 2);

    // draw my outline
    SpeechBubbleMorph.uber.drawNew.call(this);

    // position my contents
    this.contentsMorph.setPosition(this.position().add(
        new Point(
            this.padding || this.edge,
            this.border + this.padding + 1
        )
    ));
};

// BoardBubbleMorph resizing:

BoardBubbleMorph.prototype.fixLayout = function () {
    // to be used when resizing list watchers
    // otherwise use drawNew() to force re-layout

    var board = BoardMorph.prototype;

    this.changed();
    // scale my settings
    this.edge = board.bubbleCorner * this.scale;
    this.border = board.bubbleBorder * this.scale;
    this.padding = board.bubbleCorner / 2 * this.scale;

    // adjust my layout
    this.silentSetWidth(this.contentsMorph.width()
        + (this.padding ? this.padding * 2 : this.edge * 2));
    this.silentSetHeight(this.contentsMorph.height()
        + this.edge
        + this.border * 2
        + this.padding * 2
        + 2);

    // draw my outline
    SpeechBubbleMorph.uber.drawNew.call(this);

    // position my contents
    this.contentsMorph.setPosition(this.position().add(
        new Point(
            this.padding || this.edge,
            this.border + this.padding + 1
        )
    ));
    this.changed();
};

// CellMorph //////////////////////////////////////////////////////////

/*
    I am a spreadsheet style cell that can display either a string,
    a Morph, a Canvas or a toString() representation of anything else.
    I can be used in variable watchers or list view element cells.
*/

// CellMorph inherits from BoxMorph:

CellMorph.prototype = new BoxMorph();
CellMorph.prototype.constructor = CellMorph;
CellMorph.uber = BoxMorph.prototype;

// CellMorph instance creation:

function CellMorph(contents, color, idx, parentCell) {
    this.init(contents, color, idx, parentCell);
}

CellMorph.prototype.init = function (contents, color, idx, parentCell) {
    this.contents = (contents === 0 ? 0
            : contents === false ? false
                    : contents || '');
    this.isEditable = isNil(idx) ? false : true;
    this.idx = idx || null; // for list watchers
    this.parentCell = parentCell || null; // for list circularity detection
    CellMorph.uber.init.call(
        this,
        SyntaxElementMorph.prototype.corner,
        1.000001, // shadow bug in Chrome,
        new Color(255, 255, 255)
    );
    this.color = color || new Color(255, 140, 0);
    this.drawNew();
};

// CellMorph circularity testing:

CellMorph.prototype.isCircular = function (list) {
    if (!this.parentCell) {return false; }
    if (list instanceof List) {
        return this.contents === list || this.parentCell.isCircular(list);
    }
    return this.parentCell.isCircular(this.contents);
};

// CellMorph layout:

CellMorph.prototype.fixLayout = function () {
    var listwatcher;
    this.changed();
    this.drawNew();
    this.changed();
    if (this.parent && this.parent.fixLayout) { // variable watcher
        this.parent.fixLayout();
    } else {
        listwatcher = this.parentThatIsA(ListWatcherMorph);
        if (listwatcher) {
            listwatcher.fixLayout();
        }
    }
};

// CellMorph drawing:

CellMorph.prototype.drawNew = function () {
    var context,
        txt,
        img,
        fontSize = SyntaxElementMorph.prototype.fontSize,
        isSameList = this.contentsMorph instanceof ListWatcherMorph
                && (this.contentsMorph.list === this.contents);

    // re-build my contents
    if (this.contentsMorph && !isSameList) {
        this.contentsMorph.destroy();
    }

    if (!isSameList) {
        if (this.contents instanceof Morph) {
            this.contentsMorph = this.contents;
        } else if (isString(this.contents)) {
            txt  = this.contents.length > 500 ?
                    this.contents.slice(0, 500) + '...' : this.contents;
            this.contentsMorph = new TextMorph(
                txt,
                fontSize,
                null,
                true,
                false,
                'left' // was formerly 'center', reverted b/c of code-mapping
            );
            if (this.isEditable) {
                this.contentsMorph.isEditable = true;
                this.contentsMorph.enableSelecting();
            }
            this.contentsMorph.setColor(new Color(255, 255, 255));
        } else if (this.contents instanceof List) {
            if (this.isCircular()) {
                this.contentsMorph = new TextMorph(
                    '(...)',
                    fontSize,
                    null,
                    false, // bold
                    true, // italic
                    'center'
                );
                this.contentsMorph.setColor(new Color(255, 255, 255));
            } else {
                this.contentsMorph = new ListWatcherMorph(
                    this.contents,
                    this
                );
                this.contentsMorph.isDraggable = false;
            }
        } else {
            this.contentsMorph = new TextMorph(
                !isNil(this.contents) ? this.contents.toString() : '',
                fontSize,
                null,
                true,
                false,
                'center'
            );
            if (this.isEditable) {
                this.contentsMorph.isEditable = true;
                this.contentsMorph.enableSelecting();
            }
            this.contentsMorph.setColor(new Color(255, 255, 255));
        }
        this.add(this.contentsMorph);
    }

    // adjust my layout
    this.silentSetHeight(this.contentsMorph.height()
        + this.edge
        + this.border * 2);
    this.silentSetWidth(Math.max(
        this.contentsMorph.width() + this.edge * 2,
        (this.contents instanceof List ? 0 :
                    SyntaxElementMorph.prototype.fontSize * 3.5)
    ));

    // draw my outline
    this.image = newCanvas(this.extent());
    context = this.image.getContext('2d');
    if ((this.edge === 0) && (this.border === 0)) {
        BoxMorph.uber.drawNew.call(this);
        return null;
    }
    context.fillStyle = this.color.toString();
    context.beginPath();
    this.outlinePath(
        context,
        Math.max(this.edge - this.border, 0),
        this.border
    );
    context.closePath();
    context.fill();

    // position my contents
    if (!isSameList) {
        this.contentsMorph.setCenter(this.center());
    }
};

CellMorph.prototype.drawShadow = function (context, radius, inset) {
    var offset = radius + inset,
        w = this.width(),
        h = this.height();

    // bottom left:
    context.beginPath();
    context.moveTo(0, h - offset);
    context.lineTo(0, offset);
    context.stroke();

    // top left:
    context.beginPath();
    context.arc(
        offset,
        offset,
        radius,
        radians(-180),
        radians(-90),
        false
    );
    context.stroke();

    // top right:
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(w - offset, 0);
    context.stroke();
};

// CellMorph editing (inside list watchers):

CellMorph.prototype.layoutChanged = function () {
    var context,
        fontSize = SyntaxElementMorph.prototype.fontSize,
        listWatcher = this.parentThatIsA(ListWatcherMorph);

    if (this.isBig) {
        fontSize = fontSize * 1.5;
    }

    // adjust my layout
    this.silentSetHeight(this.contentsMorph.height()
        + this.edge
        + this.border * 2);
    this.silentSetWidth(Math.max(
        this.contentsMorph.width() + this.edge * 2,
        (this.contents instanceof Context ||
            this.contents instanceof List ? 0 : this.height() * 2)
    ));


    // draw my outline
    this.image = newCanvas(this.extent());
    context = this.image.getContext('2d');
    if ((this.edge === 0) && (this.border === 0)) {
        BoxMorph.uber.drawNew.call(this);
        return null;
    }
    context.fillStyle = this.color.toString();
    context.beginPath();
    this.outlinePath(
        context,
        Math.max(this.edge - this.border, 0),
        this.border
    );
    context.closePath();
    context.fill();
    
    // position my contents
    this.contentsMorph.setCenter(this.center());

    if (listWatcher) {
        listWatcher.fixLayout();
    }
};

CellMorph.prototype.reactToEdit = function (textMorph) {
    var listWatcher;
    if (!isNil(this.idx)) {
        listWatcher = this.parentThatIsA(ListWatcherMorph);
        if (listWatcher) {
            listWatcher.list.put(textMorph.text, this.idx);
        }
    }
};

CellMorph.prototype.mouseClickLeft = function (pos) {
    if (this.isEditable && this.contentsMorph instanceof TextMorph) {
        this.contentsMorph.selectAllAndEdit();
    } else {
        this.escalateEvent('mouseClickLeft', pos);
    }
};

// WatcherMorph //////////////////////////////////////////////////////////

/*
    I am a little window which observes some value and continuously
    updates itself accordingly.
*/

// WatcherMorph inherits from BoxMorph:

WatcherMorph.prototype = new BoxMorph();
WatcherMorph.prototype.constructor = WatcherMorph;
WatcherMorph.uber = BoxMorph.prototype;

// WatcherMorph instance creation:

function WatcherMorph(label, color, board, getter, isHidden) {
    this.init(label, color, board, getter, isHidden);
}

WatcherMorph.prototype.init = function (
    label,
    color,
    board,
    getter,
    isHidden
) {
    // additional properties
    this.labelText = label || '';
    this.version = null;
    this.objName = '';

    // initialize inherited properties
    WatcherMorph.uber.init.call(
        this,
        SyntaxElementMorph.prototype.rounding,
        1.000001, // shadow bug in Chrome,
        new Color(120, 120, 120)
    );

    // override inherited behavior
    this.color = new Color(220, 220, 220);
    this.readoutColor = color;
    this.style = 'normal';
    this.board = board ;
    this.getter = getter || null; // callback or variable name (string)
    this.currentValue = null;
    this.labelMorph = null;
    this.cellMorph = null;
    this.isDraggable = true;
    this.fixLayout();
    this.update();
    if (isHidden) { // for de-serializing
        this.hide();
    }
};

// WatcherMorph updating:

WatcherMorph.prototype.update = function () {
    var newValue, num;

    if (this.board && this.getter) {
        /*
        if (this.target instanceof VariableFrame) {
            newValue = this.target.vars[this.getter] ?
                    this.target.vars[this.getter].value : undefined;
            if (newValue === undefined && this.target.owner) {
                sprite = this.target.owner;
                if (contains(sprite.inheritedVariableNames(), this.getter)) {
                    newValue = this.target.getVar(this.getter);
                    // ghost cell color
                    this.cellMorph.setColor(
                        SpriteMorph.prototype.blockColor.variables
                            .lighter(35)
                    );
                } else {
                    this.destroy();
                    return;
                }
            } else {
                // un-ghost the cell color
                this.cellMorph.setColor(
                    SpriteMorph.prototype.blockColor.variables
                );
            }
        } else {
            newValue = this.target[this.getter]();
        }
        if (newValue !== '' && !isNil(newValue)) {
            num = +newValue;
            if (typeof newValue !== 'boolean' && !isNaN(num)) {
                newValue = Math.round(newValue * 1000000000) / 1000000000;
            }
        }
        if (newValue !== this.currentValue) {
            this.changed();
            this.cellMorph.contents = newValue;
            this.cellMorph.drawNew();
            if (!isNaN(newValue)) {
                this.sliderMorph.value = newValue;
                this.sliderMorph.drawNew();
            }
            this.fixLayout();
            this.currentValue = newValue;
        }
        */
    }
    if (this.cellMorph.contentsMorph instanceof ListWatcherMorph) {
        this.cellMorph.contentsMorph.update();
    }
};

// WatcherMorph layout:

WatcherMorph.prototype.fixLayout = function () {
    var fontSize = SyntaxElementMorph.prototype.fontSize, isList,
        myself = this;

    this.changed();

    // create my parts
    if (this.labelMorph === null) {
        this.labelMorph = new StringMorph(
            this.labelText,
            fontSize,
            null,
            true,
            false,
            false,
            new Point(),
            new Color(255, 255, 255)
        );
        this.add(this.labelMorph);
    }
    if (this.cellMorph === null) {
        this.cellMorph = new CellMorph('', this.readoutColor);
        this.add(this.cellMorph);
    }
    
    // adjust my layout
    isList = this.cellMorph.contents instanceof List;

    this.labelMorph.show();
    this.labelMorph.setPosition(this.position().add(new Point(
        this.edge,
        this.border + SyntaxElementMorph.prototype.typeInPadding
    )));

    if (isList) {
        this.cellMorph.setPosition(this.labelMorph.bottomLeft().add(
            new Point(0, SyntaxElementMorph.prototype.typeInPadding)
        ));
    } else {
        this.cellMorph.setPosition(this.labelMorph.topRight().add(new Point(
            fontSize / 3,
            0
        )));
        this.labelMorph.setTop(
            this.cellMorph.top()
                + (this.cellMorph.height() - this.labelMorph.height()) / 2
        );
    }

    this.bounds.corner.y = this.cellMorph.bottom()
        + this.border
        + SyntaxElementMorph.prototype.typeInPadding;
    this.bounds.corner.x = Math.max(
        this.cellMorph.right(),
        this.labelMorph.right()
    ) + this.edge
        + SyntaxElementMorph.prototype.typeInPadding;
    this.drawNew();
    this.changed();
};

// WatcherMorph drawing:

WatcherMorph.prototype.drawNew = function () {
    var context,
        gradient;
    this.image = newCanvas(this.extent());
    context = this.image.getContext('2d');
    BoxMorph.uber.drawNew.call(this);
};
