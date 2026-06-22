/*
  Syllogistic Reasoning Mouse-Tracking Experiment
  Local browser-based single-page application.
  Data are kept in memory during the session and downloaded locally as a ZIP at the end.
*/

const APP_VERSION = "1.6.2";

// Standalone local mode.
// No Google Sheets connection is required. Researchers assign participant codes P001-P020 manually.
const DATA_COLLECTION_MODE = "standalone_local_download";

// Fixed 20-participant plan. This guarantees 10 soft and 10 strict sessions
// when the researcher uses each code P001-P020 exactly once.
const MAX_STANDALONE_PARTICIPANTS = 20;
const CONDITION_BY_PARTICIPANT_NUMBER = [
  "soft", "strict", "soft", "strict",
  "soft", "strict", "soft", "strict",
  "soft", "strict", "soft", "strict",
  "soft", "strict", "soft", "strict",
  "strict", "soft", "strict", "soft",
];

// Fixed response-side plan. This keeps YES/NO placement constant for each participant
// and avoids a perfect correlation between condition and button side.
const YES_SIDE_BY_PARTICIPANT_NUMBER = [
  "left", "left", "right", "right",
  "left", "left", "right", "right",
  "left", "left", "right", "right",
  "left", "left", "right", "right",
  "left", "left", "right", "right",
];

const PHASES = {
  WELCOME: "welcome",
  CONSENT: "consent",
  DEMOGRAPHICS: "demographics",
  INSTRUCTIONS: "instructions",
  PRACTICE_START: "practice_start",
  PRACTICE_RESPONSE: "practice_response",
  PRACTICE_FEEDBACK: "practice_feedback",
  TRIAL_START: "trial_start",
  FIRST_RESPONSE: "first_answer",
  CONFIDENCE_1: "confidence1",
  CENTER_BEFORE_FINAL: "center_before_final",
  FINAL_RESPONSE: "final_answer",
  CONFIDENCE_2: "confidence2",
  END: "end",
};

const stimuli = [
  {
    problem_id: "T01",
    belief_type: "believable",
    validity: "valid",
    conclusion_form: "Some C are not A",
    premise1: "No police dogs are argonelles.",
    premise2: "Some highly trained dogs are argonelles.",
    conclusion: "Therefore, some highly trained dogs are not police dogs.",
    correct_answer: "YES",
  },
  {
    problem_id: "T02",
    belief_type: "neutral",
    validity: "valid",
    conclusion_form: "Some C are not A",
    premise1: "No Welps are lawyers.",
    premise2: "Some Abens are lawyers.",
    conclusion: "Therefore, some Abens are not Welps.",
    correct_answer: "YES",
  },
  {
    problem_id: "T03",
    belief_type: "unbelievable",
    validity: "valid",
    conclusion_form: "Some C are not A",
    premise1: "No addictive things are ramadions.",
    premise2: "Some cigarettes are ramadions.",
    conclusion: "Therefore, some cigarettes are not addictive things.",
    correct_answer: "YES",
  },
  {
    problem_id: "T04",
    belief_type: "neutral",
    validity: "invalid",
    conclusion_form: "Some C are not A",
    premise1: "Some Delpads are bird watchers.",
    premise2: "No Furels are bird watchers.",
    conclusion: "Therefore, some Furels are not Delpads.",
    correct_answer: "NO",
  },
  {
    problem_id: "T05",
    belief_type: "believable",
    validity: "invalid",
    conclusion_form: "Some C are not A",
    premise1: "Some vitamin tablets are opprobines.",
    premise2: "No nutritional things are opprobines.",
    conclusion: "Therefore, some nutritional things are not vitamin tablets.",
    correct_answer: "NO",
  },
  {
    problem_id: "T06",
    belief_type: "unbelievable",
    validity: "invalid",
    conclusion_form: "Some C are not A",
    premise1: "Some rich people are Hudons.",
    premise2: "No millionaires are Hudons.",
    conclusion: "Therefore, some millionaires are not rich people.",
    correct_answer: "NO",
  },
  {
    problem_id: "T07",
    belief_type: "believable",
    validity: "valid",
    conclusion_form: "Some A are not C",
    premise1: "Some religious people are Selaciens.",
    premise2: "No priests are Selaciens.",
    conclusion: "Therefore, some religious people are not priests.",
    correct_answer: "YES",
  },
  {
    problem_id: "T08",
    belief_type: "neutral",
    validity: "valid",
    conclusion_form: "Some A are not C",
    premise1: "Some Rewons are bus drivers.",
    premise2: "No Likels are bus drivers.",
    conclusion: "Therefore, some Rewons are not Likels.",
    correct_answer: "YES",
  },
  {
    problem_id: "T09",
    belief_type: "unbelievable",
    validity: "valid",
    conclusion_form: "Some A are not C",
    premise1: "Some astronauts are Lapitars.",
    premise2: "No healthy people are Lapitars.",
    conclusion: "Therefore, some astronauts are not healthy people.",
    correct_answer: "YES",
  },
  {
    problem_id: "T10",
    belief_type: "neutral",
    validity: "invalid",
    conclusion_form: "Some A are not C",
    premise1: "No Mobbes are teachers.",
    premise2: "Some Plicks are teachers.",
    conclusion: "Therefore, some Mobbes are not Plicks.",
    correct_answer: "NO",
  },
  {
    problem_id: "T11",
    belief_type: "believable",
    validity: "invalid",
    conclusion_form: "Some A are not C",
    premise1: "No well-educated people are Pennes.",
    premise2: "Some judges are Pennes.",
    conclusion: "Therefore, some well-educated people are not judges.",
    correct_answer: "NO",
  },
  {
    problem_id: "T12",
    belief_type: "unbelievable",
    validity: "invalid",
    conclusion_form: "Some A are not C",
    premise1: "No deep sea divers are Sylvians.",
    premise2: "Some good swimmers are Sylvians.",
    conclusion: "Therefore, some deep sea divers are not good swimmers.",
    correct_answer: "NO",
  },
];

const practiceStimulus = {
  problem_id: "PRACTICE",
  premise1: "No Mipps are artists.",
  premise2: "Some Lurds are artists.",
  conclusion: "Therefore, some Lurds are not Mipps.",
  correct_answer: "YES",
};

/*
  Counterbalancing method:
  The original experiment did not use full randomization. It used Latin-square counterbalancing.
  This implementation therefore creates structured trial orders:
  - two belief-laden blocks, each containing one item in each belief x validity cell
  - one neutral block containing the four neutral items
  - the belief/validity condition order is Latin-square counterbalanced
  - the neutral block order is Latin-square counterbalanced
  - the neutral block appears either first or last
  - the two conclusion-form blocks are also alternated to avoid always placing one conclusion form earlier
*/
const LATIN_BELIEF_VALIDITY_ORDERS = [
  ["believable_valid", "unbelievable_valid", "believable_invalid", "unbelievable_invalid"],
  ["unbelievable_valid", "believable_invalid", "unbelievable_invalid", "believable_valid"],
  ["believable_invalid", "unbelievable_invalid", "believable_valid", "unbelievable_valid"],
  ["unbelievable_invalid", "believable_valid", "unbelievable_valid", "believable_invalid"],
];

const LATIN_NEUTRAL_ORDERS = [
  ["T02", "T04", "T08", "T10"],
  ["T04", "T08", "T10", "T02"],
  ["T08", "T10", "T02", "T04"],
  ["T10", "T02", "T04", "T08"],
];

const CONCLUSION_FORM_BLOCKS = {
  some_c_not_a: "Some C are not A",
  some_a_not_c: "Some A are not C",
};

const app = document.getElementById("app");

let state = makeInitialState();
let activeTimer = null;
let activeTrackingInterval = null;
let phaseStartMs = 0;
let experimentStartPerfMs = performance.now();
let currentPhaseTimeLimitMs = null;
let currentTrialDraft = null;
let currentTrialSamplesStartIndex = 0;
let trialOrder = [];
let audioContext = null;
let audioPrimed = false;
let latestMouse = {
  x: null,
  y: null,
  buttonDown: false,
};
let automaticDownloadAttempted = false;

function makeInitialState() {
  const now = new Date();
  const participantId = `P_${formatTimestamp(now)}_${randomString(5)}`;
  const sessionId = `S_${formatTimestamp(now)}_${randomString(8)}`;
  return {
    app_version: APP_VERSION,
    participant_id: participantId,
    session_id: sessionId,
    participant_number: null,
    assigned_condition: null,
    yes_button_side: null,
    no_button_side: null,
    forced_condition_from_url: "",
    data_collection_mode: DATA_COLLECTION_MODE,
    standalone_assignment_status: "not_started",
    current_screen: PHASES.WELCOME,
    experiment_start_time: now.toISOString(),
    experiment_end_time: null,
    completion_status: "not_started",
    consent: false,
    demographics: {},
    randomized_trial_order: [],
    presentation_order_method: "latin_square_counterbalancing",
    counterbalance_index: null,
    belief_condition_order_index: null,
    neutral_order_index: null,
    neutral_block_position: null,
    conclusion_block_order: null,
    current_trial_position: 0,
    trial_data: [],
    click_events: [],
    mouse_samples: [],
    browser_info: getBrowserInfo(),
    full_json_filename: "",
    trial_csv_filename: "",
    zip_filename: "",
    download_status: "not_started",
  };
}

function getBrowserInfo() {
  return {
    user_agent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    screen_width: window.screen ? window.screen.width : null,
    screen_height: window.screen ? window.screen.height : null,
    device_pixel_ratio: window.devicePixelRatio || 1,
  };
}

function formatTimestamp(date) {
  return date.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function randomString(length) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function persistSession() {
  // Intentionally no-op in the final standalone version.
  // Previous-session recovery was removed to prevent corrupted partial-session recovery.
}

function clearTimers() {
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }
  if (activeTrackingInterval) {
    clearInterval(activeTrackingInterval);
    activeTrackingInterval = null;
  }
}

function render() {
  clearTimers();
  if (!(state.current_screen === PHASES.WELCOME && state.completion_status === "not_started")) {
    persistSession();
  }
  automaticDownloadAttempted = state.current_screen === PHASES.END ? automaticDownloadAttempted : false;

  switch (state.current_screen) {
    case PHASES.WELCOME:
      renderWelcome();
      break;
    case PHASES.CONSENT:
      renderConsent();
      break;
    case PHASES.DEMOGRAPHICS:
      renderDemographics();
      break;
    case PHASES.INSTRUCTIONS:
      renderInstructions();
      break;
    case PHASES.PRACTICE_START:
      renderPracticeStart();
      break;
    case PHASES.PRACTICE_RESPONSE:
      renderPracticeResponse();
      break;
    case PHASES.PRACTICE_FEEDBACK:
      renderPracticeFeedback();
      break;
    case PHASES.TRIAL_START:
      renderTrialStart();
      break;
    case PHASES.FIRST_RESPONSE:
      renderResponsePhase("first");
      break;
    case PHASES.CONFIDENCE_1:
      renderConfidencePhase(1);
      break;
    case PHASES.CENTER_BEFORE_FINAL:
      renderCenterBeforeFinal();
      break;
    case PHASES.FINAL_RESPONSE:
      renderResponsePhase("final");
      break;
    case PHASES.CONFIDENCE_2:
      renderConfidencePhase(2);
      break;
    case PHASES.END:
      renderEnd();
      break;
    default:
      renderWelcome();
  }
}

function renderWelcome() {
  app.innerHTML = `
    <section class="screen narrow center">
      <h1>Syllogistic Reasoning Experiment</h1>
      <p>This computerized experiment records answers, confidence ratings, response times, and mouse movements.</p>
      <div class="row center" style="justify-content:center;margin-top:24px;">
        <button id="startBtn" data-zone="start_button">Start new session</button>
      </div>
      <p class="small" style="margin-top:20px;">Standalone local version. Data are saved only at the end as a ZIP file on this computer.</p>
    </section>
  `;
  document.getElementById("startBtn").addEventListener("click", () => {
    primeAudio();
    state = makeInitialState();
    experimentStartPerfMs = performance.now();
    currentTrialDraft = null;
    trialOrder = [];
    state.completion_status = "started";
    state.current_screen = PHASES.CONSENT;
    render();
  });
}

function renderConsent() {
  app.innerHTML = `
    <section class="screen narrow">
      <h2>Consent</h2>
      <div class="consent-box" data-zone="consent_text">
        <p>You are invited to take part in a computerized reasoning experiment.</p>
        <p>The task includes syllogistic reasoning problems. The application will collect your answers, confidence ratings, response times, and mouse movements during the task.</p>
        <p>No names are required. A random participant ID will be generated automatically.</p>
        <p>You may stop the task at any time by closing the browser window.</p>
      </div>
      <label style="flex-direction:row;align-items:center;font-weight:400;">
        <input type="checkbox" id="consentCheck" /> I agree to participate.
      </label>
      <div class="row" style="margin-top:20px;">
        <button id="continueConsent" disabled data-zone="continue_button">Continue</button>
      </div>
    </section>
  `;
  const check = document.getElementById("consentCheck");
  const btn = document.getElementById("continueConsent");
  check.addEventListener("change", () => btn.disabled = !check.checked);
  btn.addEventListener("click", () => {
    state.consent = true;
    state.current_screen = PHASES.DEMOGRAPHICS;
    persistSession();
    render();
  });
}


function validateStandaloneParticipantCode(rawCode) {
  const normalized = String(rawCode || "").trim().toUpperCase();
  const match = normalized.match(/^P(\d{3})$/);
  if (!match) {
    return { ok: false, message: "Participant code must be in the format P001 to P020." };
  }
  const number = parseInt(match[1], 10);
  if (!Number.isFinite(number) || number < 1 || number > MAX_STANDALONE_PARTICIPANTS) {
    return { ok: false, message: "Participant code must be between P001 and P020." };
  }
  return {
    ok: true,
    number,
    code: `P${String(number).padStart(3, "0")}`,
    assigned_condition: getAssignedConditionForParticipantNumber(number),
  };
}

function getAssignedConditionForParticipantNumber(participantNumber) {
  const index = Number(participantNumber) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= CONDITION_BY_PARTICIPANT_NUMBER.length) {
    throw new Error("Participant number is outside the supported range P001-P020.");
  }
  return CONDITION_BY_PARTICIPANT_NUMBER[index];
}

function getYesButtonSideForParticipantNumber(participantNumber) {
  const index = Number(participantNumber) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= YES_SIDE_BY_PARTICIPANT_NUMBER.length) {
    throw new Error("Participant number is outside the supported range P001-P020.");
  }
  return YES_SIDE_BY_PARTICIPANT_NUMBER[index];
}

function getNoButtonSideFromYesSide(yesSide) {
  return yesSide === "left" ? "right" : "left";
}

function showInlineError(message) {
  const existing = document.getElementById("participantCodeError");
  if (existing) existing.remove();
  const errorBox = document.createElement("p");
  errorBox.id = "participantCodeError";
  errorBox.className = "error";
  errorBox.textContent = message;
  document.querySelector(".screen").appendChild(errorBox);
}

function renderDemographics() {
  app.innerHTML = `
    <section class="screen">
      <h2>Participant Information</h2>
      <p class="small"><strong>Researcher note:</strong> use each participant code once only, from P001 to P020. The code determines both the Latin-square order and the soft/strict condition.</p>
      <form id="demoForm" class="form-grid" data-zone="demographics_form">
        <label>Participant code
          <input name="participant_code" type="text" required placeholder="P001 to P020" pattern="P[0-9]{3}" />
          <span class="field-note">Use the researcher-assigned code only. Valid codes: P001-P020.</span>
        </label>
        <label>Age
          <input name="age" type="number" min="18" max="120" required />
        </label>
        <label>Gender
          <select name="gender" required>
            <option value="">Select</option>
            <option>Woman</option>
            <option>Man</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
            <option>Other</option>
          </select>
        </label>
        <label>Native language
          <input name="native_language" type="text" required />
        </label>
        <label>English proficiency
          <select name="english_proficiency" required>
            <option value="">Select</option>
            <option value="1">1 - Low</option>
            <option value="2">2 - Basic</option>
            <option value="3">3 - Intermediate</option>
            <option value="4">4 - Good</option>
            <option value="5">5 - Very high/native-like</option>
          </select>
        </label>
        <label>Previous experience with logic, math, statistics, or logical puzzles
          <select name="logic_experience" required>
            <option value="">Select</option>
            <option value="1">1 - Low</option>
            <option value="2">2 - Basic</option>
            <option value="3">3 - Intermediate</option>
            <option value="4">4 - Good</option>
            <option value="5">5 - High</option>
          </select>
        </label>
        <label>Dominant hand
          <select name="dominant_hand" required>
            <option value="">Select</option>
            <option>Right</option>
            <option>Left</option>
            <option>Ambidextrous</option>
          </select>
        </label>
        <label>Input device
          <select name="input_device" required>
            <option value="">Select</option>
            <option>External mouse</option>
            <option>Touchpad</option>
            <option>Other</option>
          </select>
        </label>
        <label>Vision status
          <select name="vision_status" required>
            <option value="">Select</option>
            <option>Normal</option>
            <option>Corrected with glasses/contact lenses</option>
            <option>Difficulty seeing screen text</option>
          </select>
        </label>
        <label>Motor difficulty affecting mouse use
          <select name="motor_difficulty" required>
            <option value="">Select</option>
            <option>No</option>
            <option>Yes</option>
            <option>Prefer not to say</option>
          </select>
        </label>
      </form>
      <div class="row" style="margin-top:22px;">
        <button form="demoForm" type="submit" data-zone="continue_button">Continue</button>
      </div>
    </section>
  `;
  document.getElementById("demoForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    const demographics = Object.fromEntries(fd.entries());
    const validation = validateStandaloneParticipantCode(demographics.participant_code);
    if (!validation.ok) {
      showInlineError(validation.message);
      return;
    }

    demographics.participant_code = validation.code;
    state.demographics = demographics;
    state.participant_number = validation.number;
    state.assigned_condition = validation.assigned_condition;
    state.yes_button_side = getYesButtonSideForParticipantNumber(validation.number);
    state.no_button_side = getNoButtonSideFromYesSide(state.yes_button_side);
    state.standalone_assignment_status = "assigned_from_participant_code";
    state.current_screen = PHASES.INSTRUCTIONS;
    persistSession();
    render();
  });
}



function instructionsText() {
  if (state.assigned_condition === "soft") {
    return `This experiment is designed to examine how people solve logical reasoning problems. Your task is to decide whether the conclusion given at the end of the problem follows logically from the information given within that problem.

For each problem, we want you to provide two answers. The first answer should be the first answer that comes to mind, so the answer that is your first inclination or first instinct. You will be given a 10-second deadline in which to give your first response. If you do not answer before this deadline, you will hear a beep instructing you to answer immediately.

Your second answer should be your final answer. For this answer, you will be given up to 1 minute to fully think through the question. Make sure that you have the logically correct answer before giving your final answer. To choose an answer, please press either the Yes or No buttons on the screen.

You must not make any notes or diagrams of any kind to aid you in this task. To answer each question, you must assume that all information which you are given is true; this is very important. If, and only if, you judge that a given conclusion logically follows from the information given should you choose YES. If you think that the conclusion given does not necessarily follow from the information given you should choose NO.`;
  }
  return `This experiment is designed to examine how people solve logical reasoning problems. Your task is to decide whether the conclusion given at the end of the problem follows logically from the information given within that problem.

For each problem, we want you to provide two answers. The first answer should be the first answer that comes to mind, so the answer that is your first inclination or first instinct. You will be given a 10-second deadline in which to give your first response.

Your second answer should be your final answer. For this answer, you will be given up to 1 minute to fully think through the question. Make sure that you have the logically correct answer before giving your final answer. To choose an answer, please press either the Yes or No buttons on the screen.

You must not make any notes or diagrams of any kind to aid you in this task. To answer each question, you must assume that all information which you are given is true; this is very important. If, and only if, you judge that a given conclusion logically follows from the information given should you choose YES. If you think that the conclusion given does not necessarily follow from the information given you should choose NO.`;
}

function renderInstructions() {
  app.innerHTML = `
    <section class="screen">
      <h2>Instructions</h2>
      <pre data-zone="instructions_text">${escapeHtml(instructionsText())}</pre>
      <div class="row" style="margin-top:20px;">
        <button id="continueInstructions" data-zone="continue_button">Continue to practice</button>
      </div>
    </section>
  `;
  document.getElementById("continueInstructions").addEventListener("click", () => {
    state.current_screen = PHASES.PRACTICE_START;
    render();
  });
}

function renderPracticeStart() {
  app.innerHTML = `
    <section class="screen narrow center">
      <h2>Practice Trial</h2>
      <p>You will now complete one practice trial with feedback.</p>
      <button id="startPractice" data-zone="start_button">Start practice</button>
    </section>
  `;
  document.getElementById("startPractice").addEventListener("click", () => {
    primeAudio();
    startPracticeTrial();
  });
}

function startPracticeTrial() {
  state.current_screen = PHASES.PRACTICE_RESPONSE;
  render();
}

function renderPracticeResponse() {
  app.innerHTML = `
    <section class="screen full trial-layout">
      <div class="phase-header">
        <div><strong>Practice trial</strong></div>
        <div class="small">No data from this trial will be included in the analysis.</div>
      </div>
      ${renderProblem(practiceStimulus, true)}
      <div class="response-area">
        <button class="response-button" data-zone="yes_button" id="practiceYes">YES</button>
        <button class="response-button" data-zone="no_button" id="practiceNo">NO</button>
      </div>
    </section>
  `;
  document.getElementById("practiceYes").addEventListener("click", () => showPracticeFeedback("YES"));
  document.getElementById("practiceNo").addEventListener("click", () => showPracticeFeedback("NO"));
}

function showPracticeFeedback(answer) {
  state.practice_answer = answer;
  state.current_screen = PHASES.PRACTICE_FEEDBACK;
  render();
}

function renderPracticeFeedback() {
  const correct = state.practice_answer === practiceStimulus.correct_answer;
  app.innerHTML = `
    <section class="screen narrow">
      <h2>Practice Feedback</h2>
      <p>Your answer: <strong>${escapeHtml(state.practice_answer)}</strong></p>
      <p class="${correct ? "success" : "error"}">The correct answer is YES.</p>
      <p>Since no Mipps are artists, and some Lurds are artists, those Lurds cannot be Mipps. Therefore, the conclusion follows logically.</p>
      <button id="beginTrials" data-zone="continue_button">Begin real trials</button>
    </section>
  `;
  document.getElementById("beginTrials").addEventListener("click", () => {
    startExperimentTrials();
  });
}


function getParticipantOrderNumber() {
  const participantNumber = Number(state.participant_number);
  if (Number.isFinite(participantNumber) && participantNumber > 0) return participantNumber - 1;
  return getParticipantOrderNumberFromCode() - 1;
}

function getParticipantOrderNumberFromCode() {
  const code = String(state.demographics.participant_code || "").trim();
  const digitMatch = code.match(/\d+/);
  if (digitMatch) {
    const parsed = parseInt(digitMatch[0], 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return stableStringHash(code || state.participant_id) + 1;
}

function stableStringHash(value) {
  const str = String(value || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildLatinSquareTrialOrder() {
  const orderNumber = getParticipantOrderNumber();

  // 16 schedules = 4 Latin condition orders x 2 neutral-block positions x 2 conclusion-block orders.
  const counterbalanceIndex = orderNumber % 16;
  const beliefConditionOrderIndex = counterbalanceIndex % 4;
  const neutralOrderIndex = Math.floor(counterbalanceIndex / 2) % 4;
  const neutralFirst = Math.floor(counterbalanceIndex / 4) % 2 === 0;
  const cThenA = Math.floor(counterbalanceIndex / 8) % 2 === 0;

  const conditionOrder = LATIN_BELIEF_VALIDITY_ORDERS[beliefConditionOrderIndex];
  const neutralOrder = LATIN_NEUTRAL_ORDERS[neutralOrderIndex];

  const someCBlock = conditionOrder.map((conditionKey) =>
    findStimulusByConditionKey(conditionKey, CONCLUSION_FORM_BLOCKS.some_c_not_a)
  );

  const someABlock = conditionOrder.map((conditionKey) =>
    findStimulusByConditionKey(conditionKey, CONCLUSION_FORM_BLOCKS.some_a_not_c)
  );

  const beliefBlocks = cThenA ? [someCBlock, someABlock] : [someABlock, someCBlock];
  const neutralBlock = neutralOrder.map((problemId) => findStimulusById(problemId));

  const orderedStimuli = neutralFirst
    ? [...neutralBlock, ...beliefBlocks.flat()]
    : [...beliefBlocks.flat(), ...neutralBlock];

  return {
    orderedStimuli,
    metadata: {
      presentation_order_method: "latin_square_counterbalancing",
      counterbalance_index: counterbalanceIndex,
      belief_condition_order_index: beliefConditionOrderIndex,
      neutral_order_index: neutralOrderIndex,
      neutral_block_position: neutralFirst ? "first" : "last",
      conclusion_block_order: cThenA ? "Some C are not A -> Some A are not C" : "Some A are not C -> Some C are not A",
    },
  };
}

function findStimulusByConditionKey(conditionKey, conclusionForm) {
  const [beliefType, validity] = conditionKey.split("_");
  const stimulus = stimuli.find((item) =>
    item.belief_type === beliefType &&
    item.validity === validity &&
    item.conclusion_form === conclusionForm
  );
  if (!stimulus) {
    throw new Error(`Missing stimulus for ${conditionKey} / ${conclusionForm}`);
  }
  return stimulus;
}

function findStimulusById(problemId) {
  const stimulus = stimuli.find((item) => item.problem_id === problemId);
  if (!stimulus) throw new Error(`Missing stimulus with problem_id ${problemId}`);
  return stimulus;
}

function startExperimentTrials() {
  if (!state.assigned_condition || !state.participant_number) {
    alert("Participant code assignment is not complete. Please return to the participant information screen and enter a valid code P001-P020.");
    state.current_screen = PHASES.DEMOGRAPHICS;
    render();
    return;
  }

  const counterbalancedOrder = buildLatinSquareTrialOrder();
  trialOrder = counterbalancedOrder.orderedStimuli;

  state.randomized_trial_order = trialOrder.map(t => t.problem_id);
  state.presentation_order_method = counterbalancedOrder.metadata.presentation_order_method;
  state.counterbalance_index = counterbalancedOrder.metadata.counterbalance_index;
  state.belief_condition_order_index = counterbalancedOrder.metadata.belief_condition_order_index;
  state.neutral_order_index = counterbalancedOrder.metadata.neutral_order_index;
  state.neutral_block_position = counterbalancedOrder.metadata.neutral_block_position;
  state.conclusion_block_order = counterbalancedOrder.metadata.conclusion_block_order;

  state.current_trial_position = 0;
  state.trial_data = [];
  state.click_events = [];
  state.mouse_samples = [];
  state.completion_status = "in_progress";
  state.current_screen = PHASES.TRIAL_START;
  persistSession();
  render();
}

function getCurrentStimulus() {
  return trialOrder[state.current_trial_position];
}

function renderTrialStart() {
  if (state.current_trial_position >= trialOrder.length) {
    finishExperiment("completed");
    return;
  }
  const idx = state.current_trial_position + 1;
  app.innerHTML = `
    <section class="screen narrow center">
      <h2>Trial ${idx} of ${trialOrder.length}</h2>
      <p>Click the button below to start this trial.</p>
      <p class="small">The mouse starts each trial from the same central location.</p>
      <button id="startTrial" data-zone="start_trial_button">Start trial</button>
    </section>
  `;
  document.getElementById("startTrial").addEventListener("click", () => {
    primeAudio();
    beginTrial();
  });
}

function beginTrial() {
  const stim = getCurrentStimulus();
  const yesLeft = state.yes_button_side === "left";
  currentTrialDraft = {
    participant_number: state.participant_number,
    participant_id: state.participant_id,
    participant_code: state.demographics.participant_code || "",
    session_id: state.session_id,
    assigned_condition: state.assigned_condition,
    participant_yes_button_side: state.yes_button_side,
    participant_no_button_side: state.no_button_side,
    response_side_assignment_method: "fixed_by_participant_code",
    presentation_order_method: state.presentation_order_method,
    counterbalance_index: state.counterbalance_index,
    belief_condition_order_index: state.belief_condition_order_index,
    neutral_order_index: state.neutral_order_index,
    neutral_block_position: state.neutral_block_position,
    conclusion_block_order: state.conclusion_block_order,
    trial_index: state.current_trial_position + 1,
    problem_id: stim.problem_id,
    belief_type: stim.belief_type,
    validity: stim.validity,
    conclusion_form: stim.conclusion_form,
    correct_answer: stim.correct_answer,
    yes_button_side: yesLeft ? "left" : "right",
    no_button_side: yesLeft ? "right" : "left",
    response1: "",
    response1_accuracy: "",
    response1_rt_ms: "",
    response1_status: "missing",
    confidence1: "",
    confidence1_rt_ms: "",
    final_response: "",
    final_accuracy: "",
    final_rt_ms: "",
    response2_status: "missing",
    confidence2: "",
    confidence2_rt_ms: "",
    answer_changed: "",
    trial_completed: false,
  };
  currentTrialSamplesStartIndex = state.mouse_samples.length;
  state.current_screen = PHASES.FIRST_RESPONSE;
  render();
}

function renderProblem(stim, visible) {
  if (!visible) {
    return `<div class="problem-card hidden-problem" data-zone="problem_text">Problem text hidden after deadline</div>`;
  }
  return `
    <div class="problem-card" data-zone="problem_text">
      <p><strong>Premise 1:</strong> ${escapeHtml(stim.premise1)}</p>
      <p><strong>Premise 2:</strong> ${escapeHtml(stim.premise2)}</p>
      <p><strong>Conclusion:</strong> ${escapeHtml(stim.conclusion)}</p>
    </div>
  `;
}

function renderCenterBeforeFinal() {
  // This centered button recenters the participant's mouse before the final-answer phase.
  // The final-answer timer and mouse tracking start only after this button is clicked.
  app.innerHTML = `
    <section class="screen narrow center">
      <h2>Prepare for the final answer</h2>
      <p>You will now see the same problem again and give your final answer.</p>
      <p class="small">Click the button below to continue.</p>
      <button id="continueFinal" data-zone="center_continue_button">Continue to final answer</button>
    </section>
  `;
  document.getElementById("continueFinal").addEventListener("click", () => {
    state.current_screen = PHASES.FINAL_RESPONSE;
    persistSession();
    render();
  });
}

function renderResponsePhase(kind, options = {}) {
  const stim = getCurrentStimulus();
  const isFirst = kind === "first";
  const limitMs = isFirst ? 10000 : 60000;
  const title = isFirst ? "First answer" : "Final answer";
  const phaseName = isFirst ? PHASES.FIRST_RESPONSE : PHASES.FINAL_RESPONSE;
  const showQuestion = !isFirst;
  const visibleProblem = options.visibleProblem !== false;
  const yesFirst = currentTrialDraft.yes_button_side === "left";
  app.innerHTML = `
    <section class="screen full trial-layout">
      <div class="phase-header">
        <div>
          <strong>${title}</strong><br />
          <span class="small">Trial ${state.current_trial_position + 1} of ${trialOrder.length}</span>
        </div>
        <div class="timer circular-timer" id="timer" data-zone="timer" style="--progress: 1;">
          <div class="timer-inner">
            <span class="timer-text">${formatRemaining(limitMs)}</span>
          </div>
        </div>
      </div>
      <div>
        ${showQuestion ? '<h2 class="center" id="finalQuestion" data-zone="final_question">What is your final answer?</h2>' : ""}
        <div id="warning" class="flash" data-zone="warning"></div>
        <div id="problemContainer">${renderProblem(stim, visibleProblem)}</div>
      </div>
      <div class="response-area">
        ${yesFirst ? responseButtonsHtml() : responseButtonsHtml(true)}
      </div>
    </section>
  `;
  startPhaseTracking(phaseName, limitMs);
  document.getElementById("yesBtn").addEventListener("click", () => handleResponse(kind, "YES"));
  document.getElementById("noBtn").addEventListener("click", () => handleResponse(kind, "NO"));
  startCountdown(limitMs, () => handleResponseTimeout(kind));
}

function responseButtonsHtml(reverse = false) {
  const yes = `<button class="response-button" id="yesBtn" data-zone="yes_button">YES</button>`;
  const no = `<button class="response-button" id="noBtn" data-zone="no_button">NO</button>`;
  return reverse ? `${no}${yes}` : `${yes}${no}`;
}

function startPhaseTracking(phase, timeLimitMs = null) {
  clearTimers();
  phaseStartMs = performance.now();
  currentPhaseTimeLimitMs = timeLimitMs;
  activeTrackingInterval = setInterval(() => {
    recordMouseSample(phase);
  }, 25);
}

function stopPhaseTracking() {
  if (activeTrackingInterval) {
    clearInterval(activeTrackingInterval);
    activeTrackingInterval = null;
  }
}

function startCountdown(durationMs, onExpired) {
  const timerEl = document.getElementById("timer");
  const timerTextEl = timerEl ? timerEl.querySelector(".timer-text") : null;
  let expired = false;
  activeTimer = setInterval(() => {
    const elapsed = performance.now() - phaseStartMs;
    const remaining = Math.max(0, durationMs - elapsed);
    const progress = durationMs > 0 ? Math.max(0, Math.min(1, remaining / durationMs)) : 0;

    if (timerEl) {
      timerEl.style.setProperty("--progress", progress.toFixed(4));
      if (timerTextEl) timerTextEl.textContent = formatRemaining(remaining);
      if (remaining <= 0) timerEl.classList.add("expired");
    }

    if (!expired && elapsed >= durationMs) {
      expired = true;
      onExpired();
    }
  }, 50);
}

function formatRemaining(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds}s`;
}

function handleResponseTimeout(kind) {
  const isFirst = kind === "first";
  const isSoft = state.assigned_condition === "soft";

  // The original syllogism experiment describes a beep only after the 10-second
  // first-answer deadline. The final-answer 60-second deadline has no beep.
  hideProblemText();

  if (isSoft) {
    if (isFirst) {
      playBeep();
      showWarning("Please respond now.");
    }
    return;
  }

  // Strict condition: timeout ends the current phase/trial.
  stopPhaseTracking();
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }

  if (isFirst) {
    currentTrialDraft.response1_status = "timeout";
    currentTrialDraft.trial_completed = false;
    // Short delay keeps the 10-second first-answer beep audible before advancing.
    playBeep();
    setTimeout(() => {
      finalizeTrialAndMoveNext();
    }, 260);
    return;
  }

  currentTrialDraft.response2_status = "timeout";
  currentTrialDraft.trial_completed = false;
  finalizeTrialAndMoveNext();
}

function hideProblemText() {
  const stim = getCurrentStimulus();
  const container = document.getElementById("problemContainer");
  if (container) container.innerHTML = renderProblem(stim, false);
  const finalQuestion = document.getElementById("finalQuestion");
  if (finalQuestion) finalQuestion.style.display = "none";
}

function showWarning(text) {
  const warning = document.getElementById("warning");
  if (warning) warning.textContent = text;
}

function handleResponse(kind, answer) {
  const elapsed = Math.round(performance.now() - phaseStartMs);
  const isFirst = kind === "first";
  const limit = isFirst ? 10000 : 60000;
  const status = elapsed <= limit ? "on_time" : "late";
  const stim = getCurrentStimulus();
  const accuracy = answer === stim.correct_answer ? 1 : 0;

  stopPhaseTracking();
  if (activeTimer) clearInterval(activeTimer);

  if (isFirst) {
    currentTrialDraft.response1 = answer;
    currentTrialDraft.response1_accuracy = accuracy;
    currentTrialDraft.response1_rt_ms = elapsed;
    currentTrialDraft.response1_status = status;
    state.current_screen = PHASES.CONFIDENCE_1;
  } else {
    currentTrialDraft.final_response = answer;
    currentTrialDraft.final_accuracy = accuracy;
    currentTrialDraft.final_rt_ms = elapsed;
    currentTrialDraft.response2_status = status;
    currentTrialDraft.answer_changed = currentTrialDraft.response1 ? answer !== currentTrialDraft.response1 : "";
    state.current_screen = PHASES.CONFIDENCE_2;
  }
  persistSession();
  render();
}

function renderConfidencePhase(number) {
  const phase = number === 1 ? PHASES.CONFIDENCE_1 : PHASES.CONFIDENCE_2;
  const title = number === 1 ? "Confidence rating for your first answer" : "Confidence rating for your final answer";
  app.innerHTML = `
    <section class="screen narrow center">
      <h2>${title}</h2>
      <p>How confident are you that your answer is correct?</p>
      <div class="scale-labels">
        <span>1 = Not at all confident</span>
        <span>7 = Extremely confident</span>
      </div>
      <div class="confidence-scale" data-zone="confidence_scale">
        ${[1,2,3,4,5,6,7].map(v => `<button data-zone="confidence_scale" data-confidence="${v}">${v}</button>`).join("")}
      </div>
    </section>
  `;
  startPhaseTracking(phase, null);
  document.querySelectorAll("[data-confidence]").forEach((btn) => {
    btn.addEventListener("click", () => handleConfidence(number, Number(btn.dataset.confidence)));
  });
}

function handleConfidence(number, value) {
  const elapsed = Math.round(performance.now() - phaseStartMs);
  stopPhaseTracking();
  if (number === 1) {
    currentTrialDraft.confidence1 = value;
    currentTrialDraft.confidence1_rt_ms = elapsed;
    state.current_screen = PHASES.CENTER_BEFORE_FINAL;
  } else {
    currentTrialDraft.confidence2 = value;
    currentTrialDraft.confidence2_rt_ms = elapsed;
    currentTrialDraft.trial_completed = true;
    finalizeTrialAndMoveNext();
    return;
  }
  persistSession();
  render();
}

function finalizeTrialAndMoveNext() {
  attachDerivedMetricsToCurrentTrial();
  state.trial_data.push({ ...currentTrialDraft });
  currentTrialDraft = null;
  state.current_trial_position += 1;
  persistSession();
  if (state.current_trial_position >= trialOrder.length) {
    finishExperiment("completed");
  } else {
    state.current_screen = PHASES.TRIAL_START;
    render();
  }
}

function attachDerivedMetricsToCurrentTrial() {
  const samples = state.mouse_samples.slice(currentTrialSamplesStartIndex);
  const metrics = computeDerivedMetrics(samples);
  Object.assign(currentTrialDraft, metrics);
}

function finishExperiment(status) {
  clearTimers();
  state.completion_status = status;
  state.experiment_end_time = new Date().toISOString();
  prepareOutputFilenames();
  state.current_screen = PHASES.END;
  persistSession();
  render();
}

function renderEnd() {
  app.innerHTML = `
    <section class="screen narrow center">
      <h1>Thank you.</h1>
      <p>The experiment is complete. Thank you for taking part.</p>
      <div class="warning-panel" id="downloadStatus" data-zone="download_warning">
        <strong>Do not close this page until the ZIP file appears in your Downloads folder.</strong><br />
        If the download did not work, click “Download data ZIP”.
      </div>
      <div class="download-panel">
        <h3>Data download</h3>
        <div class="row" style="justify-content:center;">
          <button id="downloadZip" class="primary-download" data-zone="download_zip_button">Download data ZIP</button>
        </div>
        <p class="small">The ZIP file contains both the full JSON file and the trial-summary CSV file.</p>
      </div>
      <p class="small">Participant code: <strong>${escapeHtml(state.demographics.participant_code || "not provided")}</strong></p>
      <p class="small">Internal session ID: <strong>${escapeHtml(state.session_id)}</strong></p>
    </section>
  `;
  document.getElementById("downloadZip").addEventListener("click", () => downloadDataZip("manual"));

  if (!automaticDownloadAttempted) {
    automaticDownloadAttempted = true;
    setTimeout(() => {
      try {
        downloadDataZip("automatic");
      } catch (error) {
        console.warn("Automatic ZIP download failed", error);
        const statusEl = document.getElementById("downloadStatus");
        if (statusEl) {
          statusEl.innerHTML = `<strong>Automatic download may have been blocked.</strong><br />Please click “Download data ZIP” before closing this page.`;
          statusEl.classList.add("error");
        }
      }
    }, 600);
  }
}


function recordMouseSample(phase) {
  const now = performance.now();
  const phaseElapsed = now - phaseStartMs;
  const experimentElapsed = now - experimentStartPerfMs;
  const zone = getZoneAt(latestMouse.x, latestMouse.y);
  const remaining = typeof currentPhaseTimeLimitMs === "number"
    ? Math.max(0, currentPhaseTimeLimitMs - phaseElapsed)
    : "";

  state.mouse_samples.push({
    participant_number: state.participant_number,
    participant_id: state.participant_id,
    participant_code: state.demographics.participant_code || "",
    session_id: state.session_id,
    assigned_condition: state.assigned_condition,
    trial_index: state.current_trial_position + 1,
    problem_id: getCurrentStimulus() ? getCurrentStimulus().problem_id : "",
    phase,
    timestamp_ms_from_experiment_start: Math.round(experimentElapsed),
    timestamp_ms_from_phase_start: Math.round(phaseElapsed),
    x: latestMouse.x,
    y: latestMouse.y,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    element_or_zone: zone,
    countdown_time_remaining_ms: remaining === "" ? "" : Math.round(remaining),
    mouse_button_down: latestMouse.buttonDown,
  });
}

function getZoneAt(x, y) {
  if (x === null || y === null) return "no_mouse_position";
  const el = document.elementFromPoint(x, y);
  if (!el) return "other";
  const zoneEl = el.closest("[data-zone]");
  return zoneEl ? zoneEl.getAttribute("data-zone") : "other";
}

function registerDocumentListeners() {
  document.addEventListener("mousemove", (event) => {
    latestMouse.x = event.clientX;
    latestMouse.y = event.clientY;
  }, { passive: true });

  document.addEventListener("mousedown", () => latestMouse.buttonDown = true, { passive: true });
  document.addEventListener("mouseup", () => latestMouse.buttonDown = false, { passive: true });

  document.addEventListener("click", (event) => {
    const now = performance.now();
    const zone = getZoneAt(event.clientX, event.clientY);
    const currentTrial = getCurrentStimulus();
    state.click_events.push({
      participant_number: state.participant_number,
      participant_id: state.participant_id,
      participant_code: state.demographics.participant_code || "",
      session_id: state.session_id,
      assigned_condition: state.assigned_condition,
      trial_index: state.current_trial_position + 1,
      problem_id: currentTrial ? currentTrial.problem_id : "",
      phase: state.current_screen,
      clicked_element: zone,
      click_timestamp_ms: Math.round(now - experimentStartPerfMs),
      x: event.clientX,
      y: event.clientY,
    });
  }, true);
}

function ensureAudioReady() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      audioContext = null;
    }
  }

  if (!audioContext) return Promise.resolve(false);

  if (audioContext.state === "suspended") {
    return audioContext.resume()
      .then(() => audioContext.state === "running")
      .catch(() => false);
  }

  return Promise.resolve(audioContext.state === "running");
}

function primeAudio() {
  return ensureAudioReady().then((ready) => {
    if (!ready || !audioContext || audioPrimed) return false;

    try {
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      gain.gain.value = 0.00001;
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(audioContext.destination);
      source.start(0);
      audioPrimed = true;
      return true;
    } catch (error) {
      console.warn("Could not prime audio", error);
      return false;
    }
  });
}

function playBeep() {
  ensureAudioReady().then((ready) => {
    if (!ready || !audioContext) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(660, now + 0.11);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.26);
    } catch (error) {
      console.warn("Could not play timeout beep", error);
    }
  });
}

function computeDerivedMetrics(samples) {
  const phases = [PHASES.FIRST_RESPONSE, PHASES.CONFIDENCE_1, PHASES.FINAL_RESPONSE, PHASES.CONFIDENCE_2];
  const out = {
    total_mouse_distance_phase1: 0,
    total_mouse_distance_confidence1: 0,
    total_mouse_distance_phase3: 0,
    total_mouse_distance_confidence2: 0,
    number_of_pauses_phase1: 0,
    number_of_pauses_phase3: 0,
    number_of_direction_changes_phase1: 0,
    number_of_direction_changes_phase3: 0,
    dwell_time_yes_button_ms: 0,
    dwell_time_no_button_ms: 0,
    dwell_time_confidence_scale_ms: 0,
  };

  const distanceKeys = {
    [PHASES.FIRST_RESPONSE]: "total_mouse_distance_phase1",
    [PHASES.CONFIDENCE_1]: "total_mouse_distance_confidence1",
    [PHASES.FINAL_RESPONSE]: "total_mouse_distance_phase3",
    [PHASES.CONFIDENCE_2]: "total_mouse_distance_confidence2",
  };

  const pauseKeys = {
    [PHASES.FIRST_RESPONSE]: "number_of_pauses_phase1",
    [PHASES.FINAL_RESPONSE]: "number_of_pauses_phase3",
  };

  const directionKeys = {
    [PHASES.FIRST_RESPONSE]: "number_of_direction_changes_phase1",
    [PHASES.FINAL_RESPONSE]: "number_of_direction_changes_phase3",
  };

  for (const phase of phases) {
    const phaseSamples = samples.filter(s => s.phase === phase && Number.isFinite(s.x) && Number.isFinite(s.y));
    out[distanceKeys[phase]] = Math.round(totalPathDistance(phaseSamples));
    if (pauseKeys[phase]) out[pauseKeys[phase]] = countPauses(phaseSamples);
    if (directionKeys[phase]) out[directionKeys[phase]] = countDirectionChanges(phaseSamples);
  }

  out.dwell_time_yes_button_ms = estimateDwell(samples, "yes_button");
  out.dwell_time_no_button_ms = estimateDwell(samples, "no_button");
  out.dwell_time_confidence_scale_ms = estimateDwell(samples, "confidence_scale");
  return out;
}

function totalPathDistance(samples) {
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    total += Math.hypot((b.x ?? 0) - (a.x ?? 0), (b.y ?? 0) - (a.y ?? 0));
  }
  return total;
}

function countPauses(samples) {
  let pauses = 0;
  let stillCount = 0;
  let inPause = false;
  for (let i = 1; i < samples.length; i++) {
    const dist = Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
    if (dist < 2) {
      stillCount++;
      if (!inPause && stillCount >= 4) { // about 100 ms at 25 ms sampling
        pauses++;
        inPause = true;
      }
    } else {
      stillCount = 0;
      inPause = false;
    }
  }
  return pauses;
}

function countDirectionChanges(samples) {
  let changes = 0;
  let previousAngle = null;
  for (let i = 1; i < samples.length; i++) {
    const dx = samples[i].x - samples[i - 1].x;
    const dy = samples[i].y - samples[i - 1].y;
    const distance = Math.hypot(dx, dy);
    if (distance < 4) continue;
    const angle = Math.atan2(dy, dx);
    if (previousAngle !== null) {
      const diff = Math.abs(Math.atan2(Math.sin(angle - previousAngle), Math.cos(angle - previousAngle)));
      if (diff > Math.PI / 2) changes++;
    }
    previousAngle = angle;
  }
  return changes;
}

function estimateDwell(samples, zone) {
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1].element_or_zone === zone) {
      const delta = samples[i].timestamp_ms_from_experiment_start - samples[i - 1].timestamp_ms_from_experiment_start;
      if (delta > 0 && delta < 200) total += delta;
    }
  }
  return Math.round(total);
}

function buildFullSessionObject() {
  return {
    app_version: state.app_version,
    participant_number: state.participant_number,
    participant_id: state.participant_id,
    participant_code: state.demographics.participant_code || "",
    session_id: state.session_id,
    assigned_condition: state.assigned_condition,
    yes_button_side: state.yes_button_side,
    no_button_side: state.no_button_side,
    response_side_assignment_method: "fixed_by_participant_code",
    experiment_start_time: state.experiment_start_time,
    experiment_end_time: state.experiment_end_time,
    completion_status: state.completion_status,
    consent: state.consent,
    demographics: state.demographics,
    randomized_trial_order: state.randomized_trial_order,
    presentation_order_method: state.presentation_order_method,
    counterbalance_index: state.counterbalance_index,
    belief_condition_order_index: state.belief_condition_order_index,
    neutral_order_index: state.neutral_order_index,
    neutral_block_position: state.neutral_block_position,
    conclusion_block_order: state.conclusion_block_order,
    current_trial_position: state.current_trial_position,
    current_screen: state.current_screen,
    browser_info: state.browser_info,
    trial_data: state.trial_data,
    click_events: state.click_events,
    mouse_samples: state.mouse_samples,
    data_collection_mode: state.data_collection_mode,
    standalone_assignment_status: state.standalone_assignment_status,
    full_json_filename: state.full_json_filename,
    trial_csv_filename: state.trial_csv_filename,
    zip_filename: state.zip_filename,
    download_status: state.download_status,
    current_trial_draft: currentTrialDraft,
  };
}

function buildTrialCsv() {
  const columns = [
    "participant_number",
    "participant_id",
    "participant_code",
    "session_id",
    "assigned_condition",
    "participant_yes_button_side",
    "participant_no_button_side",
    "response_side_assignment_method",
    "presentation_order_method",
    "counterbalance_index",
    "belief_condition_order_index",
    "neutral_order_index",
    "neutral_block_position",
    "conclusion_block_order",
    "trial_index",
    "problem_id",
    "belief_type",
    "validity",
    "conclusion_form",
    "correct_answer",
    "yes_button_side",
    "no_button_side",
    "response1",
    "response1_accuracy",
    "response1_rt_ms",
    "response1_status",
    "confidence1",
    "confidence1_rt_ms",
    "final_response",
    "final_accuracy",
    "final_rt_ms",
    "response2_status",
    "confidence2",
    "confidence2_rt_ms",
    "answer_changed",
    "trial_completed",
    "total_mouse_distance_phase1",
    "total_mouse_distance_confidence1",
    "total_mouse_distance_phase3",
    "total_mouse_distance_confidence2",
    "number_of_pauses_phase1",
    "number_of_pauses_phase3",
    "number_of_direction_changes_phase1",
    "number_of_direction_changes_phase3",
    "dwell_time_yes_button_ms",
    "dwell_time_no_button_ms",
    "dwell_time_confidence_scale_ms",
  ];
  return objectsToCsv(state.trial_data, columns);
}

function objectsToCsv(rows, columns) {
  const header = columns.join(",");
  const body = rows.map(row => columns.map(col => csvEscape(row[col])).join(",")).join("\n");
  return `${header}\n${body}`;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
  return str;
}

function safeFileLabel() {
  const raw = state.demographics.participant_code || state.participant_id;
  const cleaned = String(raw).trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  return cleaned || state.participant_id;
}

function prepareOutputFilenames() {
  if (state.full_json_filename && state.trial_csv_filename && state.zip_filename) return;
  const label = safeFileLabel();
  state.full_json_filename = `full_session_${label}.json`;
  state.trial_csv_filename = `trial_summary_${label}.csv`;
  state.zip_filename = `experiment_data_${label}.zip`;
}

function buildFullJsonContent() {
  prepareOutputFilenames();
  return JSON.stringify(buildFullSessionObject(), null, 2);
}

function buildTrialCsvContent() {
  prepareOutputFilenames();
  return buildTrialCsv();
}

function downloadDataZip(mode = "manual") {
  prepareOutputFilenames();
  state.download_status = mode === "automatic" ? "automatic_zip_download_attempted" : "manual_zip_download_attempted";
  const zipBlob = createZipBlob([
    { name: state.full_json_filename, content: buildFullJsonContent(), mimeType: "application/json;charset=utf-8" },
    { name: state.trial_csv_filename, content: buildTrialCsvContent(), mimeType: "text/csv;charset=utf-8" },
  ]);
  downloadBlob(zipBlob, state.zip_filename, "application/zip");
}

function downloadBlob(content, filename, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createZipBlob(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;
  const now = new Date();
  const dosTime = getDosTime(now);
  const dosDate = getDosDate(now);

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.content === "string" ? encoder.encode(file.content) : new Uint8Array(file.content);
    const crc = crc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true); // UTF-8 file names
    localView.setUint16(8, 0, true); // no compression
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, dataBytes.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, dataBytes.length, true);
    centralView.setUint32(24, dataBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralDirectory.push(centralHeader);

    offset += localHeader.length + dataBytes.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralDirectory.reduce((sum, item) => sum + item.length, 0);
  chunks.push(...centralDirectory);

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectorySize, true);
  endView.setUint32(16, centralDirectoryOffset, true);
  endView.setUint16(20, 0, true);
  chunks.push(endRecord);

  return new Blob(chunks, { type: "application/zip" });
}

function getDosTime(date) {
  return (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
}

function getDosDate(date) {
  return ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}


document.addEventListener("pointerdown", () => {
  primeAudio();
}, { once: true, capture: true });

registerDocumentListeners();
render();
