import { isTextDocumentAssociatedWithStopwatch, isPaused, resumeStopwatches } from "./stopwatches";
import * as vscode from 'vscode';
import { VsCodeSubscriptions } from "./interfaces";

export function autoActivateTimer()
{
    if(vscode.workspace.getConfiguration().get<boolean>("sessiontracker.stopwatch_behavior.autostarttimer"))
    {
        if(isPaused())
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
        let enabledActions: string[] = vscode.workspace.getConfiguration().get("sessiontracker.stopwatch_behavior.autostarttimer_actions");
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

export function initAutoActivate(): VsCodeSubscriptions
{
    return [
        vscode.workspace.onDidOpenTextDocument(AUTOACTIVATE_ACTIONFUNC_OpenTextDocument),
        vscode.workspace.onDidChangeTextDocument((e) => AUTOACTIVATE_ACTIONFUNC_ChangeTextDocument(e.document)),
        vscode.workspace.onDidCloseTextDocument(AUTOACTIVATE_ACTIONFUNC_CloseTextDocument),
        vscode.workspace.onDidSaveTextDocument(AUTOACTIVATE_ACTIONFUNC_SaveTextDocument),
        vscode.window.onDidChangeTextEditorSelection((e) => AUTOACTIVATE_ACTIONFUNC_ChangedTextEditorSelection(e.textEditor.document))
    ];
}