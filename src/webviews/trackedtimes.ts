import * as vscode from "vscode";
import { VsCodeSubscriptions } from "../interfaces";
import { getLastLoadedJson, getStopwatchNames, getStopwatchByName, isPaused } from "../stopwatches";
import * as fs from "fs";
import * as path from "path";
import { getExtensionPath } from "../utility";

let currentPanel: vscode.WebviewPanel = undefined;

export function getSessionTrackerDataViewHtml(): string
{
    return fs.readFileSync(path.normalize(getExtensionPath() + "/html/session-tracker-data.html"), "utf8");
}

export function initTrackedTimesDisposables(context: vscode.ExtensionContext): VsCodeSubscriptions
{
    let subscriptions: VsCodeSubscriptions = [];

    subscriptions.push(vscode.commands.registerCommand('sessiontracker.showAllTrackedTimes', () => {
        const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        
        if(currentPanel)
        {
            currentPanel.reveal(columnToShowIn);
        }
        else
        {
            currentPanel = vscode.window.createWebviewPanel("sessionTrackerDataView", "Session Tracker Times", vscode.ViewColumn.Active, {
                enableScripts: true,
                enableFindWidget: true
            });
            currentPanel.webview.html = getSessionTrackerDataViewHtml();

            const updateSessionTrackerDataView = () => {
                try{
                    const stopwatchKeys = getStopwatchNames();
                    const lastLoadedJson = getLastLoadedJson();

                    let nonRunningListings = Object.keys(lastLoadedJson).filter((key) => stopwatchKeys.indexOf(key) == -1).map((key) => {
                        return {
                            name: lastLoadedJson[key].display_name, 
                            session_time: undefined,
                            total_time: lastLoadedJson[key].total_time,
                            paused: false
                        };
                    });

                    currentPanel.webview.postMessage({
                        command: "update_listings",
                        listings: stopwatchKeys.map((key) => {
                            return {
                                name: vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(key)).name, 
                                session_time: getStopwatchByName(key).getTime(),
                                total_time: (lastLoadedJson[key] === undefined ? 0 : lastLoadedJson[key].total_time) + getStopwatchByName(key).getTime(),
                                paused: isPaused()
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

    return subscriptions;
}