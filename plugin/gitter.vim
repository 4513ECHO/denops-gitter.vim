if exists('g:loaded_gitter')
  finish
endif
let g:loaded_gitter = v:true

augroup gitter_internal
  autocmd!
  autocmd BufReadCmd gitter://* call gitter#general#detect_buffer(expand('<amatch>'))
augroup END
