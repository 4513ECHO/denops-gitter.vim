if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gitter'

syn match GitterDelimiter /^-\{60}$/
syn match GitterDisplayName /^.\+\ze @/ nextgroup=GitterUsername skipwhite
syn match GitterUsername /@[A-Za-z0-9_-]\+/ contained nextgroup=GitterSent skipwhite
syn match GitterSent /|[0-9: ]\+|$/ contained

syn region GitterCodeBlock matchgroup=GitterCodeBlockDelimiter start=/^\s*```\+.*$/ end=/^\s*```\+\ze\s*$/ keepend

hi def link GitterDelimiter Delimiter
hi def link GitterDisplayName Constant
hi def link GitterUsername Identifier
hi def link GitterSent Comment

" hi def link GitterCodeBlock
hi def link GitterCodeBlockDelimiter Delimiter
