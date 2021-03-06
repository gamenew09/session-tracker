# Change Log
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

## 0.1.x - 0.3.0
All of the changes from 0.1.x to 0.3.0. In the future, there will be per version changes.

- Added tracking time!
- Added a webview that shows session times along with all saved times. Activate it with the command: `sessiontracker.showTrackedTimes` (Displayed as: `Session Tracker: Show Session Tracker Times`)
    - The webview shows any active timers in the window as white text, along with the time in the current session and the total time.
    - If the text is grey, then it means that the folder is either inactive or not apart of the current window.
    - If the text is red, then that means the timer is stopped.
    - Currently the view refreshes times by removing all table row elements, so finding things will most likely have the highlights removed every second.
- Added a command that toggles the state of tracking time when a folder is opened (if a folder is not opened, it will show an error message): `sessiontracker.toggleStopwatches`  (Displayed as: `Session Tracker: Toggle Tracking Times`)
- Added a status bar button that does the same as the above command. Shown in the bottom-right and shows if the window is tracking time or not.
- Added a configuration property that determines if the time that is not spent focused on the window is counted toward session time: `sessiontracker.stopwatch.changebasedonfocus`
- Added a feature that will automatically turn on the stopwatches depending on what you are doing, these are configurable using: `sessiontracker.stopwatch_behavior.autostarttimer` and `sessiontracker.stopwatch_behavior.autostarttimer_actions`
- Added a session time status bar item at the bottom right. Shows how much time you have edited a folder in a session. It does change depending on what file you look at, so there might be a chance the timer is a bit off for each folder. When you click on it, it opens the `Session Tracker Times` webview.
- Added a warning that occurs when the extension is loaded (currently when VS Code loads) that indicates that time is not being tracked but you can still look at already tracked times. Along with the warning, it has a button that will run the `sessiontracker.showTrackedTimes` command.