"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BqRunExt = void 0;
const vscode = __importStar(require("vscode"));
const path = require("path");
const bqInterface_1 = require("./bqInterface");
const os_1 = __importDefault(require("os"));
/** Cette Extension a pour but d'ajouter un bouton "dry run" en bas de l'écran et d'afficher l'emplacement de l'erreur si erreur
 *
 *
 */
class BqRunExt {
    constructor(context, activeEditor) {
        this.bqDryRunErrorDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: path.join(__filename, '..', '..', '..', 'images', 'red_dot.svg'),
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
    referenceTerraformResources(tfResourceObject) {
        this.TerraformResources = tfResourceObject;
    }
    getBqDryRunDecoration() {
        return this.bqDryRunErrorDecoration;
    }
    registerDryRun(commandId) {
        const bqDryRun = vscode.commands.registerCommand(commandId, async () => {
            const bqItf = new bqInterface_1.BqInterface();
            const filePath = vscode.window.activeTextEditor?.document.uri;
            const [targetpath, query] = await this.prepareTempFile(filePath);
            this.bqDryRunStatusBar.text = 'BQ Dry Run $(loading~spin)';
            void bqItf.dryRun(query, targetpath).then((returnedAnwser) => { this.showDryRunResult(returnedAnwser); });
        });
        this.context.subscriptions.push(bqDryRun);
        // This adds a Status bar element
        this.bqDryRunStatusBar.command = commandId;
        this.context.subscriptions.push(this.bqDryRunStatusBar);
        this.bqDryRunStatusBar.text = 'BQ Dry Run';
        this.updateStatusBarBQItem();
        this.context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(event => {
            if (event?.document && vscode.window.activeTextEditor?.document && this.activeEditor?.document !== vscode.window.activeTextEditor?.document) {
                this.activeEditor = vscode.window.activeTextEditor;
                this.updateStatusBarBQItem();
            }
        })); // Update visibility when changing file
        vscode.workspace.onDidChangeTextDocument(event => {
            if (this.activeEditor && event.document === this.activeEditor.document) {
                vscode.window.activeTextEditor?.setDecorations(this.bqDryRunErrorDecoration, []);
            }
        }, null, this.context.subscriptions);
    }
    registerGetSchema(commandId) {
        const bqDryRun = vscode.commands.registerCommand(commandId, async () => { void this.getSchema(); });
        this.context.subscriptions.push(bqDryRun);
    }
    async getSchema() {
        const bqItf = new bqInterface_1.BqInterface();
        let basename = 'undefined.json';
        let schemaPath;
        const filePath = vscode.window.activeTextEditor?.document.uri;
        const [targetpath, query] = await this.prepareTempFile(filePath);
        if (filePath) {
            basename = path.basename(filePath.fsPath);
            const relativePath = vscode.workspace.asRelativePath(filePath); // == terraform/query_views/vue.sql
            schemaPath = this.TerraformResources?.getSchemaPath(relativePath);
        }
        this.bqDryRunStatusBar.text = 'BQ Dry Run Running $(loading~spin)';
        void bqItf.dryRun(query, targetpath).then((returnedAnwser) => {
            void this.storeSchema(returnedAnwser, schemaPath, basename).then(() => {
                this.bqDryRunStatusBar.text = 'BQ Dry Run ';
            });
        });
    }
    // this prepares the query and the file path.
    // Returns the query without terraform variables and a file path
    async prepareTempFile(filePath) {
        const homedirpath = os_1.default.homedir();
        let targetpath = path.join(homedirpath, 'temporarysql.sql');
        let dirname = '.';
        let query = '';
        if (filePath) {
            dirname = path.dirname(filePath.fsPath);
        }
        if (vscode.window.activeTextEditor) {
            query = vscode.window.activeTextEditor?.document.getText();
        }
        // Si Dirname = "." alors ca sert à rien de tenter un replace
        if (dirname !== '.') {
            query = await vscode.commands.executeCommand('bigqueryhelper.sqlTFReplace', query, filePath?.fsPath);
        }
        if (filePath !== undefined) {
            targetpath = filePath.fsPath;
        }
        else if (vscode.workspace.workspaceFolders !== undefined) {
            targetpath = `${vscode.workspace.workspaceFolders[0].uri.fsPath}\\temporarysql.sql`;
        }
        return [targetpath, query];
    }
    showDryRunResult(result) {
        if (result.status === 'success') {
            const processed = result.readableDataUsed;
            this.bqDryRunStatusBar.text = `BQ Dry Run : ${processed}`;
            void vscode.window.showInformationMessage(`The query is validated and will process ${processed}`);
        }
        if (result.status === 'anyError' || result.status === 'sqlError') {
            this.bqDryRunStatusBar.text = 'BQ Dry Run';
            void vscode.window.showErrorMessage(`${result.answer}`);
            if (result.errorColumn && result.errorLine) {
                let wrongName = '';
                let suggestion = '';
                const wrongNameMatch = result.answer.match(/: (\w+);/);
                const suggestionMatch = result.answer.match(/(\w+)\?/);
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
    async storeSchema(result, schemaPath, basename) {
        let oldSchema;
        let toWrite = -1; // blank file
        if (!result.schema) {
            void vscode.window.showErrorMessage(`There was an error executing the dry Run : ${result.answer}`);
            return;
        }
        if (vscode.workspace.workspaceFolders === undefined) {
            void vscode.window.showErrorMessage('Error: You are not working in a Workspace');
            return;
        }
        if (schemaPath && this.TerraformResources) {
            const mySchema = await this.TerraformResources.getSchema(schemaPath);
            if (mySchema !== undefined && mySchema !== null) {
                oldSchema = mySchema;
                toWrite = 0; // overwrite
            }
            if (mySchema === null) {
                toWrite = 1; // create
            }
        }
        let schema = result.schema;
        const newschema = JSON.parse(schema).map(function (col) {
            if (oldSchema) {
                const oldCol = oldSchema.find(x => x.name === col.name);
                if (oldCol) {
                    col.description = oldCol.description;
                    col.mode = oldCol.mode;
                }
            }
            return { name: col.name, type: col.type, mode: col.mode, description: (col.description ? col.description : '') };
        });
        schema = JSON.stringify(newschema, null, 2);
        if (toWrite === -1) {
            void vscode.workspace.openTextDocument({ content: schema, language: 'json' }).then((doc) => {
                void vscode.window.showTextDocument(doc, 1, false);
            });
        }
        if ((toWrite === 0 || toWrite === 1) && schemaPath) {
            void vscode.workspace.openTextDocument(toWrite === 1 ? schemaPath.with({ scheme: 'untitled' }) : schemaPath).then((doc) => {
                void vscode.window.showTextDocument(doc, 1, false).then((editor) => {
                    const firstLine = editor.document.lineAt(0);
                    const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                    const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
                    void editor.edit(editBuilder => {
                        editBuilder.replace(textRange, schema);
                    });
                });
            });
        }
    }
    updateStatusBarBQItem() {
        const language = this.activeEditor?.document.languageId;
        const fileName = this.activeEditor?.document.fileName;
        let extension;
        if (fileName !== undefined && fileName.lastIndexOf('.') > -1) {
            extension = fileName.substring(fileName.lastIndexOf('.') + 1);
        }
        if ((extension !== undefined && extension.toLowerCase() === 'sql') || (language !== undefined && language.substring(0, 3) === 'sql')) {
            this.bqDryRunStatusBar.show();
        }
        else {
            this.bqDryRunStatusBar.hide();
        }
    }
}
exports.BqRunExt = BqRunExt;
//# sourceMappingURL=bqRunExt.js.map