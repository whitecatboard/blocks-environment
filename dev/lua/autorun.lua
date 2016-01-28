-- WhiteCat blocks environment boot preconditions
-- ==============================================
--
-- Copyright (C) 2015 by Bernat Romagosa
-- Edutec Research Group, Citilab - Cornellà de Llobregat (Barcelona)
-- bromagosa@citilab.eu
--    
-- This file is part of WhiteCat.
-- WhiteCat is free software: you can redistribute it and/or modify
-- it under the terms of the GNU Affero General Public License as
-- published by the Free Software Foundation, either version 3 of
-- the License, or (at your option) any later version.
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU Affero General Public License for more details.
-- You should have received a copy of the GNU Affero General Public License
-- along with this program.  If not, see <http://www.gnu.org/licenses/>.


-- Global tables
-- =============

vars = {}
msg = {}
cfg = {}
cfg.p = {}
cfg.s = {}
cfg.i = false;

-- Communication with the blocks environment
-- =========================================

uart.setup(uart.UART1, 115200, 8, uart.PARNONE, uart.STOP1)

prints = function(string)
    uart.write(uart.UART1, string .. "\r\n")
end


-- File handling
-- =============

function fileExists(name)
   local f = io.open(name,"r")
   if f ~= nil then io.close(f) return true else return false end
end


-- Casting
-- =======

toDigital = function(value) return (value == true or value == 1) end
digitalToNumber = function(value) return (value and 1 or 0) end
toNumber = function(value) return (value + 0) end

printVar = function(var)
    if (type(var) == "string") then
        return var
    elseif (type(var) == "table") then
        return printTable(var)
    else
        return tostring(var)
    end
end

printTable = function(t)
    local s = "List("
    for i = 1, t.length do s = s .. t[i] .. ", " end
    return (string.sub(s, 0, -3) .. ")")
end


-- Pin config
-- ==========

pwmMap = { nil, nil, nil, nil, nil, nil, nil, 3, nil, 7, 1, 4, 5, nil, nil, 8 }

isPwmConfig = function(pinConfig)
    return (pinConfig ~= nil and ((pinConfig[1] == "a" or pinConfig[1] == "s") and pinConfig[2] == 0))
end

setPinConfig = function(pinNumber, pin, mode, direction)

    if (isPwmConfig(cfg.p[pinNumber]) and not isPwmConfig({mode, direction})) then
        pwm.stop(pwmMap[pinNumber])
    end

    cfg.p[pinNumber] = { mode, direction, nil }

    if (mode == "a") then
        if (direction == 0) then
            pwm.setup(pin, pwm.DAC, 12, 0)
            pwm.start(pin)
        else
            local a = adc.setup(adc.ADC1, adc.AVDD, 3220)
            cfg.p[pinNumber][3] = a:setupchan(12, pin)
        end
    elseif (mode == "s") then
        pwm.setup(pin, pwm.DEFAULT, 50, 0.075)
        pwm.start(pin)
    else
        pio.pin.setdir(direction, pin)
    end
end


-- User program
-- ============

local scripts = {"internet", "mqtt", "autorun"}

for index, script in pairs(scripts) do
    if fileExists("/sd/" .. script .. ".lua") then dofile("/sd/" .. script .. ".lua") end
end
