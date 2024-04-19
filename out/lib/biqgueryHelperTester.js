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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BqHelperTester = void 0;
const vscode = __importStar(require("vscode"));
const os_1 = __importDefault(require("os"));
class BqHelperTester {
    constructor(context, activeEditor) {
        this.context = context;
        this.activeEditor = activeEditor;
    }
    registerCommand(commandId) {
        const bqHelperTester = vscode.commands.registerCommand(commandId, () => {
            const terraformWorkspacesList = this.context.workspaceState.get('workspaceList');
            const homedirpath = os_1.default.homedir();
            const uri = vscode.Uri.parse((homedirpath[0] === '/' ? '' : 'file:///') + homedirpath);
            console.log(uri);
            console.log(uri.fsPath);
            console.log(terraformWorkspacesList);
        });
        this.context.subscriptions.push(bqHelperTester);
    }
}
exports.BqHelperTester = BqHelperTester;
//# sourceMappingURL=biqgueryHelperTester.js.map