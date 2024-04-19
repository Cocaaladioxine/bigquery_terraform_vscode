import * as vscode from 'vscode'

export class WorkspaceSelector {
  context: vscode.ExtensionContext
  workspaceStatusBar: vscode.StatusBarItem
  activeEditor: vscode.TextEditor | undefined
  workspacesList: string[] = []
  defaultWorkspace: string = ''
  activeWorkspace: string = ''
  pickerItems: vscode.QuickPickItem[] = []

  constructor (context: vscode.ExtensionContext) {
    this.context = context
    this.workspaceStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
    this.initWorkspaceList()
    this.refreshItems()
    void context.workspaceState.update('activeWorkspace', this.activeWorkspace)
    void context.workspaceState.update('workspaceList', this.workspacesList)
  }

  public registerWorkplaceSelector (): void {
    const selectWorkspace = vscode.commands.registerCommand('selectWorkspace', () => {
      void vscode.window.showQuickPick<vscode.QuickPickItem>(
        this.pickerItems
      ).then((selected: vscode.QuickPickItem | undefined) => {
        if (selected !== undefined) {
          this.activeWorkspace = selected.label
          this.refreshItems()
          this.updateStatusBarTfWorkspace()
          void vscode.commands.executeCommand('bigqueryhelper.terraformRefresh')
        }
      }
      )
    })

    this.context.subscriptions.push(selectWorkspace)
    this.workspaceStatusBar.command = 'selectWorkspace'
    this.context.subscriptions.push(this.workspaceStatusBar)
    this.workspaceStatusBar.text = `TF Workspace : ${this.activeWorkspace}`
    this.workspaceStatusBar.show()
    vscode.workspace.onDidChangeConfiguration(event => {
      this.initWorkspaceList()
      this.updateStatusBarTfWorkspace()
      this.refreshItems()
    }, null, this.context.subscriptions)
  }

  private initWorkspaceList (): void {
    const bqtfConfig = vscode.workspace.getConfiguration('bqtf')
    const confWorkspaces: string[] | undefined = bqtfConfig.get('workspaces')
    const contextWorkspace: string | undefined = this.context.workspaceState.get('activeWorkspace')
    const confDefaultWorkspace: string | undefined = bqtfConfig.get('defaultWorkspace')
    if (!confWorkspaces || confWorkspaces.length === 0) {
      void vscode.window.showErrorMessage("Can't find bqtf configuration. Please check your settings.json")
    } else if (!confDefaultWorkspace || confDefaultWorkspace == null) {
      void vscode.window.showErrorMessage("Can't find bqtf default workspace configuration. Please check your settings.json")
    }
    if (confDefaultWorkspace && !contextWorkspace) {
      this.defaultWorkspace = confDefaultWorkspace
      this.activeWorkspace = confDefaultWorkspace
    } else if (confDefaultWorkspace && contextWorkspace) {
      this.activeWorkspace = contextWorkspace
      this.defaultWorkspace = confDefaultWorkspace
    } else {
      this.activeWorkspace = ''
      this.defaultWorkspace = ''
    }
    if (confWorkspaces && confWorkspaces.length > 0) {
      this.workspacesList = confWorkspaces
    } else {
      this.workspacesList = ['']
    }
  }

  private refreshItems (): void {
    this.pickerItems = []
    for (const tfWorkspace of this.workspacesList) {
      if (tfWorkspace === this.activeWorkspace) {
        this.pickerItems.push({
          label: tfWorkspace,
          description: '*'
        })
      } else {
        this.pickerItems.push({ label: tfWorkspace })
      }
    }
  }

  private updateStatusBarTfWorkspace (): void {
    this.workspaceStatusBar.text = `TF Workspace : ${this.activeWorkspace}`
    void this.context.workspaceState.update('activeWorkspace', this.activeWorkspace)
    void this.context.workspaceState.update('workspaceList', this.workspacesList)
  }
}
