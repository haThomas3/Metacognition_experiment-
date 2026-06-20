# Syllogistic Reasoning Mouse-Tracking Experiment

Local browser-based experiment for a syllogistic reasoning task with mouse tracking.

## Files

- `index.html` — open this file in a browser to run the experiment.
- `app.js` — experiment logic, timers, data collection, CSV/JSON export.
- `styles.css` — visual styling.

## How to run locally

1. Extract the ZIP file.
2. Open `index.html` in Chrome or Edge.
3. Run one participant at a time.
4. At the end of the session, the browser will attempt to download exactly two files:
   - `full_session_[participant_code]_[timestamp].json`
   - `trial_summary_[participant_code]_[timestamp].csv`
5. If the browser blocks automatic downloads, use the two manual backup download buttons on the final screen.

## Important data note

This is a local version. Files download to the computer running the experiment. If the app is sent to remote participants, the files will download to their computers, not to the researcher’s computer.

## Version 1.2.0 changes

- Replaced the rectangular countdown timer with a larger circular countdown timer.
- The circular timer ring visually shrinks as time runs out.
- At half time, approximately half of the ring remains; at zero, the ring disappears.

## Version 1.1.0 changes

- The assigned condition is no longer displayed to participants.
- Added a centered “Continue to final answer” screen after the first confidence rating, so the final-answer phase starts from a central mouse position.
- Added a required `Participant code` field in the demographic questionnaire.
- Downloaded filenames use the participant code when available.
- CSV rows include `participant_code`.

## Participant code recommendation

Use a researcher-assigned anonymous code such as `P001`, `P002`, etc. Avoid collecting national ID numbers unless your course or ethics approval explicitly requires it.
