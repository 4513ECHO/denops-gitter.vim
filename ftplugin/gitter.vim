if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = v:true

setlocal bufhidden=hide noswapfile nomodifiable buftype=nofile
setlocal nolist nonumber norelativenumber signcolumn=no foldcolumn=0

nnoremap <buffer> i <Cmd>call <SID>open_input()<CR>

function! s:open_input() abort
  execute 'botright new gitter://input/' .. b:_gitter.roomId
  startinsert
endfunction
