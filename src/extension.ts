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
let timerStateStatusBar: vscode.StatusBarItem;

function updateTimerStateStatusBarText()
{
    timerStateStatusBar.text = paused ? "Not Tracking Time" : "Tracking Time";
    if(vscode.workspace.getConfiguration().get<boolean>("sessiontracker.stopwatch_statusbar.showtrackingtimeitem"))
    {
        timerStateStatusBar.show();
    }
    else
    {
        timerStateStatusBar.hide();
    }
}

function pauseStopwatches()
{
    if(!paused)
    {
        paused = true;
        Object.keys(stopwatches).forEach(key => {
            stopwatches[key].stop();
        });
        console.log("Paused stopwatches");
        updateTimerStateStatusBarText();
    }
}

function resumeStopwatches()
{
    if(paused)
    {
        paused = false;
        Object.keys(stopwatches).forEach(key => {
            stopwatches[key].start();
        });
        console.log("Started stopwatches");
        updateTimerStateStatusBarText();
    }
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

function hasStopwatch(workspaceFolder: vscode.WorkspaceFolder): boolean
{
    if(workspaceFolder === undefined)
    {
        return false;
    }

    return stopwatches[workspaceFolder.uri.toString()] !== undefined;
}

function isTextDocumentAssociatedWithStopwatch(textDocument: vscode.TextDocument): boolean
{
    if(textDocument === undefined)
    {
        return false;
    }

    return hasStopwatch(vscode.workspace.getWorkspaceFolder(textDocument.uri));
}

let extensionPath: string = "";

let timeAmountStatusItem: vscode.StatusBarItem;

function msToDisplayTime(duration: number): string {
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

let lastActiveWorkspaceFolder: vscode.WorkspaceFolder;
let showTimeAmount: boolean = true;

function updateTimeAmountStatusItem()
{
    if(lastActiveWorkspaceFolder !== undefined && vscode.workspace.getConfiguration().get<boolean>("sessiontracker.stopwatch_statusbar.showfolderworktime"))
    {
        timeAmountStatusItem.text = msToDisplayTime(stopwatches[lastActiveWorkspaceFolder.uri.toString()].getTime());
        timeAmountStatusItem.show();
    }
    else
    {
        timeAmountStatusItem.hide();
    }
}

let timeAmountUpdateHandle: NodeJS.Timer;

function autoActivateTimer()
{
    if(vscode.workspace.getConfiguration().get("sessiontracker.stopwatch_behavior.autostarttimer"))
    {
        if(paused)
        {
            vscode.window.showInformationMessage("Automatically started time tracking.", "Disable Auto-Start for this Workspace", "Disable Auto-Start Globally").then((val) => {
                if(val === "Disable Auto-Start for this Workspace")
                {
                    vscode.workspace.getConfiguration().update("sessiontracker.stopwatch_behavior.autostarttimer", false, vscode.ConfigurationTarget.Workspace).then(() => {
                        vscode.window.showInformationMessage("Disabled auto-start time tracking for this workspace.");
                    });
                }
                else if(val === "Disable Auto-Start Globally")
                {
                    vscode.workspace.getConfiguration().update("sessiontracker.stopwatch_behavior.autostarttimer", false, vscode.ConfigurationTarget.Global).then(() => {
                        vscode.window.showInformationMessage("Disabled auto-start time tracking globally.");
                    });
                }
            })
        }
        resumeStopwatches();
    }
}

function autoActivateTimerBasedOnDocument(textDocument: vscode.TextDocument)
{
    if(vscode.workspace.getConfiguration().get("sessiontracker.stopwatch_behavior.autostarttimer"))
    {
        if(isTextDocumentAssociatedWithStopwatch(textDocument))
        {
            autoActivateTimer();
        }
    }
}

function autoActivateTimerBasedOnDocument_ActionName(actionName: string): (textDocument: vscode.TextDocument) => void
{
    return (textDocument: vscode.TextDocument) => {
        let enabledActions: string[] = vscode.workspace.getConfiguration().get("sessiontracker.stopwatch_behaviro.autostarttimer_actions");
        if(enabledActions.indexOf(actionName) !== -1)
        {
            autoActivateTimerBasedOnDocument(textDocument);
        }
    };
}

const AUTOACTIVATE_ACTIONFUNC_OpenTextDocument = autoActivateTimerBasedOnDocument_ActionName("OpenTextDocument");
const AUTOACTIVATE_ACTIONFUNC_ChangeTextDocument = autoActivateTimerBasedOnDocument_ActionName("ChangeTextDocument");
const AUTOACTIVATE_ACTIONFUNC_CloseTextDocument = autoActivateTimerBasedOnDocument_ActionName("CloseTextDocument");
const AUTOACTIVATE_ACTIONFUNC_SaveTextDocument = autoActivateTimerBasedOnDocument_ActionName("SaveTextDocument");
const AUTOACTIVATE_ACTIONFUNC_ChangedTextEditorSelection = autoActivateTimerBasedOnDocument_ActionName("ChangedTextEditorSelection");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        if(e.affectsConfiguration("sessiontracker.stopwatch_statusbar.showfolderworktime"))
        {
            updateTimeAmountStatusItem();
        }
        if(e.affectsConfiguration("sessiontracker.stopwatch_statusbar.showtrackingtimeitem"))
        {
            updateTimerStateStatusBarText();
        }
    }));

    //
    extensionPath = context.extensionPath;

    try
    {
        lastLoadedJson = JSON.parse(fs.readFileSync(session_filename, {encoding: "utf8"}));
        console.log("Loaded times saved");
    }
    catch (ex) { }

    timerStateStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    timerStateStatusBar.command = "sessiontracker.toggleStopwatches";
    timerStateStatusBar.show();

    timeAmountStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
    timeAmountStatusItem.command = "sessiontracker.showTrackedTimes";

    timeAmountUpdateHandle = setInterval(updateTimeAmountStatusItem, 1000);

    context.subscriptions.push(timerStateStatusBar);
    context.subscriptions.push(timeAmountStatusItem);

    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    context.subscriptions.push(vscode.window.onDidChangeWindowState((event) => {
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
        else
        {
            if(paused)
            {
                resumeStopwatches();
            }
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((event) => {
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

    vscode.workspace.workspaceFolders.forEach((folder) => {
        const index = folder.uri.toString();
        startStopwatch(index);
    });

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
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

    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(AUTOACTIVATE_ACTIONFUNC_OpenTextDocument));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => AUTOACTIVATE_ACTIONFUNC_ChangeTextDocument(e.document)));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(AUTOACTIVATE_ACTIONFUNC_CloseTextDocument));
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(AUTOACTIVATE_ACTIONFUNC_SaveTextDocument));
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection((e) => AUTOACTIVATE_ACTIONFUNC_ChangedTextEditorSelection(e.textEditor.document)));

    context.subscriptions.push(vscode.commands.registerCommand('sessiontracker.showTrackedTimes', () => {
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
                enableFindWidget: true
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
    }));

    context.subscriptions.push(vscode.commands.registerCommand('sessiontracker.toggleStopwatches', () => {
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

    lastActiveWorkspaceFolder = vscode.workspace.workspaceFolders[0];

    updateTimerStateStatusBarText();
    updateTimeAmountStatusItem();

    console.log('Congratulations, your extension "session-tracker" is now active!');
}

function getSessionTrackerDataViewHtml(): string
{
    return fs.readFileSync(path.normalize(extensionPath + "/html/session-tracker-data.html"), "utf8");
}

// this method is called when your extension is deactivated
export function deactivate() {
    clearInterval(timeAmountUpdateHandle);

    Object.keys(stopwatches).forEach(key => {
        endStopwatch(key);
    });

    console.log("Stopped all stopwatches and saved.");
}