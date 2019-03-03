"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utils_1 = require("./utils");
const path_1 = require("path");
const fs_1 = require("fs");
class API {
    constructor(editor) {
        this.fileText = '';
        this.editor = editor;
        this.fileText = utils_1.filterComments(editor.document.getText());
    }
    openAPIFiles() {
        let libs = this.getLibraryNames();
        if (libs) {
            let files = this.filterLibraryNames(libs);
            files.forEach(e => {
                let apiPath = this.buildFilePath(e, '.api');
                if (this.checkRecent(e)) {
                    if (this.openFile(apiPath)) {
                        console.log('Successfully opened ' + apiPath);
                    }
                }
                else if (this.generateAPIFile(e)) {
                    setTimeout(() => this.openFile(apiPath), 1500);
                }
                else {
                    vscode.window.showErrorMessage('We were unable to find or generate the API file: ' + apiPath);
                }
            });
        }
    }
    getLibraryNames() {
        return this.fileText.match(/#USER_SIMPLSHARP_LIBRARY\s*?"([\S\s]*?)"/gmi);
    }
    filterLibraryNames(arr) {
        let results = [];
        arr.forEach(e => {
            let match = e.match(/#USER_SIMPLSHARP_LIBRARY\s*?"([\S\s]*?)"/mi);
            if (match) {
                results.push(match[1].toString());
            }
        });
        return results;
    }
    buildFilePath(filename, extension) {
        let path = path_1.dirname(this.editor.document.uri.fsPath);
        return path_1.join(path, 'SPlsWork', filename + extension);
    }
    checkRecent(filename) {
        let api = this.buildFilePath(filename, '.api');
        let dll = this.buildFilePath(filename, '.dll');
        if (fs_1.existsSync(api) && fs_1.existsSync(dll)) {
            let apiStat = fs_1.statSync(api);
            let dllStat = fs_1.statSync(dll);
            if (apiStat.mtime > dllStat.mtime) {
                return true;
            }
        }
        return false;
    }
    openFile(filepath) {
        if (fs_1.existsSync(filepath)) {
            let options = {};
            options.preview = false;
            let uri = vscode.Uri.file(filepath);
            vscode.window.showTextDocument(uri, options);
            return true;
        }
        return false;
    }
    generateAPIFile(filename) {
        let dll = this.buildFilePath(filename, '.dll');
        let api = this.buildFilePath(filename, '.api');
        let exe = this.buildFilePath('SPlusHeader', '.exe');
        if (fs_1.existsSync(dll) && fs_1.existsSync(exe)) {
            let term = vscode.window.createTerminal('simplHeader', vscode.workspace.getConfiguration("simpl").terminalLocation);
            term.show();
            term.sendText('"' + exe + '" "' + dll + '" "' + api + '"');
            return true;
        }
        return false;
    }
}
exports.API = API;
//# sourceMappingURL=api.js.map