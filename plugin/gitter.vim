if exists('g:loaded_gitter')
  finish
endif
let g:loaded_gitter = v:true

augroup gitter_internal
  autocmd!
  autocmd BufReadCmd gitter://* call gitter#buffer#open(expand('<amatch>'))
augroup END
