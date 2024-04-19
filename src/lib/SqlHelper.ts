import * as vscode from 'vscode'
import { BqInterface } from './bqInterface'
import os from 'os'
import path from 'path'

export class SqlHelper {
  context: vscode.ExtensionContext
  SqlHelperStatusBar: vscode.StatusBarItem
  activeEditor: vscode.TextEditor | undefined

  constructor (context: vscode.ExtensionContext, activeEditor: vscode.TextEditor | undefined) {
    this.context = context
    this.activeEditor = activeEditor
    this.SqlHelperStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  }

  public registerSelectAllFromSchema (commandId: string): void {
    const SqlHelperFromSchema = vscode.commands.registerCommand(commandId, () => {
      this.selectAllFromSchema()
    })
    this.context.subscriptions.push(SqlHelperFromSchema)
  }

  public registerSelectAllFromTableId (commandId: string): void {
    const SqlHelperFromTableId = vscode.commands.registerCommand(commandId, () => {
      this.selectAllFromTableId()
    })
    this.context.subscriptions.push(SqlHelperFromTableId)
  }

  public selectAllFromSchema (): void {
    const jsonData = vscode.window.activeTextEditor?.document.getText()
    const finalSelect = this.buildSqlFromSchema(jsonData)
    if (finalSelect.length > 0) {
      void vscode.workspace.openTextDocument({ content: finalSelect, language: 'sql' }).then((doc: vscode.TextDocument) => {
        void vscode.window.showTextDocument(doc, 1, false)
      })
    }
  }

  public buildSqlFromSchema (jsonData: string | undefined, tableId: string | undefined = undefined): string {
    let finalSelect = ''
    let fieldList: string = ''
    if (!tableId) {
      tableId = '[project].[dataset].[table]'
    }
    if (jsonData) {
      const jsonArray = JSON.parse(jsonData)
      for (const element of jsonArray) {
        fieldList += '  ' + element.name + ',\n'
      }
    }
    if (fieldList.length > 0) {
      finalSelect = 'SELECT\n' + fieldList.substring(0, fieldList.length - 2) + '\nFROM `' + tableId + '`'
    }
    return finalSelect
  }

  public selectAllFromTableId (): void {
    void vscode.window.showInputBox({
      title: 'Get select all from a table id',
      prompt: 'Input the fully qualified table id',
      placeHolder: '[project].[dataset].[table]'
    }).then((userInput) => {
      if (userInput && userInput.trim().split('.').length === 3 && userInput.trim().split(' ').length === 1) {
        const tableId = userInput.replaceAll('`', '').trim()
        const query = 'SELECT * FROM `' + tableId + '`'
        const bqItf = new BqInterface()
        const homedirpath = os.homedir()
        let targetpath = path.join(homedirpath, 'temporarysql.sql')
        if (vscode.workspace.workspaceFolders === undefined) {
          void vscode.window.showErrorMessage('Error: You are not working in a Workspace')
          return
        }
        if (vscode.workspace.workspaceFolders?.[0].uri.fsPath) {
          targetpath = vscode.workspace.workspaceFolders[0].uri.fsPath
        }
        console.log('Looks correct')
        this.SqlHelperStatusBar.text = 'Retrieving schema $(loading~spin)'
        this.SqlHelperStatusBar.show()
        void bqItf.dryRun(query, targetpath).then((returnedAnwser) => {
          this.SqlHelperStatusBar.text = ''
          this.SqlHelperStatusBar.hide()
          if (!returnedAnwser.schema) {
            void vscode.window.showErrorMessage(`There was an error executing the dry Run : ${returnedAnwser.answer}`)
            return
          }
          const finalSelect = this.buildSqlFromSchema(returnedAnwser.schema, tableId)
          if (finalSelect.length > 0) {
            void vscode.workspace.openTextDocument({ content: finalSelect, language: 'sql' }).then((doc: vscode.TextDocument) => {
              void vscode.window.showTextDocument(doc, 1, false)
            })
          } else {
            void vscode.window.showErrorMessage('There was an error generating the select')
          }
        })
      } else {
        console.log('This string does not look correct')
        void vscode.window.showErrorMessage('This string does not look like a table id')
      }
    })
  }
}
