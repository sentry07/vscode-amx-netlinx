This is a language package for programming AMX Netlinx control systems. It has syntax highlighting, a code beautifier, snippets for a lot of Netlinx
functions and code blocks, build tasks to compile your code, and shortcuts for the AMX programming help file, Netlinx Diagnostics, and the File Transfer utility. After installing the extension, please open your VSCode Settings (CTRL-Comma) and search for Netlinx and verify/update the locations in there.

## Use CTRL+SHIFT+B to compile your Netlinx code

## New in this release (0.6.0):
* Added a document formatter provider. Use the context menu to select Format Document. You can also enable "Format on Save" in VSCode settings.

## Known Issues
* Single line code blocks without {} brackets will not be detected by the code beautifier and will not be indented properly

## TODO
* Fix known issues
* Language server development

## Quality of life recommendations:
* Install "Open In Application" extension by Fabio Spampinato: https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-open-in-application
* Install "Bracket Pair Colorizer 2" by CoenraadS: https://marketplace.visualstudio.com/items?itemName=CoenraadS.bracket-pair-colorizer-2
* Use a different theme than the default themes for full syntax highlighting (One Dark Pro is amazing)

## Extension Commands

This extension contributes the following commands:

* `extension.netlinx_compile`: Compiles the currently open AXS file.
* `extension.netlinx_help`: Opens the AMX Netlinx help reference file.
* `extension.netlinx_diag`: Opens the AMX Netlinx Diagnostics executable (if installed).
* `extension.netlinx_transfer`: Opens the AMX File Transfer Utility (if installed).
* `extension.netlinx_openincludefolder`: Opens the global Netlinx includes folder in the current workspace (if configured in settings)
* `extension.netlinx_openlibraryfolder`: Opens the global Netlinx libraries folder in the current workspace (if configured in settings)
* `extension.netlinx_openmodulefolder`: Opens the global Netlinx modules folder in the current workspace (if configured in settings)

## Extension Settings

This extension contributes the following settings:

* `netlinx.compilerLocation`: sets the path of the Netlinx compiler. 
* `netlinx.helpLocation`: sets the path of the Netlinx reference guide.
* `netlinx.diagLocation`: sets the path of the Netlinx Diagnostics program.
* `netlinx.ftLocation`: sets the path of the Netlinx File Transfer utility.
* `netlinx.terminalLocation`: sets path of the default windows cmd.exe.
* `netlinx.includesLocation`: sets path of global Netlinx includes folder.
* `netlinx.libraryLocation`: sets path of global Netlinx libraries folder.
* `netlinx.modulesLocation`: sets path of global Netlinx modules folder.

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

## Notes

* `extension.netlinx_compile` requires Netlinx Studio 3.x or 4.x to be installed. Preferably 4.x. This is freely available at AMX.com.
* `extension.netlinx_diag` requires Netlinx Diagnostics to be installed. This is freely available at AMX.com.
* `extension.netlinx_transfer` requires File Transfer Utility 2 to be installed. This is not freely available, but you can try to get it from the following URL. Login may be required.
    https://trade.amx.com/techcenter/downloadConfirm.asp?fn=/assets/applicationFiles/FT2Setup.exe
