/**
 * Google Apps Script backend for the Syllogistic Reasoning Mouse-Tracking Experiment.
 *
 * Setup:
 * 1. Open the Google Sheet created for this experiment.
 * 2. Extensions -> Apps Script.
 * 3. Paste this file into Code.gs.
 * 4. Deploy -> New deployment -> Web app.
 * 5. Execute as: Me.
 * 6. Who has access: Anyone with the link.
 * 7. Copy the Web App URL into GOOGLE_SHEETS_WEB_APP_URL in app.js.
 */

const SPREADSHEET_ID = '1yQiVpdPWSnOLENCTf_fMsHlvcHQGvV8vXje-1aKIfvM';
const TARGET_PER_CONDITION = 10;
const ALLOW_FORCED_CONDITION = false;

const PARTICIPANTS_SHEET = 'Participants';
const TRIALS_SHEET = 'Trials';
const LOGS_SHEET = 'Logs';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const callback = params.callback || 'callback';
  let output;

  try {
    if (params.action === 'reserve') {
      output = reserveParticipant(params);
    } else {
      output = { ok: false, error: 'Unknown GET action.' };
    }
  } catch (err) {
    output = { ok: false, error: String(err && err.message ? err.message : err) };
    logEvent('error', '', '', '', 'doGet failed', JSON.stringify(output));
  }

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(output) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  let output;
  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(body);

    if (payload.action === 'complete') {
      output = completeParticipant(payload);
    } else {
      output = { ok: false, error: 'Unknown POST action.' };
    }
  } catch (err) {
    output = { ok: false, error: String(err && err.message ? err.message : err) };
    logEvent('error', '', '', '', 'doPost failed', JSON.stringify(output));
  }

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function reserveParticipant(params) {
  return withScriptLock(function () {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(PARTICIPANTS_SHEET);
    const headers = getHeaders(sheet);
    const rows = getDataObjects(sheet);

    const participantNumber = getNextParticipantNumber(rows);
    const counts = countConditions(rows);
    const forced = params.forced_condition || '';
    const assignedCondition = chooseCondition(counts, forced);

    const now = new Date().toISOString();
    const demographics = safeJsonParse(params.demographics_json || '{}');
    const browser = safeJsonParse(params.browser_json || '{}');

    const row = makeRow(headers, {
      participant_number: participantNumber,
      participant_code: params.participant_code || '',
      participant_id: params.participant_id || '',
      session_id: params.session_id || '',
      assigned_condition: assignedCondition,
      status: 'reserved',
      reservation_source: 'google_sheet_lock',
      reserved_at: now,
      started_at: now,
      completed_at: '',
      full_json_filename: '',
      trial_csv_filename: '',
      age: demographics.age || '',
      gender: demographics.gender || '',
      native_language: demographics.native_language || '',
      english_proficiency: demographics.english_proficiency || '',
      logic_experience: demographics.logic_experience || '',
      dominant_hand: demographics.dominant_hand || '',
      input_device: demographics.input_device || '',
      vision_status: demographics.vision_status || '',
      motor_difficulty: demographics.motor_difficulty || '',
      app_version: params.app_version || '',
      user_agent: browser.user_agent || '',
      viewport_width: browser.viewport_width || '',
      viewport_height: browser.viewport_height || '',
      counterbalance_index: '',
      presentation_order_method: '',
    });

    sheet.appendRow(row);

    const countsAfter = countConditions(getDataObjects(sheet));
    logEvent('reserve', participantNumber, params.participant_code || '', params.session_id || '', 'reserved participant', JSON.stringify({ assignedCondition, countsBefore: counts, countsAfter }));

    return {
      ok: true,
      participant_number: participantNumber,
      assigned_condition: assignedCondition,
      counts_before: counts,
      counts_after: countsAfter,
    };
  });
}

function completeParticipant(payload) {
  return withScriptLock(function () {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const participantsSheet = ss.getSheetByName(PARTICIPANTS_SHEET);
    const trialsSheet = ss.getSheetByName(TRIALS_SHEET);

    updateParticipantCompletion(participantsSheet, payload);
    const appendedTrials = appendTrialsIfNeeded(trialsSheet, payload);

    logEvent('complete', payload.participant_number || '', payload.participant_code || '', payload.session_id || '', 'completed participant', JSON.stringify({ appendedTrials }));

    return {
      ok: true,
      participant_number: payload.participant_number || '',
      session_id: payload.session_id || '',
      appended_trials: appendedTrials,
    };
  });
}

function updateParticipantCompletion(sheet, payload) {
  const headers = getHeaders(sheet);
  const sessionCol = headers.indexOf('session_id') + 1;
  if (sessionCol < 1) throw new Error('session_id column not found in Participants sheet.');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const sessionValues = sheet.getRange(2, sessionCol, lastRow - 1, 1).getValues().flat();
  const rowOffset = sessionValues.findIndex(v => String(v) === String(payload.session_id));
  if (rowOffset < 0) return;

  const rowNumber = rowOffset + 2;
  const values = {
    status: payload.completion_status || 'completed',
    completed_at: payload.experiment_end_time || new Date().toISOString(),
    full_json_filename: payload.full_json_filename || '',
    trial_csv_filename: payload.trial_csv_filename || '',
    counterbalance_index: payload.counterbalance_index ?? '',
    presentation_order_method: payload.presentation_order_method || '',
  };

  Object.keys(values).forEach(key => {
    const col = headers.indexOf(key) + 1;
    if (col > 0) sheet.getRange(rowNumber, col).setValue(values[key]);
  });
}

function appendTrialsIfNeeded(sheet, payload) {
  const headers = getHeaders(sheet);
  const sessionCol = headers.indexOf('session_id') + 1;
  const trialData = Array.isArray(payload.trial_data) ? payload.trial_data : [];
  if (!trialData.length) return 0;

  if (sessionCol > 0 && sheet.getLastRow() >= 2) {
    const existingSessions = sheet.getRange(2, sessionCol, sheet.getLastRow() - 1, 1).getValues().flat();
    if (existingSessions.some(v => String(v) === String(payload.session_id))) {
      return 0;
    }
  }

  const rows = trialData.map(trial => makeRow(headers, {
    participant_number: payload.participant_number || trial.participant_number || '',
    participant_code: payload.participant_code || trial.participant_code || '',
    participant_id: payload.participant_id || trial.participant_id || '',
    session_id: payload.session_id || trial.session_id || '',
    assigned_condition: payload.assigned_condition || trial.assigned_condition || '',
    ...trial,
  }));

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  return rows.length;
}

function chooseCondition(counts, forced) {
  if (ALLOW_FORCED_CONDITION && (forced === 'soft' || forced === 'strict')) return forced;

  const soft = counts.soft || 0;
  const strict = counts.strict || 0;

  if (soft >= TARGET_PER_CONDITION && strict < TARGET_PER_CONDITION) return 'strict';
  if (strict >= TARGET_PER_CONDITION && soft < TARGET_PER_CONDITION) return 'soft';
  if (soft >= TARGET_PER_CONDITION && strict >= TARGET_PER_CONDITION) return soft <= strict ? 'soft' : 'strict';

  return Math.random() < 0.5 ? 'soft' : 'strict';
}

function countConditions(rows) {
  return rows.reduce((acc, row) => {
    const status = String(row.status || '').toLowerCase();
    const condition = String(row.assigned_condition || '').toLowerCase();
    if (!['reserved', 'in_progress', 'completed'].includes(status)) return acc;
    if (condition === 'soft') acc.soft += 1;
    if (condition === 'strict') acc.strict += 1;
    return acc;
  }, { soft: 0, strict: 0 });
}

function getNextParticipantNumber(rows) {
  const maxNumber = rows.reduce((max, row) => {
    const n = Number(row.participant_number);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return maxNumber + 1;
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

function getDataObjects(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  const headers = getHeaders(sheet);
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function makeRow(headers, obj) {
  return headers.map(h => obj[h] == null ? '' : obj[h]);
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text || '{}');
  } catch (_) {
    return {};
  }
}

function logEvent(eventType, participantNumber, participantCode, sessionId, message, payloadJson) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(LOGS_SHEET);
    sheet.appendRow([new Date().toISOString(), eventType, participantNumber, participantCode, sessionId, message, payloadJson || '']);
  } catch (_) {
    // Avoid throwing from logging.
  }
}

function withScriptLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}
