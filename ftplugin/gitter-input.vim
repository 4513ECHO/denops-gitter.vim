if exists('b:did_ftplugin') && &filetype !~# 'markdown'
  finish
endif
let b:did_ftplugin = v:true

setlocal bufhidden=wipe buftype=acwrite noswapfile winfixheight

augroup gitter_input_internal
  autocmd! * <buffer>
  autocmd BufWriteCmd <buffer> call s:BufWriteCmd()
  autocmd WinClosed <buffer> call s:WinClosed()
augroup END

nnoremap <buffer> q <Cmd>close!<CR>
" TODO: implement these
nnoremap <buffer> <Plug>(gitter:input:send_and_clear) <Nop>
nnoremap <buffer> <Plug>(gitter:input:send_and_close) <Nop>
let g:gitter#send_on_write = get(g:, 'gitter#send_on_write', v:false)

function! s:BufWriteCmd() abort
  if g:gitter#send_on_write
    call s:send()
    %delete _
  endif
  setlocal nomodified
endfunction

function! s:WinClosed() abort
  if !&modified ||
       \ confirm('The buffer will be abandoned! Do you want to send?', "&Yes\n&No") == 1
    call s:send()
  endif
  bdelete!
  if exists('g:gitter#_parent_winid')
    call win_gotoid(g:gitter#_parent_winid)
  endif
endfunction

function! s:send() abort
  call denops#notify('gitter', 'sendMessage', [
        \ matchstr(bufname(), '^gitter://input/\zs\x\+$'),
        \ join(getline(1, '$'), "\n")
        \ ])
endfunction
