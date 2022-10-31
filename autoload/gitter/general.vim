function! gitter#general#detect_buffer(uri) abort
  if type(get(g:, 'gitter#token', v:null)) != v:t_string
    call gitter#general#print_error('Personal Access Token is invalid')
    return
  endif
  let uri = substitute(a:uri, '^gitter://', '', '')
  if uri == 'rooms'
    setlocal filetype=gitter-rooms
    call denops#notify('gitter', 'selectRooms', [bufnr()])
  elseif uri =~# '^input/\x\+$'
    setlocal filetype=markdown.gitter-input
  elseif uri =~# '^room/[A-Za-z0-9_.-]\+/[A-Za-z0-9_.-]\+$'
    setlocal filetype=gitter
    call denops#notify('gitter', 'loadRoom',
          \ [substitute(uri, '^room/', '', 'g'), bufnr(), win_getid()])
  else
    call gitter#general#print_error('You accessed wrong named buffer')
  endif
endfunction

if has('nvim')
  " @param bufnr number
  " @param callback string - the name of callback. Funcref is not allowed.
  function! gitter#general#add_buf_listener(bufnr, callback) abort
    " XXX: use vim.defer_fn() to avoid E315, internal error of Vim
    call luaeval('vim.api.nvim_buf_attach(_A.bufnr, false, { on_lines ='
          \ .. 'function() vim.defer_fn(vim.fn[_A.callback], 10) end'
          \ .. '})',
          \ { 'bufnr': a:bufnr, 'callback': a:callback })
  endfunction
else
  " @param bufnr number
  " @param callback string - the name of callback.
  function! gitter#general#add_buf_listener(bufnr, callback) abort
    call listener_add(a:callback, a:bufnr)
  endfunction
endif

" NOTE: use variable length arguments because this is called with some
" unneeded arguments as callback
function! gitter#general#goto_bottom(...) abort
  let winid = get(g:, 'gitter#_parent_winid', 0)
  if winid && line('.', winid) == line('w$', winid)
    call win_execute(winid, "execute 'normal! Gz-' | redraw")
  endif
endfunction

function! gitter#general#print_error(msg) abort
  echohl ErrorMsg
  echomsg '[gitter]' a:msg
  echohl NONE
endfunction

function! gitter#general#truncate(str, width) abort
  return strdisplaywidth(a:str) < a:width
        \ ? a:str
        \ : strcharpart(a:str, 0, a:width - strdisplaywidth('…')) .. '…'
endfunction
