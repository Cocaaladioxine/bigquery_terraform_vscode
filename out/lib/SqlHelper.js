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
exports.SqlHelper = void 0;
const vscode = __importStar(require("vscode"));
const bqInterface_1 = require("./bqInterface");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
class SqlHelper {
    constructor(context, activeEditor) {
        this.context = context;
        this.activeEditor = activeEditor;
        this.SqlHelperStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    }
    registerSelectAllFromSchema(commandId) {
        const SqlHelperFromSchema = vscode.commands.registerCommand(commandId, () => {
            this.selectAllFromSchema();
        });
        this.context.subscriptions.push(SqlHelperFromSchema);
    }
    registerSelectAllFromTableId(commandId) {
        const SqlHelperFromTableId = vscode.commands.registerCommand(commandId, () => {
            this.selectAllFromTableId();
        });
        this.context.subscriptions.push(SqlHelperFromTableId);
    }
    selectAllFromSchema() {
        const jsonData = vscode.window.activeTextEditor?.document.getText();
        const finalSelect = this.buildSqlFromSchema(jsonData);
        if (finalSelect.length > 0) {
            void vscode.workspace.openTextDocument({ content: finalSelect, language: 'sql' }).then((doc) => {
                void vscode.window.showTextDocument(doc, 1, false);
            });
        }
    }
    buildSqlFromSchema(jsonData, tableId = undefined) {
        let finalSelect = '';
        let fieldList = '';
        if (!tableId) {
            tableId = '[project].[dataset].[table]';
        }
        if (jsonData) {
            const jsonArray = JSON.parse(jsonData);
            for (const element of jsonArray) {
                fieldList += '  ' + element.name + ',\n';
            }
        }
        if (fieldList.length > 0) {
            finalSelect = 'SELECT\n' + fieldList.substring(0, fieldList.length - 2) + '\nFROM `' + tableId + '`';
        }
        return finalSelect;
    }
    selectAllFromTableId() {
        void vscode.window.showInputBox({
            title: 'Get select all from a table id',
            prompt: 'Input the fully qualified table id',
            placeHolder: '[project].[dataset].[table]'
        }).then((userInput) => {
            if (userInput && userInput.trim().split('.').length === 3 && userInput.trim().split(' ').length === 1) {
                const tableId = userInput.replaceAll('`', '').trim();
                const query = 'SELECT * FROM `' + tableId + '`';
                const bqItf = new bqInterface_1.BqInterface();
                const homedirpath = os_1.default.homedir();
                let targetpath = path_1.default.join(homedirpath, 'temporarysql.sql');
                if (vscode.workspace.workspaceFolders === undefined) {
                    void vscode.window.showErrorMessage('Error: You are not working in a Workspace');
                    return;
                }
                if (vscode.workspace.workspaceFolders?.[0].uri.fsPath) {
                    targetpath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                }
                console.log('Looks correct');
                this.SqlHelperStatusBar.text = 'Retrieving schema $(loading~spin)';
                this.SqlHelperStatusBar.show();
                void bqItf.dryRun(query, targetpath).then((returnedAnwser) => {
                    this.SqlHelperStatusBar.text = '';
                    this.SqlHelperStatusBar.hide();
                    if (!returnedAnwser.schema) {
                        void vscode.window.showErrorMessage(`There was an error executing the dry Run : ${returnedAnwser.answer}`);
                        return;
                    }
                    const finalSelect = this.buildSqlFromSchema(returnedAnwser.schema, tableId);
                    if (finalSelect.length > 0) {
                        void vscode.workspace.openTextDocument({ content: finalSelect, language: 'sql' }).then((doc) => {
                            void vscode.window.showTextDocument(doc, 1, false);
                        });
                    }
                    else {
                        void vscode.window.showErrorMessage('There was an error generating the select');
                    }
                });
            }
            else {
                console.log('This string does not look correct');
                void vscode.window.showErrorMessage('This string does not look like a table id');
            }
        });
    }
}
exports.SqlHelper = SqlHelper;
//# sourceMappingURL=SqlHelper.js.map