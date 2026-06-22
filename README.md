# Syllogistic Reasoning Mouse-Tracking Experiment

Final standalone local browser experiment for a syllogistic reasoning task with mouse tracking, Latin-square trial ordering, fixed participant-code assignment, fixed YES/NO button mapping, first-deadline-only beep, and one ZIP data export.

This version does **not** use Google Sheets, does **not** require an internet connection, and does **not** include a restore/continue-previous-session option.

## Files

- `index.html` — open this file in Chrome or Edge to run the experiment.
- `app.js` — experiment logic, timers, Latin-square order, fixed P001-P020 assignment, mouse tracking, ZIP export.
- `styles.css` — visual styling.
- `participant_assignment_plan.csv` — researcher-facing assignment table for participant code, condition, YES side, and counterbalance index.

## Participant-code workflow

Use each code exactly once:

```text
P001, P002, P003, ..., P020
```

The participant code controls:

1. time-enforcement condition: soft or strict;
2. fixed YES/NO button side for the full experiment;
3. Latin-square trial order.

The app accepts only codes from `P001` to `P020`.

## Assignment plan

The plan gives exactly 10 soft and 10 strict participants, and also avoids a perfect correlation between condition and YES-button side.

| Code | Condition | YES side | NO side |
|---|---|---|---|
| P001 | soft | left | right |
| P002 | strict | left | right |
| P003 | soft | right | left |
| P004 | strict | right | left |
| P005 | soft | left | right |
| P006 | strict | left | right |
| P007 | soft | right | left |
| P008 | strict | right | left |
| P009 | soft | left | right |
| P010 | strict | left | right |
| P011 | soft | right | left |
| P012 | strict | right | left |
| P013 | soft | left | right |
| P014 | strict | left | right |
| P015 | soft | right | left |
| P016 | strict | right | left |
| P017 | strict | left | right |
| P018 | soft | left | right |
| P019 | strict | right | left |
| P020 | soft | right | left |

## Latin-square ordering

Trial order is determined by participant number:

```text
counterbalance_index = (participant_number - 1) % 16
```

P001-P016 cover the 16 counterbalanced schedules once. P017-P020 repeat the first four schedules while preserving the final 10/10 condition balance.

The trial-order metadata is saved in the output files:

- `presentation_order_method`
- `counterbalance_index`
- `belief_condition_order_index`
- `neutral_order_index`
- `neutral_block_position`
- `conclusion_block_order`

## What the app records

Participants complete 12 syllogistic reasoning trials. For each trial they provide:

1. a first intuitive YES/NO answer under a 10-second deadline;
2. a confidence rating from 1 to 7;
3. a final YES/NO answer after up to 60 seconds;
4. a second confidence rating.

The app records answers, accuracy, response times, confidence ratings, answer changes, timeout/late/on-time status, fixed button positions, click events, mouse samples every 25 ms, and derived mouse metrics.

## Output

At the end of the experiment, the browser downloads one ZIP file:

```text
experiment_data_P001.zip
```

Inside the ZIP are two files:

```text
full_session_P001.json
trial_summary_P001.csv
```

The JSON contains the complete session, including raw mouse samples. The CSV contains trial-level summary and derived metrics.

If the automatic ZIP download is blocked, the final screen has one manual button: `Download data ZIP`. Do not close the final screen until the ZIP appears in the Downloads folder.

## Running locally

Open `index.html` directly in Chrome or Edge.

For more stable behavior, run a local server from the project folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Recommended researcher procedure

1. Assign each participant one unused code from P001-P020.
2. Mark the code as used in your own tracking sheet.
3. Run the experiment locally on the participant computer.
4. At the end, verify that the ZIP file appears in Downloads.
5. Ask every researcher/participant to send back the ZIP file.
6. Do not reuse participant codes.

## Important operational note

There is no restore function in this version. If a participant closes the browser before finishing the experiment and downloading the ZIP, that session should be treated as incomplete and should not be resumed.

## Privacy note

Use only anonymous participant codes. Do not ask participants to enter national ID numbers, phone numbers, or other directly identifying information unless explicitly approved.
