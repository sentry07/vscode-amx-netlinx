'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// import * as fs from "fs";
// import * as path from "path";
// import { stat } from 'fs';
// import { stat } from 'fs';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "amx-netlinx" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let netlinx_compile = vscode.commands.registerCommand('extension.netlinx_compile', () => {
        processNetlinx();
    });
    let help_command = vscode.commands.registerCommand("extension.netlinx_help", () => {
        let helpLocation = vscode.workspace.getConfiguration("netlinx").helpLocation;
        let term = vscode.window.createTerminal('netlinx', vscode.workspace.getConfiguration("netlinx").terminalLocation);
        term.sendText("\"" + helpLocation + "\"");
    });
    context.subscriptions.push(netlinx_compile);
    context.subscriptions.push(help_command);
}
exports.activate = activate;
function processNetlinx(args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("Please open a valid AXS file.");
        return;
    }
    let doc = editor.document;
    if (doc.languageId === "netlinx-source") {
        let savedDoc = doc.save();
        savedDoc.then(() => {
            let compiler = new NetlinxCompiler();
            compiler.filepaths.push(doc.fileName);
            let term = vscode.window.createTerminal('netlinx', vscode.workspace.getConfiguration("netlinx").terminalLocation);
            term.show();
            term.sendText(compiler.buildCommand(args));
        });
    }
    else {
        vscode.window.showErrorMessage("Please open a valid AXS file.");
        return;
    }
}
class NetlinxCompiler {
    constructor() {
        this.filepaths = [];
        this.compilerPath = "\"" + vscode.workspace.getConfiguration("netlinx").compiler + "\"";
        console.log(this.compilerPath);
    }
    buildCommand(args) {
        let filepathConcat = "";
        this.filepaths.forEach(element => {
            filepathConcat += "\"" + element + "\" ";
        });
        return this.compilerPath +
            " " +
            filepathConcat;
    }
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map