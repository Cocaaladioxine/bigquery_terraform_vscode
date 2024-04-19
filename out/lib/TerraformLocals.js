"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terraformLocalsTree = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class terraformLocalsTree {
    constructor() {
        //Si on fonctionne avec le code commenté en dessous,
        //et que project est pas déclaré en "promise", 
        //getChildren est appelé avant que project soit "rempli"
        // On est "obligé" de rester en mode promise
        this.project = this.getLocals();
    }
    //Retourne un element donné de l'arbre -> c'est rigolo ca renvoie systématiquement l'élément courant
    getTreeItem(element) {
        return element;
    }
    // Retourne le fils d'un element, ou de la racine si pas d'élement
    getChildren(element) {
        return Promise.resolve(this.project); //=> Je devrais le faire dans le constructeur nan ?
    }
    async getLocals() {
        var HCL = require("js-hcl-parser");
        let localPromise = [];
        // '**/*.tf' testé : cherche bien dans tous les sous niveaux de dossier (racine + descendants) 
        let uris = await vscode.workspace.findFiles('**/*.tf');
        //let wholeFile = '';  //won't do a full file. I need the paths :) 
        let allLocals;
        for (let uri of uris) {
            let matchedLocals;
            let localsList = '';
            let localsArray = [];
            //console.log(uri);
            matchedLocals = fs.readFileSync(uri.fsPath, 'utf8').match(/(locals[ ]*\{[^]+?[ \n\r]+\})+/mg);
            if (matchedLocals !== null) {
                for (let local of matchedLocals) {
                    localsList += "\n" + local;
                }
                localsList = localsList.replace(/\/\*[^]*?\*\//mg, ''); // Retire les groupes commentés par /* */
                localsList.replace(/\/\/[^\n]*/, ''); // Retire les lignes commentées par // 
                localsList = localsList.replace(/(\w*\s*)=\s*(\w+[.](?:\w*[.])*\w+)/mg, "\$1 = \"${\$2}\"");
            }
            if (localsList == '') {
                continue;
            }
            localsArray = JSON.parse(HCL.parse(localsList))['locals'];
            for (let key in localsArray) {
                for (let localName in localsArray[key]) {
                    console.log(localName + ' = ' + localsArray[key][localName]);
                    let object = new tfObject(localName, localsArray[key][localName], 'Local', 1, uri.fsPath);
                    localPromise.push(object);
                }
            }
        }
        //console.log(allLocals);
        //  console.log(localsList)
        // console.log(HCL.parse(localsList));
        //hcl.parse can't handle locals or other variable... Bitch please ! 
        //console.log(HCL.parse(wholeFile));
        //Just to make it work while coding//
        //  let local : tfObject[] = [];
        //   local.push( new tfObject('test', 'test', 'Project',0, 'path', 4, vscode.TreeItemCollapsibleState.None));
        return localPromise;
        /*  let bqItf = new bqInterface();
        const projects = await bqItf.getProjects();
        let projectList : projectElement[] = [];
        for(const element of projects) {
          projectList.push(new projectElement(element[1], element[0], vscode.TreeItemCollapsibleState.None, 'Project' ));
        }
        return projectList;
          
        };
    
    */
    }
}
exports.terraformLocalsTree = terraformLocalsTree;
class tfObject extends vscode.TreeItem {
    constructor(objectName, // The name 
    variable, // The variable definition for a local, nothing for a ressource ?
    type, // local or ressource
    level, // for local, the depth of the calculation ?
    file, // in which file it was found
    line, // on which line it's located
    collapsibleState) {
        super(objectName, collapsibleState);
        this.objectName = objectName;
        this.variable = variable;
        this.type = type;
        this.level = level;
        this.file = file;
        this.line = line;
        this.collapsibleState = collapsibleState;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
        this.tooltip = `${this.variable}`;
        this.description = this.variable;
    }
}
//# sourceMappingURL=terraformLocals.js.map