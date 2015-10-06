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

// Coroutines map into Lua coroutines
var Coroutine;

Coroutine.prototype = {};
Coroutine.prototype.constructor = Coroutine;
Coroutine.uber = Object.prototype;

function Coroutine(id, body, topBlock) {
    this.init(id, body, topBlock);
}

Coroutine.prototype.init = function(id, body, topBlock) {
    this.id = id;
    this.body = 'co' + id  + ' = ' + this.wrap(body);
    this.topBlock = topBlock;
}

Coroutine.prototype.wrap = function(body) {
    return 'coroutine.create(function()\n\r' + body + '\n\rend)';
}

// Scheduler handles coroutine threads
var Scheduler;

Scheduler.prototype = {};
Scheduler.prototype.constructor = Scheduler;
Scheduler.uber = Object.prototype;

function Scheduler(coroutines) {
    this.init(coroutines);
}

Scheduler.prototype.init = function(coroutines) {
    var myself = this;

    this.coroutines = coroutines;
    this.header = 'while ';
    this.body = '';

    this.coroutines.forEach(function(coroutine) {
        myself.header += 'coroutine.status(co' + coroutine.id + ') ~= "dead" or '
        myself.body += 'if coroutine.status(co' + coroutine.id + ') ~= "dead" then coroutine.resume(co' + coroutine.id + ') end\n\r';
    });

    this.header += 'false do\n\r';
    this.body += '\n\rend\n\r';
}

Scheduler.prototype.toString = function() {
    return this.header + this.body
}

// LuaExpression 

var LuaExpression;
LuaExpression.prototype = {};
LuaExpression.prototype.constructor = LuaExpression;
LuaExpression.uber = Object.prototype;

function LuaExpression(topBlock, board) {
    this.init(topBlock, board)
}

LuaExpression.prototype.init = function(topBlock, board) {
    var args = [],
        nextBlock = topBlock.nextBlock();

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
            // If it's a variadic input, let's recursivelly traverse its inputs
            input.inputs().forEach(function(each) { translateInput(each) });
        } else {
            // Otherwise, it's a reporter, so we need to translate it into a LuaExpression 
            args.push(new LuaExpression(input, board));
        }
    }

    topBlock.inputs().forEach(function(each) { translateInput(each) });

    this[topBlock.selector].apply(this, args);

    this.code += 'coroutine.yield()\n\r';

    if (nextBlock) {
        this.code += (new LuaExpression(nextBlock, board)).toString();
    }
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
    this.code = 'while (true) do\n\r' + body + '\n\rcoroutine.yield()\n\rend\n\r';
};

LuaExpression.prototype.doRepeat = function (times, body) {
    this.code = 'for i=1,' + times + ' do\n\r' + body + '\n\rcoroutine.yield()\n\rend\n\r';
};

// Conditionals

LuaExpression.prototype.doIf = function (condition, body) {
    this.code = 'if ' + condition + ' then\n\r' + body + 'end\n\r';
}

LuaExpression.prototype.doIfElse = function (condition, trueBody, falseBody) {
    this.code = 'if ' + condition + ' then\n\r' + trueBody + '\n\relse\n\r' + falseBody + '\n\rend\n\r';
}

// Others

LuaExpression.prototype.doReport = function (body) {
    this.code = 'return ' + body + '\n\r';
}

LuaExpression.prototype.doWait = function (secs) {
    // WRONG! We have to implement wait ourselves
    // See http://www.eluaproject.net/doc/v0.9/en_refman_gen_tmr.html#tmr.getdiffnow
    this.code = 'tmr.delay(nil, ' + secs + ' * 1000000)\n\r';
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
    this.code = 'pio.pin.set' + toHighLow(value) + '(pio.' + this.board.pinOut.digitalOutput[pin] + ')\n\r'
}
