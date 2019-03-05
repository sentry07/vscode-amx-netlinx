# amx-netlinx README

VSCode Extension which adds syntax highlighting and provides commands in the command pallete for compiling.

## Features

Syntax highlighting, compiler, show help file, File Transfer and Netlinx Diagnostics if installed.

TODO: language server development, snippet support

This extension contributes the following commands:

* `extension.netlinx_format`: Fixes the block indentation of the currently open AXS file.
* `extension.netlinx_compile`: Compiles the currently open AXS file.
* `extension.netlinx_help`: Opens the AMX Netlinx help reference file.
* `extension.netlinx_diag`: Opens the AMX Netlinx Diagnostics executable (if installed).
* `extension.netlinx_transfer`: Opens the AMX File Transfer Utility (if installed).

## Extension Settings

This extension contributes the following settings:

* `netlinx.compilerLocation`: sets the path of the Netlinx compiler. Can be set to a custom path via the user settings. Please use the double \ to specify directory paths.
* `netlinx.helpLocation`: sets the path of the Netlinx reference guide. Can be set to a custom path via the user settings. Please use the double \ to specify directory paths.
* `netlinx.diagLocation`: sets the path of the Netlinx Diagnostics program. Can be set to a custom path via the user settings. Please use the double \ to specify directory paths.
* `netlinx.ftLocation`: sets the path of the Netlinx File Transfer utility. Can be set to a custom path via the user settings. Please use the double \ to specify directory paths.
* `netlinx.terminalLocation`: sets path of the default windows cmd.exe. Can be set to a custom path via the user settings. Please use the double \ to specify directory paths. 


## Keybindings and Menus

All commands are added to the right click context menu of the editor tab, and the following keybindings have been added.

* `ctrl+shift+F1`: Opens Netlinx Help.
* `ctrl+shift+F2`: Runs Netlinx Indentation Fixer.
* `ctrl+shift+F3`: Opens Netlinx Diagnostics.
* `ctrl+shift+F4`: Opens File Transfer Utility.
* `ctrl+F12`: Compiles current file.

## Snippets


## Known Issues


## Release Notes

### 1.0.0

- Initial release