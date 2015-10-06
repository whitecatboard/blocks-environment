// Global utils

function toHighLow(value) {
    return toBool(value) ? 'high' : 'low'
}

function toBool(value) {
    var val = value;

    if (typeof value == 'string') {
        val = value.toLowerCase();
    }

    return (val == 'true' || val == 1 || val == 'high')
}

var Coroutine;

Coroutine.prototype = {};
Coroutine.prototype.constructor = Coroutine;
Coroutine.uber = Object.prototype;

function Coroutine(id, body) {
    this.init(id, body);
}

Coroutine.prototype.init = function(id, body, block) {
    this.id = id;
    this.body = 'co' + id  + ' = ' + this.wrap(body);
    this.topBlock = block;
}

Coroutine.prototype.wrap = function(body) {
    return 'coroutine.create(function()\n' + body + '\nend)';
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

    this.block = block;

    this.code = '';

    if (!block) { return };

    function translateInput(input) {
        if (input instanceof InputSlotMorph) {
            // If input is an InputSlotMorph, get its contents
            args.push(input.contents().text);
        } else if (input instanceof CSlotMorph) {
            // If it's a CSlotMorph, get its nested block
            args.push(new LuaExpression(input.nestedBlock()));
        } else if (input instanceof MultiArgMorph) {
            // If it's a variadic input, let's recursivelly traverse its inputs
            input.inputs().forEach(function(each) { translateInput(each) });
        } else {
            // Otherwise, it's a reporter, so we need to translate it into a LuaExpression 
            args.push(new LuaExpression(input));
        }
    }

    block.inputs().forEach(function(each) { translateInput(each) });

    this[block.selector].apply(this, args);
}

LuaExpression.prototype.toString = function() {
    return this.code;
}

/////////////// Lua generation ////////////////////

//// Control

// Hat Blocks

LuaExpression.prototype.receiveGo = function () {
    // ToDo
    // What to do with this guy?
}

// Iterators

LuaExpression.prototype.doForever = function (body) {
    this.code = 'while (true) do\n' + body + '\nend';
};

LuaExpression.prototype.doRepeat = function (times, body) {
    this.code = 'for i=1,' + times + ' do\n' + body + '\nend';
};

// Conditionals

LuaExpression.prototype.doIf = function (condition, body) {
    this.code = 'if ' + condition + ' then\n' + body + 'end';
}

LuaExpression.prototype.doIfElse = function (condition, trueBody, falseBody) {
    this.code = 'if ' + condition + ' then\n' + trueBody + '\nelse\n' + falseBody + '\nend';
}

// Others

LuaExpression.prototype.doReport = function (body) {
    this.code = 'return ' + body;
}

LuaExpression.prototype.doWait = function (secs) {
    // tmr.delay expects an id (nil) and a value in ns
    this.code = 'tmr.delay(nil, ' + secs + ' * 1000000)';
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
    var specialFunctions = { ln: 'log', log: 'log10', 'e^': 'math.exp', '10^': '10^' };

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

    this.code = '(\'\'';

    (Array.prototype.slice.call(arguments)).forEach(function(eachWord) {
        myself.code += '.. \'' + eachWord + '\''
    });

    this.code += ')';
}

//// Data

//// Input/Output

LuaExpression.prototype.setPinDigital = function(pin, value) {
    this.code = 'pio.pin.set' + toHighLow(value) + '(pio.PB_' + pin + ')'
}
