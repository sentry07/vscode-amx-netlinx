import {
    ExtensionContext,
    Disposable,
    languages,
    Range,
    TextDocument,
    TextEdit,
    workspace,
    tasks,
    window,
    Task,
    commands,
    TaskDefinition,
    Uri,
    ShellExecution,
    TaskGroup,
    OutputChannel,
    FormattingOptions,
    CancellationToken,
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider,
} from "vscode";


let taskProvider: Disposable | undefined;

export function activate(context: ExtensionContext) {
    let transfer_command = commands.registerCommand("extension.netlinx_transfer", () => {
        callShellCommand(workspace.getConfiguration("netlinx").transferLocation);
    });

    let diag_command = commands.registerCommand("extension.netlinx_diag", () => {
        callShellCommand(workspace.getConfiguration("netlinx").diagLocation);
    });

    let help_command = commands.registerCommand("extension.netlinx_help", () => {
        callShellCommand(workspace.getConfiguration("netlinx").helpLocation);
    });

    let open_includefolder = commands.registerCommand("extension.netlinx_openincludefolder", () => {
        if (workspace.getConfiguration("netlinx").includesLocation.length) {
            addFolderToWorkspace(workspace.getConfiguration("netlinx").includesLocation, "Global Includes")
        }
        else {
            window.showErrorMessage("Global Include folder not configured. Please open user settings and set the folder URI.");
        }
    });

    let open_libraryfolder = commands.registerCommand("extension.netlinx_openlibraryfolder", () => {
        if (workspace.getConfiguration("netlinx").librariesLocation.length) {
            addFolderToWorkspace(workspace.getConfiguration("netlinx").librariesLocation, "Global Libraries");
        }
        else {
            window.showErrorMessage("Global Library folder not configured. Please open user settings and set the folder URI.");
        }
    });

    let open_modulefolder = commands.registerCommand("extension.netlinx_openmodulefolder", () => {
        if (workspace.getConfiguration("netlinx").modulesLocation.length) {
            addFolderToWorkspace(workspace.getConfiguration("netlinx").modulesLocation, "Global Modules");
        }
        else {
            window.showErrorMessage("Global Module folder not configured. Please open user settings and set the folder URI.");
        }
    });

    function rebuildTaskList(): void {
        if (taskProvider) {
            taskProvider.dispose();
            taskProvider = undefined;
        }
        if (!taskProvider && window.activeTextEditor.document.languageId === "netlinx-source") {
            let netlinxPromise: Thenable<Task[]> | undefined = undefined;
            taskProvider = tasks.registerTaskProvider('netlinx', {
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

    let thisFormatProvider = new formattingProvider(formatProvider);
	languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'netlinx-source' }, thisFormatProvider);
	languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'netlinx-include' }, thisFormatProvider);

    context.subscriptions.push(transfer_command);
    context.subscriptions.push(diag_command);
    context.subscriptions.push(help_command);
    context.subscriptions.push(open_includefolder);
    context.subscriptions.push(open_libraryfolder);
    context.subscriptions.push(open_modulefolder);

    workspace.onDidChangeConfiguration(rebuildTaskList);
    workspace.onDidOpenTextDocument(rebuildTaskList);
    window.onDidChangeActiveTextEditor(rebuildTaskList);
    rebuildTaskList();
}

export interface RangeFormattingOptions {
    rangeStart: number;
    rangeEnd: number;
}

export class formattingProvider
    implements
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider {
    constructor(
        private provideEdits: (
            document: TextDocument,
            options?: RangeFormattingOptions
        ) => Promise<TextEdit[]>
    ) { }


    public async provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this.provideEdits(document, {
            rangeEnd: document.offsetAt(range.end),
            rangeStart: document.offsetAt(range.start),
        });
    }

    public async provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this.provideEdits(document);
    }
}

function fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}

async function formatProvider(document: TextDocument, options?: RangeFormattingOptions): Promise<TextEdit[]> {
    let outputText = formatText(document.getText());
    return [new TextEdit(
        fullDocumentRange(document),
        outputText)];
}

function formatText(docText: string): string {
    let outputText = "";
    let indentLevel = 0;                                        // Current line indent level (number of tabs)
    let inComment = 0;                                          // If we're in a comment and what level
    let startingComment = 0;                                    // Check if this line starts a comment
    let endingComment = 0;                                      // Check if this line ends a comment
    let docLines = docText.split(/\r?\n/);                      // Split into lines

    // Comment weeders
    let reDeCom1 = /(\/\/.*)/gm;                                // Single line comment
    let reDeCom2 = /((?:\(\*|\/\*).*(?:\*\)|\*\/))/gm;          // Fully enclosed multiline comment
    let reDeCom3 = /(.*(?:\*\)|\*\/))/gm;                       // Closing multiline comment
    let reDeCom4 = /((?:\(\*|\/\*).*)/gm;                       // Opening multiline comment
    let reString = /'[^']*'/gm;

    for (var line = 0; line < docLines.length; line++) {
        startingComment = 0;
        endingComment = 0;
        let thisLine = docLines[line];
        let thisLineTrimmed = docLines[line].trimLeft();
        let thisLineClean = docLines[line].trimLeft().replace(reDeCom1, "").replace(reDeCom2, "");      // Remove any single line comments and fully enclosed multiline comments

        if (reDeCom3.test(thisLineClean) && inComment > 0) {        // If a multiline comment closes on this line, decrease our comment level
            inComment = inComment - 1;
            if (inComment === 0) {
                endingComment = 1;
            }
        }
        if (reDeCom4.test(thisLineClean)) {                         // If a multiline comment opens on this line, increase our comment level
            if (inComment === 0) {
                startingComment = 1;                                    // If this line starts a multiline comment, it still needs to be checked
            }
            inComment = inComment + 1;
        }

        thisLineClean = thisLineClean.replace(reDeCom3, "").replace(reDeCom4, "");            // Remove any code that we think is inside multiline comments
        thisLineClean = thisLineClean.replace(reString, "");                                  // Remove any string literals from the line so we don't get false positives
        let brOpen = countChars(thisLineClean, '{') - countChars(thisLineClean, '}');         // Check the delta for squiggly brackets
        let sqOpen = countChars(thisLineClean, '[') - countChars(thisLineClean, ']');         // Check the delta for square brackets
        let parOpen = countChars(thisLineClean, '(') - countChars(thisLineClean, ')');        // Check the delta for parenthesis
        let indentDelta = brOpen + sqOpen + parOpen;                                          // Calculate total delta

        // Indent Increase Rules
        if ((inComment > 0 && !startingComment) || (!inComment && endingComment)) {           // If we're in a multiline comment, just leave the line alone unless it's the start of a ML comment
            outputText = outputText + thisLine + "\r";
        }
        else if (indentDelta > 0) {                                                         // If we're increasing indent delta because of this line, the add it, then increase indent
            outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + "\r";
            indentLevel = (indentLevel + indentDelta >= 0) ? (indentLevel + indentDelta) : 0;
        }
        // If we're decreasing delta, and the line starts with the character that is decreasing it, then decrease first, and then add this line
        else if (indentDelta < 0 && (thisLineClean[0] === '}' || thisLineClean[0] === ']' || thisLineClean[0] === ')')) {
            indentLevel = (indentLevel + indentDelta >= 0) ? (indentLevel + indentDelta) : 0;
            outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + "\r";
        }
        else if (indentDelta < 0) {                                                         // If we're decreasing delta but the first character isn't the cause, then we're still inside the block
            outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + "\r";
            indentLevel = (indentLevel + indentDelta >= 0) ? (indentLevel + indentDelta) : 0;
        }
        else {                                                                              // indentDelta === 0; do nothing except add the line with the indent
            outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + "\r";
        }
    };

    return outputText;
}

// Creates a terminal, calls the command, then closes the terminal
function callShellCommand(shellCommand: string): void {
    let term = window.createTerminal('netlinx', workspace.getConfiguration("netlinx").terminalLocation);
    term.sendText("\"" + shellCommand + "\"", true);
    term.sendText("exit", true);
}

// Adds a folder to the workspace
function addFolderToWorkspace(folder: string, folderName: string): void {
    let folderLocation = Uri.file(folder);
    workspace.updateWorkspaceFolders(workspace.workspaceFolders ? workspace.workspaceFolders.length : 0, null, { "uri": folderLocation, "name": folderName });
}

function getCompileCommand(fileName: string, useGlobal: boolean): string {
    let compiler = new NetlinxCompiler();
    compiler.filepaths.push(fileName);
    if (useGlobal) {
        if (workspace.getConfiguration("netlinx").includesLocation.length > 0) {
            compiler.filepaths.push("-I" + workspace.getConfiguration("netlinx").includesLocation);
        }
        if (workspace.getConfiguration("netlinx").librariesLocation.length > 0) {
            compiler.filepaths.push("-L" + workspace.getConfiguration("netlinx").librariesLocation);
        }
        if (workspace.getConfiguration("netlinx").modulesLocation.length > 0) {
            compiler.filepaths.push("-M" + workspace.getConfiguration("netlinx").modulesLocation);
        }
    }

    return compiler.buildCommand();
}

function countChars(haystack: string, needle: string): number {
    let count = 0;
    for (var i = 0; i < haystack.length; i++) {
        if (haystack[i] === needle) {
            count++;
        }
    }
    return count;
}

interface NetlinxTaskDefinition extends TaskDefinition {
    buildPath: string;
}

async function getCompileTasks(): Promise<Task[]> {
    let workspaceRoot = workspace.rootPath;
    let emptyTasks: Task[] = [];

    if (!workspaceRoot) {
        return emptyTasks;
    }

    try {
        let result: Task[] = [];
        let editor = window.activeTextEditor;
        let doc = editor.document;
        let executable = 'c:\\windows\\system32\\cmd.exe';

        // Create "Local" build, ignoring global folders
        let buildCommand = getCompileCommand(doc.fileName, false);

        let taskDef: NetlinxTaskDefinition = {
            type: 'shell',
            label: 'Netlinx Build Local',
            buildPath: buildCommand
        }

        let command: ShellExecution = new ShellExecution(`"${buildCommand}"`, { executable: executable, shellArgs: ['/c'] });
        let task = new Task(taskDef, 'Compile w/Local Files', 'amx-netlinx', command, `$nlrc`);
        task.definition = taskDef;
        task.group = TaskGroup.Build;

        result.push(task);

        // Create "Global" build, including global folders
        buildCommand = getCompileCommand(doc.fileName, true);

        taskDef = {
            type: 'shell',
            label: 'Netlinx Build w/Globals',
            buildPath: buildCommand
        }

        command = new ShellExecution(`"${buildCommand}"`, { executable: executable, shellArgs: ['/c'] });
        task = new Task(taskDef, 'Compile w/Global Files', 'amx-netlinx', command, `$nlrc`);
        task.definition = taskDef;
        task.group = TaskGroup.Build;

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

let _channel: OutputChannel;
function getOutputChannel(): OutputChannel {
    if (!_channel) {
        _channel = window.createOutputChannel("Netlinx Compile");
    }
    return _channel;
}

class NetlinxCompiler {
    constructor() {
        this.filepaths = [];
        this.compilerPath = "\"" + workspace.getConfiguration("netlinx").compilerLocation + "\"";
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
