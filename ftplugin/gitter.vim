if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = v:true

setlocal bufhidden=hide noswapfile nomodifiable buftype=nofile
setlocal nolist nonumber norelativenumber signcolumn=no foldcolumn=0

" TODO: provide plugin mapping
nnoremap <buffer> <Plug>(gitter:input:open) <Cmd>call <SID>open_input()<CR>
nnoremap <buffer> <Plug>(gitter:media:add) <Cmd>call <SID>add_media()<CR>
nnoremap <buffer> i <Plug>(gitter:input:open)
nnoremap <buffer> ma <Plug>(gitter:media:add)

function! s:open_input() abort
  execute 'botright 5new gitter://input/' .. b:_gitter.roomId
  startinsert
endfunction

function! s:add_media() abort
  call denops#notify('gitter', 'sendMedia', [b:_gitter.roomId])
endfunction
