import * as vscode from 'vscode';

let taskProvider: vscode.Disposable | undefined;
function activate(context: vscode.ExtensionContext) {
  let netlinx_format = vscode.commands.registerCommand('extension.netlinx_format', () => {
    fixIndentation();
  });

  let netlinx_compile = vscode.commands.registerCommand('extension.netlinx_compile', () => {
    compileNetlinx();
  });

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
  context.subscriptions.push(netlinx_compile);
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
function compileNetlinx(): void {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Please open a valid AXS file.");
    return;
  }
  let doc = editor.document;
  if (doc.languageId === "netlinx-source") {
    let savedDoc = doc.save();
    savedDoc.then(() => {
      let buildCommand = getCompileCommand(doc.fileName);
      let term = vscode.window.createTerminal('netlinx', vscode.workspace.getConfiguration("netlinx").terminalLocation);
      term.show();
      term.sendText(buildCommand);
    });
  }
  else {
    vscode.window.showErrorMessage("Please open a valid AXS file.");
    return;
  }
}

function getCompileCommand(fileName: string): string {
  let compiler = new NetlinxCompiler();
  compiler.filepaths.push(fileName);
  if (vscode.workspace.getConfiguration("netlinx").includesLocation.length > 0) {
    compiler.filepaths.push("-I" + vscode.workspace.getConfiguration("netlinx").includesLocation);
  }
  if (vscode.workspace.getConfiguration("netlinx").librariesLocation.length > 0) {
    compiler.filepaths.push("-L" + vscode.workspace.getConfiguration("netlinx").librariesLocation);
  }
  if (vscode.workspace.getConfiguration("netlinx").modulesLocation.length > 0) {
    compiler.filepaths.push("-M" + vscode.workspace.getConfiguration("netlinx").modulesLocation);
  }

  return compiler.buildCommand();
}

// Code beautifier called by context or keyboard shortcut
function fixIndentation(): void {
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
    let docText = editor.document.getText();
    let docLines = docText.split(/\r?\n/);
    for (var line = 0; line < docLines.length; line++) {
      let thisLine = docLines[line].trimLeft();
      let brOpen = thisLine.indexOf('{');
      let brClose = thisLine.indexOf('}');
      let sqOpen = thisLine.indexOf('[');
      let sqClose = thisLine.indexOf(']');
      let parOpen = thisLine.indexOf('(');
      let parClose = thisLine.indexOf(')');
      let slComment = thisLine.indexOf('//');
      let mlComment1Open = thisLine.indexOf('/*');
      let mlComment1Close = thisLine.indexOf('*/');
      let mlComment2Open = thisLine.indexOf('(*');
      let mlComment2Close = thisLine.indexOf('*)');

      // Indent Increase Rules
      if (brOpen >= 0) {      // Squiggly bracket opening
        // Make sure there are no comment modifiers that break the opening bracket
        if ((slComment >= 0 && slComment < brOpen) ||
          (mlComment1Open >= 0 && mlComment1Open < brOpen && !(mlComment1Close >= 0 && mlComment1Close < brOpen)) ||
          (mlComment2Open >= 0 && mlComment2Open < brOpen && !(mlComment2Close >= 0 && mlComment2Close < brOpen)) ||
          (brClose > brOpen && !((slComment >= 0 && slComment < brClose) ||
            (mlComment1Open >= 0 && mlComment1Open < brClose && !(mlComment1Close >= 0 && mlComment1Close < brClose)) ||
            (mlComment2Open >= 0 && mlComment2Open < brClose && !(mlComment2Close >= 0 && mlComment2Close < brClose))
          ))) {
          outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
        }
        else {
          outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
          indentLevel = indentLevel + 1;
        }
      }
      else if (sqOpen >= 0) {   // Square bracket opening
        // Make sure there are no comment modifiers that break the opening bracket
        if ((slComment >= 0 && slComment < sqOpen) ||
          (mlComment1Open >= 0 && mlComment1Open < sqOpen && !(mlComment1Close >= 0 && mlComment1Close < sqOpen)) ||
          (mlComment2Open >= 0 && mlComment2Open < sqOpen && !(mlComment2Close >= 0 && mlComment2Close < sqOpen)) ||
          (sqClose > sqOpen && !((slComment >= 0 && slComment < sqClose) ||
            (mlComment1Open >= 0 && mlComment1Open < sqClose && !(mlComment1Close >= 0 && mlComment1Close < sqClose)) ||
            (mlComment2Open >= 0 && mlComment2Open < sqClose && !(mlComment2Close >= 0 && mlComment2Close < sqClose))
          ))) {
          outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
        }
        else {
          outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
          indentLevel = indentLevel + 1;
        }
      }
      else if (parOpen >= 0) {    // Parenthesis opening
        // Make sure there are no comment modifiers that break the opening bracket
        if ((slComment >= 0 && slComment < parOpen) ||
          (mlComment1Open >= 0 && mlComment1Open < parOpen && !(mlComment1Close >= 0 && mlComment1Close < parOpen)) ||
          (mlComment2Open >= 0 && mlComment2Open < parOpen && !(mlComment2Close >= 0 && mlComment2Close < parOpen)) ||
          (parClose > parOpen && !((slComment >= 0 && slComment < parClose) ||
            (mlComment1Open >= 0 && mlComment1Open < parClose && !(mlComment1Close >= 0 && mlComment1Close < parClose)) ||
            (mlComment2Open >= 0 && mlComment2Open < parClose && !(mlComment2Close >= 0 && mlComment2Close < parClose))
          ))) {
          outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
        }
        else {
          outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
          indentLevel = indentLevel + 1;
        }
      }

      // Indentation Decrease Rules
      else if (brClose >= 0) {    // Squiggly Bracket Closing
        if ((slComment >= 0 && slComment < brClose) ||
          (mlComment1Open >= 0 && mlComment1Open < brClose && !(mlComment1Close >= 0 && mlComment1Close < brClose)) ||
          (mlComment2Open >= 0 && mlComment2Open < brClose && !(mlComment2Close >= 0 && mlComment2Close < brClose))) {
          outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
        }
        else {
          if (brClose === 0) {    // Check if it's a close bracket on a line by itself; if so, decrease indent on this line
            indentLevel = indentLevel - 1;
            outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
          }
          else {      // There's something else on the line before the close bracket, decrease indent on the next line
            outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
            indentLevel = indentLevel - 1;
          }
        }
      }
      else if (sqClose >= 0) {    // Square Bracket Closing
        if ((slComment >= 0 && slComment < sqClose) ||
          (mlComment1Open >= 0 && mlComment1Open < sqClose && !(mlComment1Close >= 0 && mlComment1Close < sqClose)) ||
          (mlComment2Open >= 0 && mlComment2Open < sqClose && !(mlComment2Close >= 0 && mlComment2Close < sqClose))) {
          outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
        }
        else {
          if (sqClose === 0) {    // Check if it's a close bracket on a line by itself; if so, decrease indent on this line
            indentLevel = indentLevel - 1;
            outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
          }
          else {      // There's something else on the line before the close bracket, decrease indent on the next line
            outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
            indentLevel = indentLevel - 1;
          }
        }
      }
      else if (parClose >= 0) {   // Parenthesis closing
        if ((slComment >= 0 && slComment < parClose) ||
          (mlComment1Open >= 0 && mlComment1Open < parClose && !(mlComment1Close >= 0 && mlComment1Close < parClose)) ||
          (mlComment2Open >= 0 && mlComment2Open < parClose && !(mlComment2Close >= 0 && mlComment2Close < parClose))) {
          outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
        }
        else {
          if (parClose === 0) {    // Check if it's a close bracket on a line by itself; if so, decrease indent on this line
            indentLevel = indentLevel - 1;
            outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
          }
          else {      // There's something else on the line before the close bracket, decrease indent on the next line
            outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
            indentLevel = indentLevel - 1;
          }
        }
      }
      else {
        outputText = outputText + ('\t'.repeat(indentLevel)) + thisLine + "\r";
      }
    };
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
    let buildCommand = getCompileCommand(doc.fileName);

    let taskDef: NetlinxTaskDefinition = {
      type: 'shell',
      label: 'Netlinx Build',
      buildPath: buildCommand
    }

    let executable = 'c:\\windows\\system32\\cmd.exe';

    let command: vscode.ShellExecution = new vscode.ShellExecution(`"${buildCommand}"`, { executable: executable, shellArgs: ['/c'] });
    let task = new vscode.Task(taskDef, 'Netlinx Build', 'amx-netlinx', command, `$nlrc`);
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
