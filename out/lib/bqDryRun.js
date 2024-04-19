"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bqDryRun = void 0;
const vscode = require("vscode");
const path = require("path");
const bqInterface_1 = require("./bqInterface");
class bqDryRun {
    constructor() {
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
        this.bqDryRun = vscode.commands.registerCommand(commandId, () => {
            let bqItf = new bqInterface_1.bqInterface();
            let path = 'C:\\temporarysql.sql';
            let filePath = vscode.window.activeTextEditor?.document.uri.fsPath == vscode.window.activeTextEditor?.document.fileName ? undefined : vscode.window.activeTextEditor?.document.uri.fsPath;
            let query = vscode.window.activeTextEditor?.document.getText();
            if (filePath !== undefined) {
                path = filePath;
            }
            else if (vscode.workspace.workspaceFolders !== undefined) {
                path = `${vscode.workspace.workspaceFolders[0].uri.fsPath}\\temporarysql.sql`;
            }
            if (query !== undefined && path !== undefined) {
                bqItf.dryRun(query, path).then((returnedAnwser) => { showDryRunResult(returnedAnwser); });
            }
        });
    }
    getBqDryRunDecoration() {
        return this.bqDryRunErrorDecoration;
    }
}
exports.bqDryRun = bqDryRun;
//# sourceMappingURL=bqDryRun.js.map