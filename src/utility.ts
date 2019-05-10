import * as vscode from 'vscode';
import { VsCodeSubscriptions } from './interfaces';
import { autoActivateTimer } from './autoactivate';

let startTimestamp: number = 0;

export function msToDisplayTime(duration: number): string {
    let seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
    days = Math.floor((duration / (1000 * 60 * 60)) / 24);

    let hours_str = (hours < 10) ? "0" + hours : hours,
    minutes_str = (minutes < 10) ? "0" + minutes : minutes,
    seconds_str = (seconds < 10) ? "0" + seconds : seconds,
    days_str = (days > 0 ? ((days < 10) ? "0" + days : days) : "");

    return days_str + ((days_str === "") ? "" : ":") + hours_str + ":" + minutes_str + ":" + seconds_str;
}

let extensionPath: string = undefined;
let lastActiveWorkspaceFolder: vscode.WorkspaceFolder = undefined;

export function getExtensionPath(): string
{
    return extensionPath;
}

export function getLastActiveWorkspaceFolder(): vscode.WorkspaceFolder | undefined
{
    return lastActiveWorkspaceFolder;
}

export function initFromContext(context: vscode.ExtensionContext): VsCodeSubscriptions
{
    let subscriptions: VsCodeSubscriptions = [];

    extensionPath = context.extensionPath;
    startTimestamp = Date.now();

    subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if(editor !== undefined)
        {
            let workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
            if(workspaceFolder === undefined)
            {
                workspaceFolder = vscode.workspace.workspaceFolders[0];
            }

            lastActiveWorkspaceFolder = workspaceFolder;
        }
        else
        {
            lastActiveWorkspaceFolder = vscode.workspace.workspaceFolders[0];
        }
        autoActivateTimer();
    }));

    // Make sure the workspaceFolders array is always an array, then access the first element to set it as the last active workspace folder.
    lastActiveWorkspaceFolder = (vscode.workspace.workspaceFolders === undefined ? [] : vscode.workspace.workspaceFolders)[0];

    return subscriptions;
}

export function getStartEpochTimestamp(): number
{
    return startTimestamp;
}