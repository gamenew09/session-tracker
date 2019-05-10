import * as vscode from 'vscode';
import { msToDisplayTime, getLastActiveWorkspaceFolder } from './utility';
import { isPaused, getStopwatchFromWorkspaceFolder } from './stopwatches';
import { VsCodeSubscriptions } from './interfaces';

let timerStateStatusBar: vscode.StatusBarItem;
let timeAmountStatusItem: vscode.StatusBarItem;

let timeAmountUpdateHandle: NodeJS.Timer;

export function updateTimeAmountStatusItem()
{
    if(getLastActiveWorkspaceFolder() !== undefined && vscode.workspace.getConfiguration().get<boolean>("sessiontracker.stopwatch_statusbar.showfolderworktime"))
    {
        timeAmountStatusItem.text = msToDisplayTime(getStopwatchFromWorkspaceFolder(getLastActiveWorkspaceFolder()).getTime());
        timeAmountStatusItem.show();
    }
    else
    {
        timeAmountStatusItem.hide();
    }
}

export function updateTimerStateStatusBarText()
{
    timerStateStatusBar.text = isPaused() ? "Not Tracking Time" : "Tracking Time";
    if(vscode.workspace.getConfiguration().get<boolean>("sessiontracker.stopwatch_statusbar.showtrackingtimeitem") && getLastActiveWorkspaceFolder() !== undefined)
    {
        timerStateStatusBar.show();
    }
    else
    {
        timerStateStatusBar.hide();
    }
}

export function initStatusBarItems(): VsCodeSubscriptions
{
    let subscriptions: VsCodeSubscriptions = [];
    timerStateStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    timerStateStatusBar.command = "sessiontracker.toggleStopwatches";
    timerStateStatusBar.show();

    timeAmountStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
    timeAmountStatusItem.command = "sessiontracker.showAllTrackedTimes";

    timeAmountUpdateHandle = setInterval(updateTimeAmountStatusItem, 1000);

    subscriptions.push(timerStateStatusBar, timeAmountStatusItem);

    subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        if(e.affectsConfiguration("sessiontracker.stopwatch_statusbar.showfolderworktime"))
        {
            updateTimeAmountStatusItem();
        }
        if(e.affectsConfiguration("sessiontracker.stopwatch_statusbar.showtrackingtimeitem"))
        {
            updateTimerStateStatusBarText();
        }
    }));

    // Add a subscription that will clear the time amount update interval when our extension goes away.
    subscriptions.push({
        dispose(): void
        {
            clearInterval(timeAmountUpdateHandle);
        }
    })

    return subscriptions;
}