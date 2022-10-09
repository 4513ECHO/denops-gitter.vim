# denops-gitter.vim

[Gitter](https://gitter.im) client for vim written in denops

> **Note** This plugins is still alpha version and working in progress. There
> may be bugs and breaking changes.

## Requirements

- [denops.vim](https://github.com/vim-denops/denops.vim)
- Personal Access Token for Gitter

Please get it from [here](https://developer.gitter.im/login).

## Usage

You have to set your parsonal access token to `g:gitter#token`.

```vim
let g:gitter#token = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
```

Open `gitter://room/:owner/:repo` to start chating.

```vim
new gitter://room/gitter/api
```

Press `i` to open buffer for new message. You can write anything to the buffer,
then save and press `q` to send the message.
