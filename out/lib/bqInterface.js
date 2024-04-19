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
exports.BqInterface = void 0;
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
class BqInterface {
    async execShell(cmd) {
        return await new Promise((resolve, reject) => {
            cp.exec(cmd, (err, out, stderr) => {
                if (stderr) {
                    resolve({ status: 'error', answer: `${stderr}` });
                    return;
                }
                // console.log(stderr);
                if (err) {
                    resolve({ status: 'error', answer: `${out}` });
                    return;
                }
                resolve({ status: 'success', answer: `${out}` });
            });
        });
    }
    async getProjects() {
        const projectList = await this.execShell('bq ls --projects --headless');
        if (projectList.status === 'error') {
            return [];
        }
        const lines = projectList.answer.split('\n');
        let x = 0;
        const projects = [];
        for (const line of lines) {
            if (line.trim().substring(0, 9) !== 'projectId' && line.trim().substring(0, 2) !== '--' && line.trim() !== '') {
                const project = line.trim().replace(/  */g, '¤').split('¤');
                // console.log("Identidiant " + x + ": "  + project[0]);
                projects[x] = [project[0], project[1]];
                x = x + 1;
            }
        }
        return projects;
    }
    /**
       * Dry Run a query and get informations about its quality
       * It will create a temporary file with the query and dry run it
       *
       * @param {string} query The query you want to dry run
       * @param {string} filePath The path to the file directory or workspace root to make a temporary copy
       *
       * filePath should give a file, even non existing, as the path will just be appended with .tmp.
       * A directory path won't work
       */
    async dryRun(query, filePath) {
        // let returnValue: dryRunAnswer = {status: 'error', answer: '' };
        fs.writeFileSync(filePath + '.tmp', query);
        const command = `bq query --use_legacy_sql=false --format=prettyjson --dry_run < "${filePath}.tmp"`;
        // console.log(command);
        const returnValue = await this.execShell(command); // dryRunAnswer inherits bqAnswer
        fs.unlinkSync(filePath + '.tmp');
        // console.log(returnValue.answer);
        if (returnValue.status === 'error') {
            returnValue.status = 'anyError';
            const posFound = returnValue.answer.match(/\[(\d+):(\d+)\]/);
            if (posFound) {
                returnValue.status = 'sqlError';
                returnValue.errorLine = +posFound[1]; // + is a kind of implicit cast
                returnValue.errorColumn = +posFound[2];
            }
        }
        if (returnValue.status === 'success') {
            const objAnswer = JSON.parse(returnValue.answer);
            returnValue.byteUsed = +objAnswer.statistics.totalBytesProcessed;
            returnValue.readableDataUsed = this.humanFileSize(+objAnswer.statistics.totalBytesProcessed);
            returnValue.schema = JSON.stringify(objAnswer.statistics.query.schema.fields);
        }
        return returnValue;
    }
    /**
       * Format bytes as human-readable text.
       *
       * @param bytes Number of bytes.
       * @param si True to use metric (SI) units, aka powers of 1000. False to use
       *           binary (IEC), aka powers of 1024.
       * @param dp Number of decimal places to display.
       *
       * @return Formatted string.
       * https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
       */
    humanFileSize(bytes, si = false, dp = 1) {
        const thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        const units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        let u = -1;
        const r = 10 ** dp;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
        return bytes.toFixed(dp) + ' ' + units[u];
    }
}
exports.BqInterface = BqInterface;
//# sourceMappingURL=bqInterface.js.map