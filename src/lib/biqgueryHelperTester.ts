import * as vscode from 'vscode'
import os from 'os'
export class BqHelperTester {
  context: vscode.ExtensionContext
  activeEditor: vscode.TextEditor | undefined

  constructor (context: vscode.ExtensionContext, activeEditor: vscode.TextEditor | undefined) {
    this.context = context
    this.activeEditor = activeEditor
  }

  public registerCommand (commandId: string): void {
    const bqHelperTester = vscode.commands.registerCommand(commandId, () => {
      const terraformWorkspacesList: string[] | undefined = this.context.workspaceState.get('workspaceList')
      const homedirpath = os.homedir()

      const uri = vscode.Uri.parse((homedirpath[0] === '/' ? '' : 'file:///') + homedirpath)
      console.log(uri)
      console.log(uri.fsPath)
      console.log(terraformWorkspacesList)
    })
    this.context.subscriptions.push(bqHelperTester)
  }
}
