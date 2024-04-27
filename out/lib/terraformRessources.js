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
exports.TerraformResources = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
const hcl2 = __importStar(require("hcl2-json-parser"));
class TerraformResources {
    constructor(context, activeEditor) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.projectObjects = this.getAllObjects();
        this.context = context;
        this.activeEditor = activeEditor;
    }
    refreshState() {
        this.projectObjects = this.getAllObjects();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    // Retourne le fils d'un element, ou de la racine si pas d'élement
    getChildren(element) {
        if (element === undefined) {
            return Promise.resolve(this.projectObjects);
        }
        else {
            const children = element.getChildren();
            if (children) {
                return Promise.resolve(children);
            }
            else {
                return Promise.resolve([]);
            }
        }
    }
    /**
     * getAllObjects
     * @returns a tfObject[] promise
     *
     */
    async getAllObjects() {
        const tfBase = await Promise.resolve(this.evalTerraformBaseDirectory());
        const myPromise = await Promise.all([this.getlocals(), this.getResources()]);
        // Sort the array
        return (await Promise.resolve(myPromise[0].concat(myPromise[1]).concat(tfBase).sort((a, b) => {
            if (a.label === undefined) {
                return 1;
            }
            if (b.label === undefined) {
                return -1;
            }
            return a.label.toString().localeCompare(b.label.toString());
        })));
    }
    /**
     * getTerraformBaseDirectory
     * @returns a tfObject[] promise
     * This function returns the terraform base directory.
     * It first look for main.tf and versions.tf files in the current workspace,
     * then for any tf file if no main.tf or versions.tf are found.
     */
    async evalTerraformBaseDirectory() {
        let tfRoot = '';
        let tfRootDepth = 100;
        for (const uri of await vscode.workspace.findFiles('**/{main,versions}.tf')) {
            const uriPath = vscode.workspace.asRelativePath(path.dirname(uri.fsPath));
            if (uriPath !== tfRoot && (tfRoot.match(/[/||\\]/g) ?? []).length < tfRootDepth) {
                tfRoot = uriPath;
                tfRootDepth = (tfRoot.match(/[/||\\]/g) ?? []).length;
            }
        }
        // Si pas de main.tf, on regarde tous les fichiers .tf et on prend le path le plus "court"
        if (tfRoot === '') {
            for (const uri of await vscode.workspace.findFiles('**/*.tf')) {
                const uriPath = vscode.workspace.asRelativePath(path.dirname(uri.fsPath));
                if (uriPath !== tfRoot && (tfRoot.match(/[/||\\]/g) ?? []).length < tfRootDepth) {
                    tfRoot = uriPath;
                    tfRootDepth = (tfRoot.match(/[/||\\]/g) ?? []).length;
                }
            }
        }
        if (!tfRoot.endsWith('/')) {
            tfRoot = tfRoot + '/';
        }
        this.terraformPath = tfRoot;
        const terraformPath = [new TfObject(tfRoot, 'Path', vscode.TreeItemCollapsibleState.None, undefined, undefined, undefined)];
        return [new TfObject('TerraformRoot', 'Root', vscode.TreeItemCollapsibleState.Collapsed, terraformPath, undefined, undefined)];
    }
    /** Build a tfObject array and populates 'this.projectLocals' which is an dictionnary.
     * The dictionnary is there for other coding uses
     * @returns a tfObject Array Promise that will be used to show the Locals in the terraform TreeView,
     */
    async getlocals() {
        const matchRecursive = require('./match-recursive-improved.js'); // eslint-disable-line @typescript-eslint/no-var-requires
        const localObjects = [];
        const allLocals = {}; // all_locals est un dictionnaire qui contient tous les locals de tous les fichiers
        for (const uri of await vscode.workspace.findFiles(this.terraformPath + '*.tf')) {
            let localsList = '';
            const localsFile = this.stripComments(fs.readFileSync(uri.fsPath, 'utf8')).trim();
            const definition = matchRecursive(localsFile, 'locals', '{...}');
            if (!definition || definition.length === 0) {
                continue;
            }
            // Replace some tricky stuff:
            // 1. Enclose variables and locals : 'gcp_project_id = local.dtm_name' by 'gcp_project_id = "${local.dtm_name}'"" => To use the same syntax everywhere
            // Functions and conditional syntaxes are automatically enclosed in ${ } by the parser
            definition.forEach(locals => {
                locals = locals.replace(/(?<!(?:\${))((?:terraform|local|var){1}.\w+)/mg, '"${\$1}"'); // eslint-disable-line no-useless-escape
                localsList += locals.trim() + '\n';
            });
            localsList = 'locals { \n' + localsList + '\n}\n';
            // Could do a try{} catch{}
            const hcl2Locals = await hcl2.parseToObject(localsList);
            // Show Message if error while parsing (result is null if error)
            if (hcl2Locals.locals[0] == null) {
                let currentUri = uri.fsPath;
                if (this.terraformPath && vscode.workspace.workspaceFolders) {
                    currentUri = path.relative(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, this.terraformPath), currentUri);
                }
                void vscode.window.showErrorMessage('Error parsing ' + currentUri); // Todo : show relative path
                continue;
            }
            for (const locals of hcl2Locals.locals) {
                for (const localName in locals) {
                    if (typeof (locals[localName]) === 'string' && locals[localName].trim().startsWith('${{')) {
                        // TODO : see if we could improve and handle at least objects with only variables inside
                        allLocals[localName] = { base: 'Object[]', eval: 'Object[]', path: uri, level: 1, type: 'object', evalcomplete: false };
                    }
                    else if (typeof (locals[localName]) === 'string' && this.isConditionalExpression(locals[localName])) {
                        allLocals[localName] = { base: locals[localName].toString(), eval: locals[localName].toString(), path: uri, level: 1, type: 'ConditionalExpression', evalcomplete: false };
                    }
                    else if (typeof (locals[localName]) === 'string' || typeof (locals[localName]) === 'number') {
                        allLocals[localName] = { base: locals[localName].toString(), eval: locals[localName].toString(), path: uri, level: 1, type: typeof (locals[localName]), evalcomplete: typeof (locals[localName]) === 'number' };
                    }
                    else {
                        // May be a boolean :)// TODO Handle Booleans
                        // Probablement inutile => c'est un simple "String"
                        console.log(typeof (locals[localName]));
                        // Set the values as the following string : Object[]. The content won't be analysed yet (maybe one day)
                        allLocals[localName] = { base: 'Object[]', eval: 'Object[]', path: uri, level: 1, type: 'object', evalcomplete: false };
                    }
                }
            }
        }
        // Evaluation des variables autant de fois que nécéssaire, mais max 15 fois
        const workspace = this.context.workspaceState.get('activeWorkspace');
        if (workspace !== undefined) {
            allLocals['terraform.workspace'] = { base: 'terraform.workspace', eval: workspace, path: undefined, level: 0, type: 'base', evalcomplete: true };
        }
        let toEval = true;
        let iteration = 0;
        this.maxLevel = 1;
        while (toEval) {
            toEval = false;
            iteration++;
            for (const localName in allLocals) {
                // si evalcomplete is true, next local !
                if (allLocals[localName].evalcomplete) {
                    continue;
                }
                // on tente de matcher local.xxx et terraform.xxx, on récupère 3 groupes : local.xxx, local, xxx
                const checkReplacement = allLocals[localName].eval.match(/\${((local|terraform).(\w+))}/);
                // on trouve une replacement à faire :
                if (checkReplacement !== null) {
                    let replaceString = '';
                    const searchString = '${' + checkReplacement[1] + '}';
                    let evalComplete = false;
                    if (checkReplacement[2] === 'terraform') {
                        replaceString = allLocals[checkReplacement[1]].eval;
                        evalComplete = true; // allow replacement
                    }
                    else {
                        if (allLocals[checkReplacement[3]] === undefined) {
                            continue;
                        } // missing stuff => you'll know it when running validate ^^
                        replaceString = allLocals[checkReplacement[3]].eval;
                        evalComplete = allLocals[checkReplacement[3]].evalcomplete; // allow replacement if eval complete on replacement value
                    }
                    if (!evalComplete) {
                        toEval = true;
                        continue;
                    } // Skip this replacement if eval is not complete
                    allLocals[localName].eval = allLocals[localName].eval.replace(searchString, replaceString);
                    allLocals[localName].level += 1;
                    if (allLocals[localName].level > this.maxLevel) {
                        this.maxLevel = allLocals[localName].level;
                    } // setting a maxLevel for value->variable replacement
                    toEval = true; // in order to use the newly evaluated variable
                }
                else if (checkReplacement == null && allLocals[localName].type === 'ConditionalExpression' && allLocals[localName].eval.includes('${')) { // Analyse only when all everything's replaced (checkReplacement == null)
                    allLocals[localName].eval = eval(allLocals[localName].eval.trim().substring(2, allLocals[localName].eval.trim().length - 1));
                    allLocals[localName].evalcomplete = true;
                    toEval = true; // in order to use the newly evaluated variable
                }
                else {
                    allLocals[localName].evalcomplete = true;
                }
                if (iteration > 15) {
                    toEval = false;
                } // protection mechanism => Allow only 10 full replacement cycles to prevent process hang
            }
        }
        // Transforme le dictionnaire en tableau d'objets
        for (const localName in allLocals) {
            if (localName === 'terraform.workspace') {
                continue;
            }
            const objectEval = new TfObject(allLocals[localName].eval, 'Eval', vscode.TreeItemCollapsibleState.None, undefined, allLocals[localName].path);
            const objectVariable = new TfObject(allLocals[localName].base, 'Variable', vscode.TreeItemCollapsibleState.Expanded, [objectEval], allLocals[localName].path);
            const object = new TfObject(localName, 'Local', vscode.TreeItemCollapsibleState.Collapsed, [objectVariable], allLocals[localName].path);
            localObjects.push(object);
        }
        const localRoot = new TfObject('Locals', 'Root', vscode.TreeItemCollapsibleState.Expanded, undefined, undefined, undefined);
        localRoot.addChildren(localObjects);
        this.projectLocals = allLocals;
        return [localRoot];
    }
    // Code base proposed by Bard
    // Permet d'identifier si on a une expression conditionnelle
    isConditionalExpression(expression) {
        // Trim the expression to be sure
        expression = expression.trim();
        // Check if the expression is surrounded by ${ }
        // bard error, missing )
        if (!expression.startsWith('${') || !expression.endsWith('}')) {
            return false;
        }
        // Check if the expression contains an operator of comparison
        // Bard wrong. We'll get the position
        const operators = ['==', '>=', '<=', '!=', '&&', '||'];
        let operatorPos = -1;
        for (const operator of operators) {
            const position = expression.indexOf(operator);
            if (position > 0) {
                operatorPos = position;
                break;
            }
        }
        if (operatorPos === -1) {
            return false;
        }
        // Check if the expression contains a ?
        // Bard not enough, check if it's after  comparison operator
        // -1 if not found
        operatorPos = expression.indexOf('?', operatorPos);
        if (operatorPos === -1) {
            return false;
        }
        // Check if the expression contains a :
        // Bard not enough, check if it's after ?
        // -1 if not found
        operatorPos = expression.indexOf(':', operatorPos);
        if (operatorPos === -1) {
            return false;
        }
        // If all the checks have passed, the expression is a conditional expression
        return true;
    }
    async getResources() {
        const resourcesDictionary = {};
        const uris = await vscode.workspace.findFiles(this.terraformPath + '*.tf');
        for (const uri of uris) {
            const rawFile = fs.readFileSync(uri.fsPath, 'utf8');
            const resourcesFile = this.stripComments(rawFile);
            // Could do a try{} catch{}
            // Need to repair this
            const terraformObjects = await hcl2.parseToObject(resourcesFile);
            if (!terraformObjects) {
                continue;
            }
            for (const objectType in terraformObjects) {
                if (objectType === 'resource') {
                    const resourceList = terraformObjects.resource; /* TODO FIX Object? */ // eslint-disable-line @typescript-eslint/ban-types
                    const analysedResources = this.resourceAnalysis(resourceList, uri, rawFile);
                    Object.assign(resourcesDictionary, analysedResources);
                }
                else if (objectType === 'terraform') {
                    console.log('found terraform resource');
                    // Won't use now TODO move here ???
                }
                else if (objectType === 'locals') {
                    console.log('found locals resource');
                    // Won't use now, may I move the current local process here ?
                }
                else if (objectType === 'provider') {
                    console.log('found a provider resource');
                    // Won't use now
                }
                else if (objectType === 'module') {
                    console.log('found a module resource');
                    // Won't use now
                }
                else {
                    console.log('unknown - found a ' + objectType + ' resource');
                }
            }
        }
        const resourceTypeDict = {};
        let idx = 0;
        const returnArray = [];
        // TODO : Est il possible de faire un truc plus simple ?
        for (const resourceId in resourcesDictionary) {
            const resource = resourcesDictionary[resourceId];
            const resourceType = resourcesDictionary[resourceId].type;
            // Ce if crée un nouveau type de ressource si il n'existe pas déjà
            if (!resourceTypeDict[resourceType]) {
                resourceTypeDict[resourceType] = { arrayIndex: idx };
                const anyRoot = new TfObject(resourceType, 'Root', vscode.TreeItemCollapsibleState.Collapsed, undefined, undefined, undefined);
                returnArray.push(anyRoot);
                idx++;
            }
            const object = new TfObject(resource.name, resource.subtype ?? resourceType, resource.subtype && resource.subtype === 'View' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, undefined, resource.uri, resource.strpos);
            if (resource.subtype && resource.subtype === 'View' && resource.variables) {
                for (const variable in resource.variables) {
                    const evalItem = new TfObject(resource.variables[variable].eval, 'Eval', vscode.TreeItemCollapsibleState.None, undefined, resource.uri);
                    const variableItem = new TfObject(variable, 'Variable', vscode.TreeItemCollapsibleState.Collapsed, [evalItem], resource.uri, resource.strpos);
                    object.addChild(variableItem);
                }
            }
            returnArray[resourceTypeDict[resourceType].arrayIndex].addChild(object);
        }
        this.projectResources = resourcesDictionary;
        return returnArray;
    }
    resourceAnalysis(resourceList, uri, rawFile) {
        const resourcesDictionary = {};
        let stringPos;
        for (const resourceType in resourceList) {
            const bqtableResources = resourceList[resourceType];
            for (const resourceName in bqtableResources) {
                let subtype;
                let templatefile;
                const vars = {};
                let schemaPath;
                let disabledFlag = false;
                let tableId;
                let tablePartition;
                let tableClusters;
                const resourceDeclaration = bqtableResources[resourceName][0];
                // common properties:  disabled_flag , resource position
                disabledFlag = !!(resourceDeclaration.count && resourceDeclaration.count === 0);
                stringPos = rawFile.indexOf(resourceName);
                if (resourceType === 'google_bigquery_table') {
                    subtype = 'Table'; // will be overriden by view if applicable
                    tableId = resourceDeclaration.table_id ? resourceDeclaration.table_id : undefined;
                    if (resourceDeclaration.schema) {
                        const matchSchema = resourceDeclaration.schema.match(/file\((.*?)\).*$/m);
                        if (matchSchema) {
                            schemaPath = matchSchema[1].trim().replaceAll('"', '');
                        }
                    }
                    // view properties
                    if (resourceDeclaration.view) {
                        subtype = 'View';
                        const view = resourceDeclaration.view[0].query;
                        const viewDef = view.match(/(?:(templatefile|file)\([ ]*\"([\w\/\.]*)\")+[\r\n ,]*(?:\{([\w \=\.\t\r\n]*)\})*[ ]*\)/m); // eslint-disable-line
                        templatefile = (viewDef?.[2]) ? viewDef[2] : undefined;
                        if (viewDef?.[3]) {
                            const viewVars = viewDef[3].matchAll(/([\w]*)[ ]*=[ ]*([\w]*\.[\w]*)/mg);
                            for (const viewVar of viewVars) {
                                vars[viewVar[1]] = { eval: viewVar[2] };
                            }
                        }
                    }
                    tableClusters = resourceDeclaration.clustering;
                    tablePartition = resourceDeclaration.time_partitioning ? resourceDeclaration.time_partitioning[0].field : undefined;
                }
                // ->file<-
                const resourceId = resourceType + '.' + resourceName;
                resourcesDictionary[resourceId] = { type: resourceType, name: resourceName, strpos: stringPos, subtype, templatefile, variables: vars, uri, schemaPath, disabledFlag, table_id: tableId, table_partition: tablePartition, table_clusters: tableClusters };
            }
        }
        return resourcesDictionary;
    }
    // Here come the commands :)
    registerCommands() {
        const bqHelperTerraformReplace = vscode.commands.registerCommand('bigqueryhelper.terraformReplace', () => {
            void this.terraformReplace('toValue');
        });
        this.context.subscriptions.push(bqHelperTerraformReplace);
        const bqHelperTerraformFormat = vscode.commands.registerCommand('bigqueryhelper.terraformFormat', () => {
            void this.terraformReplace('toVar');
        });
        this.context.subscriptions.push(bqHelperTerraformFormat);
        const bqHelperTerraformRefresh = vscode.commands.registerCommand('bigqueryhelper.terraformRefresh', () => {
            this.refreshState();
        });
        this.context.subscriptions.push(bqHelperTerraformRefresh);
        const bqHelperGenDrawIo = vscode.commands.registerCommand('bigqueryhelper.genDrawIo', (item) => {
            void this.genRelationalSchema(item, 'createTable', 'Table');
        });
        this.context.subscriptions.push(bqHelperGenDrawIo);
        const bqHelperGenPlantUml = vscode.commands.registerCommand('bigqueryhelper.genPlantUml', (item) => {
            void this.genRelationalSchema(item, 'plantUml', 'Table');
        });
        this.context.subscriptions.push(bqHelperGenPlantUml);
        const bqHelperGenPlantUmlWViews = vscode.commands.registerCommand('bigqueryhelper.genPlantUmlWViews', (item) => {
            void this.genRelationalSchema(item, 'plantUml', 'All');
        });
        this.context.subscriptions.push(bqHelperGenPlantUmlWViews);
        const sqlTFReplaced = 'bigqueryhelper.sqlTFReplace';
        const sqlTFReplacedHandler = (sqlText, filename) => {
            const workspace = this.context.workspaceState.get('activeWorkspace');
            let query = '';
            if (workspace) {
                query = this.replaceLocals(sqlText, filename, workspace, 'sql', 'toValue');
            }
            return query;
        };
        this.context.subscriptions.push(vscode.commands.registerCommand(sqlTFReplaced, sqlTFReplacedHandler));
        const retrieveTFPath = vscode.commands.registerCommand('bigqueryhelper.ressources.getTerraformBasePath', () => { return this.getTerraformBasePath(); });
        this.context.subscriptions.push(retrieveTFPath);
        const getLocalsList = vscode.commands.registerCommand('bigqueryhelper.ressources.getLocalsList', () => { return this.getLocalsList(); });
        this.context.subscriptions.push(getLocalsList);
        const getResourcesList = vscode.commands.registerCommand('bigqueryhelper.ressources.getResourcesList', () => { return this.getResourcesList(); });
        this.context.subscriptions.push(getResourcesList);
        const goToResource = 'bigqueryhelper.goToResource';
        this.context.subscriptions.push(vscode.commands.registerCommand(goToResource, this.gotoResource));
        const moveSqlToFile = vscode.commands.registerCommand('bigqueryhelper.moveSqlToFile', (item) => {
            void this.prepareMoveViewSchema('SQL');
        });
        this.context.subscriptions.push(moveSqlToFile);
        const moveSchemaToFile = vscode.commands.registerCommand('bigqueryhelper.moveSchemaToFile', (item) => {
            void this.prepareMoveViewSchema('SCHEMA');
        });
        this.context.subscriptions.push(moveSchemaToFile);
    }
    buildOrderedLocalsArray(localsList) {
        // on pourrait retourner le tableau non ordonné ?
        const returnArray = [];
        if (!this.maxLevel) {
            for (const localName in localsList) {
                const local = localsList[localName];
                returnArray.push({ value: local.eval, variable: localName });
            }
            return returnArray;
        }
        let currentLevel = this.maxLevel;
        while (currentLevel > 0) {
            for (const localName in localsList) {
                const local = localsList[localName];
                if (local.level === currentLevel) {
                    returnArray.push({ value: local.eval, variable: localName });
                }
            }
            currentLevel = currentLevel - 1;
        }
        return returnArray;
    }
    /** * terraformReplace()
     *  replaces the ${...} terraform variables/locals with their eval value,
     *  based on the selected terraform workspace
     */
    async terraformReplace(direction) {
        const document = vscode.window.activeTextEditor?.document;
        const selectionRange = vscode.window.activeTextEditor?.selection;
        const workspace = this.context.workspaceState.get('activeWorkspace');
        if (document && workspace !== undefined) {
            const textRange = new vscode.Range(0, 0, document.lineCount - 1, document.lineAt(document.lineCount - 1).range.end.character);
            const language = document.languageId;
            const fileName = document.fileName.replaceAll('\\', '/');
            let extension = '';
            if (fileName !== undefined && fileName.lastIndexOf('.') > -1) {
                extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
            }
            let fileContent = document.getText();
            if (fileContent !== undefined) {
                // Traitement pour les fichiers en mode template_file, sql.
                if ((extension !== undefined && extension === 'sql') || (language !== undefined && language.substring(0, 3) === 'sql')) {
                    fileContent = this.replaceLocals(fileContent, fileName, workspace, 'sql', direction);
                    void this.applyLocalsReplacement(fileContent, textRange);
                }
                // Traitement des fichiers tf
                const textRangeArray = [];
                // 1) Traitement des selections
                if (extension !== undefined && extension === 'tf') {
                    // Préparation de la selection
                    if (selectionRange && !selectionRange.start.isEqual(selectionRange.end)) {
                        textRangeArray.push({ range: selectionRange, text: document.getText(selectionRange) });
                    }
                    else {
                        // Traitement des query = <<XXX    [.....            ${local.var}                   ...]   XXX
                        let matched = fileContent.matchAll(/view[ ]*{[^}]*?query[ ]*=[ ]*<<([A-Z]+)[\r\n]{1}/mg);
                        for (const match of matched) {
                            if (match.index) {
                                // look for ending text starting at match
                                const end = match.index + fileContent.substring(match.index).search(new RegExp(`^[ \t]*${match[1]}[ ]*$`, 'm'));
                                const textRange = new vscode.Range(document.positionAt(match.index), document.positionAt(end));
                                textRangeArray.push({ range: textRange, text: document.getText(textRange) });
                            }
                        }
                        // Traitement des    query = "Select    [.....            ${local.var}                   ...] "
                        matched = fileContent.matchAll(/view[ ]*{[ \r\n]*[^}]*query[ ]*=[ ]*"([^]*?)"[ ]*[\r\n]/mg);
                        for (const match of matched) {
                            if (match.index) {
                                // end is the start of next line
                                const start = document.positionAt(match.index);
                                const stringEnd = document.positionAt(match.index + match[0].length);
                                const end = new vscode.Position(stringEnd.line + 1, 0);
                                const textRange = new vscode.Range(start, end);
                                textRangeArray.push({ range: textRange, text: document.getText(textRange) });
                            }
                        }
                    }
                    for (const textRange of textRangeArray) {
                        if (!textRange) {
                            continue;
                        }
                        const newQuery = this.replaceLocals(textRange.text, fileName, workspace, 'tf', direction);
                        await this.applyLocalsReplacement(newQuery, textRange.range);
                    }
                }
            }
        }
    }
    getReplacements(type, direction, filename) {
        const replacementArray = [];
        const terraformWorkspace = this.context.workspaceState.get('activeWorkspace');
        const terraformWorkspacesList = this.context.workspaceState.get('workspaceList');
        if (type === 'sql' && direction === 'toVar' && filename && terraformWorkspace && terraformWorkspacesList) {
            for (const resourceId in this.projectResources) {
                const resource = this.projectResources[resourceId];
                if (resource.subtype === 'View' && resource.templatefile && filename.toLowerCase().endsWith(resource.templatefile.toLowerCase()) && resource.variables) {
                    for (const variable in resource.variables) {
                        const baseValue = this.projectLocals?.[resource.variables[variable].eval.replace('local.', '')].eval;
                        if (baseValue && baseValue.includes('${terraform.workspace}')) {
                            for (const item in terraformWorkspacesList) { /* TODO See if we can fix this eslint error  */ // eslint-disable-line 
                                const value = baseValue.replace('${terraform.workspace}', terraformWorkspacesList[item]);
                                replacementArray.push({ string: value, replacement: '${' + variable + '}' });
                            }
                        }
                        else {
                            if (baseValue) {
                                replacementArray.push({ string: baseValue, replacement: '${' + variable + '}' });
                            }
                        }
                    }
                }
            }
        }
        if (type === 'sql' && direction === 'toValue' && filename && terraformWorkspace) {
            for (const resourceId in this.projectResources) {
                const resource = this.projectResources[resourceId];
                if (resource.subtype === 'View' && resource.templatefile && filename.toLowerCase().endsWith(resource.templatefile.toLowerCase()) && resource.variables) {
                    for (const variable in resource.variables) {
                        let value;
                        if (resource.variables[variable].eval === 'terraform.workspace') {
                            value = terraformWorkspace;
                        }
                        else {
                            value = this.projectLocals?.[resource.variables[variable].eval.replace('local.', '')].eval.replace('${terraform.workspace}', terraformWorkspace);
                        }
                        if (value) {
                            replacementArray.push({ string: '${' + variable + '}', replacement: value });
                        }
                    }
                }
            }
        }
        if (type === 'tf' && direction === 'toValue' && terraformWorkspace) {
            for (const localName in this.projectLocals) {
                const local = this.projectLocals[localName];
                const variable = '${local.' + localName + '}';
                const value = local.eval.replaceAll('${terraform.workspace}', terraformWorkspace);
                if (value) {
                    replacementArray.push({ string: variable, replacement: value });
                }
                ;
            }
            replacementArray.push({ string: '${terraform.workspace}', replacement: terraformWorkspace });
        }
        // TO DO dans to Var : récupérer le "level" le plus élevé et l'utiliser en premier.
        // il faudrait donc créer un tableau dans le bon ordre!
        if (type === 'tf' && direction === 'toVar' && terraformWorkspace && terraformWorkspacesList) {
            if (this.projectLocals) {
                const localsArray = this.buildOrderedLocalsArray(this.projectLocals);
                for (const local of localsArray) {
                    const variable = '${local.' + local.variable + '}';
                    if (local.value.includes('${terraform.workspace}')) {
                        for (const item in terraformWorkspacesList) { /* TODO See if we can fix this es-lint error */ // eslint-disable-line @typescript-eslint/no-for-in-array
                            const value = local.value.replaceAll('${terraform.workspace}', terraformWorkspacesList[item]);
                            if (value) {
                                replacementArray.push({ string: value, replacement: variable });
                            }
                            ;
                        }
                    }
                    else {
                        replacementArray.push({ string: local.value, replacement: variable });
                    }
                }
            }
        }
        return replacementArray;
    }
    replaceLocals(text, fileName, workspace, type, direction) {
        const replacements = this.getReplacements(type, direction, fileName.replaceAll('\\', '/'));
        for (const replacement of replacements) {
            text = text.replaceAll(replacement.string, replacement.replacement);
        }
        return text;
    }
    async applyLocalsReplacement(replacement, range) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await vscode.window.activeTextEditor?.edit(editBuilder => {
                editBuilder.replace(range, replacement);
            });
        }
    }
    stripComments(baseString) {
        baseString = baseString.replace(/\/\*[^]*?\*\//mg, '\n'); // Retire les groupes commentés par /* */
        baseString = baseString.replace(/(?<!https:|http:)\/\/[^\n]*/m, '\n'); // Retire les lignes commentées par // en ignorant les http:/https:
        baseString = baseString.replace(/#[^\n]*/m, '\n');
        return baseString;
    }
    gotoResource(item) {
        if (item.uri) {
            void vscode.commands.executeCommand('vscode.open', item.uri).then((any) => {
                if (vscode.window.activeTextEditor && item.strpos) {
                    const textEditor = vscode.window.activeTextEditor;
                    const startPosition = textEditor.document.positionAt(item.strpos);
                    const endPosition = new vscode.Position(startPosition.line, textEditor.document.lineAt(startPosition.line).text.length);
                    // let goToRange = new vscode.Range(startPosition, endPosition);
                    textEditor.selection = new vscode.Selection(startPosition, endPosition);
                    textEditor.revealRange(new vscode.Range(startPosition, endPosition), vscode.TextEditorRevealType.AtTop);
                }
                ;
            });
        }
    }
    async getSchema(schemaPath) {
        const fs = vscode.workspace.fs;
        let schema;
        try {
            await fs.stat(schemaPath);
            schema = JSON.parse(new util_1.TextDecoder().decode(await fs.readFile(schemaPath)));
            return schema;
        }
        catch (e) {
            return null; // create
        }
    }
    /* TODO :
  Creer ceci :
  !$data={
          "user":
                {"partition_cols": ["col1"],
                 "clustering_cols" : ["col3","col2"]
                },
          "city":
                {"partition_cols": ["col2"],
                 "clustering_cols" : ["col4","col5"]
                }
         }
  }
  
  */
    // TODO : Deduplicate code. On peut créer un "faux" array de ressources, qui les contient toutes (sauf disabled) pour le full et uniquement la ressource demandée pour le partiel.
    async genRelationalSchema(item, type, scope) {
        let createTable = '';
        let plantUml = '';
        let links = '';
        const plantUmlDataArray = {};
        const bqtfConfig = vscode.workspace.getConfiguration('bqtf');
        const plantUmlconfig = bqtfConfig.get('plantUmlConfig');
        // var plantUmlconfig = '!procedure part($table)\n      !partition_cols_size=%size($data[$table].partition_cols)\n      !$partition_cols=$data[$table].partition_cols[0]\n      !loop_idx=1\n      !while (loop_idx != partition_cols_size)\n         !$partition_cols=$partition_cols + "," + $data[$table].partition_cols[loop_idx]\n         !loop_idx=loop_idx+1\n      !endwhile\n      <b><color:#3944bc><&layers></color> $partition_cols</b>\n    !endprocedure\n    \n    !procedure cluster($table)\n      !clustering_cols_size=%size($data[$table].clustering_cols)\n      !$clustering_cols=$data[$table].clustering_cols[0]\n      !loop_idx=1\n      !while (loop_idx != clustering_cols_size)\n         !$clustering_cols=$clustering_cols + "," + $data[$table].clustering_cols[loop_idx]\n         !loop_idx=loop_idx+1\n      !endwhile\n      <b><color:#3944bc><&menu></color> $clustering_cols</b>\n    !endprocedure\n    !define primary_key(x) <b><color:#b8861b><&key></color> x</b>\n    !define foreign_key(x) <color:#aaaaaa><&key></color> x\n    !define column(x) <color:#efefef><&media-record></color> x\n    !define table(x) entity x << (T, white) >>\n    \n    entity table << (T, white) >> {\n      <b><color:#3944bc><&layers></color> </b><size:10><&arrow-right> //Partitioning column-s//</size> \n      <b><color:#3944bc><&menu></color> </b><size:10><&arrow-right> //Clustering column-s//</size> \n      ---\n      <b><color:#b8861b><&key></color> </b><size:10><&arrow-right> //Primary Key-s//</size> \n      <b><color:#aaaaaa><&key></color> </b><size:10><&arrow-right> //Foreign Key-s//</size> \n    }';
        const ressourceToHandle = {};
        if (item.objectName === 'google_bigquery_table') {
            for (const resourceId in this.projectResources) {
                const resourceObject = this.projectResources[resourceId];
                if ((resourceObject.subtype === 'Table' || scope === 'All') && resourceObject.schemaPath && !resourceObject.disabledFlag) {
                    ressourceToHandle[resourceId] = resourceObject;
                }
            }
        }
        if ((item.type === 'Table' || (item.type === 'View' && scope === 'All')) && this.projectResources) {
            ressourceToHandle[item.objectName] = this.projectResources[item.objectName];
        }
        for (const resource in ressourceToHandle) {
            const resourceObject = ressourceToHandle[resource];
            if (resourceObject.schemaPath && !resourceObject.disabledFlag) {
                const schemaPath = this.getSchemaPath(resourceObject.schemaPath);
                const tableName = resourceObject.table_id;
                if (schemaPath && tableName) {
                    const schema = await this.getSchema(schemaPath);
                    let partitionFlag = false;
                    let clusteringFlag = false;
                    if (resourceObject.table_partition) {
                        if (plantUmlDataArray[tableName] === undefined) {
                            plantUmlDataArray[tableName] = {};
                        }
                        plantUmlDataArray[tableName].partition_cols = [resourceObject.table_partition];
                        partitionFlag = true;
                    }
                    if (resourceObject.table_clusters) {
                        if (plantUmlDataArray[tableName] === undefined) {
                            plantUmlDataArray[tableName] = {};
                        }
                        plantUmlDataArray[tableName].clustering_cols = resourceObject.table_clusters;
                        clusteringFlag = true;
                    }
                    if (schema) {
                        createTable += '\r\n\r\n' + await this.genCreateTable(schema, tableName);
                        const subtype = resourceObject.subtype ? resourceObject.subtype : 'Table';
                        const plantUmlResponse = await this.genPlantUml(schema, tableName, subtype, partitionFlag, clusteringFlag);
                        plantUml += '\r\n\r\n' + plantUmlResponse.plantUml;
                        links += '\r\n\r\n' + plantUmlResponse.links;
                    }
                }
            }
        }
        let content = createTable;
        const data = '!$data=' + JSON.stringify(plantUmlDataArray, null, 2) + '\r\n';
        if (type === 'plantUml') {
            content = '@startuml\n' + data + plantUmlconfig + plantUml + links + '\n@enduml';
        }
        void vscode.workspace.openTextDocument({ content, language: 'puml' }).then((doc) => {
            void vscode.window.showTextDocument(doc, 1, false);
        });
        console.log(plantUml + links);
    }
    /***
     * Return a table that has the same name as the view in order to link them in the plantUml
     */
    async findRelatedTable(view, resources) {
        for (const resource in resources) {
            const resourceObject = resources[resource];
            if (resourceObject.subtype === 'Table' && resourceObject.table_id) {
                if (view.slice(1) === resourceObject.table_id.slice(1)) {
                    return resourceObject.table_id;
                }
            }
        }
        return null;
    }
    async genCreateTable(schema, tableName) {
        let createTable = 'CREATE TABLE ' + tableName + ' (\r\n';
        const length = schema.length;
        let x = 1;
        // let pk: string | undefined
        // let fk: string | undefined
        for (const column of schema) {
            const type = column.type;
            const closure = x === length ? '' : ',\r\n';
            createTable += '  ' + column.name + ' ' + type;
            createTable += column.mode === 'REQUIRED' ? ' NOT NULL' : '';
            if (column.description?.match(/\[[U]*PK[1-9]*\]/m) !== null) {
                createTable += ' PRIMARY KEY';
            }
            createTable += closure;
            // I keep it here, if Draw.io includes FK in the future..
            // hande [UPK], [PK1], [PK2]...à
            // Handle [FK - Table - Column]
            /* if(column.description && column.description.match(/\[PK[1-9]*\]/m) !== null){
              if(pk === undefined){
                pk = column.name + ',';
              }
              else{
                pk += column.name + ',';
              }
            }
            // Expects [FK - Table - Column]
            if(column.description){
              let currentfk = column.description.match(/\[FK[ ]*-[ ]*([\w]*)[ ]*-[ ]*([\w]*)\]/m);
              if(currentfk && currentfk.length == 3){
                let fkDefinition = ',\r\n  FOREIGN KEY (' + column.name + ') REFERENCES ' + currentfk[1] + '(' + currentfk[2] + ')';
                fk = fk === undefined ? fkDefinition : fk + fkDefinition;
              }
            } */
            x++;
        }
        //    if(pk){ createTable += ',\r\n  PRIMARY KEY (' + pk.slice(0, -1) + ')'; }
        //    if(fk){ createTable += fk; };
        createTable += '\r\n);';
        return createTable;
    }
    async genPlantUml(schema, tableName, type, partitionFlag, clusteringFlag) {
        // At the moment, can't handle both PK and FK + un seule FK
        let plantUml = 'table( ' + tableName + ' ) {\r\n';
        if (type === 'View') {
            plantUml = 'view( ' + tableName + ' ) {\r\n';
        }
        const fkLink = [];
        const linkDefinitions = [];
        if (partitionFlag) {
            plantUml += '  part("' + tableName + '") \r\n';
        }
        if (clusteringFlag) {
            plantUml += '  cluster("' + tableName + '") \r\n';
        }
        if (type === 'Table') {
            plantUml += '  ---\r\n';
        }
        for (const column of schema) {
            let topPk = false;
            let topFk = false;
            // gérer l'absence de description !
            if (column.description) {
                if (column.description?.match(/\[[U]*PK[0-9]*\]/m) !== null) {
                    plantUml += '  primary_key(' + column.name + '): ' + column.type + ' \r\n';
                    topPk = true;
                }
                // Expects [FK - Table - Column]
                if (column.description?.match(/\[FK[ ]*-[ ]*([\w\.]+)[ ]*-[ ]*([\w]+)\]/m) !== null) {
                    const currentfk = column.description.matchAll(/\[FK[ ]*-[ ]*([\w]*)[ ]*-[ ]*([\w]*)\]/mg);
                    for (const fk of currentfk) {
                        if (!topFk && !topPk) {
                            plantUml += '  foreign_key(' + column.name + '): ' + column.type + '\r\n';
                            topFk = true;
                        }
                        const curLink = tableName + ' }|--|| ' + fk[1] + ' : ' + column.name + ' = ' + fk[2];
                        const tablesLink = tableName + ' }|--|| ' + fk[1];
                        const indexOf = fkLink.indexOf(tablesLink);
                        if (indexOf > -1) {
                            linkDefinitions[indexOf] += '\\n ' + column.name + ' = ' + fk[2];
                        }
                        else {
                            fkLink.push(tablesLink);
                            linkDefinitions.push(curLink);
                        }
                    }
                }
            }
            if (!topFk && !topPk) {
                plantUml += '  column(' + column.name + '): ' + column.type + '\r\n';
            }
        }
        const linkList = linkDefinitions.join('\r\n');
        plantUml += '}';
        return { plantUml, links: linkList };
    }
    getSchemaPath(path) {
        const resourceArray = this.projectResources;
        if (this.terraformPath) {
            path = path.replace(this.terraformPath, '');
        }
        for (const resourceName in resourceArray) {
            const resource = resourceArray[resourceName];
            if (resource.templatefile?.toLowerCase().endsWith(path.toLowerCase()) || resource.schemaPath?.toLowerCase().endsWith(path.toLowerCase())) { /* || operator is the right one, it's a OR, not a coalesce ! */ // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
                const workspace = vscode.workspace.workspaceFolders;
                if (workspace !== undefined && workspace?.length > 0 && this.terraformPath && resource.schemaPath) {
                    return (vscode.Uri.joinPath(workspace[0].uri, this.terraformPath, resource.schemaPath));
                }
            }
        }
        return undefined;
    }
    /*
      0. Demander le répertoire cible (commencer par fixe)
      1. Retirer les commentaires
      2. Isoler la ressource
      3. 3 Tester la présence d'un sql.
      4. Si oui, récupérer à nouveau la ressource avec les commentaires et sa position (début et fin ? )
      5. Récupérer le SQL (on dispose déjà de l'identifiant début fin)
      6. détecter les ${local.something} et remplacer par ${something}, faire une liste
      7. Récupérer le nom de la vue
      7. ecrire le fichier .sql
      8. remplacer le query = <<SQL   SQL par le code templatefile avec les ${local.something}
      9. update de la ressource
  
    */
    async prepareMoveViewSchema(type) {
        if (vscode.workspace.workspaceFolders === undefined || this.terraformPath === undefined) {
            return await Promise.reject(new Error('No workspace found'));
        }
        const basePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, this.terraformPath);
        void vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, defaultUri: basePath }).then((uri) => {
            if (uri) {
                void this.moveViewSchemaToFile(uri[0], type);
            }
        });
    }
    async moveViewSchemaToFile(targetPath, type) {
        if (vscode.workspace.workspaceFolders === undefined || this.terraformPath === undefined) {
            await Promise.reject(new Error('No workspace found'));
            return;
        }
        const matchRecursive = require('./match-recursive-improved.js'); // eslint-disable-line @typescript-eslint/no-var-requires
        const basePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, this.terraformPath);
        const targetDir = targetPath.fsPath.replace(basePath.fsPath, '');
        try {
            fs.statSync(targetPath.fsPath);
        }
        catch (error) {
            fs.mkdirSync(targetPath.fsPath);
        }
        for (const uri of await vscode.workspace.findFiles(this.terraformPath + '*.tf')) {
            let baseFile = fs.readFileSync(uri.fsPath, 'utf8');
            const resourcesFile = this.stripComments(baseFile);
            let toUpdate = false;
            for (const resource of resourcesFile.matchAll(/resource[ ]+"(\w+)"[ ]+"([\w\-]+)"[ ]+/mg)) {
                if (resource.index !== undefined) {
                    const resourceURI = resource[0];
                    const startPosition = baseFile.indexOf(resourceURI);
                    const baseDefinition = matchRecursive(baseFile, resource[0], '{...}');
                    const uncommentedDefinition = this.stripComments(baseDefinition[0]);
                    const tableId = uncommentedDefinition.match(/table_id[ ]*=[ ]*"(\w+)"/m);
                    let matched;
                    if (type === 'SQL') {
                        matched = baseDefinition[0].matchAll(/view[ ]*{[^}]*?query[ ]*=[ ]*<<([A-Z]+)[\r\n]{1}/mg);
                    }
                    else if (type === 'SCHEMA') {
                        matched = baseDefinition[0].matchAll(/schema[ ]*=[ ]*<<([A-Z]+)[\r\n]{1}/mg);
                    }
                    for (const match of matched) {
                        if (match.index !== undefined && tableId) {
                            let varList = '';
                            const includeStart = startPosition + resourceURI.length + match.index + match[0].length;
                            const includeDeclarationStart = includeStart - 2 - match[1].length; // -2 pour le << et match[1].length pour l'idenficateur
                            const includeEnd = includeStart + baseFile.substring(includeStart).search(new RegExp(`^[ \t]*${match[1]}[ ]*$`, 'm'));
                            const includeDeclarationEnd = includeEnd + baseFile.substring(includeEnd).search(new RegExp(`${match[1]}`, 'm')) + match[1].length;
                            let include = baseFile.substring(includeStart, includeEnd);
                            const variables = include.matchAll(/\$\{(\w+)\.(\w+)\}/mg);
                            for (const variable of variables) {
                                if (variable) {
                                    varList += '      ' + variable[2] + ' = ' + variable[1] + '.' + variable[2] + '\r\n';
                                    include = include.replaceAll(variable[0], '${' + variable[2] + '}');
                                }
                            }
                            if (type === 'SQL') {
                                const replacementString = ' templatefile("' + targetDir + '/' + tableId[1] + '.sql", { \r\n' + varList + '  })\r\n';
                                fs.writeFileSync(vscode.Uri.joinPath(targetPath, tableId[1] + '.sql').fsPath, include.trimLeft());
                                baseFile = baseFile.substring(0, includeDeclarationStart) + replacementString + baseFile.substring(includeDeclarationEnd);
                                toUpdate = true;
                            }
                            if (type === 'SCHEMA') {
                                const replacementString = ' file("' + targetDir + '/' + tableId[1] + '.json")\r\n';
                                fs.writeFileSync(vscode.Uri.joinPath(targetPath, tableId[1] + '.json').fsPath, include.trimLeft());
                                baseFile = baseFile.substring(0, includeDeclarationStart) + replacementString + baseFile.substring(includeDeclarationEnd);
                                toUpdate = true;
                            }
                        }
                    }
                }
            }
            if (toUpdate) {
                await vscode.commands.executeCommand('vscode.open', uri).then((any) => {
                    if (vscode.window.activeTextEditor) {
                        const textEditor = vscode.window.activeTextEditor;
                        const startPosition = textEditor.document.positionAt(0);
                        const lastLineText = textEditor.document.lineAt(new vscode.Position(textEditor.document.lineCount - 1, 0));
                        const lastLineLength = lastLineText.text.length;
                        const endPosition = new vscode.Position(textEditor.document.lineCount - 1, lastLineLength);
                        const range = new vscode.Range(startPosition, endPosition);
                        void vscode.window.activeTextEditor?.edit(editBuilder => {
                            editBuilder.replace(range, baseFile);
                        });
                    }
                    ;
                });
            }
            // fs.writeFileSync(uri.fsPath, baseFile);
        }
    }
    getTerraformBasePath() {
        return this.terraformPath;
    }
    getLocalsList() {
        return this.projectLocals;
    }
    getResourcesList() {
        return this.projectResources;
    }
}
exports.TerraformResources = TerraformResources;
/* A partir d'ici, ce sont les ressources spécifiques au TreeView */
class TfObject extends vscode.TreeItem {
    constructor(objectName, // The name
    type, // local/ table / view / dataset
    collapsibleState, children, // List of childrens
    uri, strpos // string position
    ) {
        super(objectName, collapsibleState);
        this.objectName = objectName;
        this.type = type;
        this.collapsibleState = collapsibleState;
        this.children = children;
        this.uri = uri;
        this.strpos = strpos;
        this.iconPath = new vscode.ThemeIcon('notebook');
        switch (type) {
            case 'Local':
                this.iconPath = new vscode.ThemeIcon('wrench');
                break;
            case 'Variable':
                this.iconPath = new vscode.ThemeIcon('variable');
                break;
            case 'Eval':
                this.iconPath = new vscode.ThemeIcon('symbol-value');
                break;
            case 'View':
                this.iconPath = new vscode.ThemeIcon('window');
                this.contextValue = this.contextValue + 'Type_View;';
                break;
            case 'Table':
                this.iconPath = new vscode.ThemeIcon('database');
                this.contextValue = this.contextValue + 'Type_Table;';
                break;
        }
        if (this.objectName === 'google_bigquery_table') {
            this.contextValue = this.contextValue + 'google_bigquery_table;';
        }
        if (this.uri) {
            this.contextValue = this.contextValue + 'clickable;';
        }
    }
    /**
     addChildren
     */
    addChild(child) {
        if (this.children === undefined) {
            this.children = [child];
        }
        else {
            this.children?.push(child);
        }
    }
    addChildren(childArray) {
        this.children = childArray;
    }
    getChildren() {
        return this.children;
    }
}
//# sourceMappingURL=terraformRessources.js.map