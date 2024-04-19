"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigQueryLister = void 0;
const vscode = require("vscode");
const bqInterface_1 = require("./lib/bqInterface");
const path = require("path");
//Base code is from https://code.visualstudio.com/api/extension-guides/tree-view 
// I'll use it as a scaffold for building my tree view item
class BigQueryLister {
    constructor() {
        //Si on fonctionne avec le code commenté en dessous,
        //et que project est pas déclaré en "promise", 
        //getChildren est appelé avant que project soit "rempli"
        // On est "obligé" de rester en mode promise
        this.project = this.getProjectElements();
    }
    //Retourne un element donné de l'arbre -> c'est rigolo ca renvoie systématiquement l'élément courant
    getTreeItem(element) {
        return element;
    }
    // Retourne le fils d'un element, ou de la racine si pas d'élement
    getChildren(element) {
        return Promise.resolve(this.project); //=> Je devrais le faire dans le constructeur nan ?
    }
    async getProjectElements() {
        let bqItf = new bqInterface_1.bqInterface();
        const projects = await bqItf.getProjects();
        let projectList = [];
        for (const element of projects) {
            projectList.push(new projectElement(element[1], element[0], vscode.TreeItemCollapsibleState.None, 'Project'));
        }
        return projectList;
    }
    ;
}
exports.BigQueryLister = BigQueryLister;
class projectElement extends vscode.TreeItem {
    constructor(projectFriendlyName, projectId, collapsibleState, level) {
        super(projectFriendlyName, collapsibleState);
        this.projectFriendlyName = projectFriendlyName;
        this.projectId = projectId;
        this.collapsibleState = collapsibleState;
        this.level = level;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
        this.tooltip = `${this.projectFriendlyName}`;
        this.description = this.projectFriendlyName;
    }
}
//# sourceMappingURL=BigQueryLister.js.map