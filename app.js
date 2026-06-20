/*
  Syllogistic Reasoning Mouse-Tracking Experiment
  Local browser-based single-page application.
  Data are stored in localStorage during the session and downloaded locally at the end.
*/

const APP_VERSION = "1.2.0";
const STORAGE_KEY_PREFIX = "syllogism_mouse_session_";
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
let latestMouse = {
  x: null,
  y: null,
  buttonDown: false,
};
let automaticDownloadAttempted = false;

function makeInitialState() {
  const params = new URLSearchParams(window.location.search);
  const requestedCondition = params.get("condition");
  const assignedCondition = requestedCondition === "soft" || requestedCondition === "strict"
    ? requestedCondition
    : Math.random() < 0.5 ? "soft" : "strict";
  const now = new Date();
  const participantId = `P_${formatTimestamp(now)}_${randomString(5)}`;
  const sessionId = `S_${formatTimestamp(now)}_${randomString(8)}`;
  return {
    app_version: APP_VERSION,
    participant_id: participantId,
    session_id: sessionId,
    assigned_condition: assignedCondition,
    current_screen: PHASES.WELCOME,
    experiment_start_time: now.toISOString(),
    experiment_end_time: null,
    completion_status: "not_started",
    consent: false,
    demographics: {},
    randomized_trial_order: [],
    current_trial_position: 0,
    trial_data: [],
    click_events: [],
    mouse_samples: [],
    browser_info: getBrowserInfo(),
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

function getStorageKey() {
  return `${STORAGE_KEY_PREFIX}${state.session_id}`;
}

function persistSession() {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(buildFullSessionObject()));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}latest`, state.session_id);
  } catch (error) {
    console.warn("Could not save session to localStorage", error);
  }
}

function loadLatestSession() {
  try {
    const latestSessionId = localStorage.getItem(`${STORAGE_KEY_PREFIX}latest`);
    if (!latestSessionId) return null;
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${latestSessionId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Could not load session", error);
    return null;
  }
}

function restoreSession(saved) {
  if (!saved || !saved.participant_id || !saved.session_id) return;
  state = {
    ...state,
    ...saved,
    current_screen: saved.current_screen || PHASES.WELCOME,
  };
  experimentStartPerfMs = performance.now();
  trialOrder = state.randomized_trial_order.map((id) => stimuli.find((s) => s.problem_id === id)).filter(Boolean);
  currentTrialDraft = saved.current_trial_draft || null;
  currentTrialSamplesStartIndex = state.mouse_samples.findIndex(s => Number(s.trial_index) === Number(state.current_trial_position + 1));
  if (currentTrialSamplesStartIndex < 0) currentTrialSamplesStartIndex = state.mouse_samples.length;
  render();
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
  const saved = loadLatestSession();
  app.innerHTML = `
    <section class="screen narrow center">
      <h1>Syllogistic Reasoning Experiment</h1>
      <p>This computerized experiment records answers, confidence ratings, response times, and mouse movements.</p>
      <div class="row center" style="justify-content:center;margin-top:24px;">
        <button id="startBtn" data-zone="start_button">Start new session</button>
        ${saved && saved.completion_status !== "completed" ? '<button class="secondary" id="restoreBtn" data-zone="restore_button">Restore previous session</button>' : ""}
      </div>
      <p class="small" style="margin-top:20px;">For local data collection only. Downloaded files are saved on the computer running this experiment.</p>
    </section>
  `;
  document.getElementById("startBtn").addEventListener("click", () => {
    ensureAudioReady();
    state.completion_status = "started";
    state.current_screen = PHASES.CONSENT;
    render();
  });
  const restoreBtn = document.getElementById("restoreBtn");
  if (restoreBtn) restoreBtn.addEventListener("click", () => restoreSession(saved));
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

function renderDemographics() {
  app.innerHTML = `
    <section class="screen">
      <h2>Participant Information</h2>
      <form id="demoForm" class="form-grid" data-zone="demographics_form">
        <label>Participant code
          <input name="participant_code" type="text" required placeholder="e.g., P001" />
          <span class="field-note">Use a researcher-assigned code. Do not enter a national ID unless explicitly required by your course or ethics approval.</span>
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
    state.demographics = Object.fromEntries(fd.entries());
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
    ensureAudioReady();
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

function startExperimentTrials() {
  trialOrder = shuffle(stimuli);
  state.randomized_trial_order = trialOrder.map(t => t.problem_id);
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
    ensureAudioReady();
    beginTrial();
  });
}

function beginTrial() {
  const stim = getCurrentStimulus();
  const yesLeft = Math.random() < 0.5;
  currentTrialDraft = {
    participant_id: state.participant_id,
    participant_code: state.demographics.participant_code || "",
    session_id: state.session_id,
    assigned_condition: state.assigned_condition,
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

  hideProblemText();

  if (isSoft) {
    playBeep();
    showWarning("Please respond now.");
    return;
  }

  // Strict condition: timeout ends the current phase/trial.
  playBeep();
  stopPhaseTracking();
  if (activeTimer) clearInterval(activeTimer);

  if (isFirst) {
    currentTrialDraft.response1_status = "timeout";
    currentTrialDraft.trial_completed = false;
    finalizeTrialAndMoveNext();
  } else {
    currentTrialDraft.response2_status = "timeout";
    currentTrialDraft.trial_completed = false;
    finalizeTrialAndMoveNext();
  }
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
  state.current_screen = PHASES.END;
  persistSession();
  render();
}

function renderEnd() {
  app.innerHTML = `
    <section class="screen narrow center">
      <h1>Thank you.</h1>
      <p>The experiment is complete.</p>
      <p id="downloadStatus" class="small">Your data files are being downloaded. If the download does not start automatically, use the buttons below.</p>
      <div class="download-panel">
        <h3>Manual backup downloads</h3>
        <div class="row" style="justify-content:center;">
          <button id="downloadJson" data-zone="download_json_button">Download full JSON</button>
          <button id="downloadCsv" data-zone="download_csv_button">Download trial summary CSV</button>
        </div>
        <p class="small">Files download to the browser’s default Downloads folder on this computer.</p>
      </div>
      <p class="small">Participant code: <strong>${escapeHtml(state.demographics.participant_code || "not provided")}</strong></p>
      <p class="small">Internal session ID: <strong>${escapeHtml(state.session_id)}</strong></p>
    </section>
  `;
  document.getElementById("downloadJson").addEventListener("click", () => downloadFullJson());
  document.getElementById("downloadCsv").addEventListener("click", () => downloadTrialCsv());

  if (!automaticDownloadAttempted) {
    automaticDownloadAttempted = true;
    setTimeout(() => {
      try {
        downloadFullJson();
        setTimeout(() => downloadTrialCsv(), 500);
        state.download_status = "automatic_download_attempted";
        persistSession();
      } catch (error) {
        console.warn("Automatic download failed", error);
        const statusEl = document.getElementById("downloadStatus");
        if (statusEl) {
          statusEl.textContent = "Automatic download may have been blocked by your browser. Please use the manual download buttons below.";
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
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

function playBeep() {
  ensureAudioReady();
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.18);
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
    participant_id: state.participant_id,
    participant_code: state.demographics.participant_code || "",
    session_id: state.session_id,
    assigned_condition: state.assigned_condition,
    experiment_start_time: state.experiment_start_time,
    experiment_end_time: state.experiment_end_time,
    completion_status: state.completion_status,
    consent: state.consent,
    demographics: state.demographics,
    randomized_trial_order: state.randomized_trial_order,
    current_trial_position: state.current_trial_position,
    current_screen: state.current_screen,
    browser_info: state.browser_info,
    trial_data: state.trial_data,
    click_events: state.click_events,
    mouse_samples: state.mouse_samples,
    download_status: state.download_status,
    current_trial_draft: currentTrialDraft,
  };
}

function buildTrialCsv() {
  const columns = [
    "participant_id",
    "participant_code",
    "session_id",
    "assigned_condition",
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

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
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

function safeFileLabel() {
  const raw = state.demographics.participant_code || state.participant_id;
  const cleaned = String(raw).trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  return cleaned || state.participant_id;
}

function downloadFullJson() {
  const timestamp = formatTimestamp(new Date());
  const filename = `full_session_${safeFileLabel()}_${timestamp}.json`;
  const content = JSON.stringify(buildFullSessionObject(), null, 2);
  downloadBlob(content, filename, "application/json;charset=utf-8");
}

function downloadTrialCsv() {
  const timestamp = formatTimestamp(new Date());
  const filename = `trial_summary_${safeFileLabel()}_${timestamp}.csv`;
  downloadBlob(buildTrialCsv(), filename, "text/csv;charset=utf-8");
}

window.addEventListener("beforeunload", () => {
  persistSession();
});

registerDocumentListeners();
render();
