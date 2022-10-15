if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gitter-rooms'

syn match GitterRoom /^[^║]\+/ nextgroup=GitterDelimiter skipwhite
syn match GitterRoomDelimiter /║/ contained

hi def link GitterRoomName Identifier
hi def link GitterRoomDelimiter Delimiter
