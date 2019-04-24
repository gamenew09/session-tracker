'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Stopwatch } from 'ts-stopwatch';

interface StopwatchMap{
    [folder: string]: Stopwatch;
}

interface FolderSessionTrack {
    total_time: number;
    display_name: string;
}

interface JsonEditable {
    [name: string]: FolderSessionTrack | undefined;
}

let stopwatches: StopwatchMap = {};
let paused: boolean = false;

function pauseStopwatches()
{
    paused = true;
    Object.keys(stopwatches).forEach(key => {
        stopwatches[key].stop();
    });
    console.log("Paused stopwatches");
}

function resumeStopwatches()
{
    paused = false;
    Object.keys(stopwatches).forEach(key => {
        stopwatches[key].start();
    });
    console.log("Started stopwatches");
}

let lastLoadedJson: JsonEditable = {};
const session_filename = "session_times.json";

function saveFolderTime(name: string): void
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
                total_time: 0
            };
        }
        lastLoadedJson[name] = {
            display_name: vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(name)).name,
            total_time: lastLoadedJson[name].total_time + stopwatches[name].getTime()
        };

        fs.writeFileSync(session_filename, JSON.stringify(lastLoadedJson), "utf8");
    }
}

function startStopwatch(index: string)
{
    stopwatches[index] = new Stopwatch();
    if(!paused)
    {
        stopwatches[index].start();
    }
    console.log(`Started stopwatch for "${index}".${paused ? " Stopwatch is paused." : ""}`);
}

function endStopwatch(index: string)
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

let extensionPath: string = "";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    extensionPath = context.extensionPath;
    console.log(path.resolve(session_filename));
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "session-tracker" is now active!');

    try
    {
        lastLoadedJson = JSON.parse(fs.readFileSync(session_filename, {encoding: "utf8"}));
        console.log("Loaded times saved");
    }
    catch (ex) { }

    const configuration = vscode.workspace.getConfiguration();
    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    vscode.window.onDidChangeWindowState((event) => {
        if(configuration.get<boolean>("sessiontracker.stopwatch.changebasedonfocus"))
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
        else
        {
            if(paused)
            {
                resumeStopwatches();
            }
        }
    })

    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
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
    });

    vscode.workspace.workspaceFolders.forEach((folder) => {
        const index = folder.uri.toString();
        startStopwatch(index);
    });

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('sessiontracker.showTrackedTimes', () => {
        const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // Display a message box to the user
        if(currentPanel)
        {
            currentPanel.reveal(columnToShowIn);
        }
        else
        {
            currentPanel = vscode.window.createWebviewPanel("sessionTrackerDataView", "Session Tracker Times", vscode.ViewColumn.One, {
                enableScripts: true,
            });
            currentPanel.webview.html = getSessionTrackerDataViewHtml();

            const updateSessionTrackerDataView = () => {
                try{
                    const stopwatchKeys = Object.keys(stopwatches);

                    let nonRunningListings = Object.keys(lastLoadedJson).filter((key) => stopwatchKeys.indexOf(key) == -1).map((key) => {
                        return {
                            name: lastLoadedJson[key].display_name, 
                            session_time: undefined,
                            total_time: lastLoadedJson[key].total_time,
                        };
                    });

                    currentPanel.webview.postMessage({
                        command: "update_listings",
                        listings: stopwatchKeys.map((key) => {
                            return {
                                name: vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(key)).name, 
                                session_time: stopwatches[key].getTime(),
                                total_time: (lastLoadedJson[key] === undefined ? 0 : lastLoadedJson[key].total_time) + stopwatches[key].getTime(),
                            }
                        }).concat(nonRunningListings)
                    });
                }
                catch(err)
                {
                    console.log(err);
                }
            };

            const update = setInterval(updateSessionTrackerDataView, 1000);

            currentPanel.onDidDispose(() => {
                clearInterval(update);
                currentPanel = undefined;
            }, null, context.subscriptions);
        }
    });

    context.subscriptions.push(disposable);
}

function getSessionTrackerDataViewHtml(): string
{
    return fs.readFileSync(path.normalize(extensionPath + "/src/session-tracker-data.html"), "utf8");
}

// this method is called when your extension is deactivated
export function deactivate() {
    Object.keys(stopwatches).forEach(key => {
        endStopwatch(key);
    });

    console.log("Stopped all stopwatches and saved.");
}