import * as vscode from 'vscode';

let taskProvider: vscode.Disposable | undefined;
function activate(context: vscode.ExtensionContext) {
  let netlinx_format = vscode.commands.registerCommand('extension.netlinx_format', () => {
    fixIndentation();
  });

  // let netlinx_compile = vscode.commands.registerCommand('extension.netlinx_compile', () => {
  //   compileNetlinx();
  // });

  let transfer_command = vscode.commands.registerCommand("extension.netlinx_transfer", () => {
    callShellCommand(vscode.workspace.getConfiguration("netlinx").transferLocation);
  });

  let diag_command = vscode.commands.registerCommand("extension.netlinx_diag", () => {
    callShellCommand(vscode.workspace.getConfiguration("netlinx").diagLocation);
  });

  let help_command = vscode.commands.registerCommand("extension.netlinx_help", () => {
    callShellCommand(vscode.workspace.getConfiguration("netlinx").helpLocation);
  });

  let open_includefolder = vscode.commands.registerCommand("extension.netlinx_openincludefolder", () => {
    if (vscode.workspace.getConfiguration("netlinx").includesLocation.length) {
      addFolderToWorkspace(vscode.workspace.getConfiguration("netlinx").includesLocation, "Global Includes")
    }
    else {
      vscode.window.showErrorMessage("Global Include folder not configured. Please open user settings and set the folder URI.");
    }
  });

  let open_libraryfolder = vscode.commands.registerCommand("extension.netlinx_openlibraryfolder", () => {
    if (vscode.workspace.getConfiguration("netlinx").librariesLocation.length) {
      addFolderToWorkspace(vscode.workspace.getConfiguration("netlinx").librariesLocation, "Global Libraries");
    }
    else {
      vscode.window.showErrorMessage("Global Library folder not configured. Please open user settings and set the folder URI.");
    }
  });

  let open_modulefolder = vscode.commands.registerCommand("extension.netlinx_openmodulefolder", () => {
    if (vscode.workspace.getConfiguration("netlinx").modulesLocation.length) {
      addFolderToWorkspace(vscode.workspace.getConfiguration("netlinx").modulesLocation, "Global Modules");
    }
    else {
      vscode.window.showErrorMessage("Global Module folder not configured. Please open user settings and set the folder URI.");
    }
  });

  function rebuildTaskList(): void {
    if (taskProvider) {
      taskProvider.dispose();
      taskProvider = undefined;
    }
    if (!taskProvider && vscode.window.activeTextEditor.document.languageId === "netlinx-source") {
      let netlinxPromise: Thenable<vscode.Task[]> | undefined = undefined;
      taskProvider = vscode.tasks.registerTaskProvider('netlinx', {
        provideTasks: () => {
          if (!netlinxPromise) {
            netlinxPromise = getCompileTasks();
          }

          return netlinxPromise;
        },
        resolveTask: () => {
          return undefined;
        }
      })
    }
  }

  context.subscriptions.push(netlinx_format);
  //context.subscriptions.push(netlinx_compile);      // Removing this to force the use of the build tasks
  context.subscriptions.push(transfer_command);
  context.subscriptions.push(diag_command);
  context.subscriptions.push(help_command);
  context.subscriptions.push(open_includefolder);
  context.subscriptions.push(open_libraryfolder);
  context.subscriptions.push(open_modulefolder);

  vscode.workspace.onDidChangeConfiguration(rebuildTaskList);
  vscode.workspace.onDidOpenTextDocument(rebuildTaskList);
  vscode.window.onDidChangeActiveTextEditor(rebuildTaskList);
  rebuildTaskList();
}
exports.activate = activate;

// Creates a terminal, calls the command, then closes the terminal
function callShellCommand(shellCommand: string): void {
  let term = vscode.window.createTerminal('netlinx', vscode.workspace.getConfiguration("netlinx").terminalLocation);
  term.sendText("\"" + shellCommand + "\"", true);
  term.sendText("exit", true);
}

// Adds a folder to the workspace
function addFolderToWorkspace(folder: string, folderName: string): void {
  let folderLocation = vscode.Uri.file(folder);
  vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { "uri": folderLocation, "name": folderName });
}

// This function is the function called by the shortcut on the context menu, or CTRL+F12
// function compileNetlinx(): void {
//   let editor = vscode.window.activeTextEditor;
//   if (!editor) {
//     vscode.window.showErrorMessage("Please open a valid AXS file.");
//     return;
//   }
//   let doc = editor.document;
//   if (doc.languageId === "netlinx-source") {
//     let savedDoc = doc.save();
//     savedDoc.then(() => {
//       let buildCommand = getCompileCommand(doc.fileName,false);
//       let term = vscode.window.createTerminal('netlinx', vscode.workspace.getConfiguration("netlinx").terminalLocation);
//       term.show();
//       term.sendText(buildCommand);
//     });
//   }
//   else {
//     vscode.window.showErrorMessage("Please open a valid AXS file.");
//     return;
//   }
// }

function getCompileCommand(fileName: string, useGlobal: boolean): string {
  let compiler = new NetlinxCompiler();
  compiler.filepaths.push(fileName);
  if (useGlobal) {
    if (vscode.workspace.getConfiguration("netlinx").includesLocation.length > 0) {
      compiler.filepaths.push("-I" + vscode.workspace.getConfiguration("netlinx").includesLocation);
    }
    if (vscode.workspace.getConfiguration("netlinx").librariesLocation.length > 0) {
      compiler.filepaths.push("-L" + vscode.workspace.getConfiguration("netlinx").librariesLocation);
    }
    if (vscode.workspace.getConfiguration("netlinx").modulesLocation.length > 0) {
      compiler.filepaths.push("-M" + vscode.workspace.getConfiguration("netlinx").modulesLocation);
    }
  }

  return compiler.buildCommand();
}

function countChars(haystack: string, needle: string): number {
  let count = 0;
  for (var i = 0; i < haystack.length; i++) {
    if (haystack[i] === needle){
      count++;
    }
  }
  return count;
}

// Code beautifier called by context or keyboard shortcut
function fixIndentation(): void {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Please open a valid Netlinx file.");
    return;
  }

  // Set up variables for grabbing and replacing the text
  let doc = editor.document;
  var firstLine = doc.lineAt(0);
  var lastLine = doc.lineAt(doc.lineCount - 1);
  var textRange = new vscode.Range(0,
    firstLine.range.start.character,
    doc.lineCount - 1,
    lastLine.range.end.character);

  // The indent fixing code
  if (doc.languageId === "netlinx-source" || doc.languageId === "netlinx-include") {
    let outputText = "";
    let indentLevel = 0;                                        // Current line indent level (number of tabs)
    let inComment = 0;                                          // If we're in a comment and what level
    let docText = editor.document.getText();                    // Get the full text of the editor
    let docLines = docText.split(/\r?\n/);                      // Split into lines

    // Comment weeders
    let reDeCom1 = /(\/\/.*)/gm;                                // Single line comment
    let reDeCom2 = /((?:\(\*|\/\*).*(?:\*\)|\*\/))/gm;          // Fully enclosed multiline comment
    let reDeCom3 = /(.*(?:\*\)|\*\/))/gm;                       // Closing multiline comment
    let reDeCom4 = /((?:\(\*|\/\*).*)/gm;                       // Opening multiline comment

    for (var line = 0; line < docLines.length; line++) {
      let thisLine = docLines[line];
      let thisLineTrimmed = docLines[line].trimLeft();
      let thisLineClean = docLines[line].trimLeft().replace(reDeCom1,"").replace(reDeCom2,"");      // Remove any single line comments and fully enclosed multiline comments

      if (reDeCom3.test(thisLineClean) && inComment > 0) {        // If a multiline comment closes on this line, decrease our comment level
        inComment = inComment - 1;
      }
      if (reDeCom4.test(thisLineClean)) {                         // If a multiline comment opens on this line, increase our comment level
        inComment = inComment + 1;
      }

      thisLineClean = thisLineClean.replace(reDeCom3,"").replace(reDeCom4,"");            // Remove any code that we think is inside multiline comments
      let brOpen = countChars(thisLineClean,'{') - countChars(thisLineClean,'}');         // Check the delta for squiggly brackets
      let sqOpen = countChars(thisLineClean,'[') - countChars(thisLineClean,']');         // Check the delta for square brackets
      let parOpen = countChars(thisLineClean,'(') - countChars(thisLineClean,')');        // Check the delta for parenthesis
      let indentDelta = brOpen + sqOpen + parOpen;                                        // Calculate total delta

      // Indent Increase Rules
      if (inComment > 0) {                                                                // If we're in a multiline comment, just leave the line alone
        outputText = outputText + thisLine + "\r";
      }
      else if (indentDelta > 0) {                                                         // If we're increasing indent delta because of this line, the add it, then increase indent
        outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + "\r";
        indentLevel = indentLevel + indentDelta;
      }
      // If we're decreasing delta, and the line starts with the character that is decreasing it, then decrease first, and then add this line
      else if (indentDelta < 0 && (thisLineClean[0] === '}' || thisLineClean[0] === ']' || thisLineClean[0] === ')')) {
        indentLevel = indentLevel + indentDelta;
        outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + "\r";
      }
      else if (indentDelta < 0) {                                                         // If we're decreasing delta but the first character isn't the cause, then we're still inside the block
        outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + "\r";
        indentLevel = indentLevel + indentDelta;
      }
      else {                                                                              // indentDelta === 0; do nothing except add the line with the indent
        outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + "\r";
      }
    };

    // Replace all the code in the editor with the new code
    editor.edit(editBuilder => {
      editBuilder.replace(textRange, outputText);
    });
  }
  else {
    vscode.window.showErrorMessage("Please open a valid Netlinx file.");
    return;
  }
}

interface NetlinxTaskDefinition extends vscode.TaskDefinition {
  buildPath: string;
}

async function getCompileTasks(): Promise<vscode.Task[]> {
  let workspaceRoot = vscode.workspace.rootPath;
  let emptyTasks: vscode.Task[] = [];

  if (!workspaceRoot) {
    return emptyTasks;
  }

  try {
    let result: vscode.Task[] = [];
    let editor = vscode.window.activeTextEditor;
    let doc = editor.document;
    let executable = 'c:\\windows\\system32\\cmd.exe';

    // Create "Local" build, ignoring global folders
    let buildCommand = getCompileCommand(doc.fileName,false);

    let taskDef: NetlinxTaskDefinition = {
      type: 'shell',
      label: 'Netlinx Build Local',
      buildPath: buildCommand
    }

    let command: vscode.ShellExecution = new vscode.ShellExecution(`"${buildCommand}"`, { executable: executable, shellArgs: ['/c'] });
    let task = new vscode.Task(taskDef, 'Compile w/Local Files', 'amx-netlinx', command, `$nlrc`);
    task.definition = taskDef;
    task.group = vscode.TaskGroup.Build;

    result.push(task);

    // Create "Global" build, including global folders
    buildCommand = getCompileCommand(doc.fileName,true);

    taskDef = {
      type: 'shell',
      label: 'Netlinx Build w/Globals',
      buildPath: buildCommand
    }

    command = new vscode.ShellExecution(`"${buildCommand}"`, { executable: executable, shellArgs: ['/c'] });
    task = new vscode.Task(taskDef, 'Compile w/Global Files', 'amx-netlinx', command, `$nlrc`);
    task.definition = taskDef;
    task.group = vscode.TaskGroup.Build;

    result.push(task);
    return result;
  }
  catch (err) {
    let channel = getOutputChannel();
    console.log(err);
    if (err.stderr) {
      channel.appendLine(err.stderr);
    }
    if (err.stdout) {
      channel.appendLine(err.stdout);
    }

    channel.appendLine('Netlinx compile failed');
    channel.show(true);
    return emptyTasks;
  }
}

let _channel: vscode.OutputChannel;
function getOutputChannel(): vscode.OutputChannel {
  if (!_channel) {
    _channel = vscode.window.createOutputChannel("Netlinx Compile");
  }
  return _channel;
}

class NetlinxCompiler {
  constructor() {
    this.filepaths = [];
    this.compilerPath = "\"" + vscode.workspace.getConfiguration("netlinx").compilerLocation + "\"";
  }
  buildCommand() {
    let filepathConcat = "";
    this.filepaths.forEach(element => {
      filepathConcat += "\"" + element + "\" ";
    });
    return this.compilerPath +
      " " +
      filepathConcat;
  }

  filepaths: string[];
  compilerPath: string;
}
// this method is called when your extension is deactivated
function deactivate(): void {
  if (taskProvider) {
    taskProvider.dispose();
  }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
