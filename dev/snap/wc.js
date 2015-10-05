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

    // Is this the best approach?
    // The division into three items seems arbitrary in many cases
    this.opening = '';
    this.body = '';
    this.closing = '';

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
    return this.opening + this.body + this.closing;
}

/////////////// Lua equivalences ////////////////////

//// Control

// Hat Blocks

LuaExpression.prototype.receiveGo = function () {
    // ToDo
    // What to do with this guy?
}

// Iterators

LuaExpression.prototype.doForever = function (body) {
    this.opening = 'while (true) do\n';
    this.body = body;
    this.closing = '\nend';
};

LuaExpression.prototype.doRepeat = function (times, body) {
    this.opening = 'for i=1,' + times + ' do\n';
    this.body = body;
    this.closing = '\nend';
};

// Conditionals

LuaExpression.prototype.doIf = function (condition, body) {
    this.opening = 'if ' + condition + ' then\n';
    this.body = body;
    this.closing = 'end';
}

LuaExpression.prototype.doIfElse = function (condition, body, elseBody) {
    this.opening = 'if ' + condition + ' then\n';
    this.body = body;
    this.closing = '\nelse\n' + elseBody + '\nend';
}

// Others

LuaExpression.prototype.doReport = function (body) {
    this.opening = 'return ';
    this.body = body;
    this.closing = '';
}

LuaExpression.prototype.doWait = function (secs) {
    this.opening = 'tmr.delay(';
    // tmr.delay expects an id (nil) and a value in ns
    this.body = 'nil, ' + secs + ' * 1000000';
    this.closing = ')';
}


//// Operators

LuaExpression.prototype.reportSum = function (a, b) {
    this.opening = '(' + a;
    this.body = ' + ';
    this.closing = b + ')';
}

LuaExpression.prototype.reportDifference = function (a, b) {
    this.opening = '(' + a;
    this.body = ' - ';
    this.closing = b + ')';
}

LuaExpression.prototype.reportProduct = function (a, b) {
    this.opening = '(' + a;
    this.body = ' * ';
    this.closing = b + ')';
}

LuaExpression.prototype.reportQuotient = function (a, b) {
    this.opening = '(' + a;
    this.body = ' / ';
    this.closing = b + ')';
}

LuaExpression.prototype.reportModulus = function (a, b) {
    this.opening = '(' + a;
    this.body = ' % ';
    this.closing = b + ')';
}

LuaExpression.prototype.reportMonadic = function (func, a) {
    var specialFunctions = { ln: 'log', log: 'log10', 'e^': 'math.exp', '10^': '10^' };

    this.opening = '(';

    if (specialFunctions.hasOwnProperty(func)) {
        this.opening += specialFunctions[func];
    } else {
        this.opening += 'math.' + func;
    }

    this.opening += '(';
    this.body = a;
    this.closing = '))';
}

LuaExpression.prototype.reportRandom = function (a, b) {
    this.opening = '(math.random(';
    this.body = a + ',' + b;
    this.closing = '))';
}

LuaExpression.prototype.reportLessThan = function (a, b) {
    this.opening = '(' + a;
    this.body = ' < ';
    this.closing = b + ')';
}

LuaExpression.prototype.reportEquals = function (a, b) {
    this.opening = '(' + a;
    this.body = ' == ';
    this.closing = b + ')';
}

LuaExpression.prototype.reportGreaterThan = function (a, b) {
    this.opening = '(' + a;
    this.body = ' > ';
    this.closing = b + ')';
}

LuaExpression.prototype.reportAnd = function (a, b) {
    this.opening = '(' + a;
    this.body = ' and ';
    this.closing = b + ')';
}

LuaExpression.prototype.reportOr = function (a, b) {
    this.opening = '(' + a;
    this.body = ' or ';
    this.closing = b + ')';
}

LuaExpression.prototype.reportNot = function (a) {
    this.opening = '(not ';
    this.body = a;
    this.closing = ')';
}

LuaExpression.prototype.reportTrue = function () {
    this.body = 'true';
}

LuaExpression.prototype.reportFalse = function () {
    this.body = 'false';
}

LuaExpression.prototype.reportJoinWords = function () {
    var myself = this;

    this.opening = '(';
    this.body = '\'\'';

    (Array.prototype.slice.call(arguments)).forEach(function(eachWord) {
        myself.body += '.. \'' + eachWord + '\''
    });

    this.closing = ')';
}

//// Data

//// Input/Output

LuaExpression.prototype.setPinDigital = function(pin, value) {
    this.opening = 'pio.pin.set' + toHighLow(value) + '(';
    this.body = 'pio.PB_' + pin;
    this.closing = ')'
}
