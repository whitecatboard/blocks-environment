/*

    store.js

    saving and loading Snap! projects

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
    needs morphic.js, xml.js, and most of Snap!'s other modules


    hierarchy
    ---------
    the following tree lists all constructors hierarchically,
    indentation indicating inheritance. Refer to this list to get a
    contextual overview:

        XML_Serializer
            SnapSerializer


    credits
    -------
    Nathan Dinsmore contributed to the design and implemented a first
    working version of a complete XMLSerializer. I have taken much of the
    overall design and many of the functions and methods in this file from
    Nathan's fine original prototype.

*/

/*global modules, XML_Element, VariableFrame, ,
, WatcherMorph, Point, CustomBlockDefinition, ,
ReporterBlockMorph, CommandBlockMorph, HatBlockMorph, RingMorph, contains,
detect, CustomCommandBlockMorph, CustomReporterBlockMorph, Color, List,
newCanvas, Costume, Sound, Audio, IDE_Morph, ScriptsMorph, BlockMorph,
ArgMorph, InputSlotMorph, TemplateSlotMorph, CommandSlotMorph,
FunctionSlotMorph, MultiArgMorph, ColorSlotMorph, nop, CommentMorph, isNil,
localize, sizeOf, ArgLabelMorph, SVG_Costume, MorphicPreferences,
SyntaxElementMorph, Variable*/

// XML_Serializer ///////////////////////////////////////////////////////
/*
    I am an abstract protype for my heirs.

    I manage object identities and keep track of circular data structures.
    Objects are "touched" and a property named "serializationID" is added
    to each, representing an index integer in the list, starting with 1.
*/

// XML_Serializer instance creation:

function XML_Serializer() {
    this.contents = [];
}

// XML_Serializer preferences settings:

XML_Serializer.prototype.idProperty = 'serializationID';
XML_Serializer.prototype.version = 1; // increment on structural change

// XML_Serializer accessing:

XML_Serializer.prototype.serialize = function (object) {
    // public: answer an XML string representing the given object
    var xml;
    this.flush(); // in case an error occurred in an earlier attempt
    xml = this.store(object);
    this.flush();
    return xml;
};

XML_Serializer.prototype.store = function (object, mediaID) {
    // private - mediaID is optional
    if (isNil(object) || !object.toXML) {
        // unsupported type, to be checked before calling store()
        // when debugging, be sure to throw an error at this point
        return '';
    }
    if (object[this.idProperty]) {
        return this.format('<ref id="@"></ref>', object[this.idProperty]);
    }
    this.add(object);
    return object.toXML(this, mediaID).replace(
        '~',
        this.format('id="@"', object[this.idProperty])
    );
};

XML_Serializer.prototype.add = function (object) {
    // private - mark the object with a serializationID property and add it
    if (object[this.idProperty]) { // already present
        return -1;
    }
    this.contents.push(object);
    object[this.idProperty] = this.contents.length;
    return this.contents.length;
};

XML_Serializer.prototype.at = function (integer) {
    // private
    return this.contents[integer - 1];
};

XML_Serializer.prototype.flush = function () {
    // private - free all objects and empty my contents
    var myself = this;
    this.contents.forEach(function (obj) {
        delete obj[myself.idProperty];
    });
    this.contents = [];
};

// XML_Serializer formatting:

XML_Serializer.prototype.escape = XML_Element.prototype.escape;
XML_Serializer.prototype.unescape = XML_Element.prototype.unescape;


XML_Serializer.prototype.format = function (string) {
    // private
    var myself = this,
        i = -1,
        values = arguments,
        value;

    return string.replace(/[@$%]([\d]+)?/g, function (spec, index) {
        index = parseInt(index, 10);

        if (isNaN(index)) {
            i += 1;
            value = values[i + 1];
        } else {
            value = values[index + 1];
        }
        // original line of code - now frowned upon by JSLint:
        // value = values[(isNaN(index) ? (i += 1) : index) + 1];

        return spec === '@' ?
                myself.escape(value)
                    : spec === '$' ?
                        myself.escape(value, true)
                            : value;
    });
};

// XML_Serializer loading:

XML_Serializer.prototype.load = function (xmlString) {
    // public - answer a new object which is represented by the given
    // XML string.
    nop(xmlString);
    throw new Error(
        'loading should be implemented in heir of XML_Serializer'
    );
};

XML_Serializer.prototype.parse = function (xmlString) {
    // private - answer an XML_Element representing the given XML String
    var element = new XML_Element();
    element.parseString(xmlString);
    return element;
};

// SnapSerializer ////////////////////////////////////////////////////////////

var SnapSerializer;

// SnapSerializer inherits from XML_Serializer:

SnapSerializer.prototype = new XML_Serializer();
SnapSerializer.prototype.constructor = SnapSerializer;
SnapSerializer.uber = XML_Serializer.prototype;

// SnapSerializer constants:

SnapSerializer.prototype.app = 'WhiteCat 0.1b';

/*
SnapSerializer.prototype.watcherLabels = {
    xPosition: 'x position',
    yPosition: 'y position',
    direction: 'direction',
    getScale: 'size',
    getTempo: 'tempo',
    getLastAnswer: 'answer',
    getLastMessage: 'message',
    getTimer: 'timer',
    getCostumeIdx: 'costume #',
    reportMouseX: 'mouse x',
    reportMouseY: 'mouse y',
    reportThreadCount: 'processes'
};
*/

// SnapSerializer instance creation:

function SnapSerializer() {
    this.init();
}

// SnapSerializer initialization:

SnapSerializer.prototype.init = function () {
    this.project = {};
};

// SnapSerializer loading:

SnapSerializer.prototype.load = function (xmlString, ide) {
    // public - answer a new Project represented by the given XML String
    return this.loadProjectModel(this.parse(xmlString), ide);
};

SnapSerializer.prototype.loadProjectModel = function (xmlNode, ide) {
    // public - answer a new Project represented by the given XML top node
    // show a warning if the origin apps differ

    var appInfo = xmlNode.attributes.app,
        app = appInfo ? appInfo.split(' ')[0] : null;

    if (ide && app && app !== this.app.split(' ')[0]) {
        ide.inform(
            app + ' Project',
            'This project has been created by a different app:\n\n' +
                app +
                '\n\nand may be incompatible or fail to load here.'
        );
    }
    return this.rawLoadProjectModel(xmlNode, ide);
};

SnapSerializer.prototype.rawLoadProjectModel = function (xmlNode, ide) {
    // private
    var myself = this,
        project = {},
        model,
        nameID;

    this.project = project;

    model = { project: xmlNode };
    if (+xmlNode.attributes.version > this.version) {
        throw 'Project uses newer version of Serializer';
    }

    /* Project Info */

    project.name = model.project.attributes.name;
    if (!project.name) {
        nameID = 1;
        while (
            Object.prototype.hasOwnProperty.call(
                localStorage,
                '-snap-project-Untitled ' + nameID
            )
        ) {
            nameID += 1;
        }
        project.name = 'Untitled ' + nameID;
    }
    model.notes = model.project.childNamed('notes');
    if (model.notes) {
        project.notes = model.notes.contents;
    }

    /*
    model.globalVariables = model.project.childNamed('variables');
    project.globalVariables = new VariableFrame();
    */
    /* Global Variables */

    /*
    if (model.globalVariables) {
        this.loadVariables(
            project.globalVariables,
            model.globalVariables
        );
    }
    */

    /* Watchers */

    /*
    model.board.childrenNamed('watcher').forEach(function (model) {
        var watcher, color, target, hidden, extX, extY;

        color = myself.loadColor(model.attributes.color);
        target = Object.prototype.hasOwnProperty.call(
            model.attributes,
            'scope'
        ) ? project.board[model.attributes.scope] : null;

        // determine whether the watcher is hidden, slightly
        // complicated to retain backward compatibility
        // with former tag format: hidden="hidden"
        // now it's: hidden="true"
        hidden = Object.prototype.hasOwnProperty.call(
            model.attributes,
            'hidden'
        ) && (model.attributes.hidden !== 'false');

        if (Object.prototype.hasOwnProperty.call(
                model.attributes,
                'var'
            )) {
            watcher = new WatcherMorph(
                model.attributes['var'],
                color,
                isNil(target) ? project.globalVariables
                    : target.variables,
                model.attributes['var'],
                hidden
            );
        } else {
            watcher = new WatcherMorph(
                localize(myself.watcherLabels[model.attributes.s]),
                color,
                target,
                model.attributes.s,
                hidden
            );
        }
        watcher.setStyle(model.attributes.style || 'normal');
        if (watcher.style === 'slider') {
            watcher.setSliderMin(model.attributes.min || '1', true);
            watcher.setSliderMax(model.attributes.max || '100', true);
        }
        watcher.setPosition(
            project.board.topLeft().add(new Point(
                +model.attributes.x || 0,
                +model.attributes.y || 0
            ))
        );
        project.board.add(watcher);
        watcher.onNextStep = function () {this.currentValue = null; };

        // set watcher's contentsMorph's extent if it is showing a list and
        // its monitor dimensions are given
        if (watcher.currentValue instanceof List) {
            extX = model.attributes.extX;
            if (extX) {
                watcher.cellMorph.contentsMorph.setWidth(+extX);
            }
            extY = model.attributes.extY;
            if (extY) {
                watcher.cellMorph.contentsMorph.setHeight(+extY);
            }
            // adjust my contentsMorph's handle position
            watcher.cellMorph.contentsMorph.handle.drawNew();
        }
    });
    */

    model.board = model.project.require('board');
    project.board = ide.board;

    try {
        model.board.broker = model.board.require('broker');
        project.board.broker.url = model.board.broker.attributes.url;
        project.board.broker.port = model.board.broker.attributes.port;
        project.board.broker.deviceID = model.board.broker.attributes.deviceID;
        project.board.broker.username = model.board.broker.attributes.username;
        project.board.broker.password = model.board.broker.attributes.password;
    } catch (err) {
        console.log(err);
        console.log('probably an old project, please resave!'); 
    }
    this.loadObject(project.board, model.board);

    this.objects = {};
    return project;
};

SnapSerializer.prototype.loadBlocks = function (xmlString, targetStage) {
    // public - answer a new Array of custom block definitions
    // represented by the given XML String
    /*
    var board = new BoardMorph(),
        model;

    this.project = {
        board: board
    };
    model = this.parse(xmlString);
    if (+model.attributes.version > this.version) {
        throw 'Module uses newer version of Serializer';
    }
    this.loadCustomBlocks(board, model, true);
    this.populateCustomBlocks(
        board,
        model,
        true
    );
    board.globalBlocks.forEach(function (def) {
        def.receiver = null;
    });
    this.project = {};
    return board.globalBlocks;
    */
};

SnapSerializer.prototype.loadObject = function (object, model) {
    // private
    var blocks = model.require('blocks');
    this.loadCustomBlocks(object, blocks);
    this.populateCustomBlocks(object, blocks);
//    this.loadVariables(object.variables, model.require('variables'));
    this.loadScripts(object.scripts, model.require('scripts'));
};

SnapSerializer.prototype.loadVariables = function (varFrame, element) {
    // private
    var myself = this;

    /*
    element.children.forEach(function (child) {
        var value;
        if (child.tag !== 'variable') {
            return;
        }
        value = child.children[0];
        varFrame.vars[child.attributes.name] = new Variable(value ?
                myself.loadValue(value) : 0);
    });
    */
};

SnapSerializer.prototype.loadCustomBlocks = function (
    object,
    element,
    isGlobal
) {
    /*
    // private
    var myself = this;
    element.children.forEach(function (child) {
        var definition, names, inputs, header, code, comment, i;
        if (child.tag !== 'block-definition') {
            return;
        }
        definition = new CustomBlockDefinition(
            child.attributes.s || '',
            object
        );
        definition.category = child.attributes.category || 'other';
        definition.type = child.attributes.type || 'command';
        definition.isGlobal = (isGlobal === true);
        if (definition.isGlobal) {
            object.globalBlocks.push(definition);
        } else {
            object.customBlocks.push(definition);
        }

        names = definition.parseSpec(definition.spec).filter(
            function (str) {
                return str.charAt(0) === '%' && str.length > 1;
            }
        ).map(function (str) {
            return str.substr(1);
        });

        definition.names = names;
        inputs = child.childNamed('inputs');
        if (inputs) {
            i = -1;
            inputs.children.forEach(function (child) {
                var options = child.childNamed('options');
                if (child.tag !== 'input') {
                    return;
                }
                i += 1;
                definition.declarations[names[i]] = [
                    child.attributes.type,
                    child.contents,
                    options ? options.contents : undefined,
                    child.attributes.readonly === 'true'
                ];
            });
        }

        header = child.childNamed('header');
        if (header) {
            definition.codeHeader = header.contents;
        }

        code = child.childNamed('code');
        if (code) {
            definition.codeMapping = code.contents;
        }

        comment = child.childNamed('comment');
        if (comment) {
            definition.comment = myself.loadComment(comment);
        }
    });
    */
};

SnapSerializer.prototype.populateCustomBlocks = function (
    object,
    element,
    isGlobal
) {
    /*
    // private
    var myself = this;
    element.children.forEach(function (child, index) {
        var definition, script, scripts;
        if (child.tag !== 'block-definition') {
            return;
        }
        definition = isGlobal ? object.globalBlocks[index]
                : object.customBlocks[index];
        script = child.childNamed('script');
        if (script) {
            definition.body = new Context(
                null,
                script ? myself.loadScript(script) : null,
                null,
                object
            );
            definition.body.inputs = definition.names.slice(0);
        }
        scripts = child.childNamed('scripts');
        if (scripts) {
            definition.scripts = myself.loadScriptsArray(scripts);
        }

        delete definition.names;
    });
    */
};

SnapSerializer.prototype.loadScripts = function (scripts, model) {
    // private
    var myself = this,
        scale = SyntaxElementMorph.prototype.scale;
    scripts.cachedTexture = IDE_Morph.prototype.scriptsPaneTexture;
    model.children.forEach(function (child) {
        var element;
        if (child.tag === 'script') {
            element = myself.loadScript(child);
            if (!element) {
                return;
            }
            element.setPosition(new Point(
                (+child.attributes.x || 0) * scale,
                (+child.attributes.y || 0) * scale
            ).add(scripts.topLeft()));
            scripts.add(element);
            element.fixBlockColor(null, true); // force zebra coloring
            element.allComments().forEach(function (comment) {
                comment.align(element);
            });
        } else if (child.tag === 'comment') {
            element = myself.loadComment(child);
            if (!element) {
                return;
            }
            element.setPosition(new Point(
                (+child.attributes.x || 0) * scale,
                (+child.attributes.y || 0) * scale
            ).add(scripts.topLeft()));
            scripts.add(element);
        }
    });
};

SnapSerializer.prototype.loadScriptsArray = function (model) {
    // private - answer an array containting the model's scripts
    var myself = this,
        scale = SyntaxElementMorph.prototype.scale,
        scripts = [];
    model.children.forEach(function (child) {
        var element;
        if (child.tag === 'board') {
            element = myself.loadScript(child);
            if (!element) {
                return;
            }
            element.setPosition(new Point(
                (+child.attributes.x || 0) * scale,
                (+child.attributes.y || 0) * scale
            ));
            scripts.push(element);
            element.fixBlockColor(null, true); // force zebra coloring
        } else if (child.tag === 'comment') {
            element = myself.loadComment(child);
            if (!element) {
                return;
            }
            element.setPosition(new Point(
                (+child.attributes.x || 0) * scale,
                (+child.attributes.y || 0) * scale
            ));
            scripts.push(element);
        }
    });
    return scripts;
};

SnapSerializer.prototype.loadScript = function (model) {
    // private
    var topBlock, block, nextBlock,
        myself = this;
    model.children.forEach(function (child) {
        nextBlock = myself.loadBlock(child);
        if (!nextBlock) {
            return;
        }
        if (block) {
            block.nextBlock(nextBlock);
        } else {
            topBlock = nextBlock;
        }
        block = nextBlock;
    });
    return topBlock;
};

SnapSerializer.prototype.loadComment = function (model) {
    // private
    var comment = new CommentMorph(model.contents),
        scale = SyntaxElementMorph.prototype.scale;
    comment.isCollapsed = (model.attributes.collapsed === 'true');
    comment.setTextWidth(+model.attributes.w * scale);
    return comment;
};

SnapSerializer.prototype.loadBlock = function (model, isReporter) {
    // private
    var block, info, inputs, isGlobal, rm, receiver;
    if (model.tag === 'block') {
        if (Object.prototype.hasOwnProperty.call(
                model.attributes,
                'var'
            )) {
            return BoardMorph.prototype.variableBlock(
                model.attributes['var']
            );
        }
        block = BoardMorph.prototype.blockForSelector(model.attributes.s);
    } else if (model.tag === 'custom-block') {
        isGlobal = model.attributes.scope ? false : true;
        receiver = isGlobal ? this.project.board
            : this.project.board[model.attributes.scope];
        rm = model.childNamed('receiver');
        if (rm && rm.children[0]) {
            receiver = this.loadValue(
                model.childNamed('receiver').children[0]
            );
        }
        if (!receiver) {
            if (!isGlobal) {
                receiver = this.project.board;
            } else {
                return this.obsoleteBlock(isReporter);
            }
        }
        if (isGlobal) {
            info = detect(receiver.globalBlocks, function (block) {
                return block.blockSpec() === model.attributes.s;
            });
            if (!info && this.project.targetStage) { // importing block files
                info = detect(
                    this.project.targetStage.globalBlocks,
                    function (block) {
                        return block.blockSpec() === model.attributes.s;
                    }
                );
            }
        } else {
            info = detect(receiver.customBlocks, function (block) {
                return block.blockSpec() === model.attributes.s;
            });
        }
        if (!info) {
            return this.obsoleteBlock(isReporter);
        }
        block = info.type === 'command' ? new CustomCommandBlockMorph(
            info,
            false
        ) : new CustomReporterBlockMorph(
            info,
            info.type === 'predicate',
            false
        );
    }
    if (block === null) {
        block = this.obsoleteBlock(isReporter);
    }
    block.isDraggable = true;
    inputs = block.inputs();
    model.children.forEach(function (child, i) {
        if (child.tag === 'comment') {
            block.comment = this.loadComment(child);
            block.comment.block = block;
        } else if (child.tag === 'receiver') {
            nop(); // ignore
        } else {
            this.loadInput(child, inputs[i], block);
        }
    }, this);
    block.cachedInputs = null;
    return block;
};

SnapSerializer.prototype.obsoleteBlock = function (isReporter) {
    // private
    var block = isReporter ? new ReporterBlockMorph()
            : new CommandBlockMorph();
    block.selector = 'nop';
    block.color = new Color(200, 0, 20);
    block.setSpec('Obsolete!');
    block.isDraggable = true;
    return block;
};

SnapSerializer.prototype.loadInput = function (model, input, block) {
    // private
    var inp, val, myself = this;
    if (model.tag === 'script') {
        inp = this.loadScript(model);
        if (inp) {
            input.add(inp);
            input.fixLayout();
        }
    } else if (model.tag === 'autolambda' && model.children[0]) {
        inp = this.loadBlock(model.children[0], true);
        if (inp) {
            input.silentReplaceInput(input.children[0], inp);
            input.fixLayout();
        }
    } else if (model.tag === 'list') {
        while (input.inputs().length > 0) {
            input.removeInput();
        }
        model.children.forEach(function (item) {
            input.addInput();
            myself.loadInput(
                item,
                input.children[input.children.length - 2],
                input
            );
        });
        input.fixLayout();
    } else if (model.tag === 'block' || model.tag === 'custom-block') {
        block.silentReplaceInput(input, this.loadBlock(model, true));
    } else if (model.tag === 'color') {
        input.setColor(this.loadColor(model.contents));
    } else {
        val = this.loadValue(model);
        if (!isNil(val) && input.setContents) {
            input.setContents(this.loadValue(model));
        }
    }
};

SnapSerializer.prototype.loadValue = function (model) {
    // private
    var v, items, el, center, image, name, audio, option,
        myself = this;

    function record() {
        if (Object.prototype.hasOwnProperty.call(
                model.attributes,
                'id'
            )) {
            myself.objects[model.attributes.id] = v;
        }
    }
    switch (model.tag) {
    case 'ref':
        if (Object.prototype.hasOwnProperty.call(model.attributes, 'id')) {
            return this.objects[model.attributes.id];
        }
        if (Object.prototype.hasOwnProperty.call(
                model.attributes,
                'mediaID'
            )) {
            return this.mediaDict[model.attributes.mediaID];
        }
        throw new Error('expecting a reference id');
    case 'l':
        option = model.childNamed('option');
        return option ? [option.contents] : model.contents;
    case 'bool':
        return model.contents === 'true';
    case 'list':
        if (model.attributes.hasOwnProperty('linked')) {
            items = model.childrenNamed('item');
            if (items.length === 0) {
                v = new List();
                record();
                return v;
            }
            items.forEach(function (item) {
                var value = item.children[0];
                if (v === undefined) {
                    v = new List();
                    record();
                } else {
                    v = v.rest = new List();
                }
                v.isLinked = true;
                if (!value) {
                    v.first = 0;
                } else {
                    v.first = myself.loadValue(value);
                }
            });
            return v;
        }
        v = new List();
        record();
        v.contents = model.childrenNamed('item').map(function (item) {
            var value = item.children[0];
            if (!value) {
                return 0;
            }
            return myself.loadValue(value);
        });
        return v;
    }
    return undefined;
};

SnapSerializer.prototype.openProject = function (project, ide) {
    if (!project) {
        return;
    }
    ide.projectName = project.name;
    ide.projectNotes = project.notes || '';
    /*
    if (ide.globalVariables) {
        ide.globalVariables = project.globalVariables;
    }
    */

    ide.fixLayout();

    // force watchers to update
    //project.board.watchers().forEach(function (watcher) {
    //  watcher.onNextStep = function () {this.currentValue = null;};
    //})

//    ide.world().keyboardReceiver = project.board;
};

// SnapSerializer XML-representation of objects:

// Generics

Array.prototype.toXML = function (serializer) {
    return this.reduce(function (xml, item) {
        return xml + serializer.store(item);
    }, '');
};

// Board

BoardMorph.prototype.toXML = function (serializer) {
    var ide = this.parentThatIsA(IDE_Morph);
    return serializer.format(
        '<project name="@"><board>' +
            '<broker url="@" port="@" deviceID="@" username="@" password="@"></broker>' +
            '<variables>%</variables>' +
            '<blocks>%</blocks>' +
            '<scripts>%</scripts>' +
            '</board></project>',
        this.parentThatIsA(IDE_Morph).projectName,
        this.broker.url,
        this.broker.port,
        this.broker.deviceID,
        this.broker.username,
        this.broker.password,
        serializer.store(this.variables),
        !this.customBlocks ?
                    '' : serializer.store(this.customBlocks),
        serializer.store(this.scripts)
    );
};

/*
VariableFrame.prototype.toXML = function (serializer) {
    var myself = this;
    return Object.keys(this.vars).reduce(function (vars, v) {
        var val = myself.vars[v].value,
            dta;
        if (val === undefined || val === null) {
            dta = serializer.format('<variable name="@"/>', v);
        } else {
            dta = serializer.format(
                '<variable name="@">%</variable>',
                v,
                typeof val === 'object' ? serializer.store(val)
                        : typeof val === 'boolean' ?
                                serializer.format('<bool>$</bool>', val)
                                : serializer.format('<l>$</l>', val)
            );
        }
        return vars + dta;
    }, '');
};
*/

// Watchers

/*
WatcherMorph.prototype.toXML = function (serializer) {
    var isVar = this.target instanceof VariableFrame,
        isList = this.currentValue instanceof List,
        position = this.parent ?
                this.topLeft().subtract(this.parent.topLeft())
                : this.topLeft();

    return serializer.format(
        '<watcher% % style="@"% x="@" y="@" color="@,@,@"%%/>',
        (isVar && this.target.owner) || (!isVar && this.target) ?
                    serializer.format(' scope="@"',
                        isVar ? this.target.owner.name : this.target.name)
                            : '',
        serializer.format(isVar ? 'var="@"' : 's="@"', this.getter),
        this.style,
        isVar && this.style === 'slider' ? serializer.format(
                ' min="@" max="@"',
                this.sliderMorph.start,
                this.sliderMorph.stop
            ) : '',
        position.x,
        position.y,
        color.r,
        color.g,
        color.b,
        !isList ? ''
                : serializer.format(
                ' extX="@" extY="@"',
                this.cellMorph.contentsMorph.width(),
                this.cellMorph.contentsMorph.height()
            ),
        this.isVisible ? '' : ' hidden="true"'
    );
};*/

// Scripts

ScriptsMorph.prototype.toXML = function (serializer) {
    return this.children.reduce(function (xml, child) {
        if (child instanceof BlockMorph) {
            return xml + child.toScriptXML(serializer, true);
        }
        if (child instanceof CommentMorph && !child.block) { // unattached
            return xml + child.toXML(serializer);
        }
        return xml;
    }, '');
};

BlockMorph.prototype.toXML = BlockMorph.prototype.toScriptXML = function (
    serializer,
    savePosition
) {
    var position,
        xml,
        scale = SyntaxElementMorph.prototype.scale,
        block = this;

    // determine my position
    if (this.parent) {
        position = this.topLeft().subtract(this.parent.topLeft());
    } else {
        position = this.topLeft();
    }

    // save my position to xml
    if (savePosition) {
        xml = serializer.format(
            '<script x="@" y="@">',
            position.x / scale,
            position.y / scale
        );
    } else {
        xml = '<script>';
    }

    // recursively add my next blocks to xml
    do {
        xml += block.toBlockXML(serializer);
        block = block.nextBlock();
    } while (block);
    xml += '</script>';
    return xml;
};

BlockMorph.prototype.toBlockXML = function (serializer) {
    return serializer.format(
        '<block s="@">%%</block>',
        this.selector,
        serializer.store(this.inputs()),
        this.comment ? this.comment.toXML(serializer) : ''
    );
};

ReporterBlockMorph.prototype.toXML = function (serializer) {
    return this.selector === 'reportGetVar' ? serializer.format(
        '<block var="@"/>',
        this.blockSpec
    ) : this.toBlockXML(serializer);
};

ReporterBlockMorph.prototype.toScriptXML = function (
    serializer,
    savePosition
) {
    var position,
        scale = SyntaxElementMorph.prototype.scale;

    // determine my save-position
    if (this.parent) {
        position = this.topLeft().subtract(this.parent.topLeft());
    } else {
        position = this.topLeft();
    }

    if (savePosition) {
        return serializer.format(
            '<script x="@" y="@">%</script>',
            position.x / scale,
            position.y / scale,
            this.toXML(serializer)
        );
    }
    return serializer.format('<script>%</script>', this.toXML(serializer));
};

CustomCommandBlockMorph.prototype.toBlockXML = function (serializer) {
    var scope = this.definition.isGlobal ? undefined
        : this.definition.receiver.name;
    return serializer.format(
        '<custom-block s="@"%>%%%</custom-block>',
        this.blockSpec,
        this.definition.isGlobal ?
                '' : serializer.format(' scope="@"', scope),
        serializer.store(this.inputs()),
        this.comment ? this.comment.toXML(serializer) : '',
        scope && !this.definition.receiver[serializer.idProperty] ?
                '<receiver>' +
                    serializer.store(this.definition.receiver) +
                    '</receiver>'
                        : ''
    );
};

CustomReporterBlockMorph.prototype.toBlockXML
    = CustomCommandBlockMorph.prototype.toBlockXML;

CustomBlockDefinition.prototype.toXML = function (serializer) {
    var myself = this;

    function encodeScripts(array) {
        return array.reduce(function (xml, element) {
            if (element instanceof BlockMorph) {
                return xml + element.toScriptXML(serializer, true);
            }
            if (element instanceof CommentMorph && !element.block) {
                return xml + element.toXML(serializer);
            }
            return xml;
        }, '');
    }

    return serializer.format(
        '<block-definition s="@" type="@" category="@">' +
            '%' +
            '<header>@</header>' +
            '<code>@</code>' +
            '<inputs>%</inputs>%%' +
            '</block-definition>',
        this.spec,
        this.type,
        this.category || 'other',
        this.comment ? this.comment.toXML(serializer) : '',
        this.codeHeader || '',
        this.codeMapping || '',
        Object.keys(this.declarations).reduce(function (xml, decl) {
                return xml + serializer.format(
                    '<input type="@"$>$%</input>',
                    myself.declarations[decl][0],
                    myself.declarations[decl][3] ?
                            ' readonly="true"' : '',
                    myself.declarations[decl][1],
                    myself.declarations[decl][2] ?
                            '<options>' + myself.declarations[decl][2] +
                                '</options>'
                                : ''
                );
            }, ''),
        this.body ? serializer.store(this.body.expression) : '',
        this.scripts.length > 0 ?
                    '<scripts>' + encodeScripts(this.scripts) + '</scripts>'
                        : ''
    );
};

// Scripts - Inputs

ArgMorph.prototype.toXML = function () {
    return '<l/>'; // empty by default
};

InputSlotMorph.prototype.toXML = function (serializer) {
    if (this.constant) {
        return serializer.format(
            '<l><option>$</option></l>',
            this.constant
        );
    }
    return serializer.format('<l>$</l>', this.contents().text);
};

TemplateSlotMorph.prototype.toXML = function (serializer) {
    return serializer.format('<l>$</l>', this.contents());
};

CommandSlotMorph.prototype.toXML = function (serializer) {
    var block = this.children[0];
    if (block instanceof BlockMorph) {
        if (block instanceof ReporterBlockMorph) {
            return serializer.format(
                '<autolambda>%</autolambda>',
                serializer.store(block)
            );
        }
        return serializer.store(block);
    }
    return '<script></script>';
};

FunctionSlotMorph.prototype.toXML = CommandSlotMorph.prototype.toXML;

MultiArgMorph.prototype.toXML = function (serializer) {
    return serializer.format(
        '<list>%</list>',
        serializer.store(this.inputs())
    );
};

ArgLabelMorph.prototype.toXML = function (serializer) {
    return serializer.format(
        '%',
        serializer.store(this.inputs()[0])
    );
};

// Values

List.prototype.toXML = function (serializer, mediaContext) {
    // mediaContext is an optional name-stub
    // when collecting media into a separate module
    var xml, item;
    if (this.isLinked) {
        xml = '<list linked="linked" ~>';
        item = this;
        do {
            xml += serializer.format(
                '<item>%</item>',
                serializer.store(item.first)
            );
            item = item.rest;
        } while (item !== undefined && (item !== null));
        return xml + '</list>';
    }
    return serializer.format(
        '<list ~>%</list>',
        this.contents.reduce(function (xml, item) {
            return xml + serializer.format(
                '<item>%</item>',
                typeof item === 'object' ?
                        serializer.store(item, mediaContext)
                        : typeof item === 'boolean' ?
                                serializer.format('<bool>$</bool>', item)
                                : serializer.format('<l>$</l>', item)
            );
        }, '')
    );
};

// Comments

CommentMorph.prototype.toXML = function (serializer) {
    var position,
        scale = SyntaxElementMorph.prototype.scale;

    if (this.block) { // attached to a block
        return serializer.format(
            '<comment w="@" collapsed="@">%</comment>',
            this.textWidth() / scale,
            this.isCollapsed,
            serializer.escape(this.text())
        );
    }

    // free-floating, determine my save-position
    if (this.parent) {
        position = this.topLeft().subtract(this.parent.topLeft());
    } else {
        position = this.topLeft();
    }
    return serializer.format(
        '<comment x="@" y="@" w="@" collapsed="@">%</comment>',
        position.x / scale,
        position.y / scale,
        this.textWidth() / scale,
        this.isCollapsed,
        serializer.escape(this.text())
    );
};
