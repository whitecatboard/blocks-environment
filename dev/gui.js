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

// Declarations

var IDE_Morph;
var ProjectDialogMorph;

// Get the full url without "snap.html"
var baseURL = (function getPath(location) {
    var origin, path, slash;
    path = location.pathname; // starts with a /
    origin = location.origin; // has no trailing /
    slash = path.lastIndexOf('/');
    path = path.slice(0, slash + 1); // keep a trailing /
    return origin + path;
}(window.location));


// IDE_Morph ///////////////////////////////////////////////////////////

// I am SNAP's top-level frame, the Editor window

// IDE_Morph inherits from Morph:

IDE_Morph.prototype = new Morph();
IDE_Morph.prototype.constructor = IDE_Morph;
IDE_Morph.uber = Morph.prototype;

// IDE_Morph preferences settings and skins

IDE_Morph.prototype.setDefaultDesign = function () {
    MorphicPreferences.isFlat = true;

    IDE_Morph.prototype.buttonContrast = 30;
    IDE_Morph.prototype.backgroundColor = new Color(255, 237, 167);
    IDE_Morph.prototype.frameColor = new Color(255, 255, 230);

    IDE_Morph.prototype.groupColor = new Color(255, 255, 250);
    IDE_Morph.prototype.sliderColor = BoardMorph.prototype.sliderColor;
    IDE_Morph.prototype.buttonLabelColor = new Color(70, 70, 70);
    IDE_Morph.prototype.tabColors = [
        IDE_Morph.prototype.groupColor.lighter(60),
        IDE_Morph.prototype.groupColor.darker(10),
        IDE_Morph.prototype.groupColor
    ];
    IDE_Morph.prototype.rotationStyleColors = [
        IDE_Morph.prototype.groupColor,
        IDE_Morph.prototype.groupColor.darker(10),
        IDE_Morph.prototype.groupColor.darker(30)
    ];
    IDE_Morph.prototype.scriptsPaneTexture = null;
    IDE_Morph.prototype.padding = 2;
};

// IDE_Morph instance creation:

function IDE_Morph(isAutoFill) {
    this.init(isAutoFill);
}

IDE_Morph.prototype.init = function (isAutoFill) {
    // global font setting
    MorphicPreferences.globalFontFamily = 'Helvetica, Arial';

    // restore saved user preferences
    this.userLanguage = null; // user language preference for startup
    this.projectsInURLs = false;
    this.applySavedSettings();

    // additional properties:
    this.source = 'local';
    this.serializer = new SnapSerializer();

    this.currentCategory = 'control';
    this.currentTab = 'scripts';
    this.projectName = '';
    this.projectNotes = '';

    this.logo = null;
    this.controlBar = null;
    this.categories = null;
    this.palette = null;
    this.scriptEditor = null;

    this.isAutoFill = isAutoFill || true;
    this.filePicker = null;

    this.isAnimating = true;

    this.loadNewProject = false; // flag when starting up translated
    this.shield = null;

    // initialize inherited properties:
    IDE_Morph.uber.init.call(this);

    // override inherited properites:
    this.color = this.backgroundColor;
};

IDE_Morph.prototype.openIn = function (world) {
    var hash, usr, myself = this, urlLanguage = null;

    // get persistent user data, if any
    if (localStorage) {
        usr = localStorage['-snap-user'];
    }

    this.buildPanes();
    world.add(this);
    world.userMenu = this.userMenu;

    // prevent non-DialogBoxMorphs from being dropped
    // onto the World in user-mode
    world.reactToDropOf = function (morph) {
        if (!(morph instanceof DialogBoxMorph)) {
            if (world.hand.grabOrigin) {
                morph.slideBackTo(world.hand.grabOrigin);
            } else {
                world.hand.grab(morph);
            }
        }
    };

    this.reactToWorldResize(world.bounds);

    if (this.userLanguage) {
        this.setLanguage(this.userLanguage);
    }
};

// IDE_Morph construction

IDE_Morph.prototype.buildPanes = function () {
    this.createLogo();
    this.createControlBar();
    this.createBoard();
    this.createCategories();
    this.createPalette();
    this.createEditor();
    this.createConfigPanel();
};

IDE_Morph.prototype.createLogo = function () {
    var myself = this;

    if (this.logo) {
        this.logo.destroy();
    }

    this.logo = new Morph();
    this.logo.texture = 'wc_logo_sm.png';
    this.logo.drawNew = function () {
        this.image = newCanvas(this.extent());
        var context = this.image.getContext('2d'),
            gradient = context.createLinearGradient(
                0,
                0,
                this.width(),
                0
            );
        gradient.addColorStop(0, 'black');
        gradient.addColorStop(0.5, myself.frameColor.toString());
        context.fillStyle = MorphicPreferences.isFlat ?
                myself.frameColor.toString() : gradient;
        context.fillRect(0, 0, this.width(), this.height());
        if (this.texture) {
            this.drawTexture(this.texture);
        }
    };

    this.logo.drawCachedTexture = function () {
        var context = this.image.getContext('2d');
        context.drawImage(
            this.cachedTexture,
            25,
            Math.round((this.height() - this.cachedTexture.height) / 2)
        );
        this.changed();
    };

    this.logo.mouseClickLeft = function () {
        myself.snapMenu();
    };

    this.logo.color = new Color();
    this.logo.setExtent(new Point(200, 35)); // dimensions are fixed
    this.add(this.logo);
};

IDE_Morph.prototype.createControlBar = function () {
    // assumes the logo has already been created
    var padding = 5,
        button,
        stopButton,
        startButton,
        projectButton,
        settingsButton,
        x,
        colors = [
            this.groupColor,
            this.frameColor.darker(10),
            this.frameColor.darker(20)
        ],
        myself = this;

    if (this.controlBar) {
        this.controlBar.destroy();
    }

    this.controlBar = new Morph();
    this.controlBar.color = this.frameColor;
    this.controlBar.setHeight(this.logo.height()); // height is fixed
    this.controlBar.mouseClickLeft = function () {
        this.world().fillPage();
    };
    this.add(this.controlBar);

    // stopButton
    button = new PushButtonMorph(
        this,
        'stopAllScripts',
        new SymbolMorph('square', 14)
    );
    button.corner = 12;
    button.color = colors[0];
    button.highlightColor = colors[1];
    button.pressColor = colors[2];
    button.labelMinExtent = new Point(36, 18);
    button.padding = 0;
    button.labelColor = new Color(200, 0, 0);
    button.contrast = this.buttonContrast;
    button.drawNew();
    // button.hint = 'stop\nevery-\nthing';
    button.fixLayout();
    stopButton = button;
    this.controlBar.add(stopButton);

    // startButton
    button = new PushButtonMorph(
        this,
        'pressStart',
        new SymbolMorph('pointRight', 14)
    );
    button.corner = 12;
    button.color = colors[0];
    button.highlightColor = colors[1];
    button.pressColor = colors[2];
    button.labelMinExtent = new Point(36, 18);
    button.padding = 0;
    button.labelColor = new Color(0, 200, 0);
    button.contrast = this.buttonContrast;
    button.drawNew();
    // button.hint = 'start green\nflag scripts';
    button.fixLayout();
    startButton = button;
    this.controlBar.add(startButton);
    this.controlBar.startButton = startButton;

    // projectButton
    button = new PushButtonMorph(
        this,
        'projectMenu',
        new SymbolMorph('file', 14)
        //'\u270E'
    );
    button.corner = 12;
    button.color = colors[0];
    button.highlightColor = colors[1];
    button.pressColor = colors[2];
    button.labelMinExtent = new Point(36, 18);
    button.padding = 0;
    button.labelColor = this.buttonLabelColor;
    button.contrast = this.buttonContrast;
    button.drawNew();
    // button.hint = 'open, save, & annotate project';
    button.fixLayout();
    projectButton = button;
    this.controlBar.add(projectButton);
    this.controlBar.projectButton = projectButton; // for menu positioning

    // settingsButton
    button = new PushButtonMorph(
        this,
        'settingsMenu',
        new SymbolMorph('gears', 14)
        //'\u2699'
    );
    button.corner = 12;
    button.color = colors[0];
    button.highlightColor = colors[1];
    button.pressColor = colors[2];
    button.labelMinExtent = new Point(36, 18);
    button.padding = 0;
    button.labelColor = this.buttonLabelColor;
    button.contrast = this.buttonContrast;
    button.drawNew();
    // button.hint = 'edit settings';
    button.fixLayout();
    settingsButton = button;
    this.controlBar.add(settingsButton);
    this.controlBar.settingsButton = settingsButton; // for menu positioning

    this.controlBar.fixLayout = function () {
        x = this.right() - padding;
        [stopButton, startButton].forEach(
            function (button) {
                button.setCenter(myself.controlBar.center());
                button.setRight(x);
                x -= button.width();
                x -= padding;
            }
        );

        x = startButton.left() - (3 * padding)

        projectButton.setCenter(myself.controlBar.center());
        projectButton.setLeft(112);

        settingsButton.setCenter(myself.controlBar.center());
        settingsButton.setLeft(projectButton.right() + padding);

        this.updateLabel();
    };

    this.controlBar.updateLabel = function () {
        if (this.label) {
            this.label.destroy();
        }
        
        this.label = new StringMorph(
            (myself.projectName || localize('untitled')),
            14,
            'sans-serif',
            true,
            false,
            false,
            null,
            myself.frameColor.darker(myself.buttonContrast)
        );
        this.label.color = myself.buttonLabelColor;
        this.label.drawNew();
        this.add(this.label);
        this.label.setCenter(this.center());
        this.label.setLeft(this.settingsButton.right() + padding);
    };
};

IDE_Morph.prototype.createBoard = function () {
    if (!this.board) { 
        this.board = new BoardMorph(this);
    };
}

IDE_Morph.prototype.createCategories = function () {
    // assumes the logo has already been created
    var myself = this;

    if (this.categories) {
        this.categories.destroy();
    }
    this.categories = new Morph();
    this.categories.color = this.frameColor;
    this.categories.silentSetWidth(this.logo.width()); // width is fixed

    function addCategoryButton(category) {
        var labelWidth = 82,
            colors = [
                myself.frameColor,
                myself.frameColor.darker(20),
                BoardMorph.prototype.blockColor[category]
            ],
            button;

        button = new ToggleButtonMorph(
            colors,
            myself, // the IDE is the target
            function () {
                myself.currentCategory = category;
                myself.categories.children.forEach(function (each) {
                    each.refresh();
                });
                myself.refreshPalette(true);
            },
            category[0].toUpperCase().concat(category.slice(1)), // label
            function () {  // query
                return myself.currentCategory === category;
            },
            null, // env
            null, // hint
            null, // template cache
            labelWidth, // minWidth
            true // has preview
        );

        button.corner = 8;
        button.padding = 0;
        button.labelColor = myself.buttonLabelColor;
        button.fixLayout();
        button.refresh();
        myself.categories.add(button);
        return button;
    }

    function fixCategoriesLayout() {
        var buttonWidth = myself.categories.children[0].width(),
            buttonHeight = myself.categories.children[0].height(),
            border = 3,
            rows =  Math.ceil((myself.categories.children.length) / 2),
            xPadding = (myself.categories.width()
                - border
                - buttonWidth * 2) / 3,
            yPadding = 2,
            l = myself.categories.left(),
            t = myself.categories.top(),
            i = 0,
            row,
            col;

        myself.categories.children.forEach(function (button) {
            i += 1;
            row = Math.ceil(i / 2);
            col = 2 - (i % 2);
            button.setPosition(new Point(
                l + (col * xPadding + ((col - 1) * buttonWidth)),
                t + (row * yPadding + ((row - 1) * buttonHeight) + border)
            ));
        });

        myself.categories.setHeight(
            (rows + 1) * yPadding
                + rows * buttonHeight
                + 2 * border
        );
    }

    BoardMorph.prototype.categories.forEach(function (cat) {
        addCategoryButton(cat);
    });
    fixCategoriesLayout();
    this.add(this.categories);
};

IDE_Morph.prototype.createPalette = function (forSearching) {
    // assumes that the logo pane has already been created
    // needs the categories pane for layout
    var myself = this;

    if (this.palette) {
        this.palette.destroy();
    }

    if (forSearching) {
        this.palette = new ScrollFrameMorph(
            null,
            null,
            this.board.sliderColor
        );
    } else {
        this.palette = this.board.palette(this.currentCategory);
    }
    this.palette.isDraggable = false;
    this.palette.acceptsDrops = true;
    this.palette.contents.acceptsDrops = false;

    this.palette.reactToDropOf = function (droppedMorph) {
        if (droppedMorph instanceof DialogBoxMorph || droppedMorph instanceof InspectorMorph) {
            myself.world().add(droppedMorph);
        } else {
            droppedMorph.destroy();
        }
    };

    this.palette.setWidth(this.logo.width());
    this.add(this.palette);
    return this.palette;
};

IDE_Morph.prototype.createEditor = function () {
    var scripts = this.board.scripts,
        myself = this;

    if (this.scriptEditor) {
        this.scriptEditor.destroy();
    }

    scripts.isDraggable = false;
    scripts.color = this.groupColor;
    scripts.cachedTexture = this.scriptsPaneTexture;

    this.scriptEditor = new ScrollFrameMorph(
            scripts,
            null,
            this.sliderColor.darker(20)
            );
    this.scriptEditor.padding = 10;
    this.scriptEditor.growth = 50;
    this.scriptEditor.isDraggable = false;
    this.scriptEditor.acceptsDrops = false;
    this.scriptEditor.contents.acceptsDrops = true;

    scripts.scrollFrame = this.scriptEditor;
    this.add(this.scriptEditor);
    this.scriptEditor.scrollX(this.scriptEditor.padding);
    this.scriptEditor.scrollY(this.scriptEditor.padding);
};

IDE_Morph.prototype.createConfigPanel = function () {
    var myself = this;

    this.configPanel = new Morph();
    this.configPanel.color = this.frameColor;
    this.configPanel.setWidth(this.palette.width() - 2);
    this.add(this.configPanel);
    this.configPanel.add(this.board);
    this.board.setTop(this.configPanel.top());
    this.board.setLeft(this.configPanel.left() + 2);

    this.internetLED = new CircleBoxMorph();
    this.internetLED.setExtent(new Point(20, 20));
    this.internetLED.setColor(new Color(200,100,100));
    this.configPanel.add(this.internetLED);
    this.internetLED.setTop(this.board.bottom() + 5);
    this.internetLED.setLeft(this.configPanel.left() + 2);

    this.mqttLED = new CircleBoxMorph();
    this.mqttLED.setExtent(new Point(20, 20));
    this.mqttLED.setColor(new Color(200,100,100));
    this.configPanel.add(this.mqttLED);
    this.mqttLED.setTop(this.internetLED.bottom() + 5);
    this.mqttLED.setLeft(this.configPanel.left() + 2);

    var internetButton = new PushButtonMorph(
            null,
            function () {
                new InternetDialogMorph(
                    myself.board,
                    nop,
                    myself.board
                ).popUp(this.world);
            },
            'Connect to the Internet'
        );
    this.configPanel.add(internetButton);
    internetButton.setLeft(this.internetLED.right() + 5);
    internetButton.setTop(this.internetLED.top());

    var mqttButton = new PushButtonMorph(
            null,
            function () {
                new MQTTDialogMorph(
                    myself.board,
                    nop,
                    myself.board
                ).popUp(this.world);
            },
            'Connect to MQTT broker'
        );
    this.configPanel.add(mqttButton);
    mqttButton.setLeft(this.mqttLED.right() + 5);
    mqttButton.setTop(this.mqttLED.top());


}

// IDE_Morph layout

IDE_Morph.prototype.fixLayout = function (situation) {
    // situation is a string, i.e.
    // 'selectBoard' or 'refreshPalette' or 'tabEditor'
    var padding = this.padding;

    Morph.prototype.trackChanges = false;

    if (situation !== 'refreshPalette') {
        // controlBar
        this.controlBar.setPosition(this.logo.topRight());
        this.controlBar.setWidth(this.right() - this.controlBar.left());
        this.controlBar.fixLayout();

        // categories
        this.categories.setLeft(this.logo.left());
        this.categories.setTop(this.logo.bottom());

        if (this.scriptEditor.isVisible) {
            this.scriptEditor.setTop(this.categories.top() + 1);
            this.scriptEditor.setLeft(this.categories.right() + 1);
            this.scriptEditor.setExtent(new Point(
                this.width() -  this.categories.width() * 2,
                this.bottom() - this.scriptEditor.top()
            ));
        }

    }

    // palette
    this.palette.setLeft(this.logo.left());
    this.palette.setTop(this.categories.bottom());
    this.palette.setHeight(this.bottom() - this.palette.top());

    // configPanel
    this.configPanel.setTop(this.controlBar.bottom());
    this.configPanel.setRight(this.right());
    this.configPanel.setHeight(this.bottom() - this.controlBar.bottom());

    Morph.prototype.trackChanges = true;
    this.changed();
};

IDE_Morph.prototype.setProjectName = function (string) {
    this.projectName = string.replace(/['"]/g, ''); // filter quotation marks
    this.hasChangedMedia = true;
    this.controlBar.updateLabel();
};

// IDE_Morph resizing

IDE_Morph.prototype.setExtent = function (point) {
    var ext = new Point(window.innerWidth, window.innerHeight);

    // apply
    IDE_Morph.uber.setExtent.call(this, ext);
    this.fixLayout();
};

// IDE_Morph events

IDE_Morph.prototype.reactToWorldResize = function (rect) {
    if (this.isAutoFill) {
        this.setPosition(rect.origin);
        this.setExtent(rect.extent());
    }
    if (this.filePicker) {
        document.body.removeChild(this.filePicker);
        this.filePicker = null;
    }
};

IDE_Morph.prototype.droppedText = function (aString, name) {
    var lbl = name ? name.split('.')[0] : '';
    if (aString.indexOf('<project') === 0) {
        return this.openProjectString(aString, this);
    }
    if (aString.indexOf('<blocks') === 0) {
        return this.openBlocksString(aString, lbl, true);
    }
};

// IDE_Morph button actions

IDE_Morph.prototype.refreshPalette = function (shouldIgnorePosition) {
    var oldTop = this.palette.contents.top();

    this.createPalette();
    this.fixLayout('refreshPalette');
    if (!shouldIgnorePosition) {
        this.palette.contents.setTop(oldTop);
    }
};

IDE_Morph.prototype.pressStart = function () {
    if (this.world().currentKey === 16) { // shiftClicked
        this.toggleFastTracking();
    } else {
        this.runScripts();
    }
};

IDE_Morph.prototype.fireGreenFlagEvent = function () {
    this.board.buildThreads(this.board.allHatBlocksFor('__shout__go__').concat(this.board.allHatBlocksFor('__postal__service__')), true);
};

IDE_Morph.prototype.fireStopAllEvent = function () {
    this.board.stopAll();
    this.board.scripts.children.forEach(function(each) {
        if (!(each instanceof WatcherMorph)) { 
            each.removeHighlight();
        }
    });
};

IDE_Morph.prototype.runScripts = function () {
    this.fireGreenFlagEvent();
};

IDE_Morph.prototype.stopAllScripts = function () {
    this.fireStopAllEvent();
};

// IDE_Morph skins

IDE_Morph.prototype.refreshIDE = function () {
    var projectData = this.serializer.serialize(this.board);

    BoardMorph.prototype.initBlocks();
    this.buildPanes();
    this.fixLayout();
    if (this.loadNewProject) {
        this.newProject();
    } else {
        this.openProjectString(projectData);
    }
};

// IDE_Morph settings persistance

IDE_Morph.prototype.applySavedSettings = function () {
    var zoom = this.getSetting('zoom'),
        language = this.getSetting('language'),
        click = this.getSetting('click'),
        longform = this.getSetting('longform'),
        longurls = this.getSetting('longurls'),
        plainprototype = this.getSetting('plainprototype'),
        keyboard = this.getSetting('keyboard');

    this.setDefaultDesign();

    // blocks zoom
    if (zoom) {
        SyntaxElementMorph.prototype.setScale(Math.min(zoom, 12));
        CommentMorph.prototype.refreshScale();
        BoardMorph.prototype.initBlocks();
    }

    // language
    if (language && language !== 'en') {
        this.userLanguage = language;
    } else {
        this.userLanguage = null;
    }

    //  click
    if (click && !BlockMorph.prototype.snapSound) {
        BlockMorph.prototype.toggleSnapSound();
    }

    // long form
    if (longform) {
        InputSlotDialogMorph.prototype.isLaunchingExpanded = true;
    }

    // project data in URLs
    if (longurls) {
        this.projectsInURLs = true;
    } else {
        this.projectsInURLs = false;
    }

    // keyboard editing
    if (keyboard) {
        ScriptsMorph.prototype.enableKeyboard = true;
    } else {
        ScriptsMorph.prototype.enableKeyboard = false;
    }

    // plain prototype labels
    if (plainprototype) {
        BlockLabelPlaceHolderMorph.prototype.plainLabel = true;
    }
};

IDE_Morph.prototype.saveSetting = function (key, value) {
    if (localStorage) {
        localStorage['-snap-setting-' + key] = value;
    }
};

IDE_Morph.prototype.getSetting = function (key) {
    if (localStorage) {
        return localStorage['-snap-setting-' + key];
    }
    return null;
};

IDE_Morph.prototype.removeSetting = function (key) {
    if (localStorage) {
        delete localStorage['-snap-setting-' + key];
    }
};

// IDE_Morph menus

IDE_Morph.prototype.userMenu = function () {
    var menu = new MenuMorph(this);
    // menu.addItem('help', 'nop');
    return menu;
};

IDE_Morph.prototype.snapMenu = function () {
    var menu,
        world = this.world();

    menu = new MenuMorph(this);
    menu.addItem('About Snap!...', 'aboutSnap');
    menu.addItem('About WhiteCat...', 'aboutWhiteCat');
    if (world.isDevMode) {
        menu.addLine();
        menu.addItem(
            'Switch back to user mode',
            'switchToUserMode',
            'disable deep-Morphic\ncontext menus'
                + '\nand show user-friendly ones',
            new Color(0, 100, 0)
        );
    } else if (world.currentKey === 16) { // shift-click
        menu.addLine();
        menu.addItem(
            'Switch to dev mode',
            'switchToDevMode',
            'enable Morphic\ncontext menus\nand inspectors,'
                + '\nnot user-friendly!',
            new Color(100, 0, 0)
        );
    }
    menu.popup(world, this.logo.bottomLeft());
};

IDE_Morph.prototype.settingsMenu = function () {
    var menu,
        world = this.world(),
        myself = this,
        pos = this.controlBar.settingsButton.bottomLeft(),
        shiftClicked = (world.currentKey === 16);

    function addPreference(label, toggle, test, onHint, offHint, hide) {
        var on = '\u2611 ',
            off = '\u2610 ';
        if (!hide || shiftClicked) {
            menu.addItem(
                (test ? on : off) + localize(label),
                toggle,
                test ? onHint : offHint,
                hide ? new Color(100, 0, 0) : null
            );
        }
    }

    menu = new MenuMorph(this);
    menu.addItem('Language...', 'languageMenu');
    menu.addItem(
        'Zoom blocks...',
        'userSetBlocksScale'
    );
    menu.addLine();
    addPreference(
        'Zebra coloring',
        'toggleZebraColoring',
        BlockMorph.prototype.zebraContrast,
        'uncheck to disable alternating\ncolors for nested block',
        'check to enable alternating\ncolors for nested blocks',
        true
    );
    addPreference(
        'Dynamic input labels',
        'toggleDynamicInputLabels',
        SyntaxElementMorph.prototype.dynamicInputLabels,
        'uncheck to disable dynamic\nlabels for variadic inputs',
        'check to enable dynamic\nlabels for variadic inputs',
        true
    );
    addPreference(
        'Prefer empty slot drops',
        'togglePreferEmptySlotDrops',
        ScriptsMorph.prototype.isPreferringEmptySlots,
        'uncheck to allow dropped\nreporters to kick out others',
        'settings menu prefer empty slots hint',
        true
    );
    addPreference(
        'Long form input dialog',
        'toggleLongFormInputDialog',
        InputSlotDialogMorph.prototype.isLaunchingExpanded,
        'uncheck to use the input\ndialog in short form',
        'check to always show slot\ntypes in the input dialog'
    );
    addPreference(
        'Plain prototype labels',
        'togglePlainPrototypeLabels',
        BlockLabelPlaceHolderMorph.prototype.plainLabel,
        'uncheck to always show (+) symbols\nin block prototype labels',
        'check to hide (+) symbols\nin block prototype labels'
    );
    addPreference(
        'Virtual keyboard',
        'toggleVirtualKeyboard',
        MorphicPreferences.useVirtualKeyboard,
        'uncheck to disable\nvirtual keyboard support\nfor mobile devices',
        'check to enable\nvirtual keyboard support\nfor mobile devices',
        true
    );
    addPreference(
        'Input sliders',
        'toggleInputSliders',
        MorphicPreferences.useSliderForInput,
        'uncheck to disable\ninput sliders for\nentry fields',
        'check to enable\ninput sliders for\nentry fields'
    );
    if (MorphicPreferences.useSliderForInput) {
        addPreference(
            'Execute on slider change',
            'toggleSliderExecute',
            InputSlotMorph.prototype.executeOnSliderEdit,
            'uncheck to supress\nrunning scripts\nwhen moving the slider',
            'check to run\nthe edited script\nwhen moving the slider'
        );
    }
    menu.addLine();
    menu.addItem(
            'Update boot file',
            'updateBootFile',
            'This file is stored in\nthe board and defines'
                +'\nbasic functions needed\nfor the blocks environment\nto work.'
            );
    menu.popup(world, pos);
};

IDE_Morph.prototype.projectMenu = function () {
    var menu,
        myself = this,
        world = this.world(),
        pos = this.controlBar.projectButton.bottomLeft(),
        shiftClicked = (world.currentKey === 16);

    menu = new MenuMorph(this);
    menu.addItem('New', 'createNewProject');
    menu.addItem('Save to disk', 'saveToDisk');
    menu.addItem(
        'Load from disk',
        function () {
            var inp = document.createElement('input');
            if (myself.filePicker) {
                document.body.removeChild(myself.filePicker);
                myself.filePicker = null;
            }
            inp.type = 'file';
            inp.style.color = "transparent";
            inp.style.backgroundColor = "transparent";
            inp.style.border = "none";
            inp.style.outline = "none";
            inp.style.position = "absolute";
            inp.style.top = "0px";
            inp.style.left = "0px";
            inp.style.width = "0px";
            inp.style.height = "0px";
            inp.addEventListener(
                "change",
                function (event) {
                    var files = event instanceof FileList ? event
                        : event.target.files || event.dataTransfer.files;
                    document.body.removeChild(inp);
                    myself.filePicker = null;

                    function readText(aFile) {
                        var frd = new FileReader();
                        frd.onloadend = function (e) {
                            myself.loadFromString(e.target.result, aFile.name);
                        };
                        frd.readAsText(aFile);
                    }
                    readText(files[0]);
                },
                false
            );
            document.body.appendChild(inp);
            myself.filePicker = inp;
            inp.click();
        },
        'Load a WhiteCat project from a file'
    );

    if (shiftClicked) {
        menu.addLine();
        menu.addItem(
            'Export all scripts as pic...',
            function () {myself.exportScriptsPicture(); },
            'show a picture of all scripts\nand block definitions',
            new Color(100, 0, 0)
        );
    }

    menu.popup(world, pos);
};

// IDE_Morph menu actions

IDE_Morph.prototype.aboutSnap = function () {
    var dlg, aboutTxt, noticeTxt, creditsTxt, versions = '', translations,
        module, btn1, btn2, btn3, btn4, licenseBtn, translatorsBtn,
        world = this.world();

    aboutTxt = 'Snap! 4.0.2\nBuild Your Own Blocks\n\n'
        + 'Copyright \u24B8 2015 Jens M\u00F6nig and '
        + 'Brian Harvey\n'
        + 'jens@moenig.org, bh@cs.berkeley.edu\n\n'

        + 'Snap! is developed by the University of California, Berkeley\n'
        + '          with support from the National Science Foundation, '
        + 'MioSoft,     \n'
        + 'and the Communications Design Group at SAP Labs. \n'

        + 'The design of Snap! is influenced and inspired by Scratch,\n'
        + 'from the Lifelong Kindergarten group at the MIT Media Lab\n\n'

        + 'for more information see http://snap.berkeley.edu\n'
        + 'and http://scratch.mit.edu';

    noticeTxt = localize('License')
        + '\n\n'
        + 'Snap! is free software: you can redistribute it and/or modify\n'
        + 'it under the terms of the GNU Affero General Public License as\n'
        + 'published by the Free Software Foundation, either version 3 of\n'
        + 'the License, or (at your option) any later version.\n\n'

        + 'This program is distributed in the hope that it will be useful,\n'
        + 'but WITHOUT ANY WARRANTY; without even the implied warranty of\n'
        + 'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the\n'
        + 'GNU Affero General Public License for more details.\n\n'

        + 'You should have received a copy of the\n'
        + 'GNU Affero General Public License along with this program.\n'
        + 'If not, see http://www.gnu.org/licenses/';

    creditsTxt = localize('Contributors')
        + '\n\nNathan Dinsmore: Saving/Loading, Snap-Logo Design, '
        + '\ncountless bugfixes and optimizations'
        + '\nKartik Chandra: Paint Editor'
        + '\nMichael Ball: Time/Date UI, many bugfixes'
        + '\n"Ava" Yuan Yuan: Graphic Effects'
        + '\nKyle Hotchkiss: Block search design'
        + '\nIan Reynolds: UI Design, Event Bindings, '
        + 'Sound primitives'
        + '\nIvan Motyashov: Initial Squeak Porting'
        + '\nDavide Della Casa: Morphic Optimizations'
        + '\nAchal Dave: Web Audio'
        + '\nJoe Otto: Morphic Testing and Debugging';

    for (module in modules) {
        if (Object.prototype.hasOwnProperty.call(modules, module)) {
            versions += ('\n' + module + ' (' +
                            modules[module] + ')');
        }
    }
    if (versions !== '') {
        versions = localize('current module versions:') + ' \n\n' +
            'morphic (' + morphicVersion + ')' +
            versions;
    }
    translations = localize('Translations') + '\n' + SnapTranslator.credits();

    dlg = new DialogBoxMorph();
    dlg.inform(localize('About Snap!'), aboutTxt, world);
    btn1 = dlg.buttons.children[0];
    translatorsBtn = dlg.addButton(
        function () {
            dlg.body.text = translations;
            dlg.body.drawNew();
            btn1.show();
            btn2.show();
            btn3.hide();
            btn4.hide();
            licenseBtn.hide();
            translatorsBtn.hide();
            dlg.fixLayout();
            dlg.drawNew();
            dlg.setCenter(world.center());
        },
        'Translators...'
    );
    btn2 = dlg.addButton(
        function () {
            dlg.body.text = aboutTxt;
            dlg.body.drawNew();
            btn1.show();
            btn2.hide();
            btn3.show();
            btn4.show();
            licenseBtn.show();
            translatorsBtn.hide();
            dlg.fixLayout();
            dlg.drawNew();
            dlg.setCenter(world.center());
        },
        'Back...'
    );
    btn2.hide();
    licenseBtn = dlg.addButton(
        function () {
            dlg.body.text = noticeTxt;
            dlg.body.drawNew();
            btn1.show();
            btn2.show();
            btn3.hide();
            btn4.hide();
            licenseBtn.hide();
            translatorsBtn.hide();
            dlg.fixLayout();
            dlg.drawNew();
            dlg.setCenter(world.center());
        },
        'License...'
    );
    btn3 = dlg.addButton(
        function () {
            dlg.body.text = versions;
            dlg.body.drawNew();
            btn1.show();
            btn2.show();
            btn3.hide();
            btn4.hide();
            licenseBtn.hide();
            translatorsBtn.hide();
            dlg.fixLayout();
            dlg.drawNew();
            dlg.setCenter(world.center());
        },
        'Modules...'
    );
    btn4 = dlg.addButton(
        function () {
            dlg.body.text = creditsTxt;
            dlg.body.drawNew();
            btn1.show();
            btn2.show();
            translatorsBtn.show();
            btn3.hide();
            btn4.hide();
            licenseBtn.hide();
            dlg.fixLayout();
            dlg.drawNew();
            dlg.setCenter(world.center());
        },
        'Credits...'
    );
    translatorsBtn.hide();
    dlg.fixLayout();
    dlg.drawNew();
};

IDE_Morph.prototype.aboutWhiteCat = function () {
    var dlg, aboutTxt, noticeTxt, btn1, btn2, licenseBtn,
        world = this.world(),
        pic = Morph.fromImageURL('logos-about.png');

    pic.setExtent(new Point(230, 76));

    aboutTxt = 'WhiteCat blocks environment\n\n'
        + 'Copyright \u24B8 2016 Bernat Romagosa\n'
        + 'Edutec Research Group, Citilab - Cornellà de Llobregat (Barcelona)\n'
        + 'bromagosa@e-citilab.eu - edutec@e-citilab.eu'
        + '\n\n'
        + 'WhiteCat is based on a stripped-down version of Snap!, by Jens Mönig,\n'
        + 'and reuses its whole Morphic system, its blocks rendering engine, many\n'
        + 'of its widgets and, in general, several parts of its graphic user\n'
        + 'interface.\n\n'
        + 'It has been turned into a desktop application thanks to the nwjs\n'
        + 'framework, and relies on Chris Williams\'s NodeJS serial port module\n'
        + 'for serial communications with the board.\n\n'
        + 'This project has been sponsored by the Barcelona Metropolitan Area\n'
        + 'administration (AMB), along with the design of the hardware platform\n'
        + 'and the LuaOS project.\n\n'
        + 'For any questions, please contact us at:\n'
        + 'edutec@e-citilab.eu\n\n'
        + 'http://amb.cat\n'
        + 'http://citilab.eu\n'
        + 'http://edutec.citilab.eu\n'


    noticeTxt = 'License'
        + '\n\n'
        + 'WhiteCat is free software: you can redistribute it and/or modify\n'
        + 'it under the terms of the GNU Affero General Public License as\n'
        + 'published by the Free Software Foundation, either version 3 of\n'
        + 'the License, or (at your option) any later version.\n\n'

        + 'This program is distributed in the hope that it will be useful,\n'
        + 'but WITHOUT ANY WARRANTY; without even the implied warranty of\n'
        + 'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the\n'
        + 'GNU Affero General Public License for more details.\n\n'

        + 'You should have received a copy of the\n'
        + 'GNU Affero General Public License along with this program.\n'
        + 'If not, see http://www.gnu.org/licenses/';


    dlg = new DialogBoxMorph();
    dlg.inform(localize('About WhiteCat'), localize(aboutTxt), world, pic);
    btn1 = dlg.buttons.children[0];
    btn2 = dlg.addButton(
        function () {
            dlg.body.text = localize(aboutTxt);
            dlg.body.drawNew();
            btn1.show();
            btn2.hide();
            licenseBtn.show();
            dlg.fixLayout();
            dlg.drawNew();
            dlg.setCenter(world.center());
        },
        'Back...'
    );
    btn2.hide();
    licenseBtn = dlg.addButton(
        function () {
            dlg.body.text = localize(noticeTxt);
            dlg.body.drawNew();
            btn1.show();
            btn2.show();
            licenseBtn.hide();
            dlg.fixLayout();
            dlg.drawNew();
            dlg.setCenter(world.center());
        },
        'License...'
    );
    dlg.fixLayout();
    dlg.drawNew();

}

IDE_Morph.prototype.newProject = function () {
    this.source = 'local';
    if (this.board) {
        this.board.reset();
        var scripts = this.board.scripts;
        for (i = scripts.children.length; i >= 0; i --) {
            scripts.removeChild(scripts.children[i]);
        }
        this.board.deleteAllVariables();
    } else {
        this.createBoard();
    }
    if (location.hash.substr(0, 6) !== '#lang:') {
        location.hash = '';
    }
    this.setProjectName('');
    this.projectNotes = '';
    this.fixLayout();
};

IDE_Morph.prototype.openProjectString = function (str, name, silent) {
    var msg,
        myself = this;
    this.nextSteps([
        function () {
            if (!silent) { msg = myself.showMessage('Opening project...'); }
        },
        function () {nop(); }, // yield (bug in Chrome)
        function () {
            myself.newProject();
        },
        function () {
            myself.rawOpenProjectString(str);
        },
        function () {
            if (msg) { msg.destroy(); }
        }
    ]);
};

IDE_Morph.prototype.rawOpenProjectString = function (str) {
    this.serializer.openProject(
            this.serializer.load(str, this),
            this
            );
};

IDE_Morph.prototype.loadFromString = function (str) {
    var myself = this;
    this.nextSteps([
        function() { myself.newProject() },
        function() {
            try {
                this.serializer.openProject(
                        this.serializer.load(str, this),
                        this
                        );
            } catch (err) {
                this.showMessage('Load failed: ' + err);
            }
        }
    ]);
}

IDE_Morph.prototype.saveToDisk = function (name, plain) {
    var menu, str, myself = this;

    if (!name) {
        new DialogBoxMorph(
                this,
                function(name) {
                    myself.saveToDisk(name);
                },
                this
            ).prompt(
                'Please enter a name for\nthis project', 
                this.projectName || 'Untitled',
                this.world()
            );
        return;
    } else {
        this.setProjectName(name);
        try {
            menu = this.showMessage('Exporting');
            str = this.serializer.serialize(this.board);
            myself.saveFile(name + '.xml', str);
            menu.destroy();
        } catch (err) {
            this.showMessage('Export failed: ' + err);
        }
    }

};

IDE_Morph.prototype.saveFile = function(name, contents) {
    function homePath() {
        return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + ((process.platform == 'win32') ? '\\' : '/')
    }

    var inp = document.createElement('input'),
        myself = this;

    if (this.filePicker) {
        document.body.removeChild(this.filePicker);
        this.filePicker = null;
    }

    inp.nwsaveas = homePath() + name;
    inp.type = 'file';
    inp.style.color = "transparent";
    inp.style.backgroundColor = "transparent";
    inp.style.border = "none";
    inp.style.outline = "none";
    inp.style.position = "absolute";
    inp.style.top = "0px";
    inp.style.left = "0px";
    inp.style.width = "0px";
    inp.style.height = "0px";

    inp.addEventListener(
            "change",
            function (e) {
                document.body.removeChild(inp);
                myself.filePicker = null;

                var fs = require('fs');
                fs.writeFileSync(e.target.files[0].path, contents);
                myself.showMessage('Exported!', 1);
            },
            false
            );

    document.body.appendChild(inp);
    myself.filePicker = inp;

    inp.click();
}

IDE_Morph.prototype.exportScriptsPicture = function () {
    var pics = [],
        pic,
        padding = 20,
        w = 0,
        h = 0,
        y = 0,
        ctx;

    // collect all script pics
    pics.push(this.board.image);
    pics.push(this.board.scripts.scriptsPicture());
    this.board.customBlocks.forEach(function (def) {
        pics.push(def.scriptsPicture());
    });

    pics = pics.filter(function (each) {return !isNil(each); });

    // determine dimensions of composite
    pics.forEach(function (each) {
        w = Math.max(w, each.width);
        h += (each.height);
        h += padding;
    });
    h -= padding;
    pic = newCanvas(new Point(w, h));
    ctx = pic.getContext('2d');

    // draw all parts
    pics.forEach(function (each) {
        ctx.drawImage(each, 0, y);
        y += padding;
        y += each.height;
    });

    this.saveFile('whitecat-scripts.png', pic.toDataURL()); // ToDo!
};

IDE_Morph.prototype.setURL = function (str) {
    if (this.projectsInURLs) {
        location.hash = str;
    }
};

IDE_Morph.prototype.switchToUserMode = function () {
    var world = this.world();

    world.isDevMode = false;
    this.controlBar.updateLabel();
    this.isAutoFill = true;
    this.isDraggable = false;
    this.reactToWorldResize(world.bounds.copy());
    this.siblings().forEach(function (morph) {
        if (morph instanceof DialogBoxMorph) {
            world.add(morph); // bring to front
        } else {
            morph.destroy();
        }
    });
    this.flushBlocksCache();
    this.refreshPalette();
    // prevent non-DialogBoxMorphs from being dropped
    // onto the World in user-mode
    world.reactToDropOf = function (morph) {
        if (!(morph instanceof DialogBoxMorph)) {
            world.hand.grab(morph);
        }
    };
    this.showMessage('entering user mode', 1);

};

IDE_Morph.prototype.switchToDevMode = function () {
    var world = this.world();

    world.isDevMode = true;
    this.controlBar.updateLabel();
    this.isAutoFill = false;
    this.isDraggable = true;
    this.setExtent(world.extent().subtract(100));
    this.setPosition(world.position().add(20));
    this.flushBlocksCache();
    this.refreshPalette();
    // enable non-DialogBoxMorphs to be dropped
    // onto the World in dev-mode
    delete world.reactToDropOf;
    this.showMessage(
        'entering development mode.\n\n'
            + 'error catching is turned off,\n'
            + 'use the browser\'s web console\n'
            + 'to see error messages.'
    );
};

IDE_Morph.prototype.flushBlocksCache = function (category) {
    // if no category is specified, the whole cache gets flushed
    if (category) {
        this.board.blocksCache[category] = null;
    } else {
        this.board.blocksCache = {};
    }
    this.flushPaletteCache(category);
};

IDE_Morph.prototype.flushPaletteCache = function (category) {
    // if no category is specified, the whole cache gets flushed
    if (category) {
        this.board.paletteCache[category] = null;
    } else {
        this.board.paletteCache = {};
    }
};

IDE_Morph.prototype.toggleZebraColoring = function () {
    var scripts = [];

    if (!BlockMorph.prototype.zebraContrast) {
        BlockMorph.prototype.zebraContrast = 40;
    } else {
        BlockMorph.prototype.zebraContrast = 0;
    }

    // select all scripts:
    scripts = scripts.concat(
            this.board.scripts.children.filter(function (morph) {
                return morph instanceof BlockMorph;
            })
            );

    // force-update all scripts:
    scripts.forEach(function (topBlock) {
        topBlock.fixBlockColor(null, true);
    });
};

IDE_Morph.prototype.toggleLongFormInputDialog = function () {
    InputSlotDialogMorph.prototype.isLaunchingExpanded =
        !InputSlotDialogMorph.prototype.isLaunchingExpanded;
    if (InputSlotDialogMorph.prototype.isLaunchingExpanded) {
        this.saveSetting('longform', true);
    } else {
        this.removeSetting('longform');
    }
};

IDE_Morph.prototype.togglePlainPrototypeLabels = function () {
    BlockLabelPlaceHolderMorph.prototype.plainLabel =
        !BlockLabelPlaceHolderMorph.prototype.plainLabel;
    if (BlockLabelPlaceHolderMorph.prototype.plainLabel) {
        this.saveSetting('plainprototype', true);
    } else {
        this.removeSetting('plainprototype');
    }
};

IDE_Morph.prototype.togglePreferEmptySlotDrops = function () {
    ScriptsMorph.prototype.isPreferringEmptySlots =
        !ScriptsMorph.prototype.isPreferringEmptySlots;
};

IDE_Morph.prototype.toggleVirtualKeyboard = function () {
    MorphicPreferences.useVirtualKeyboard =
        !MorphicPreferences.useVirtualKeyboard;
};

IDE_Morph.prototype.toggleInputSliders = function () {
    MorphicPreferences.useSliderForInput =
        !MorphicPreferences.useSliderForInput;
};

IDE_Morph.prototype.toggleSliderExecute = function () {
    InputSlotMorph.prototype.executeOnSliderEdit =
        !InputSlotMorph.prototype.executeOnSliderEdit;
};

IDE_Morph.prototype.updateBootFile = function() {
    this.board.updateBootFile();
}

IDE_Morph.prototype.createNewProject = function () {
    var myself = this;
    this.confirm(
        'Replace the current project with a new one?',
        'New Project',
        function () { myself.newProject(); }
    );
};

// IDE_Morph localization

IDE_Morph.prototype.languageMenu = function () {
    var menu = new MenuMorph(this),
        world = this.world(),
        pos = this.controlBar.settingsButton.bottomLeft(),
        myself = this;
    SnapTranslator.languages().forEach(function (lang) {
        menu.addItem(
            (SnapTranslator.language === lang ? '\u2713 ' : '    ') +
                SnapTranslator.languageName(lang),
            function () {myself.setLanguage(lang); }
        );
    });
    menu.popup(world, pos);
};

IDE_Morph.prototype.setLanguage = function (lang, callback) {
    var translation = document.getElementById('language'),
        src = 'lang-' + lang + '.js',
        myself = this;
    SnapTranslator.unload();
    if (translation) {
        document.head.removeChild(translation);
    }
    if (lang === 'en') {
        return this.reflectLanguage('en', callback);
    }
    translation = document.createElement('script');
    translation.id = 'language';
    translation.onload = function () {
        myself.reflectLanguage(lang, callback);
    };
    document.head.appendChild(translation);
    translation.src = src;
};

IDE_Morph.prototype.reflectLanguage = function (lang, callback) {
    var projectData = this.serializer.serialize(this.board);
    SnapTranslator.language = lang;
    BoardMorph.prototype.initBlocks();
    this.categories = null;
    this.createCategories();
    this.flushBlocksCache();
    this.refreshPalette(true);
    this.fixLayout();
    if (this.loadNewProject) {
        this.newProject();
    } else {
        this.openProjectString(projectData, null, true);
    }
    this.saveSetting('language', lang);
    if (callback) {callback.call(this); }
};

// IDE_Morph blocks scaling

IDE_Morph.prototype.userSetBlocksScale = function () {
    var myself = this,
        scrpt,
        blck,
        shield,
        sample,
        action;

    scrpt = new CommandBlockMorph();
    scrpt.color = BoardMorph.prototype.blockColor.control;
    scrpt.setSpec(localize('build'));
    blck = new CommandBlockMorph();
    blck.color = BoardMorph.prototype.blockColor.data;
    blck.setSpec(localize('your own'));
    scrpt.nextBlock(blck);
    blck = new CommandBlockMorph();
    blck.color = BoardMorph.prototype.blockColor.operators;
    blck.setSpec(localize('blocks'));
    scrpt.bottomBlock().nextBlock(blck);

    sample = new FrameMorph();
    sample.acceptsDrops = false;
    sample.color = IDE_Morph.prototype.groupColor;
    sample.cachedTexture = this.scriptsPaneTexture;
    sample.setExtent(new Point(250, 180));
    scrpt.setPosition(sample.position().add(10));
    sample.add(scrpt);

    shield = new Morph();
    shield.alpha = 0;
    shield.setExtent(sample.extent());
    shield.setPosition(sample.position());
    sample.add(shield);

    action = function (num) {
        scrpt.blockSequence().forEach(function (block) {
            block.setScale(num);
            block.drawNew();
            block.setSpec(block.blockSpec);
        });
    };

    new DialogBoxMorph(
        null,
        function (num) {
            myself.setBlocksScale(Math.min(num, 12));
        }
    ).withKey('zoomBlocks').prompt(
        'Zoom blocks',
        SyntaxElementMorph.prototype.scale.toString(),
        this.world(),
        sample, // pic
        {
            'normal (1x)' : 1,
            'demo (1.2x)' : 1.2,
            'presentation (1.4x)' : 1.4,
            'big (2x)' : 2,
            'huge (4x)' : 4,
            'giant (8x)' : 8,
            'monstrous (10x)' : 10
        },
        false, // read only?
        true, // numeric
        1, // slider min
        12, // slider max
        action // slider action
    );
};

IDE_Morph.prototype.setBlocksScale = function (num) {
    var projectData = this.serializer.serialize(this.board);
    SyntaxElementMorph.prototype.setScale(num);
    CommentMorph.prototype.refreshScale();
    BoardMorph.prototype.initBlocks();
    this.createCategories();
    this.flushBlocksCache();
    this.refreshPalette(true);
    this.fixLayout();
    this.openProjectString(projectData, null, true);
    this.saveSetting('zoom', num);
};

// IDE_Morph user dialog shortcuts

IDE_Morph.prototype.showMessage = function (message, secs) {
    var m = new MenuMorph(null, message),
        intervalHandle;
    m.popUpCenteredInWorld(this.world());
    if (secs) {
        intervalHandle = setInterval(function () {
            m.destroy();
            clearInterval(intervalHandle);
        }, secs * 1000);
    }
    return m;
};

IDE_Morph.prototype.showModalMessage = function (message, secs) {
    var overlay = new TriggerMorph(),
        myself = this,
        m = this.showMessage(message, secs);

    m.originalDestroy = m.destroy;
    m.destroy = function() {
        myself.overlay.destroy();
        this.originalDestroy();
    }

    this.overlay = overlay;
    this.add(overlay);

    overlay.step = function() {
        this.setWidth(myself.width());
        this.setHeight(myself.height());
        this.setPosition(myself.position());
    }
    
    return m;
};

IDE_Morph.prototype.modalPrompt = function (title, message, callback, choices, key) {
    var overlay = new Morph(),
        myself = this,
        m = this.prompt(title, callback, choices, key),
        contents = new AlignmentMorph('column', 5);
    
    contents.add(new TextMorph(message));
    contents.add(copy(m.body));

    contents.drawNew();
    contents.fixLayout();
    contents.changed();

    m.addBody(contents);

    m.originalDestroy = m.destroy;
    m.destroy = function() {
        world.overlay.destroy();
        this.originalDestroy();
    }
    m.drawNew();
    m.fixLayout();

    world.overlay = overlay;
    world.add(overlay);
    world.add(m);

    overlay.step = function() {
        this.setWidth(myself.width());
        this.setHeight(myself.height());
        this.setPosition(myself.position());
    }
    
    return m;
};

IDE_Morph.prototype.inform = function (title, message) {
    var d = new DialogBoxMorph()
    d.inform(
        title,
        localize(message),
        this.world()
    );
    return d;
};

IDE_Morph.prototype.confirm = function (message, title, action) {
    d = new DialogBoxMorph(null, action);
    d.askYesNo(
        title,
        localize(message),
        this.world()
    );
    return d;
};

IDE_Morph.prototype.prompt = function (title, callback, choices, key) {
    var d = new DialogBoxMorph(null, callback);
    d.withKey(key).prompt(
        title,
        '',
        this.world(),
        null,
        choices
    );
    return d;
};
