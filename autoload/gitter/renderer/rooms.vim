" @param bufnr number
" @param rooms { name: string, topic: string }[]
function! gitter#renderer#rooms#render(bufnr, rooms) abort
  call setbufvar(a:bufnr, '&modifiable', v:true)
  call setbufline(a:bufnr, 1, map(a:rooms,
        \ { _, val -> printf('%-24s ║ %s', gitter#general#truncate(val.name, 24), val.topic) }))
  call setbufvar(a:bufnr, '&modifiable', v:false)
endfunction
