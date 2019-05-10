import * as vscode from 'vscode';
import { Stopwatch } from 'ts-stopwatch';

export interface StopwatchMap{
    [folder: string]: Stopwatch;
}

export interface ProjectDetailsMap {
    [projectName: string]: {
        webviewPanel: vscode.WebviewPanel,
        project: FolderSessionTrack
    };
}

export interface SessionTimes {
    session_length: number;
    start_timestamp: number;
}

export interface FolderSessionTrack {
    total_time: number;
    display_name: string;
    session_times: SessionTimes[];
}

export interface JsonEditable {
    [name: string]: FolderSessionTrack | undefined;
}

export type VsCodeSubscription = { dispose(): any };
export type VsCodeSubscriptions = VsCodeSubscription[];