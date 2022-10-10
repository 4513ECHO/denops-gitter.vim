function! gitter#util#warn(msg) abort
  echohl WarningMsg
  echomsg '[gitter]' a:msg
  echohl NONE
endfunction
