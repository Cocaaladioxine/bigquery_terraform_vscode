"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bqDryRunExt = void 0;
const vscode = require("vscode");
const path = require("path");
const bqInterface_1 = require("./bqInterface");
/** Cette Extension a pour but d'ajouter un bouton "dry run" en bas de l'écran et d'afficher l'emplacement de l'erreur si erreur
 *
 *
 */
class bqDryRunExt {
    constructor(context, activeEditor) {
        this.bqDryRunErrorDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: path.join(__filename, '..', '..', 'images', 'red_dot.svg'),
            gutterIconSize: '70%',
            borderWidth: '1px',
            borderStyle: 'solid',
            overviewRulerColor: 'red',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            light: {
                // this color will be used in light color themes
                borderColor: 'darkblue'
            },
            dark: {
                // this color will be used in dark color themes
                borderColor: 'lightblue'
            }
        });
        this.context = context;
        this.activeEditor = activeEditor;
        this.bqDryRunStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    }
    getBqDryRunDecoration() {
        return this.bqDryRunErrorDecoration;
    }
    registerDryRunExtension(commandId) {
        let bqDryRun = vscode.commands.registerCommand(commandId, async () => {
            let bqItf = new bqInterface_1.bqInterface();
            let [targetpath, query] = await this.prepareTempFile();
            bqItf.dryRun(query, targetpath).then((returnedAnwser) => { this.showDryRunResult(returnedAnwser); });
        });
        this.context.subscriptions.push(bqDryRun);
        //This adds a Status bar element
        this.bqDryRunStatusBar.command = commandId;
        this.context.subscriptions.push(this.bqDryRunStatusBar);
        this.bqDryRunStatusBar.text = `BQ Dry Run`;
        this.updateStatusBarBQItem();
        this.context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(event => {
            if (event?.document && vscode.window.activeTextEditor?.document && this.activeEditor?.document !== vscode.window.activeTextEditor?.document) {
                this.activeEditor = vscode.window.activeTextEditor;
                this.updateStatusBarBQItem();
            }
        })); //Update visibility when changing file
        vscode.workspace.onDidChangeTextDocument(event => {
            if (this.activeEditor && event.document === this.activeEditor.document) {
                vscode.window.activeTextEditor?.setDecorations(this.bqDryRunErrorDecoration, []);
            }
        }, null, this.context.subscriptions);
    }
    async prepareTempFile() {
        let targetpath = 'C:\\temporarysql.sql';
        let dirname = ".";
        let filePath = vscode.window.activeTextEditor?.document.uri.fsPath;
        if (filePath) {
            dirname = path.dirname(filePath);
        }
        let query = "";
        if (vscode.window.activeTextEditor) {
            query = vscode.window.activeTextEditor?.document.getText();
        }
        //Si Dirname = "." alors ca sert à rien de tenter un replace 
        if (dirname !== ".") {
            query = await vscode.commands.executeCommand('bigqueryhelper.sqlTFReplace', query, filePath);
        }
        if (filePath !== undefined) {
            targetpath = filePath;
        }
        else if (vscode.workspace.workspaceFolders !== undefined) {
            targetpath = `${vscode.workspace.workspaceFolders[0].uri.fsPath}\\temporarysql.sql`;
        }
        return [targetpath, query];
    }
    showDryRunResult(result) {
        if (result.status == 'success') {
            let processed = result.readableDataUsed;
            this.bqDryRunStatusBar.text = `BQ Dry Run : ${processed}`;
            vscode.window.showInformationMessage(`The query is validated and will process ${processed}`);
        }
        if (result.status == 'anyError' || result.status == 'sqlError') {
            this.bqDryRunStatusBar.text = 'BQ Dry Run';
            vscode.window.showErrorMessage(`${result.answer}`);
            if (result.errorColumn && result.errorLine) {
                let wrongName = '';
                let suggestion = '';
                let wrongNameMatch = result.answer.match(/: (\w+);/);
                let suggestionMatch = result.answer.match(/(\w+)\?/);
                if (wrongNameMatch !== null && suggestionMatch !== null) {
                    wrongName = wrongNameMatch[1];
                    suggestion = suggestionMatch[1];
                }
                ;
                const start = new vscode.Position(result.errorLine - 1, result.errorColumn - 1);
                const end = new vscode.Position(result.errorLine - 1, result.errorColumn + wrongName.length - 1);
                const range = { range: new vscode.Range(start, end), hoverMessage: `${wrongName} is unrecognized, did you mean ${suggestion}?` };
                vscode.window.activeTextEditor?.setDecorations(this.bqDryRunErrorDecoration, [range]);
            }
        }
    }
    updateStatusBarBQItem() {
        let language = this.activeEditor?.document.languageId;
        let fileName = this.activeEditor?.document.fileName;
        let extension = undefined;
        if (fileName !== undefined && fileName.lastIndexOf('.') > -1) {
            extension = fileName.substring(fileName.lastIndexOf('.') + 1);
        }
        if (extension !== undefined && extension.toLowerCase() == 'sql' || language !== undefined && language.substring(0, 3) == 'sql') {
            this.bqDryRunStatusBar.show();
        }
        else {
            this.bqDryRunStatusBar.hide();
        }
    }
}
exports.bqDryRunExt = bqDryRunExt;
//# sourceMappingURL=bqDryRunExt.js.map