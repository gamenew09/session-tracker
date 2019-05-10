# session-tracker README

Tracks how long folders have been opened. Works with workspaces, the tracker will count each folder seperately.

## Extension Settings

This extension contributes the following settings:

* `sessiontracker.stopwatch.changebasedonfocus`: Determines if the extension will count any time that the current window is not focuses.
* `sessiontracker.stopwatch_behavior.autostarttimer`: When true, the timer will start when any of the actions in `sessiontracker.stopwatch_behavior.autostarttimer_actions` occur.
* `sessiontracker.stopwatch_behavior.autostarttimer_actions`: The actions that will activate the timer if `sessiontracker.stopwatch_behavior.autostarttimer` is true. The list of array values that work are as follows:
    * `"OpenTextDocument"`: Start the stopwatches when you open a text document.
    * `"ChangeTextDocument"`: Start the stopwatches when you edit (add/remove a text character) a text document.
    * `"CloseTextDocument"`: Start the stopwatches when you close a text document.
    * `"SaveTextDocument"`: Start the stopwatches when you save a text document.
    * `"ChangedTextEditorSelection"`: Start the stopwatches when you select a new part in a text document.
* `sessiontracker.stopwatch_statusbar.showfolderworktime`: Shows a timer in the status bar that indicates time in the current session.
* `sessiontracker.stopwatch_statusbar.showtrackingtimeitem`: Shows a button in the status bar that indicates whether or not the stopwatch for the current session is running. When the button is clicked, it runs the `sessiontracker.toggleStopwatches` command.
* `sessiontracker.unopened_folder_behavior.showWarningOnExtensionStart`: When Visual Studio Code first starts in an environment where a folder isn't opened and this is true, it will show a warning stating that it is not tracking time along with a button that will activate the `sessiontracker.showTrackedTimes` command.

## Known Issues

> No known issues at the moment, hopefully no more will pop up in the future.

## Release Notes

Users appreciate release notes as you update your extension.

## 0.5.0
 - Cleaned up and abstracted some extension code to make it easier to read and edit. There could be bugs from reorganizing/rewriting the code, so please do report them if you see any.
 - Updated the command `sessiontracker.showTrackedTimes` to `sessiontracker.showAllTrackedTimes` and changed the label of the command from `Session Tracker: Show Session Tracker Times` to `Session Tracker: Show All Tracked Times`.
 - The picker when you run `sessiontracker.showProjectDetails`, now allows you to search based on the label, description (which is considered the `active` text), and detail (the uri or devname of the project) shown instead of just the label and description.

## 0.4.0
 - Individual session times and start times now save in the json file.
    - There is still the total_time in the json which will always be more accurate than iterating through session_times for getting the total time of a project.
 - Added new command, `Show Project Details` (`sessiontracker.showProjectDetails`), to show project details. These project details include:
    - Display name
    - Dev Name (uri)
    - Total Time
    - Individual Session Times)
 - Updated web views to open up in the currently active side instead of the left side.

### 0.3.0

Version where git repository was made public.