if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gitter'

syn match GitterDelimiter /^-\{80}$/
syn match GitterUsername /@[A-Za-z0-9_-]\+/

hi def link GitterDelimiter Delimiter
hi def link GitterUsername Constant
