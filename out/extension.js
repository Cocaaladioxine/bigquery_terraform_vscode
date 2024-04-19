// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
'use strict';
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
// import { BigQueryLister } from './lib/BigQueryLister';
const bqRunExt_1 = require("./lib/bqRunExt");
const terraformRessources_1 = require("./lib/terraformRessources");
const tfWorspaceSelector_1 = require("./lib/tfWorspaceSelector");
const biqgueryHelperTester_1 = require("./lib/biqgueryHelperTester");
const SqlHelper_1 = require("./lib/SqlHelper");
const terraformHelper_1 = require("./lib/terraformHelper");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log('Congratulations, your extension "bigqueryhelper" is now starting !');
    const activeEditor = vscode.window.activeTextEditor;
    // Declare the Dry run command
    const bqRunExtension = new bqRunExt_1.BqRunExt(context, activeEditor);
    bqRunExtension.registerDryRun('bigqueryhelper.bqDryRun');
    bqRunExtension.registerGetSchema('bigqueryhelper.reverseViewSchema');
    console.log('BqRunExtension registered');
    const myworkspaceSelector = new tfWorspaceSelector_1.WorkspaceSelector(context);
    myworkspaceSelector.registerWorkplaceSelector();
    const tfRessourcesTree = new terraformRessources_1.TerraformResources(context, activeEditor);
    vscode.window.registerTreeDataProvider('terraformResources', tfRessourcesTree);
    tfRessourcesTree.registerCommands();
    bqRunExtension.referenceTerraformResources(tfRessourcesTree);
    console.log('TerraformResources registered');
    // Ca c'est juste pour avoir une commande pour faire des petits tests :) =>
    const bigqueryhelperTester = new biqgueryHelperTester_1.BqHelperTester(context, activeEditor);
    bigqueryhelperTester.registerCommand('bigqueryhelper.tester');
    const sqlHelper = new SqlHelper_1.SqlHelper(context, activeEditor);
    sqlHelper.registerSelectAllFromSchema('bigqueryhelper.SQLSelectAllFromSchema');
    sqlHelper.registerSelectAllFromTableId('bigqueryhelper.SQLSelectAllFromTableId');
    const terraformHelper = new terraformHelper_1.TerraformHelper(context, activeEditor);
    terraformHelper.registerCommand('bigqueryhelper.declareView');
    terraformHelper.registerCommand('bigqueryhelper.declareTable');
    /* Pour le moment, cette partie n'est pas des plus utiles. Il y a du taf, et c'est lent, alors on met de côté
    This adds a TreeView in the "explorer view". The location is defined in th package.json
    const bigQueryLister = new BigQueryLister();
    vscode.window.registerTreeDataProvider('bigQueryLister', bigQueryLister);
  */
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map