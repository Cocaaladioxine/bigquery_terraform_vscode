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
exports.WorkspaceSelector = void 0;
const vscode = __importStar(require("vscode"));
class WorkspaceSelector {
    constructor(context) {
        this.workspacesList = [];
        this.defaultWorkspace = '';
        this.activeWorkspace = '';
        this.pickerItems = [];
        this.context = context;
        this.workspaceStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.initWorkspaceList();
        this.refreshItems();
        void context.workspaceState.update('activeWorkspace', this.activeWorkspace);
        void context.workspaceState.update('workspaceList', this.workspacesList);
    }
    registerWorkplaceSelector() {
        const selectWorkspace = vscode.commands.registerCommand('selectWorkspace', () => {
            void vscode.window.showQuickPick(this.pickerItems).then((selected) => {
                if (selected !== undefined) {
                    this.activeWorkspace = selected.label;
                    this.refreshItems();
                    this.updateStatusBarTfWorkspace();
                    void vscode.commands.executeCommand('bigqueryhelper.terraformRefresh');
                }
            });
        });
        this.context.subscriptions.push(selectWorkspace);
        this.workspaceStatusBar.command = 'selectWorkspace';
        this.context.subscriptions.push(this.workspaceStatusBar);
        this.workspaceStatusBar.text = `TF Workspace : ${this.activeWorkspace}`;
        this.workspaceStatusBar.show();
        vscode.workspace.onDidChangeConfiguration(event => {
            this.initWorkspaceList();
            this.updateStatusBarTfWorkspace();
            this.refreshItems();
        }, null, this.context.subscriptions);
    }
    initWorkspaceList() {
        const bqtfConfig = vscode.workspace.getConfiguration('bqtf');
        const confWorkspaces = bqtfConfig.get('workspaces');
        const contextWorkspace = this.context.workspaceState.get('activeWorkspace');
        const confDefaultWorkspace = bqtfConfig.get('defaultWorkspace');
        if (!confWorkspaces || confWorkspaces.length === 0) {
            void vscode.window.showErrorMessage("Can't find bqtf configuration. Please check your settings.json");
        }
        else if (!confDefaultWorkspace || confDefaultWorkspace == null) {
            void vscode.window.showErrorMessage("Can't find bqtf default workspace configuration. Please check your settings.json");
        }
        if (confDefaultWorkspace && !contextWorkspace) {
            this.defaultWorkspace = confDefaultWorkspace;
            this.activeWorkspace = confDefaultWorkspace;
        }
        else if (confDefaultWorkspace && contextWorkspace) {
            this.activeWorkspace = contextWorkspace;
            this.defaultWorkspace = confDefaultWorkspace;
        }
        else {
            this.activeWorkspace = '';
            this.defaultWorkspace = '';
        }
        if (confWorkspaces && confWorkspaces.length > 0) {
            this.workspacesList = confWorkspaces;
        }
        else {
            this.workspacesList = [''];
        }
    }
    refreshItems() {
        this.pickerItems = [];
        for (const tfWorkspace of this.workspacesList) {
            if (tfWorkspace === this.activeWorkspace) {
                this.pickerItems.push({
                    label: tfWorkspace,
                    description: '*'
                });
            }
            else {
                this.pickerItems.push({ label: tfWorkspace });
            }
        }
    }
    updateStatusBarTfWorkspace() {
        this.workspaceStatusBar.text = `TF Workspace : ${this.activeWorkspace}`;
        void this.context.workspaceState.update('activeWorkspace', this.activeWorkspace);
        void this.context.workspaceState.update('workspaceList', this.workspacesList);
    }
}
exports.WorkspaceSelector = WorkspaceSelector;
//# sourceMappingURL=tfWorspaceSelector.js.map