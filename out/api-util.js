"use strict";
// import * as vscode from 'vscode';
// import { fsync, readFile, existsSync } from 'fs';
// import { filterComments } from './utils';
// export function getSimplSharpLibraries(editor:vscode.TextEditor):RegExpMatchArray | null {
//     let fileText = editor.document.getText();
//     let filtered = filterComments(fileText);
//     return filtered.match(/#USER_SIMPLSHARP_LIBRARY\s*?"([\S\s]*?)"/gmi);
// }
// function filterSimplSharpLibrary(arr: RegExpMatchArray) {
//     arr.forEach(e => {
//         let result = e.match(/#USER_SIMPLSHARP_LIBRARY\s*?"([\S\s]*?)"/mi);
//         if(result) {
//             processSimplSharpLibrary(result[1].toString());
//         }
//     });
// }
// function processSimplSharpLibrary(file: string) {
// }
// function openSimplSharpAPI(filepath: string) {
//     if(existsSync(filepath)) {
//         let options: vscode.TextDocumentShowOptions = {};
//         options.preview = false;
//         let uri = vscode.Uri.file(filepath);
//         vscode.window.showTextDocument(uri, options);
//     }
//     else {
//         vscode.window.showErrorMessage('We could not find the API file for ' + filepath + '. Would you like to try generating it?', 'Yes', 'No')
//         // .then( value => {
//         // });
//     }
// }
//# sourceMappingURL=api-util.js.map