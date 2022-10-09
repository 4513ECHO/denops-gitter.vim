function! gitter#util#warn(msg) abort
  echohl WarningMsg
  echomsg a:msg
  echohl NONE
endfunction
