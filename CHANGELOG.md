# Change Log
## 1.0.0
Initial release!

- Added tracking time!
- Added a webview that shows session times along with all saved times. Activate it with the command: `sessiontracker.showTrackedTimes` (Displayed as: `Session Tracker: Show Session Tracker Times`)
- Added a command that toggles the state of tracking time: `sessiontracker.toggleStopwatches`  (Displayed as: `Session Tracker: Toggle Tracking Times`)
- Added a status bar button that does the same as the above command. Shown in the bottom-right and shows if the window is tracking time or not.
- Added a configuration property that determines if the time that is not spent focused on the window is counted toward session time: `sessiontracker.stopwatch.changebasedonfocus`