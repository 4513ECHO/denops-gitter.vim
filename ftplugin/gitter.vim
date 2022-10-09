if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = v:true

setlocal bufhidden=hide noswapfile nomodifiable buftype=nofile
setlocal nolist nonumber norelativenumber signcolumn=no foldcolumn=0

" TODO: provide plugin mapping
nnoremap <buffer> i <Cmd>call <SID>open_input()<CR>
nnoremap <buffer> ma <Cmd>call <SID>add_media()<CR>

function! s:open_input() abort
  execute 'botright new gitter://input/' .. b:_gitter.roomId
  startinsert
endfunction

function! s:add_media() abort
  let uri = substitute(bufname(), '^gitter://', '', '')
  call denops#notify('gitter', "sendMedia", [
        \ substitute(uri, '\v^room/|/?$', '', 'g'),
        \ ])
endfunction
