# amx-netlinx README

VSCode Extension which adds syntax highlighting and provides commands in the command pallete for compiling.

## Features

Syntax highlighting, compiler, show help file, File Transfer and Netlinx Diagnostics if installed.

TODO: language server development, snippet support

This extension contributes the following commands:

* `extension.netlinx_format`: Fixes the block indentation of the currently open file (code beautifier).
* `extension.netlinx_compile`: Compiles the currently open AXS file.
* `extension.netlinx_help`: Opens the AMX Netlinx help reference file.
* `extension.netlinx_diag`: Opens the AMX Netlinx Diagnostics executable (if installed).
* `extension.netlinx_transfer`: Opens the AMX File Transfer Utility (if installed).
* `extension.netlinx_openincludefolder`: Opens the global Netlinx includes folder in the current workspace (if configured in settings)
* `extension.netlinx_openlibraryfolder`: Opens the global Netlinx libraries folder in the current workspace (if configured in settings)
* `extension.netlinx_openmodulefolder`: Opens the global Netlinx modules folder in the current workspace (if configured in settings)

## Extension Settings

This extension contributes the following settings:
For locations, please use the double \ between folder names.

* `netlinx.compilerLocation`: sets the path of the Netlinx compiler. 
* `netlinx.helpLocation`: sets the path of the Netlinx reference guide.
* `netlinx.diagLocation`: sets the path of the Netlinx Diagnostics program.
* `netlinx.ftLocation`: sets the path of the Netlinx File Transfer utility.
* `netlinx.terminalLocation`: sets path of the default windows cmd.exe.
* `netlinx.includesLocation`: sets path of global Netlinx includes folder. Separate multiple paths with semicolons(;). 
* `netlinx.libraryLocation`: sets path of global Netlinx libraries folder. Separate multiple paths with semicolons(;). 
* `netlinx.modulesLocation`: sets path of global Netlinx modules folder. Separate multiple paths with semicolons(;). 

## Keybindings and Menus

All commands are added to the right click context menu of the editor tab, and the following keybindings have been added.

* `ctrl+shift+F1`: Opens Netlinx Help
* `ctrl+shift+F2`: Runs Netlinx Code Beautifier
* `ctrl+shift+F3`: Opens Netlinx Diagnostics
* `ctrl+shift+F4`: Opens File Transfer Utility
* `ctrl+shift+F5`: Opens Global Includes Folder in Workspace
* `ctrl+shift+F6`: Opens Global Libraries Folder in Workspace
* `ctrl+shift+F7`: Opens Global Modules Folder in Workspace
* `ctrl+F12`: Compiles current file.

## Snippets

* See `SNIPPETS.md` for the list of currently configured snippets.

## Known Issues


## Release Notes

* `extension.netlinx_compile` requires Netlinx Studio 3.x or 4.x to be installed. Preferably 4.x. This is freely available at AMX.com.
* `extension.netlinx_diag` requires Netlinx Diagnostics to be installed. This is freely available at AMX.com.
* `extension.netlinx_transfer` requires File Transfer Utility 2 to be installed. This is not freely available, but you can try to get it from the following URL. Login may be required.
    https://trade.amx.com/techcenter/downloadConfirm.asp?fn=/assets/applicationFiles/FT2Setup.exe

### 0.2.1
- Removing double quoted strings as a string container. It prevented autocomplete and other things to function inside strings.
- Fixed "FOR" code snippet

### 0.2.0
- More Code Snippets
- Published to Extension Marketplace

### 0.1.2
- Added base Netlinx code snippets

### 0.1.1
- Beta release
