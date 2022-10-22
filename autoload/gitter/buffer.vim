let s:name = 'gitter'

function! gitter#buffer#open(uri) abort
  if empty(get(g:, 'gitter#token', ''))
    call s:render_error('Parsonal Access Token is not defined')
    return
  endif
  let uri = substitute(a:uri, '^gitter://', '', '')
  if uri == 'rooms'
    setlocal filetype=gitter-rooms
    call denops#notify(s:name, 'selectRooms', [])
  elseif uri =~ '^input/[A-Za-z0-9]\+$'
    setlocal filetype=markdown.gitter-input
  elseif uri =~ '\v^room/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/?$'
    setlocal filetype=gitter
    call denops#notify(s:name, 'loadRoom', [substitute(uri, '\v^room/|/?$', '', 'g')])
  else
    call s:render_error('You accessed wrong named buffer')
  endif
endfunction

" @param bufnr number
" @param entries { username: string, text: string, sent: string, id: string, }[]
function! gitter#buffer#render_messages(bufnr, entries) abort
  let format = ['[%16s] ║ %14s ║ %s', printf('%19s║%16s║ %%s', '', '')]
  call setbufvar(a:bufnr, '&modifiable', v:true)
  for entry in a:entries
    let text = split(entry.text, "\n")
    let lines = [printf(format[0], entry.sent, s:truncate(entry.username, 14), text[0])]
          \ + (len(text) > 1 ? map(text[1:], { _, val -> printf(format[1], val) }) : [])
    let lastline = line('$', g:gitter#_parent_winid)
    call setbufline(a:bufnr, lastline + 1, lines)
    " update b:_gitter
    let _gitter = getbufvar(a:bufnr, '_gitter')
    call setbufvar(a:bufnr, '_gitter',
          \ extend(_gitter, {
          \ 'messages': add(
          \   _gitter.messages,
          \   extend(entry, {
          \     'position': {'start': lastline + 1, 'end': lastline + len(lines)},
          \     'lines': lines
          \   })
          \ )}))
  endfor
  call setbufvar(a:bufnr, '&modifiable', v:false)
endfunction

function! gitter#buffer#attach_buf(bufnr) abort
  call luaeval('vim.api.nvim_buf_attach(_A, false, { on_lines = function()'
        \ .. 'vim.defer_fn(vim.fn["gitter#buffer#move_cursor"], 10)'
        \ .. 'end })',
        \ a:bufnr)
endfunction

function! gitter#buffer#move_cursor(...) abort
  let winid = get(g:, 'gitter#_parent_winid', 0)
  if winid && line('.', winid) == line('w$', winid)
    call win_execute(winid, "execute 'normal! Gz-' | redraw")
  endif
endfunction

" @param bufnr number
" @param rooms { name: string, topic: string }[]
function! gitter#buffer#render_rooms(bufnr, rooms) abort
  call setbufvar(a:bufnr, '&modifiable', v:true)
  call setbufline(a:bufnr, 1, map(a:rooms,
        \ { _, val -> printf('%-24s ║ %s', s:truncate(val.name, 24), val.topic) }))
  call setbufvar(a:bufnr, '&modifiable', v:false)
endfunction

function! s:truncate(str, width) abort
  return strdisplaywidth(a:str) < a:width
        \ ? a:str
        \ : strcharpart(a:str, 0, a:width - strdisplaywidth('… ')) .. '… '
endfunction

function! s:render_error(msg) abort
  setlocal filetype=gitter modifiable bufhidden=wipe
  call setline(1, 'Error: ' .. a:msg)
  setlocal nomodifiable
endfunction
