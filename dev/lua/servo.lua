function setServo(pin, value)
   cfg.s[pin] = value
   pio.pin.setdir(pio.OUTPUT, pin)
end

function moveServo(pin, value)
   thread.start(function()
     while true do
       pio.pin.sethigh(pin)
       tmr.delayus(value)
       pio.pin.setlow(pin)
       tmr.delayus(20000 - value)
     end
   end)
end

function runServos()
   for pin, value in pairs(cfg.s) do moveServo(pin, value) end
end
