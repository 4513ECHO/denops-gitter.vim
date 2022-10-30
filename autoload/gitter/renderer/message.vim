" @param entry { username: string, text: string, sent: string, id: string, thread: number }
" @return string[]
function! s:format_message(entry) abort
  let format = ['[%16s] ║ %14s ║ %s', printf('%19s║%16s║ %%s', '', '')]
  let text = split(a:entry.text, "\n")
  let lines = [printf(format[0], a:entry.sent, gitter#general#truncate(a:entry.username, 14), text[0])]
        \ + (len(text) > 1 ? map(text[1:], { _, val -> printf(format[1], val) }) : [])
        \ + (a:entry.thread > 0
        \   ? [printf(format[1], '↳ ' .. a:entry.thread ..
        \     ' repl' .. (a:entry.thread == 1 ? 'y' : 'ies'))]
        \   : [])
  return lines
endfunction

" @param id string
function! s:find_by_id(id) abort
  let messages = filter(copy(getbufvar(a:bufnr, '_gitter').messages),
        \ { _, val -> val.id ==# a:id })
  return empty(messages) ? {} : messages[0]
endfunction

" @param bufnr number
" @param entries { username: string, text: string, sent: string, id: string, thread: number }[]
function! gitter#renderer#message#append(bufnr, entries) abort
  call setbufvar(a:bufnr, '&modifiable', v:true)
  for entry in a:entries
    let lines = s:format_message(entry)
    let lastline = line('$', g:gitter#_parent_winid)
    keepjumps call setbufline(a:bufnr, lastline + 1, lines)
    " update b:_gitter
    let _gitter = getbufvar(a:bufnr, '_gitter')
    call setbufvar(a:bufnr, '_gitter',
          \ extend(_gitter, {
          \ 'messages': add(
          \   _gitter.messages,
          \   extend(entry, {'position': {
          \     'start': lastline + 1,
          \     'end': lastline + len(lines),
          \     'idx': len(_gitter.messages),
          \   }})
          \ )}))
  endfor
  call setbufvar(a:bufnr, '&modifiable', v:false)
endfunction

" @param bufnr number
" @param parentId string
function! gitter#renderer#message#increase_thread(bufnr, parentId) abort
  call setbufvar(a:bufnr, '&modifiable', v:true)
  let parent = s:find_by_id(a:parentId)
  if !empty(parent)
    let lines = s:format_message(parent)
    keepjumps call deletebufline(a:bufnr, parent.position.start, parent.position.end)
    keepjumps call appendbufline(a:bufnr, parent.position.start - 1, lines)
  endif
  call setbufvar(a:bufnr, '&modifiable', v:false)
endfunction

" @param bufnr number
" @param entries { username: string, text: string, sent: string, id: string, thread: number }[]
function! gitter#renderer#message#edit(bufnr, entry) abort
  call setbufvar(a:bufnr, '&modifiable', v:true)
  for entry in a:entries
    let position = s:find_by_id(entry.id).position
    let lines = s:format_message(entry)
    keepjumps call deletebufline(a:bufnr, position.start, position.end)
    keepjumps call appendbufline(a:bufnr, position.start - 1, lines)
    if len(lines) != (position.end - position.start + 1)
      " update b:_gitter
      let diff = len(lines) - (position.end - position.start + 1)
      let _gitter = getbufvar(a:bufnr, '_gitter')
      call setbufvar(a:bufnr, '_gitter',
            \ extend(_gitter, {
            \ 'messages': map(
            \   _gitter.messages,
            \   { _, val ->
            \   val.id ==# entry.id
            \   ? extend(entry, {'position': {
            \       'start': position.start + diff,
            \       'end': position.end + diff,
            \       'idx': position.idx,
            \   })
            \   : val.position.start >= position.start
            \     ? extend(val, {'position': {
            \         'start': val.position.start + diff,
            \         'end': val.position.end + diff,
            \         'idx': val.position.idx,
            \       }})
            \     : val }
            \ )}))
    endif
  endfor
  call setbufvar(a:bufnr, '&modifiable', v:false)
endfunction
