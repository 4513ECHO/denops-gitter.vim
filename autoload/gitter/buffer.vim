let s:name = 'gitter'

function! gitter#buffer#open(uri) abort
  if empty(get(g:, 'gitter#token', ''))
    call s:render_error('Parsonal Access Token is not defined')
    return
  endif
  let uri = substitute(a:uri, '^gitter://', '', '')
  if uri == 'rooms'
    call s:render_error('This feature is not implemented yet')
  elseif uri =~ '^input/[A-Za-z0-9]\+$'
    setlocal bufhidden=wipe buftype=acwrite noswapfile filetype=markdown
    autocmd gitter_internal BufWriteCmd <buffer> setlocal nomodified
    nnoremap <buffer> q <Cmd>call <SID>close_input()<CR>
  elseif uri =~ '\v^room/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/?$'
    setlocal filetype=gitter
    call denops#notify(s:name, 'loadRoom', [substitute(uri, '\v^room/|/?$', '', 'g')])
  else
    call s:render_error('You accessed wrong named buffer')
  endif
endfunction

" @param bufnr number
" @param entries { displayName: string, username: string, text: string, sent: string }[]
function! gitter#buffer#update(bufnr, entries) abort
  let format = ['[%16s] ║ %14s ║ %s', printf('%19s║%16s║ %%s', '', '')]
  call setbufvar(a:bufnr, '&modifiable', v:true)
  for entry in a:entries
    let text = split(entry.text, "\n")
    let lines = [printf(format[0], entry.sent, entry.displayName, text[0])]
          \ + (len(text) > 1 ? map(text[1:], { _, val -> printf(format[1], val) }) : [])
    call appendbufline(a:bufnr, '$', lines)
  endfor
  call setbufvar(a:bufnr, '&modifiable', v:false)
endfunction

function! s:render_error(msg) abort
  setlocal filetype=gitter modifiable bufhidden=wipe
  call setline(1, 'Error: ' .. a:msg)
  setlocal nomodifiable
endfunction

function! s:close_input() abort
  if &l:modified
    call gitter#util#warn('Your changes are not saved')
  else
    call denops#notify(s:name, 'sendMessage', [
          \ matchstr(bufname(), '^gitter://input/\zs[A-Za-z0-9]\+$'),
          \ join(getline(1, '$'), "\n")
          \ ])
    close
    if exists('g:gitter#_parent_winid')
      call win_gotoid(g:gitter#_parent_winid)
    endif
  endif
endfunction
