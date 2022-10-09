let s:name = 'gitter'

function! gitter#buffer#open(uri) abort
  let uri = substitute(a:uri, '^gitter://', '', '')
  if uri == 'rooms'
    " TODO: implement this
    call denops#notify(s:name, 'selectRooms', [])
  elseif uri =~ '^input/[A-Za-z0-9]\+$'
    setlocal bufhidden=wipe buftype=acwrite noswapfile filetype=markdown
    autocmd gitter_internal BufWriteCmd <buffer> setlocal nomodified
    nnoremap <buffer> q <Cmd>call <SID>close_input()<CR>
  elseif uri =~ '\v^room/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/?$'
    setlocal nolist bufhidden=hide noswapfile nomodifiable buftype=nofile filetype=gitter
    nnoremap <buffer> i <Cmd>execute 'botright new gitter://input/' .. b:_gitter.roomId<CR>
    call denops#notify(s:name, 'loadRoom', [substitute(uri, '\v^room/|/?$', '', 'g')])
  else
    call setline(1, 'You accessed wrong named buffer')
  endif
endfunction

function! gitter#buffer#update(bufnr, entry) abort
  call setbufvar(a:bufnr, '&modifiable', v:true)
  call appendbufline(a:bufnr, '$', [repeat('-', 80), '@' .. a:entry.name, ''] + split(a:entry.text, "\n"))
  call setbufvar(a:bufnr, '&modifiable', v:false)
endfunction

function! s:close_input() abort
  if &l:modified
    echohl WarningMsg | echo 'Your changes are not saved' | echohl NONE
  else
    call denops#notify(s:name, 'sendMessage', [
          \ matchstr(bufname(), '^gitter://input/\zs[A-Za-z0-9]\+$'),
          \ join(getline(1, '$'), "\n")
          \ ])
    bwipeout
  endif
endfunction
