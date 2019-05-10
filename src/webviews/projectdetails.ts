import { VsCodeSubscriptions, FolderSessionTrack, ProjectDetailsMap } from "../interfaces";
import * as vscode from "vscode";
import { getLastLoadedJson, getStopwatchByName } from "../stopwatches";

import * as fs from "fs";
import * as path from "path";
import { msToDisplayTime, getExtensionPath, getStartEpochTimestamp } from "../utility";

let projectDetailWebViews: ProjectDetailsMap = {};

export let webviewDisposables: vscode.Disposable[] = [];

export function initProjectDetailsDisposables(context: vscode.ExtensionContext): VsCodeSubscriptions
{
    let subscriptions: VsCodeSubscriptions = [];

    subscriptions.push(vscode.commands.registerCommand("sessiontracker.showProjectDetails", () => {
        const lastLoadedJson = getLastLoadedJson();

        let firstSelected = true;
        vscode.window.showQuickPick(Object.keys(lastLoadedJson).map<vscode.QuickPickItem>((projectName) => {
            if(typeof lastLoadedJson[projectName] === 'object')
            {
                let selected = false;
                if(firstSelected && getStopwatchByName(projectName) !== undefined)
                {
                    selected = true;
                    firstSelected = false;
                }
                return {
                    label: (lastLoadedJson[projectName] as FolderSessionTrack).display_name,
                    detail: projectName,
                    description: getStopwatchByName(projectName) !== undefined ? "active" : "",
                    picked: selected
                }
            }
            else
            {
                return undefined;
            }
        }), {
            canPickMany: false,
            matchOnDescription: true,
            matchOnDetail: true,
            placeHolder: "Select project to get more details (session times and total time)"
        }).then((item) => {
            if(item !== undefined)
            {
                let projectName = item.detail;
                if(typeof lastLoadedJson[projectName] === 'object')
                {
                    let project: FolderSessionTrack = (lastLoadedJson[projectName] as FolderSessionTrack);
                    
                    let projectDetailsWebView = vscode.window.createWebviewPanel("sessionTrackerProjectDetailsWebView", project.display_name + " - Project Session Times", vscode.ViewColumn.Active, {
                        enableScripts: true
                    });
                    projectDetailsWebView.webview.html = getProjectDetailsHTML(projectName, project);

                    projectDetailWebViews[projectName] = {
                        webviewPanel: projectDetailsWebView,
                        project: project
                    };

                    const updateProjectDetailsFunc = () => {
                        projectDetailsWebView.webview.postMessage({
                            type: "update",
                            current_session_length: getStopwatchByName(projectName).getTime(),
                            total_time: (lastLoadedJson[projectName] === undefined ? 0 : lastLoadedJson[projectName].total_time) + getStopwatchByName(projectName).getTime()
                        });
                    };
                    const updateProjectDetails: NodeJS.Timer = (getStopwatchByName(projectName) !== undefined) ? setInterval(updateProjectDetailsFunc, 1000) : undefined;

                    projectDetailsWebView.onDidDispose(() => {
                        if(updateProjectDetails !== undefined)
                        {
                            clearInterval(updateProjectDetails);
                        }

                        projectDetailWebViews[projectName] = undefined;
                    }, null, context.subscriptions);
                }
            }
        });
    }));

    return subscriptions;
}

function getProjectDetailsHTML(devname: string, project: FolderSessionTrack): string
{
    let html = fs.readFileSync(path.normalize(getExtensionPath() + "/html/project-details.html"), "utf8");

    html = html.replace("{{display_name}}", project.display_name).replace("{{dev_name}}", devname).replace("{{total_time}}", msToDisplayTime(project.total_time));

    let rowHtml = "";

    if(project.session_times !== undefined && project.session_times.length > 0)
    {
        project.session_times.forEach((time) => {
            rowHtml = rowHtml.concat(`<tr>
                <td>${new Date(time.start_timestamp).toLocaleString()}</td>
                <td>${msToDisplayTime(time.session_length)}</td>
            </tr>
            `);
        });
    }
    else if(getStopwatchByName(devname) === undefined)
    {
        rowHtml = `<tr>
        <td colspan="2">There are no session times yet.</td>
    </tr>`;
    }

    if(getStopwatchByName(devname) !== undefined)
    {
        rowHtml = `<tr id="current-session-row">
        <td id="current-session-starttimestamp">${new Date(getStartEpochTimestamp()).toLocaleString()}</td>
        <td id="current-session-length">${msToDisplayTime(getStopwatchByName(devname).getTime())}</td>
    </tr>
    ` + rowHtml;
    }

    html = html.replace("{{table_append}}", rowHtml);

    return html;
}