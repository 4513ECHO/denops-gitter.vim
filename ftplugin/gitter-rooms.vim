if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = v:true

setlocal bufhidden=wipe noswapfile nomodifiable buftype=nofile
setlocal nolist nonumber norelativenumber signcolumn=no nofoldenable

" TODO: provide plugin mapping
nnoremap <buffer> <Plug>(gitter:enter_room) <Cmd>call <SID>enter_room()<CR>
nnoremap <buffer> <CR> <Plug>(gitter:enter_room)

function! s:enter_room() abort
  execute 'edit gitter://room/' .. b:_gitter.rooms[line('.') - 1].uri
endfunction
