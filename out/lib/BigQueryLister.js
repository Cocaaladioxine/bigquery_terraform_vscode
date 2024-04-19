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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigQueryLister = void 0;
const vscode = __importStar(require("vscode"));
const bqInterface_1 = require("./bqInterface");
const path = __importStar(require("path"));
// Base code is from https://code.visualstudio.com/api/extension-guides/tree-view
// I'll use it as a scaffold for building my tree view item
class BigQueryLister {
    constructor() {
        // Si on fonctionne avec le code commenté en dessous,
        // et que project est pas déclaré en "promise",
        // getChildren est appelé avant que project soit "rempli"
        // On est "obligé" de rester en mode promise
        this.project = this.getProjectElements();
    }
    // Retourne un element donné de l'arbre -> c'est rigolo ca renvoie systématiquement l'élément courant
    getTreeItem(element) {
        return element;
    }
    // Retourne le fils d'un element, ou de la racine si pas d'élement
    getChildren(element) {
        return Promise.resolve(this.project); //= > Je devrais le faire dans le constructeur nan ?
    }
    async getProjectElements() {
        const bqItf = new bqInterface_1.BqInterface();
        const projects = await bqItf.getProjects();
        const projectList = [];
        for (const element of projects) {
            projectList.push(new ProjectElement(element[1], element[0], vscode.TreeItemCollapsibleState.None, 'Project'));
        }
        return projectList;
    }
    ;
}
exports.BigQueryLister = BigQueryLister;
class ProjectElement extends vscode.TreeItem {
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