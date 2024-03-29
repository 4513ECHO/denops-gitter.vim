if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gitter'

syn match GitterSent /^\[\d\{4}-\d\d-\d\d \d\d:\d\d]/ nextgroup=GitterDelimiter1 skipwhite
syn match GitterSentEmpty /^\s\+/ transparent nextgroup=GitterDelimiter1
syn match GitterDelimiter1 /║/ contained nextgroup=GitterUsername skipwhite
syn match GitterDelimiter2 /║/ contained nextgroup=GitterMessage,GitterReply skipwhite
syn match GitterUsername /[^║]\+/ contained nextgroup=GitterDelimiter2 skipwhite
syn match GitterReply /\v↳ \d+ repl%(y|ies)$/ contained
syn match GitterError /^Error:/

hi def link GitterSent Comment
hi def link GitterDelimiter1 Delimiter
hi def link GitterDelimiter2 Delimiter
hi def link GitterUsername Identifier
hi def link GitterReply Comment
hi def link GitterError Error
