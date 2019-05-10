import * as vscode from 'vscode';
import { StopwatchMap, JsonEditable, VsCodeSubscriptions } from "./interfaces";
import { Stopwatch } from "ts-stopwatch";
import * as fs from 'fs';
import { getStartEpochTimestamp } from './utility';
import { updateTimerStateStatusBarText } from './statusbaritems';

let stopwatches: StopwatchMap = {};
let paused: boolean = false;

let lastLoadedJson: JsonEditable = {};
const session_filename = "session_times.json";

export function getLastLoadedJson(): JsonEditable
{
    return lastLoadedJson;
}

export function isPaused(): boolean
{
    return paused;
}

export function pauseStopwatches()
{
    if(!isPaused())
    {
        paused = true;
        Object.keys(stopwatches).forEach(key => {
            stopwatches[key].stop();
        });
        console.log("Paused stopwatches");
        updateTimerStateStatusBarText();
    }
}

export function resumeStopwatches()
{
    if(isPaused())
    {
        if(vscode.workspace.workspaceFolders === undefined)
        {
            vscode.window.showErrorMessage("You must open a folder before you can track time.");
        }
        else
        {
            paused = false;
            Object.keys(stopwatches).forEach(key => {
                stopwatches[key].start();
            });
            console.log("Resumed stopwatches.");
            updateTimerStateStatusBarText();
        }
    }
}

export function startStopwatch(index: string)
{
    stopwatches[index] = new Stopwatch();
    if(!paused)
    {
        stopwatches[index].start();
    }
    console.log(`Started stopwatch for "${index}".${paused ? " Stopwatch is paused." : ""}`);
}

export function endStopwatch(index: string)
{
    stopwatches[index].stop();
    try
    {
        saveFolderTime(index);
    }
    catch (err)
    {
        console.error(`Failed to save time in ${index}: ${err}`);
    }
    stopwatches[index] = undefined;
    console.log(`Stopped stopwatch for "${index}".`);
}

export function hasStopwatch(workspaceFolder: vscode.WorkspaceFolder): boolean
{
    if(workspaceFolder === undefined)
    {
        return false;
    }

    return stopwatches[workspaceFolder.uri.toString()] !== undefined;
}

export function isTextDocumentAssociatedWithStopwatch(textDocument: vscode.TextDocument): boolean
{
    if(textDocument === undefined)
    {
        return false;
    }

    return hasStopwatch(vscode.workspace.getWorkspaceFolder(textDocument.uri));
}

export function getStopwatchFromWorkspaceFolder(workspaceFolder: vscode.WorkspaceFolder): Stopwatch
{
    if(workspaceFolder === undefined)
    {
        return undefined;
    }

    return stopwatches[workspaceFolder.uri.toString()];
}

export function getStopwatchByName(name: string): Stopwatch
{
    return stopwatches[name];
}

export function getStopwatchNames(): string[]
{
    return Object.keys(stopwatches);
}

export function saveFolderTime(name: string): void
{
    if(stopwatches[name] !== undefined)
    {
        try
        {
            lastLoadedJson = JSON.parse(fs.readFileSync(session_filename, {encoding: "utf8"}));
        }
        catch (ex) { }

        if(typeof lastLoadedJson[name] !== "object")
        {
            lastLoadedJson[name] = {
                display_name: vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(name)).name,
                total_time: 0,
                session_times: []
            };
        }
        let previousSessionTimes = (lastLoadedJson[name].session_times === undefined ? [] : lastLoadedJson[name].session_times);
        
        let sessionTime = stopwatches[name].getTime();
        previousSessionTimes.push({
            session_length: sessionTime,
            start_timestamp: getStartEpochTimestamp()
        });
        
        lastLoadedJson[name] = {
            display_name: vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(name)).name,
            total_time: lastLoadedJson[name].total_time + sessionTime,
            session_times: previousSessionTimes
        };

        fs.writeFileSync(session_filename, JSON.stringify(lastLoadedJson), "utf8");
    }
}

export function initStopwatches(): VsCodeSubscriptions
{
    let subscriptions: VsCodeSubscriptions = [];

    try
    {
        lastLoadedJson = JSON.parse(fs.readFileSync(session_filename, {encoding: "utf8"}));
        console.log("Loaded times saved");
    }
    catch (ex) { }

    subscriptions.push(vscode.window.onDidChangeWindowState((event) => {
        if(vscode.workspace.getConfiguration().get<boolean>("sessiontracker.stopwatch_behavior.changebasedonfocus"))
        {
            if(event.focused)
            {
                resumeStopwatches();
            }
            else
            {
                pauseStopwatches();
            }
        }
    }));

    subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        console.log(event);
        if(event.added.length > 0)
        {
            event.added.forEach((folder) => {
                const index = folder.uri.toString();
                startStopwatch(index);
            });
        }
        if(event.removed.length > 0)
        {
            event.removed.forEach((folder) => {
                const index = folder.uri.toString();
                endStopwatch(index);
            })
        }
    }));

    subscriptions.push(vscode.commands.registerCommand('sessiontracker.toggleStopwatches', () => {
        if(paused)
        {
            resumeStopwatches();
            vscode.window.showInformationMessage("Resumed Time Tracking");
        }
        else
        {
            pauseStopwatches();
            vscode.window.showInformationMessage("Paused Time Tracking");
        }
    }));

    subscriptions.push({
        dispose(): void
        {
            Object.keys(stopwatches).forEach(key => {
                endStopwatch(key);
            });
        }
    });

    const workspaceFolders: vscode.WorkspaceFolder[] = vscode.workspace.workspaceFolders === undefined ? [] : vscode.workspace.workspaceFolders;

    workspaceFolders.forEach((folder) => {
        const index = folder.uri.toString();
        startStopwatch(index);
    });

    if(workspaceFolders[0] === undefined)
    {
        paused = true;
        if(vscode.workspace.getConfiguration().get<boolean>("sessiontracker.unopened_folder_behavior.showWarningOnExtensionStart"))
        {
            vscode.window.showWarningMessage("A folder is not currently opened, will not be tracking time. You are still able to look at times.", "Show Tracked Times").then((item) => {
                if(item === "Show Tracked Times")
                {
                    return vscode.commands.executeCommand("sessiontracker.showAllTrackedTimes");
                }
            });
        }
    }

    return subscriptions;
}