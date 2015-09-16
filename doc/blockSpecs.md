# WhiteCat Block Specifications

## Introduction

For the definition of the WhiteCat blocks library, we will try our best to adhere to the Lua specification, detailed in the Lua 5.3 Reference Manual. Its online version can be found here: 

[Lua 5.3 Manual](http://www.lua.org/manual/5.3/manual.html)

In cases where Lua is hard to translate into the blocks metaphor we're used to, we will make an extra effort to hide complexity before compromising clarity. An example of this is the way lambda is handled in Lua and the way we would like to have it handled in blocks.

## Conventions

### Syntax

We will be using the following syntax to describe blocks:

* ``! !`` &rarr; Hat block
* ``( )`` &rarr; Reporter block
* ``[ ]`` &rarr; Command block
* ``_[ ]_`` &rarr; Opening of a C-block
* ``|`` &rarr; Contents of a C-block
* ``-----`` &rarr; End of a C-block
* ``{ }`` &rarr; Lambda
* ``< >`` &rarr; Input slot
* ``[ v]`` &rarr; Dropdown input slot
* ``>`` &rarr; Variadic input

## Categories

### Control

Control holds blocks that modify the linear execution of a script.

#### Conditionals

Branching and decision making.

---

_WhiteCat_

    _[if <true>]_____
    |  [do something]
    -----------------

_Lua_

    if (true) then
      doSomething()
    end

---

_WhiteCat_

    _[if <true>]__________
    |  [do something]
    |_[else]______________
    |  [do something else]
    ----------------------

_Lua_

    if (true) then
      doSomething()
    else
      doSomethingElse()
    end

---

#### Iterators

Repeat a stack of blocks a number of times, depending on some condition.

---

_WhiteCat_

    _[while <(<a> < <10>)>]_
    |  [do something]
    ------------------------

_Lua_

    while (a < 10) do
      doSomething()
    end

---

_WhiteCat_

    _[forever]_______
    |  [do something]
    -----------------

_Lua_

    while (true) do
      doSomething()
    end

---

_WhiteCat_

    _[repeat <3>]____
    |  [do something]
    -----------------

_Lua_

    for i=1,3 do
      doSomething()
    end

---

_WhiteCat_

    _[for (i) = <3> to <10>]_
    |  [do something]
    -------------------------

_Lua_

    for i=3,10 do
      doSomething()
    end

---

_WhiteCat_

    _[for each (item) in (<aTable>)]_
    |  [do something with (item)]
    ---------------------------------

_Lua_

    for index,item in pairs(aTable) do
        doSomethingWith(item)
    end

---

### Operators

Mathematical, logical and string manipulation operators belong here. Since the Lua implementation is trivial, we're just listing their block spec:

* ``(< > + < >)`` 
* ``(< > - < >)``
* ``(< > * < >)``
* ``(< > / < >)``
* ``(< > mod < >)``
* ``(round < >)``
* ``([sqrt v] < >)`` _this block mimics Scratch's and features several different mathematical functions such as sin or ln_
* ``(random < > to < >)``
* ``(< > < < >)``
* ``(< > > < >)``
* ``(< > = < >)``
* ``(< > and < >)``
* ``(< > or < >)``
* ``(not < >)``
* ``(true)``
* ``(false)``
* ``(join <hello > <World!> >)``
* ``(split <hello World!> by < >)``

### Data

Data holds all blocks related to variable handling and data types.

#### Variables

Blocks that handle variable assignment and modification.

---

_WhiteCat_

    [set <aVariable> to <some string>]

_Lua_

    aVariable = 'some string'

---

_WhiteCat_

    [change <aVariable> by <1>] 

_Lua_

    aVariable = aVariable + 1

---

_WhiteCat_

    [script variables (aLocalVariable)] 

_Lua_

    local aLocalVariable = nil

---

#### Tables

We reuse the already established metaphor for Lists, although now keys can be of any type, and items don't have a specific order:

---

_WhiteCat_

    (table <3> <hello> >) 

_Lua_

    {3, 'hello'}

---

_WhiteCat_

    [set <myTable> to (table <3> <hello> >)] 

_Lua_

    myTable = {3, 'hello'}

---

_WhiteCat_

    [put <'test'> at <'key'> of <(myTable)>] 

_Lua_

    myTable['key'] = 'test'

---

_WhiteCat_

    (table <(myTable)> at <'key'>) 

_Lua_

    myTable['key']

---

#### Functions

In Lua, all functions are anonymous, so Snap-like lambda syntax fits perfectly. However, Lua seems to have small syntactical inconsistencies regarding anonymous functions that we will need to work around somehow.

The syntax for creating a function when assigning it to a variable is different from the syntax for creating an inline anonymous function:

---

_WhiteCat_

    {[do something with <(a)> and <(b)>] input names: (a) (b) >} 

_Lua_

    return (function (a, b) doSomethingWith(a, b) end)

---

_WhiteCat_

    (call <{[do something with <(a)>] input names: (a) > }> with inputs <3> >) 

_Lua_

    return (function (a) doSomethingWith(a) end)(3)

---

_WhiteCat_

    [set <lambda> to <{[do something with <(a)>] input names: (a) >}> 

_Lua_

    lambda = function (a) doSomethingWith(a) end

---

### Input/Output

Blocks under this category trigger hardware responses into the WhiteCat board. The Lua counterpart to these blocks is not yet completely decided, which is why we are only listing the block specs and textually describing their functionality at the moment:

* ``[set pin [ v] to digital < >]`` Allows to set a digital value to a particular pin. It automatically checks for pin direction and sets it up if needed. Pins are remapped into numbers so we don't need to tell users about physical ports, pretty much like the Arduino platform does. Only digital output capable pins are listed in the dropdown input slot.
* ``[set pin [ v] to analog < >]`` Does the same as the previous, but for PWM capable pins.
* ``(get digital value from pin [ v])`` Returns the current digital reading at a particular pin. Like the others, it is also kind of automagic.
* ``(get analog value from pin [ v])`` Returns the current analog (ADM) reading at a particular pin. Like the others, it is also kind of automagic.

### Communications

Under this category we find all blocks that allow the board to communicate with the outside world (in both ways) via different protocols and technologies. The Lua counterpart is still being worked on.

#### MQTT

* ``!when I receive an MQTT (message) at topic < >!`` Subscribes to a topic and allows to use any message received as an upvar.
* ``!when I receive MQTT message < > at topic < >!`` Subscribes to a topic and checks for a particular message.
* ``[send MQTT message < > with topic < >]`` Sends a message with a particular topic
* ``[set MQTT broker to URL < >]`` All of the blocks above use a default MQTT broker set up exclusively for the WhiteCat project. It is however possible to choose a different broker programmatically.

#### HTTP
* ``([GET v] at http://< > with parameters < >)`` Issues a REST query, to choose from the dropdown list, to the specified server and retrieves its response.

#### WebSockets
* ``(open webSocket at ws://< >)`` Instanciates a socket at a particular URL. You should assign this to a variable if you want to work with it.
* ``[send < > over webSocket < >]`` Sends a message over a webSocket instance.
* ``!when I receive a (message) from webSocket < >!`` Subscribes to a particular webSocket and allows to use any message received as an upvar.
* ``!when I receive message < > from webSocket < >!`` Subscribes to a particular webSocket and checks for a particluar message.

#### GPRS
TBD
