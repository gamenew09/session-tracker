import * as vscode from "vscode";
import { VsCodeSubscriptions } from "../interfaces";

import { initProjectDetailsDisposables } from "./projectdetails";
import { initTrackedTimesDisposables } from "./trackedtimes";

export function initWebViews(context: vscode.ExtensionContext)
{
    let subscriptions: VsCodeSubscriptions = [];
    
    subscriptions = subscriptions.concat(initProjectDetailsDisposables(context));
    subscriptions = subscriptions.concat(initTrackedTimesDisposables(context));

    context.subscriptions.push(...subscriptions);
}