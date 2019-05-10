'use strict';
import * as vscode from 'vscode';
import { initFromContext } from './utility';
import { initStopwatches } from './stopwatches';
import { initWebViews } from './webviews';
import { initStatusBarItems, updateTimeAmountStatusItem, updateTimerStateStatusBarText } from './statusbaritems';
import { initAutoActivate } from './autoactivate';

export function activate(context: vscode.ExtensionContext)
{
    // Initailize parts of the extension and push it into the subscriptions array.
    // ... "spreads" an array out so it can be used in variadic arguments.
    context.subscriptions.push(
        ...initFromContext(context),
        ...initStopwatches(),
        ...initStatusBarItems(),
        ...initAutoActivate()
    );
    
    // Initailize the web views.
    // The function automatically adds everything into the subscriptions array.
    initWebViews(context);

    // Update the text of the status bar items.
    updateTimerStateStatusBarText();
    updateTimeAmountStatusItem();
}

export function deactivate()
{

}