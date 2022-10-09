if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gitter'

syn match GitterDelimiter /^-\{80}$/
syn match GitterUsername /^@.\{1,20}/
syn match GitterSent /\v\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

hi def link GitterDelimiter Delimiter
hi def link GitterUsername Constant
hi def link GitterSent Comment
