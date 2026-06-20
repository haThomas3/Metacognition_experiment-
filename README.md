# Syllogistic Reasoning Mouse-Tracking Experiment

Local browser-based experiment for a syllogistic reasoning task with mouse tracking, Latin-square trial ordering, circular countdown timer, and optional central Google Sheets logging.

## Files

- `index.html` — open this file in a browser to run the experiment.
- `app.js` — experiment logic, timers, Latin-square order, data collection, CSV/JSON export, Google Sheets sync.
- `styles.css` — visual styling.
- `google_apps_script.gs` — Google Apps Script backend for central Google Sheets logging and balanced condition assignment.

## What the app does

Participants complete 12 syllogistic reasoning trials. For each trial they provide:

1. a first intuitive yes/no answer under a 10-second deadline,
2. a confidence rating from 1 to 7,
3. a final yes/no answer after up to 60 seconds,
4. a second confidence rating.

The app records response times, accuracy, confidence ratings, answer changes, click events, and mouse movement samples.

## Trial order

The experiment uses Latin-square counterbalancing rather than full randomization. Participant order is based on the centrally assigned `participant_number` from the Google Sheet backend.

## Condition assignment

The app no longer requires researchers to choose `soft` or `strict` manually.

When Google Sheets is configured, condition assignment happens centrally in the Apps Script backend:

- initially, conditions are assigned randomly;
- once one condition reaches 10 participants, new participants are assigned to the other condition;
- the reservation is protected with `LockService`, so two parallel sessions should not receive the same participant number.

The assigned condition is not shown to participants.

## Data output

At the end of each participant session, the browser still downloads exactly two local files:

1. `full_session_[participant_code]_[timestamp].json`
2. `trial_summary_[participant_code]_[timestamp].csv`

The Google Sheet receives:

- one row per participant in the `Participants` tab;
- one row per trial in the `Trials` tab;
- logging/debug events in the `Logs` tab.

Raw mouse samples are kept in the local JSON file and are not uploaded to Google Sheets, because they can be very large and may exceed practical Google Sheets / Apps Script limits.

## Google Sheets setup

A Google Sheet was prepared with three tabs:

- `Participants`
- `Trials`
- `Logs`

To connect the app:

1. Open the Google Sheet.
2. Go to `Extensions` -> `Apps Script`.
3. Paste the contents of `google_apps_script.gs` into `Code.gs`.
4. Click `Deploy` -> `New deployment`.
5. Choose type: `Web app`.
6. Set `Execute as`: `Me`.
7. Set `Who has access`: `Anyone with the link`.
8. Deploy and copy the Web App URL.
9. Open `app.js` and replace:

```js
const GOOGLE_SHEETS_WEB_APP_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

with the deployed Web App URL.

If this URL is not configured, the experiment will stop after the demographic questionnaire and show an error. This prevents accidental local-only data collection when central assignment is required.

## Running locally

Open `index.html` in Chrome or Edge.

For more stable behavior, run a local server from the project folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Researcher workflow

1. Configure the Google Apps Script Web App URL in `app.js`.
2. Open the experiment on the participant's computer.
3. Participant fills the demographic form.
4. The app reserves a participant number and condition in the shared Google Sheet.
5. Participant completes the experiment.
6. The local JSON and CSV files download.
7. Participant and trial-summary rows are uploaded to the shared Google Sheet.
8. Keep the local JSON file as the main backup for raw mouse data.

## Important limitations

- The local JSON file is still necessary for complete raw mouse-tracking data.
- Google Sheets is used for central participant/trial tracking and condition balancing, not for raw mouse samples.
- If the browser is offline or Apps Script is not deployed, participant reservation will fail.
- If multiple researchers run the experiment in parallel, the Apps Script lock should prevent duplicate participant numbers.

## Privacy note

Use anonymous participant codes. Avoid national ID numbers, phone numbers, or other directly identifying information unless explicitly approved.
