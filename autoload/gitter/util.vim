function! gitter#util#warn(msg) abort
  echohl WarningMsg
  echomsg '[gitter]' a:msg
  echohl NONE
endfunction

let s:frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

function! gitter#util#spinner() abort
  let s:count = 1
  return timer_start(80, { -> [
        \ execute('redraw'),
        \ execute('echo "[gitter]" s:frames[s:count % len(s:frames)] "Loading..."', ''),
        \ execute('let s:count += 1'),
        \ ] }, { 'repeat': -1 })
endfunction
