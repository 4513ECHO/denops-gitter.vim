if exists('g:loaded_gitter') || &cp
  finish
endif
let g:loaded_gitter = v:true

let s:save_cpo = &cpo
set cpo&vim

augroup gitter_internal
  autocmd!
  autocmd BufReadCmd gitter://* call gitter#buffer#open(expand('<amatch>'))
  autocmd ColorScheme * :
augroup END

let &cpo = s:save_cpo
unlet s:save_cpo
