'use strict';
Object.defineProperty(exports, "__esModule", { value: true });

const vscode = require("vscode");

function activate(context) {
    let netlinx_format = vscode.commands.registerCommand('extension.netlinx_format', () => {
        fixIndentation();
    });
    let netlinx_compile = vscode.commands.registerCommand('extension.netlinx_compile', () => {
        compileNetlinx();
    });
    let transfer_command = vscode.commands.registerCommand("extension.netlinx_transfer", () => {
        let transferLocation = vscode.workspace.getConfiguration("netlinx").transferLocation;
        let term = vscode.window.createTerminal('netlinx', vscode.workspace.getConfiguration("netlinx").terminalLocation);
        term.sendText("\"" + transferLocation + "\"");
    });
    let diag_command = vscode.commands.registerCommand("extension.netlinx_diag", () => {
        let diagLocation = vscode.workspace.getConfiguration("netlinx").diagLocation;
        let term = vscode.window.createTerminal('netlinx', vscode.workspace.getConfiguration("netlinx").terminalLocation);
        term.sendText("\"" + diagLocation + "\"");
    });
    let help_command = vscode.commands.registerCommand("extension.netlinx_help", () => {
        let helpLocation = vscode.workspace.getConfiguration("netlinx").helpLocation;
        let term = vscode.window.createTerminal('netlinx', vscode.workspace.getConfiguration("netlinx").terminalLocation);
        term.sendText("\"" + helpLocation + "\"");
    });
    context.subscriptions.push(netlinx_format);
    context.subscriptions.push(netlinx_compile);
    context.subscriptions.push(transfer_command);
    context.subscriptions.push(diag_command);
    context.subscriptions.push(help_command);
}
exports.activate = activate;

function compileNetlinx(args) {
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
            if (vscode.workspace.getConfiguration("netlinx").includesLocation.length > 0) {
                compiler.filepaths.push("-I" + vscode.workspace.getConfiguration("netlinx").includesLocation);
            }
            if (vscode.workspace.getConfiguration("netlinx").librariesLocation.length > 0) {
                compiler.filepaths.push("-L" + vscode.workspace.getConfiguration("netlinx").librariesLocation);
            }
            if (vscode.workspace.getConfiguration("netlinx").modulesLocation.length > 0) {
                compiler.filepaths.push("-M" + vscode.workspace.getConfiguration("netlinx").modulesLocation);
            }
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

function fixIndentation(args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("Please open a valid Netlinx file.");
        return;
    }
    let doc = editor.document;
    var firstLine = doc.lineAt(0);
    var lastLine = doc.lineAt(doc.lineCount - 1);
    var textRange = new vscode.Range(0, 
                                     firstLine.range.start.character, 
                                     doc.lineCount - 1, 
                                     lastLine.range.end.character);
    if (doc.languageId === "netlinx-source" || doc.languageId === "netlinx-include") {
        let indentLevel = 0;
        let outputText = "";
        let reIncrease = new RegExp("^((?!\\/\\/).)*(\\{[^{}\\v]*|\\([^()\\*\\v]*|\\[[^\\[\\]\\v]*)$");
        let reDecrease = new RegExp("^((?!.*?\\/\\*).*\\*\\/)?\\s*[\\}\\]\\)].*$");
        let docText = editor.document.getText();
        console.debug(docText);
        let docLines = docText.split(/\r?\n/);
        for (var line = 0; line < docLines.length; line++) {
            if (reIncrease.test(docLines[line])) {
                outputText = outputText + ('\t'.repeat(indentLevel)) + docLines[line].trimLeft() + "\r";
                indentLevel = indentLevel + 1;
            }
            else if (reDecrease.test(docLines[line])) {
                indentLevel = indentLevel - 1;
                outputText = outputText + ('\t'.repeat(indentLevel)) + docLines[line].trimLeft() + "\r";
            }
            else {
                outputText = outputText + ('\t'.repeat(indentLevel)) + docLines[line].trimLeft() + "\r";
            }
        };
        editor.edit(editBuilder => {
            editBuilder.replace(textRange,outputText);
        });
    }
    else {
        vscode.window.showErrorMessage("Please open a valid Netlinx file.");
        return;
    }
}
class NetlinxCompiler {
    constructor() {
        this.filepaths = [];
        this.compilerPath = "\"" + vscode.workspace.getConfiguration("netlinx").compilerLocation + "\"";
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