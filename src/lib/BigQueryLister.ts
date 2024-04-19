import * as vscode from 'vscode'
import { BqInterface } from './bqInterface'
import * as path from 'path'

// Base code is from https://code.visualstudio.com/api/extension-guides/tree-view
// I'll use it as a scaffold for building my tree view item

export class BigQueryLister implements vscode.TreeDataProvider<ProjectElement> {
  project: Promise<ProjectElement[]>

  constructor () {
    // Si on fonctionne avec le code commenté en dessous,
    // et que project est pas déclaré en "promise",
    // getChildren est appelé avant que project soit "rempli"
    // On est "obligé" de rester en mode promise
    this.project = this.getProjectElements()
  }

  // Retourne un element donné de l'arbre -> c'est rigolo ca renvoie systématiquement l'élément courant
  getTreeItem (element: ProjectElement): vscode.TreeItem {
    return element
  }

  // Retourne le fils d'un element, ou de la racine si pas d'élement
  getChildren (element?: ProjectElement): Thenable<ProjectElement[]> {
    return Promise.resolve(this.project) //= > Je devrais le faire dans le constructeur nan ?
  }

  private async getProjectElements (): Promise<ProjectElement[]> {
    const bqItf = new BqInterface()
    const projects = await bqItf.getProjects()
    const projectList: ProjectElement[] = []
    for (const element of projects) {
      projectList.push(new ProjectElement(element[1], element[0], vscode.TreeItemCollapsibleState.None, 'Project'))
    }
    return projectList
  };
}

class ProjectElement extends vscode.TreeItem {
  constructor (
    public readonly projectFriendlyName: string,
    public projectId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public level: string
  ) {
    super(projectFriendlyName, collapsibleState)
    this.tooltip = `${this.projectFriendlyName}`
    this.description = this.projectFriendlyName
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  }
}
