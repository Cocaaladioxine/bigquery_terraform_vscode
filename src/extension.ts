// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
'use strict'
import * as vscode from 'vscode'
// import { BigQueryLister } from './lib/BigQueryLister';
import { BqRunExt } from './lib/bqRunExt'
import { TerraformResources } from './lib/terraformRessources'
import { WorkspaceSelector } from './lib/tfWorspaceSelector'
import { BqHelperTester } from './lib/biqgueryHelperTester'
import { SqlHelper } from './lib/SqlHelper'
import { TerraformHelper } from './lib/terraformHelper'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate (context: vscode.ExtensionContext): void {
  console.log('Congratulations, your extension "bigqueryhelper" is now starting !')
  const activeEditor = vscode.window.activeTextEditor

  // Declare the Dry run command
  const bqRunExtension = new BqRunExt(context, activeEditor)
  bqRunExtension.registerDryRun('bigqueryhelper.bqDryRun')
  bqRunExtension.registerGetSchema('bigqueryhelper.reverseViewSchema')
  console.log('BqRunExtension registered')

  const myworkspaceSelector = new WorkspaceSelector(context)
  myworkspaceSelector.registerWorkplaceSelector()

  const tfRessourcesTree = new TerraformResources(context, activeEditor)
  vscode.window.registerTreeDataProvider('terraformResources', tfRessourcesTree)
  tfRessourcesTree.registerCommands()
  bqRunExtension.referenceTerraformResources(tfRessourcesTree)
  console.log('TerraformResources registered')

  // Ca c'est juste pour avoir une commande pour faire des petits tests :) =>
  const bigqueryhelperTester = new BqHelperTester(context, activeEditor)
  bigqueryhelperTester.registerCommand('bigqueryhelper.tester')

  const sqlHelper = new SqlHelper(context, activeEditor)
  sqlHelper.registerSelectAllFromSchema('bigqueryhelper.SQLSelectAllFromSchema')
  sqlHelper.registerSelectAllFromTableId('bigqueryhelper.SQLSelectAllFromTableId')

  const terraformHelper = new TerraformHelper(context, activeEditor)
  terraformHelper.registerCommand('bigqueryhelper.declareView')
  terraformHelper.registerCommand('bigqueryhelper.declareTable')

  /* Pour le moment, cette partie n'est pas des plus utiles. Il y a du taf, et c'est lent, alors on met de côté
  This adds a TreeView in the "explorer view". The location is defined in th package.json
  const bigQueryLister = new BigQueryLister();
  vscode.window.registerTreeDataProvider('bigQueryLister', bigQueryLister);
*/
}

// this method is called when your extension is deactivated
export function deactivate (): void {}
