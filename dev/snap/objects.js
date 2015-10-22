/*

    objects.js

    a scriptable microworld
    based on morphic.js, blocks.js and threads.js
    inspired by Scratch

    written by Jens Mönig
    jens@moenig.org

    Copyright (C) 2015 by Jens Mönig

    This file is part of Snap!.

    Snap! is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of
    the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.


    prerequisites:
    --------------
    needs blocks.js, wc.js, morphic.js and widgets.js


    toc
    ---
    the following list shows the order in which all constructors are
    defined. Use this list to locate code in this document:

        BoardMorph
        BoardHighlightMorph
        CellMorph
        WatcherMorph

        SpeechBubbleMorph*
            BoardBubbleMorph

    * defined in Morphic.js
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
        'custom'
    ];

BoardMorph.prototype.blockColor = {
    control : new Color(230, 168, 34),
    operators : new Color(98, 194, 19),
    data : new Color(243, 118, 29),
    'input / output' : new Color(207, 74, 217),
    comm: new Color(130, 92, 124),
    custom : new Color(150, 150, 150)
};

BoardMorph.prototype.paletteColor = new Color(55, 55, 55);
BoardMorph.prototype.paletteTextColor = new Color(230, 230, 230);
BoardMorph.prototype.sliderColor
    = BoardMorph.prototype.paletteColor.lighter(30);
BoardMorph.prototype.isCachingPrimitives = true;

BoardMorph.prototype.bubbleColor = new Color(255, 255, 255);
BoardMorph.prototype.bubbleFontSize = 14;
BoardMorph.prototype.bubbleFontIsBold = true;
BoardMorph.prototype.bubbleCorner = 10;
BoardMorph.prototype.bubbleBorder = 3;
BoardMorph.prototype.bubbleBorderColor = new Color(190, 190, 190);
BoardMorph.prototype.bubbleMaxTextWidth = 130;

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
            category: 'custom',
            spec: '%rc %ringparms',
            alias: 'command ring lambda'
        },
        reifyReporter: {
            type: 'ring',
            category: 'custom',
            spec: '%rr %ringparms',
            alias: 'reporter ring lambda'
        },
        reifyPredicate: {
            type: 'ring',
            category: 'custom',
            spec: '%rp %ringparms',
            alias: 'predicate ring lambda'
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
            spec: '%s < %s'
        },
        reportEquals: {
            type: 'reporter',
            category: 'operators',
            spec: '%s = %s'
        },
        reportGreaterThan: {
            type: 'reporter',
            category: 'operators',
            spec: '%s > %s'
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
        doDeclareVariables: {
            type: 'command',
            category: 'data',
            spec: 'script variables %scriptVars'
        },
        // Tables
        reportNewList: {
            type: 'reporter',
            category: 'data',
            spec: 'table %exp'
        },

        // Input/Output
        setPinDigital: {
            type: 'command',
            category: 'input / output',
            spec: 'set pin %n to digital %s',
            defaults: [1, true]
        },
        setPinAnalog: {
            type: 'command',
            category: 'input / output',
            spec: 'set pin %n to analog %s',
            defaults: [4, 128]
        },
        getPinDigital: {
            type: 'reporter',
            category: 'input / output',
            spec: 'get digital value from pin %n',
            defaults: [5]
        },
        getPinAnalog: {
            type: 'reporter',
            category: 'input / output',
            spec: 'get analog value from pin %n',
            defaults: [6]
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
    doChangeVar: ['doSetVar']
};

// BoardMorph instance creation

function BoardMorph() {
    this.init();
}

BoardMorph.prototype.init = function () {
    this.name = localize('Board');
    this.scripts = new ScriptsMorph(this);
    this.customBlocks = [];
    this.version = Date.now(); // for observer optimization

    this.blocksCache = {}; // not to be serialized (!)
    this.paletteCache = {}; // not to be serialized (!)
    this.idx = 0; // not to be serialized (!) - used for de-serialization
    
    this.coroutines = [];

    this.serialConnect('/dev/ttyUSB0', 115200);

    BoardMorph.uber.init.call(this);
};

BoardMorph.prototype.findCoroutine = function(id) {
    return detect(this.coroutines, function(coroutine) { return coroutine.id === id });
}

BoardMorph.prototype.serialConnect = function(port, baudrate) {
    var serialLib = require('serialport'),
        SerialPort = serialLib.SerialPort,
        myself = this;

    this.serialPort = new SerialPort(
            port, 
            { 
                baudrate: baudrate, 
                buffersize: 64,
                parser: serialLib.parsers.readline("\n")
            });

    this.serialPort.on('open', function (err) {
        if (err) { console.log(err) };
        myself.serialPort.on('data', function(data) {
            // We use a prefix to know whether this data is meant for us
            if (data.slice(0,2) === 'wc') {
                try {
                    var id = data.match(/^wc:(.*):/, '$1')[1],
                        contents = data.match(/^wc:.*:(.*)/, '$1')[1];
                    if (id === 'r') {
                        // It's just a reporter block, we need to flush its coroutine afterwards
                        var block = myself.findCoroutine(id).topBlock;
                        block.showBubble(contents);
                        myself.removeCoroutine(block.coroutine);
                    } else {
                        myself.findCoroutine(Number.parseInt(id)).topBlock.showBubble(contents);
                    }
                } catch (err) {
                    console.log(myself);
                    myself.parentThatIsA(IDE_Morph).showMessage('Error parsing data back from the board:\n' + data + '\n' + err);
                }
            }
        });
    });

    // PinOut depends on the board
    // For now we're supporting the WhiteCat board, but adding a menu
    // option for other boards is trivial
    this.loadPinOut('whitecat');
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
                myself.pinOut = JSON.parse(data);
            } catch (error) {
                myself.parentThatIsA(IDE_Morph).showMessage(error + '\nCould not parse pinout specs file for\n' 
                    + boardName + ' board. Input / output blocks\nare not going to work!');
            }
        }
    });
}

BoardMorph.prototype.stopAll = function() {
    this.serialPort.write('\r');
}

// Coroutine handling

BoardMorph.prototype.addCoroutineForBlock = function(topBlock) {
    var coroutine, 
        id = 0;

    if (this.coroutines.length > 0) {
        id = this.coroutines[this.coroutines.length - 1].id + 1;
    }

    coroutine = new Coroutine(id, topBlock);
    topBlock.coroutine = coroutine;
    coroutine.setBody(new LuaExpression(topBlock, this));

    return this.addCoroutine(coroutine);
}

BoardMorph.prototype.addCoroutine = function(coroutine) {
    this.coroutines.push(coroutine);
    return coroutine;
}

BoardMorph.prototype.removeCoroutine = function(coroutine) {
    coroutine.topBlock.coroutine = null;
    this.coroutines.splice(this.coroutines.indexOf(coroutine), 1);
}

BoardMorph.prototype.clearCoroutines = function() {
    this.coroutines = [];
    this.stopAll();
}

BoardMorph.prototype.buildCoroutines = function(topBlocksToRun) {
    // Build all coroutines based on the block stacks on the scripts canvas
    // Fire up the coroutines that correspond with topBlocksToRun
    // Add all that to autorun.lua so it's persistent upon reset

    var myself = this,
        coroutinesToRun = [],
        opening = 'io.stdinred("autorun.lua")\r',
        luaScript = '',
        closing = '\rio.stdinred()\rdofile("autorun.lua")\r';

    this.clearCoroutines();

    this.scripts.children.forEach(function(topBlock) {
        if (topBlock instanceof ReporterBlockMorph) { return };

        var coroutine = myself.addCoroutineForBlock(topBlock);
        luaScript += coroutine.body + ';\r';
        if (topBlocksToRun.indexOf(topBlock) > -1) {
            coroutinesToRun.push(coroutine);
        };
    })

    luaScript += new Scheduler(coroutinesToRun) + '\r';
    luaScript += closing + '\r'; 

    // We should probably not stop everything, but that's how it works for now
    this.stopAll();

    function writeAndDrain (data, callback) {
        myself.serialPort.write(data, function() {
            myself.serialPort.drain(callback);
        });
    }

    writeAndDrain(opening, function(err) {
        var index = 0;

        if (err) { console.log(err) };

        function writeSlice() {
            if (index > luaScript.length) { return };
            var chunk = luaScript.slice(index, index + 255);
            
            // Ugly delay. Needed until we solve the buffer issue at the other side of the cable
            for (i=0; i<100000000; i++) {};

            writeAndDrain(
                    chunk,
                    function(err) {
                        if (err) { console.log(err) };
                        index += 255;
                        writeSlice();
                    });
        }

        writeSlice();
    });
}

BoardMorph.prototype.getReporterResult = function (block) {
    this.serialPort.write(
            'local result = '
            + new LuaExpression(block) 
            + '; print("wc:'
            + block.coroutine.id 
            + ':"..tostring(result));\r'
            );
}

// BoardMorph duplicating (fullCopy)

BoardMorph.prototype.fullCopy = function () {
    var c = BoardMorph.uber.fullCopy.call(this),
        myself = this,
        cb;

    c.blocksCache = {};
    c.paletteCache = {};
    c.scripts = this.scripts.fullCopy();
    c.scripts.owner = c;
    c.customBlocks = [];
    this.customBlocks.forEach(function (def) {
        cb = def.copyAndBindTo(c);
        c.customBlocks.push(cb);
        c.allBlockInstances(def).forEach(function (block) {
            block.definition = cb;
        });
    });

    return c;
};

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
    if (contains(['reifyReporter', 'reifyPredicate'], block.selector)) {
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
                    inputs[i].setContents(defaults[i]);
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

    function helpMenu() {
        var menu = new MenuMorph(this);
        menu.addItem('help...', 'showHelp');
        return menu;
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
        blocks.push('-');
        blocks.push(block('doStopThis'));
        blocks.push(block('doStopOthers'));
        blocks.push('-');
        blocks.push(block('doRun'));
        blocks.push(block('fork'));
        blocks.push(block('evaluate'));
        blocks.push('-');
        

    } else if (cat === 'operators') {

        blocks.push(block('reifyScript'));
        blocks.push(block('reifyReporter'));
        blocks.push(block('reifyPredicate'));
        blocks.push('#');
        blocks.push('-');
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

    } else if (cat === 'data') {

        blocks.push(block('doSetVar'));
        blocks.push(block('doChangeVar'));
        blocks.push(block('doDeclareVariables'));

        blocks.push('=');

        blocks.push(block('reportNewList'));

        blocks.push('=');

        button = new PushButtonMorph(
            null,
            function () {
                var ide = myself.parentThatIsA(IDE_Morph);
                new BlockDialogMorph(
                    null,
                    function (definition) {
                        if (definition.spec !== '') {
                            myself.customBlocks.push(definition);
                            ide.flushPaletteCache();
                            ide.refreshPalette();
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
        blocks.push(button);
    } else if (cat === 'input / output') {

        blocks.push(block('setPinDigital'));
        blocks.push(block('setPinAnalog'));
        blocks.push('-');
        blocks.push(block('getPinDigital'));
        blocks.push(block('getPinAnalog'));

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
            ide = this.parentThatIsA(IDE_Morph),
            more = {
                operators:
                    ['reifyScript', 'reifyReporter', 'reifyPredicate'],
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
                        ['custom'],
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
        ide = this.parentThatIsA(IDE_Morph),
        oldSearch = '',
        searchBar = new InputFieldMorph(searchString || ''),
        searchPane = ide.createPalette('forSearch'),
        blocksList = [],
        selection,
        focus;

    function showSelection() {
        if (focus) {focus.destroy(); }
        if (!selection || !scriptFocus) {return; }
        focus = selection.outline(
            MorphicPreferences.isFlat ? new Color(150, 200, 255)
                    : new Color(255, 255, 255),
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
    searchBar.setWidth(ide.logo.width() - 30);
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
        ide.refreshPalette();
        ide.palette.adjustScrollBars();
    };

    ide.fixLayout('refreshPalette');
    searchBar.edit();
    if (searchString) {searchPane.reactToKeystroke(); }
};

// BoardMorph primitives

// BoardMorph message broadcasting

BoardMorph.prototype.allMessageNames = function () {
    var msgs = [];
    this.scripts.allChildren().forEach(function (morph) {
        var txt;
        if (morph.selector) {
            if (contains(
                    ['receiveMessage', 'doBroadcast', 'doBroadcastAndWait'],
                    morph.selector
                )) {
                txt = morph.inputs()[0].evaluate();
                if (isString(txt) && txt !== '') {
                    if (!contains(msgs, txt)) {
                        msgs.push(txt);
                    }
                }
            }
        }
    });
    return msgs;
};

BoardMorph.prototype.allHatBlocksFor = function (message) {
    if (typeof message === 'number') {message = message.toString(); }
    return this.scripts.children.filter(function (morph) {
        var event;
        if (morph.selector) {
            if (morph.selector === 'receiveMessage') {
                event = morph.inputs()[0].evaluate();
                return event === message
                    || (event instanceof Array
                        && message !== '__shout__go__'
                        && message !== '__clone__init__');
            }
            if (morph.selector === 'receiveGo') {
                return message === '__shout__go__';
            }
            if (morph.selector === 'receiveOnClone') {
                return message === '__clone__init__';
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
    var ide = this.parentThatIsA(IDE_Morph);
    if (!ide) {return null; }
    return detect(
        ide.palette.contents.children,
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
        myself = this,
        ide;
    doubles.forEach(function (double) {
        myself.allBlockInstances(double).forEach(function (block) {
            block.definition = definition;
            block.refresh();
        });
    });
    
    this.customBlocks = this.customBlocks.filter(function (def) {
        return !contains(doubles, def);
    });
    ide = this.parentThatIsA(IDE_Morph);
    if (ide) {
        ide.flushPaletteCache();
        ide.refreshPalette();
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
