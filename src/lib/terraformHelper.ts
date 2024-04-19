import * as vscode from 'vscode'
import * as path from 'path'
import type { CommonQuickPicks, LocalArray, ResourceArray, UsefulPaths, TableQuickPicks } from './interfaces'
import * as fs from 'fs'

export class TerraformHelper {
  context: vscode.ExtensionContext
  activeEditor: vscode.TextEditor | undefined

  constructor (context: vscode.ExtensionContext, activeEditor: vscode.TextEditor | undefined) {
    this.context = context
    this.activeEditor = activeEditor
  }

  public registerCommand (commandId: string): void {
    const TerraformHelper = vscode.commands.registerCommand(commandId, () => {
      if (commandId === 'bigqueryhelper.declareView') {
        void this.declareView()
      }
      if (commandId === 'bigqueryhelper.declareTable') {
        void this.declareTable()
      }
    })
    this.context.subscriptions.push(TerraformHelper)
  }

  private async declareView (): Promise<void> {
    const bqtfConfig = vscode.workspace.getConfiguration('bqtf')
    let targetPath = ''
    const usefulPaths = await this.retrieveUsefulPaths()
    if (!usefulPaths) { return }
    const viewName = usefulPaths.filename.split('.')[0]
    const sqlRelativePath = path.relative(usefulPaths.terraformRootPath, usefulPaths.activeEditorPath.fsPath).replaceAll('\\', '/')
    const tfViewFile: string | undefined = bqtfConfig.get('viewFile')

    if (bqtfConfig.get('preferedViewLocation') === 'one' && tfViewFile) {
      targetPath = path.join(usefulPaths.terraformRootPath, tfViewFile)
    }
    if (bqtfConfig.get('preferedViewLocation') === 'one' && !tfViewFile) {
      void vscode.window.showErrorMessage('Error: you have to declare the View File name in Vscode Settings')
      return
    }
    if (bqtfConfig.get('preferedViewLocation') === 'many') {
      targetPath = path.join(usefulPaths.terraformRootPath, viewName + '.tf')
    }

    const commonQuickPicks: CommonQuickPicks | undefined = await this.handleCommonQuickPicks()
    if (!commonQuickPicks) { return }

    let resourceDeclaration = '\n\n'
    resourceDeclaration += `resource "google_bigquery_table" "bq_view_${viewName}_v1" {\n`
    resourceDeclaration += '  deletion_protection = false\n'
    resourceDeclaration += `  project = ${commonQuickPicks.projectId}\n`
    resourceDeclaration += `  dataset_id = ${commonQuickPicks.datasetId}\n`
    resourceDeclaration += `  table_id = "${viewName}"\n`
    resourceDeclaration += '  description = ""\n\n'
    resourceDeclaration += '  view {\n'
    resourceDeclaration += `    query = templatefile("${sqlRelativePath}", { \n`
    resourceDeclaration += '    })\n'
    resourceDeclaration += '  use_legacy_sql = false\n'
    resourceDeclaration += '  }\n'
    resourceDeclaration += '  # schema = file("")\n'
    resourceDeclaration += '}'

    console.log(resourceDeclaration)
    await this.appendResource(targetPath, resourceDeclaration)
  }

  private async declareTable (): Promise<void> {
    const bqtfConfig = vscode.workspace.getConfiguration('bqtf')
    let targetPath = ''
    const usefulPaths = await this.retrieveUsefulPaths()
    if (!usefulPaths) { return }
    const tableName = usefulPaths.filename.split('.')[0]
    const jsonRelativePath = path.relative(usefulPaths.terraformRootPath, usefulPaths.activeEditorPath.fsPath).replaceAll('\\', '/')
    const tfTableFile: string | undefined = bqtfConfig.get('tableFile')

    if (bqtfConfig.get('preferedTableLocation') === 'one' && tfTableFile) {
      targetPath = path.join(usefulPaths.terraformRootPath, tfTableFile)
    }
    if (bqtfConfig.get('preferedTableLocation') === 'one' && !tfTableFile) {
      void vscode.window.showErrorMessage('Error: you have to declare the Table File name in Vscode Settings')
      return
    }
    if (bqtfConfig.get('preferedTableLocation') === 'many') {
      targetPath = path.join(usefulPaths.terraformRootPath, tableName + '.tf')
    }

    const commonQuickPicks: CommonQuickPicks | undefined = await this.handleCommonQuickPicks()
    if (!commonQuickPicks) { return }

    const tableQuickPicks = await this.tableQuickPicks()
    if (!tableQuickPicks) { return }

    const requirePartitionFilterText = 'require_partition_filter = false\n'
    let insidePartitionFilter = ''
    let outsidePartitionFilter = ''
    if (bqtfConfig.get('partitionFilterOutsideDeclaration') === false) {
      insidePartitionFilter = '    ' + requirePartitionFilterText
    } else {
      outsidePartitionFilter = '  ' + requirePartitionFilterText
    }
    let partition = ''

    if (tableQuickPicks.partitionField) {
      partition = '\n  time_partitioning {\n'
      partition += '    type = "DAY"\n'
      partition += `    field = "${tableQuickPicks.partitionField}"\n`
      partition += insidePartitionFilter // empty if config is false
      partition += '  }\n'
    }
    let cluster = ''
    if (tableQuickPicks.clusterField) {
      cluster = `\n  clustering = [${tableQuickPicks.clusterField.toString()}]\n`
    }

    const schemaDeclaration = (bqtfConfig.get('tableSchemaDefinition') as string).replace('{{path}}', jsonRelativePath)
    let resourceDeclaration = '\n\n'
    resourceDeclaration += `resource "google_bigquery_table" "bq_table_${tableName}_v1" {\n`
    resourceDeclaration += '  deletion_protection = false\n'
    resourceDeclaration += `  project = ${commonQuickPicks.projectId}\n`
    resourceDeclaration += `  dataset_id = ${commonQuickPicks.datasetId}\n`
    resourceDeclaration += `  table_id = "${tableName}"\n`
    resourceDeclaration += '  description = ""\n'
    resourceDeclaration += partition
    resourceDeclaration += outsidePartitionFilter
    resourceDeclaration += cluster
    resourceDeclaration += `\n  schema = ${schemaDeclaration} \n`
    resourceDeclaration += '}'

    console.log(resourceDeclaration)

    await this.appendResource(targetPath, resourceDeclaration)
  }

  private async handleCommonQuickPicks (): Promise<CommonQuickPicks | undefined > {
    const bqtfConfig = vscode.workspace.getConfiguration('bqtf')
    const autoDataset: boolean | undefined = bqtfConfig.get('autoDataset')
    const QuickPickItemObj = await this.buildDatasetQuickPickItems()
    const resourcesQuickPick: vscode.QuickPickItem[] = QuickPickItemObj.QuickPick
    const datasetCount = QuickPickItemObj.datasetCount
    const lastDataset = QuickPickItemObj.lastDataset

    let datasetId = ''
    let choseDataset = false
    let projectId = ''

    if (autoDataset && datasetCount === 1 && lastDataset !== '') {
      datasetId = `${lastDataset}.dataset_id`
      projectId = `${lastDataset}.project`
    } else {
      const datasetPick = await vscode.window.showQuickPick(resourcesQuickPick, { title: 'Choose Dataset id' })
      if (!datasetPick) { return }
      if (datasetPick.label === 'Input Dataset name manually...') {
        const inputDataset = await vscode.window.showInputBox({ title: 'Input your Dataset name' })
        if (inputDataset && inputDataset !== '') {
          datasetId = `"${inputDataset}"`
        } else {
          return
        }
      } else {
        choseDataset = true
        datasetId = datasetPick.label
      }

      const localsQuickPick = await this.buildLocalsQuickPickItems(choseDataset, datasetId)

      const project = await vscode.window.showQuickPick(localsQuickPick, { title: 'Choose Project' })
      if (!project) { return }
      if (project.label === 'Input Project name manually...') {
        const inputProject = await vscode.window.showInputBox({ title: 'Input your Dataset id' })
        if (inputProject && inputProject !== '') {
          projectId = `"${inputProject}"`
        } else {
          return undefined
        }
      } else {
        projectId = project.label
      }
    }
    return { projectId, datasetId }
  }

  private async tableQuickPicks (): Promise<TableQuickPicks | undefined> {
    const jsonData = vscode.window.activeTextEditor?.document.getText()
    if (!jsonData) { return }
    const partitionQuickPick: vscode.QuickPickItem[] = []
    const json = JSON.parse(jsonData)
    for (const element of json) {
      if (['DATETIME', 'DATE', 'TIMESTAMP'].includes(element.type.toUpperCase())) {
        partitionQuickPick.push({ label: element.name, description: element.type })
      }
    }
    let partition: string | undefined
    if (partitionQuickPick.length > 0) {
      partitionQuickPick.unshift({ label: 'None' })
      const partitionPick = await vscode.window.showQuickPick(partitionQuickPick, { title: 'Select Time Partition Field' })
      if (!partitionPick) { return }
      if (partitionPick?.label !== 'None') {
        partition = partitionPick.label
      }
    }

    const clusterQuickPick: vscode.QuickPickItem[] = []
    for (const element of json) {
      if (['DATE', 'BOOLEAN', 'GEOGRAPHY', 'INTEGER', 'NUMERIC', 'BIGNUMERIC', 'STRING', 'TIMESTAMP'].includes(element.type.toUpperCase())) {
        clusterQuickPick.push({ label: element.name, description: element.type })
      }
    }
    if (clusterQuickPick.length > 0) {
      clusterQuickPick.unshift({ label: 'None' })
    }
    const clusterPick = await vscode.window.showQuickPick(clusterQuickPick, { title: 'Select cluster field', canPickMany: true })
    if (!clusterPick) { return }
    let cluster: string[] | undefined = []
    for (const pick of clusterPick) {
      if (pick.label === 'None') {
        cluster = undefined
        break
      } else {
        cluster?.push(`"${pick.label}"`)
      }
    }
    return { partitionField: partition, clusterField: cluster }
  }

  private async appendResource (targetPath: string, resourceDeclaration: string): Promise<void> {
    // The "scheme untitled" allows the creation of the file if it does not exists
    let file = vscode.Uri.parse((targetPath[0] === '/' ? '' : 'file:///') + targetPath)
    if (!fs.existsSync(targetPath)) {
      file = file.with({ scheme: 'untitled' })
    }
    void vscode.workspace.openTextDocument(file).then((doc: vscode.TextDocument) => {
      void vscode.window.showTextDocument(doc, 1, false).then(textEditor => {
        const lastLineText = doc.lineAt(new vscode.Position(doc.lineCount - 1, 0))
        const lastLineLength = lastLineText.text.length
        const endPosition = new vscode.Position(doc.lineCount - 1, lastLineLength)
        void textEditor.edit(editBuilder => {
          editBuilder.insert(endPosition, resourceDeclaration)
        })
      })
    })
  }

  private async buildLocalsQuickPickItems (choseDataset: boolean, datasetId: string): Promise<vscode.QuickPickItem[]> {
    const localsList: LocalArray = await vscode.commands.executeCommand('bigqueryhelper.ressources.getLocalsList')
    const localsQuickPick: vscode.QuickPickItem[] = [{ label: 'Input Project name manually...' }] // not really a const: reassigned after
    if (choseDataset) {
      localsQuickPick.push({ label: datasetId.replace('.dataset_id', '.project') })
    }
    for (const local in localsList) {
      localsQuickPick.push({ label: 'local.' + local, description: localsList[local].eval })
    }
    return localsQuickPick
  }

  private async buildDatasetQuickPickItems (): Promise<{ QuickPick: vscode.QuickPickItem[], datasetCount: number, lastDataset: string }> {
    const resourcesList: ResourceArray = await vscode.commands.executeCommand('bigqueryhelper.ressources.getResourcesList')
    const resourcesQuickPick: vscode.QuickPickItem[] = [{ label: 'Input Dataset name manually...' }]
    let datasetCount = 0
    let lastDataset = ''
    for (const resourceId in resourcesList) {
      const currentResource = resourcesList[resourceId]
      if (currentResource.type === 'google_bigquery_dataset') {
        resourcesQuickPick.push({ label: `${currentResource.type}.${currentResource.name}.dataset_id` })
        datasetCount++
        lastDataset = `${currentResource.type}.${currentResource.name}`
      }
    }
    return { QuickPick: resourcesQuickPick, datasetCount, lastDataset }
  }

  private async retrieveUsefulPaths (): Promise<UsefulPaths | undefined> {
    const filepath = vscode.window.activeTextEditor?.document.uri
    if (!filepath) {
      void vscode.window.showErrorMessage('Error: could not retrieve the file path')
      return
    }
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath
    if (!workspacePath) {
      void vscode.window.showErrorMessage('Error: you must use a workspace')
      return
    }

    const filename = filepath.path.split('/').slice(-1)[0]
    // I tried to use early returns to make the code more concise and easier to read
    // Early returns is the concept of calling the functions directly inside the return call
    return {
      activeEditorPath: filepath,
      terraformRootPath: path.join(workspacePath, await vscode.commands.executeCommand('bigqueryhelper.ressources.getTerraformBasePath')),
      filename
    }
  }
}
