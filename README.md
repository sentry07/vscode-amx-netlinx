# amx-netlinx README

VSCode Extension which adds syntax highlighting and provides commands in the command pallete for compiling.

## Features

Syntax highlighting. Compiler.

TODO: code file-type icons, maybe better intellisense + autocompletes.

This extension contributes the following commands:

* `extension.netlinx_compile`: Compiles the currently open AXS file.
* `extension.netlinx_help`: Opens the AMX Netlinx help reference file.

## Extension Settings

This extension contributes the following settings:

* `netlinx.compiler`: sets the path of the Simpl+ compiler. Can be set to a custom path via the user settings. Please use the double \ to specify directory paths.
* `netlinx.helpLocation`: sets the path of the SIMPL+ reference guide. Can be set to a custom path via the user settings. Please use the double \ to specify directory paths.
* `netlinx.terminalLocation`: sets path of the default windows cmd.exe. Can be set to a custom path via the user settings. Please use the double \ to specify directory paths. 

## Keybindings and Menus

All commands are added to the right click context menu of the editor tab, and the following keybindings have been added.

* `ctrl+F1`: Opens Netlinx Help.
* `ctrl+F12`: Compiles current file.

## Snippets


## Known Issues


## Release Notes

### 1.0.0

- Initial release