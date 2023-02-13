# denops-gitter.vim

🎸 Asynchronous realtime [Gitter](https://gitter.im) client for Vim/Neovim

> **Warning** This plugin is no longer maintained. Please use
> [parade.vim](https://github.com/4513ECHO/parade.vim) instead.

## Requirements

- [denops.vim](https://github.com/vim-denops/denops.vim)
- Personal Access Token for Gitter

**Please get the token from [here](https://developer.gitter.im/login).**

## Usage

You have to set your personal access token to `g:gitter#token`.

```vim
let g:gitter#token = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
```

Open `gitter://room/{owner}/{repo}` to start chating.

```vim
new gitter://room/gitter/api
```

Press `i` to open buffer for new message. You can write anything to the buffer,
then save and press `q` to send the message.
