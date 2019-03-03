'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// import * as fs from "fs";
// import * as path from "path";
const svg = require("./visualizer");
const api = require("./api");
// import { stat } from 'fs';
// import { getSimplSharpLibraries } from './api-util';
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
    let previewUri = vscode.Uri.parse('simpl-visualize://authority/simpl-visualize');
    class TextDocumentContentProvider {
        constructor() {
            this._onDidChange = new vscode.EventEmitter();
        }
        update(uri) {
            this._onDidChange.fire(uri);
        }
        provideTextDocumentContent(uri) {
            return this.createVisualizer();
        }
        createVisualizer() {
            let editor = vscode.window.activeTextEditor;
            if (editor) {
                if (!(editor.document.languageId === 'simpl+')) {
                    return this.errorSnippet("A SIMPL+ file is not open.");
                }
                else {
                    return this.extractVisualizer();
                }
            }
            else {
                return this.errorSnippet("A SIMPL+ file is not open.");
            }
        }
        extractVisualizer() {
            let parser = new svg.VisualizerParse();
            parser.parseSimplPlus();
            let viewer = new svg.SVGCreator(parser);
            return viewer.returnSVG();
        }
        errorSnippet(error) {
            return `
				<body>
					${error}
				</body>`;
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
    }
    let provider = new TextDocumentContentProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('simpl-visualize', provider);
    vscode.workspace.onDidChangeTextDocument((e) => {
        if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });
    vscode.window.onDidChangeTextEditorSelection((e) => {
        if (e.textEditor === vscode.window.activeTextEditor) {
            provider.update(previewUri);
        }
    });
    let series3_compile = vscode.commands.registerCommand('extension.simplCC_Series3', () => {
        processSimpl("\\target series3");
    });
    let series2and3_compile = vscode.commands.registerCommand('extension.simplCC_Series2and3', () => {
        processSimpl("\\target series2 series3");
    });
    let series3_compileAll = vscode.commands.registerCommand("extension.simplCC_Series3All", () => {
        let foundFiles = vscode.workspace.findFiles('*.usp');
        let term = vscode.window.createTerminal('simplCC', vscode.workspace.getConfiguration("simpl").terminalLocation);
        let compiler = new SimplCompiler();
        term.show();
        foundFiles.then(files => {
            if (files.length) {
                files.forEach(e => {
                    compiler.filepaths.push(e.fsPath);
                });
                term.sendText(compiler.buildCommand("\\target series3"));
            }
            else {
                vscode.window.showErrorMessage("No .usp files found");
            }
        });
    });
    let simpl_visualize = vscode.commands.registerCommand("extension.simpl_visualize", () => {
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'SIMPL Preview').then((success) => {
        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
        // let uri = vscode.Uri.parse('file:///resources/test.html');
        // return vscode.commands.executeCommand('vscode.previewHtml', uri );
    });
    let help_command = vscode.commands.registerCommand("extension.simpl_help", () => {
        let helpLocation = vscode.workspace.getConfiguration("simpl").helpLocation;
        let term = vscode.window.createTerminal('simpl', vscode.workspace.getConfiguration("simpl").terminalLocation);
        term.sendText("\"" + helpLocation + "\"");
    });
    let open_api = vscode.commands.registerCommand("extension.simplCC_API", () => {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let newAPI = new api.API(editor);
            newAPI.openAPIFiles();
        }
    });
    context.subscriptions.push(series3_compile);
    context.subscriptions.push(series2and3_compile);
    context.subscriptions.push(series3_compileAll);
    context.subscriptions.push(help_command);
    context.subscriptions.push(simpl_visualize);
    context.subscriptions.push(open_api);
    context.subscriptions.push(registration);
}
exports.activate = activate;
function processSimpl(args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("Please open a valid USP file.");
        return;
    }
    let doc = editor.document;
    if (doc.languageId === "simpl+") {
        let savedDoc = doc.save();
        savedDoc.then(() => {
            let compiler = new SimplCompiler();
            compiler.filepaths.push(doc.fileName);
            let term = vscode.window.createTerminal('simplCC', vscode.workspace.getConfiguration("simpl").terminalLocation);
            term.show();
            term.sendText(compiler.buildCommand(args));
        });
    }
    else {
        vscode.window.showErrorMessage("Please open a valid USP file.");
        return;
    }
}
class SimplCompiler {
    constructor() {
        this.filepaths = [];
        this.compilerPath = "\"" + vscode.workspace.getConfiguration("simpl").compiler + "\"";
        console.log(this.compilerPath);
    }
    buildCommand(args) {
        let filepathConcat = "";
        this.filepaths.forEach(element => {
            filepathConcat += "\"" + element + "\" ";
        });
        return this.compilerPath +
            " \\rebuild " +
            filepathConcat + " " +
            args;
    }
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map