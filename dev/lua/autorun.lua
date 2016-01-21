vars = {}
msg = {}
cfg = {}
cfg.p = {}
cfg.s = {}

uart.setup(uart.UART1, 115200, 8, uart.PARNONE, uart.STOP1)
prints = function(string) uart.write(uart.UART1, string.."\r\n") end

dofile("/sd/autorun.lua")
