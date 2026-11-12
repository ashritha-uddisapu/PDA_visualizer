/* =========================================
   PDA VISUALIZER — MANUAL-FIRST FRONTEND
   Python backend handles all PDA transitions.
========================================= */

// DOM ELEMENTS

const $ = (id) => document.getElementById(id);

const expressionInput = $("expressionInput");

const runBtn = $("runBtn");
const resetBtn = $("resetBtn");
const stepBtn = $("stepBtn");
const prevBtn = $("prevBtn");
const autoBtn = $("autoBtn");
const pauseBtn = $("pauseBtn");

const currentState = $("currentState");
const stepCount = $("stepCount");
const currentAction = $("currentAction");
const finalResult = $("finalResult");

const stackVisual = $("stackVisual");
const stackTop = $("stackTop");
const stackSize = $("stackSize");
const stackDepthLabel = $("stackDepthLabel");

const inputTape = $("inputTape");

const progressBar = $("progressBar");
const progressText = $("progressText");

const readSymbol = $("readSymbol");
const transitionAction = $("transitionAction");
const transitionMessage = $("transitionMessage");

const historyBody = $("historyBody");

const resultPanel = $("resultPanel");
const resultHeading = $("resultHeading");
const resultMessage = $("resultMessage");

const charCount = $("charCount");
const errorMessage = $("errorMessage");


// =========================================
// APPLICATION STATE
// =========================================

let simulationData = null;

let currentStepIndex = 0;

let autoTimer = null;

let isRunning = false;

let isPaused = false;


// =========================================
// INITIALIZATION
// =========================================

function initializeApplication() {

    renderStack(["Z0"]);

    renderInputTape("");

    updateStatus("q0", 0, "WAITING", "PENDING");

    setControls();

    expressionInput.addEventListener("input", () => {

        charCount.textContent =
            `${expressionInput.value.length} characters`;

    });

    runBtn.addEventListener("click", prepareSimulation);

    resetBtn.addEventListener("click", resetSimulation);

    stepBtn.addEventListener("click", nextStep);

    prevBtn.addEventListener("click", previousStep);

    autoBtn.addEventListener("click", runAll);

    pauseBtn.addEventListener("click", togglePause);

}


// =========================================
// PREPARE SIMULATION
// =========================================

async function prepareSimulation() {

    stopAutomaticExecution();

    hideError();

    const expression = expressionInput.value;

    runBtn.disabled = true;

    runBtn.textContent = "Preparing…";

    try {

        const response = await fetch("/api/simulate", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                expression: expression
            })

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "Simulation request failed."
            );

        }

        if (
            !Array.isArray(data.steps) ||
            !Array.isArray(data.final_stack)
        ) {

            throw new Error(
                "The backend response is missing the PDA execution trace."
            );

        }

        simulationData = data;

        currentStepIndex = 0;

        resetVisualization();

        renderInputTape(expression);

        if (simulationData.steps.length === 0) {

            completeSimulation();

        } else {

            transitionMessage.textContent =
                "Simulation prepared. Select Next step to execute the first transition.";

        }

        setControls();

    }

    catch (error) {

        simulationData = null;

        showError(error.message);

        setControls();

    }

    finally {

        runBtn.disabled = false;

        runBtn.textContent = "↳ Prepare simulation";

    }

}


// =========================================
// NEXT STEP
// =========================================

function nextStep() {

    if (
        !simulationData ||
        isRunning ||
        currentStepIndex >= simulationData.steps.length
    ) {
        return;
    }

    const step = simulationData.steps[currentStepIndex];

    applyStep(step);

    currentStepIndex++;

    if (step.action === "REJECT") {

        finalizeResult("REJECTED", step.message);

        currentAction.textContent = "REJECT";

        stopAutomaticExecution();

    }

    else if (
        currentStepIndex >= simulationData.steps.length
    ) {

        completeSimulation();

    }

    updateProgress();

    setControls();

}


// =========================================
// PREVIOUS STEP
// =========================================

function previousStep() {

    if (
        !simulationData ||
        isRunning ||
        currentStepIndex <= 0
    ) {
        return;
    }

    currentStepIndex--;

    const completedSteps =
        simulationData.steps.slice(0, currentStepIndex);

    // Restore stack configuration.

    renderStack(
        currentStepIndex === 0
            ? ["Z0"]
            : completedSteps[completedSteps.length - 1].stack_after
    );

    // Rebuild execution history.

    historyBody.replaceChildren();

    completedSteps.forEach(addHistoryRow);

    if (currentStepIndex === 0) {

        updateStatus("q0", 0, "WAITING", "PENDING");

        readSymbol.textContent = "—";

        transitionAction.textContent = "—";

        transitionMessage.textContent =
            "Back at the initial configuration.";

        clearResult();

        highlightInput(-1);

    }

    else {

        const step =
            completedSteps[completedSteps.length - 1];

        showStepDetails(step);

        highlightInput(step.step - 1);

        clearResult();

    }

    updateProgress();

    setControls();

}


// =========================================
// APPLY ONE BACKEND TRANSITION
// =========================================

function applyStep(step) {

    showStepDetails(step);

    renderStack(step.stack_after);

    highlightInput(step.step - 1);

    addHistoryRow(step);

}


// =========================================
// DISPLAY STEP DETAILS
// =========================================

function showStepDetails(step) {

    currentState.textContent = step.state;

    stepCount.textContent = step.step;

    currentAction.textContent = step.action;

    readSymbol.textContent =
        displayCharacter(step.character);

    transitionAction.textContent = step.action;

    transitionMessage.textContent = step.message;

}


// =========================================
// RUN ALL
// =========================================

function runAll() {

    if (
        !simulationData ||
        isRunning ||
        currentStepIndex >= simulationData.steps.length
    ) {
        return;
    }

    isRunning = true;

    isPaused = false;

    pauseBtn.textContent = "Ⅱ Pause";

    autoBtn.disabled = true;

    stepBtn.disabled = true;

    prevBtn.disabled = true;

    pauseBtn.disabled = false;

    autoTimer = setInterval(() => {

        if (isPaused) return;

        const step =
            simulationData.steps[currentStepIndex];

        if (!step) {

            completeSimulation();

            return;

        }

        applyStep(step);

        currentStepIndex++;

        updateProgress();

        if (step.action === "REJECT") {

            finalizeResult("REJECTED", step.message);

            stopAutomaticExecution();

            setControls();

        }

        else if (
            currentStepIndex >= simulationData.steps.length
        ) {

            completeSimulation();

        }

    }, 850);

}


// =========================================
// PAUSE / RESUME
// =========================================

function togglePause() {

    if (!isRunning) return;

    isPaused = !isPaused;

    pauseBtn.textContent = isPaused
        ? "▶ Resume"
        : "Ⅱ Pause";

}


// =========================================
// STOP AUTOMATIC EXECUTION
// =========================================

function stopAutomaticExecution() {

    if (autoTimer !== null) {

        clearInterval(autoTimer);

        autoTimer = null;

    }

    isRunning = false;

    isPaused = false;

    pauseBtn.textContent = "Ⅱ Pause";

}


// =========================================
// RENDER STACK
// =========================================

function renderStack(stack) {

    stackVisual.replaceChildren();

    stack.forEach((symbol, index) => {

        const cell = document.createElement("div");

        cell.className = "stack-item";

        if (index === 0) {

            cell.classList.add("bottom-marker");

        }

        cell.textContent = symbol;

        stackVisual.appendChild(cell);

    });

    const top = stack.length
        ? stack[stack.length - 1]
        : "—";

    stackTop.textContent = top;

    stackSize.textContent = stack.length;

    stackDepthLabel.textContent =
        `DEPTH ${String(stack.length).padStart(2, "0")}`;

}


// =========================================
// INPUT TAPE VISUALIZATION
// =========================================

function renderInputTape(expression) {

    inputTape.replaceChildren();

    if (!expression.length) {

        const placeholder = document.createElement("p");

        placeholder.className = "placeholder-text";

        placeholder.textContent = "Empty input string (ε)";

        inputTape.appendChild(placeholder);

        return;

    }

    [...expression].forEach((character, index) => {

        const cell = document.createElement("div");

        cell.className = "tape-cell";

        cell.textContent = displayCharacter(character);

        cell.dataset.index = index;

        inputTape.appendChild(cell);

    });

}


// =========================================
// HIGHLIGHT CURRENT INPUT
// =========================================

function highlightInput(index) {

    const cells =
        inputTape.querySelectorAll(".tape-cell");

    cells.forEach((cell, i) => {

        cell.classList.remove(
            "active",
            "processed",
            "rejected"
        );

        if (i < index) {

            cell.classList.add("processed");

        }

        if (i === index) {

            cell.classList.add("active");

        }

    });

    const current =
        simulationData?.steps?.[currentStepIndex];

    if (
        current?.action === "REJECT" &&
        cells[index]
    ) {

        cells[index].classList.add("rejected");

    }

}


// =========================================
// EXECUTION HISTORY
// =========================================

function addHistoryRow(step) {

    if (historyBody.querySelector(".empty-history")) {

        historyBody.replaceChildren();

    }

    const row = document.createElement("tr");

    const values = [

        step.step,

        displayCharacter(step.character),

        step.state,

        step.action,

        `[${step.stack_after.join(", ")}]`

    ];

    values.forEach((value, index) => {

        const cell = document.createElement("td");

        cell.textContent = value;

        if (index === 3) {

            if (value === "REJECT") {

                cell.style.color = "var(--danger)";

            }

            if (value === "PUSH") {

                cell.style.color = "var(--block)";

            }

            if (value === "POP") {

                cell.style.color = "var(--success)";

            }

        }

        row.appendChild(cell);

    });

    historyBody.appendChild(row);

}


// =========================================
// PROGRESS TRACKER
// =========================================

function updateProgress() {

    const total =
        simulationData?.steps?.length || 0;

    const percent = total === 0
        ? (simulationData ? 100 : 0)
        : Math.round(
            (currentStepIndex / total) * 100
        );

    progressBar.style.width = `${percent}%`;

    progressText.textContent = `${percent}%`;

}


// =========================================
// STATUS UPDATES
// =========================================

function updateStatus(state, count, action, result) {

    currentState.textContent = state;

    stepCount.textContent = count;

    currentAction.textContent = action;

    finalResult.textContent = result;

}


// =========================================
// FINAL RESULT
// =========================================

function finalizeResult(result, message) {

    finalResult.textContent = result;

    resultHeading.textContent =
        result === "ACCEPTED"
            ? "✓ Expression accepted"
            : "✕ Expression rejected";

    resultMessage.textContent = message;

    resultPanel.classList.remove(
        "accepted",
        "rejected"
    );

    resultPanel.classList.add(
        result.toLowerCase()
    );

}


// =========================================
// COMPLETE SIMULATION
// =========================================

function completeSimulation() {

    if (!simulationData) return;

    stopAutomaticExecution();

    currentState.textContent =
        simulationData.final_state;

    currentAction.textContent = "COMPLETED";

    finalResult.textContent =
        simulationData.result;

    renderStack(simulationData.final_stack);

    updateProgress();

    finalizeResult(
        simulationData.result,
        simulationData.message
    );

    setControls();

}


// =========================================
// RESET VISUALIZATION
// =========================================

function resetVisualization() {

    stopAutomaticExecution();

    currentStepIndex = 0;

    renderStack(["Z0"]);

    renderInputTape(expressionInput.value);

    updateStatus(
        "q0",
        0,
        "WAITING",
        "PENDING"
    );

    progressBar.style.width = "0%";

    progressText.textContent = "0%";

    readSymbol.textContent = "—";

    transitionAction.textContent = "—";

    transitionMessage.textContent =
        "Waiting for execution.";

    historyBody.innerHTML = `
        <tr>
            <td colspan="5" class="empty-history">
                No execution history available.
            </td>
        </tr>
    `;

    clearResult();

    setControls();

}


// =========================================
// CLEAR RESULT
// =========================================

function clearResult() {

    resultPanel.classList.remove(
        "accepted",
        "rejected"
    );

    resultHeading.textContent =
        "Awaiting execution";

    resultMessage.textContent =
        "Step through the PDA execution to see the final result.";

    finalResult.textContent = "PENDING";

}


// =========================================
// RESET BUTTON
// =========================================

function resetSimulation() {

    stopAutomaticExecution();

    simulationData = null;

    currentStepIndex = 0;

    expressionInput.value = "";

    charCount.textContent = "0 characters";

    hideError();

    resetVisualization();

    renderInputTape("");

    transitionMessage.textContent =
        "Enter an expression and prepare the simulation.";

}


// =========================================
// CONTROL BUTTON STATES
// =========================================

function setControls() {

    const prepared = Boolean(simulationData);

    const hasPrevious =
        prepared && currentStepIndex > 0;

    const hasNext =
        prepared &&
        currentStepIndex < simulationData.steps.length;

    stepBtn.disabled =
        !hasNext || isRunning;

    prevBtn.disabled =
        !hasPrevious || isRunning;

    autoBtn.disabled =
        !hasNext || isRunning;

    pauseBtn.disabled = !isRunning;

    runBtn.disabled = isRunning;

}


// =========================================
// DISPLAY SPECIAL CHARACTERS
// =========================================

function displayCharacter(character) {

    if (character === " ") return "SPACE";

    if (character === "\t") return "TAB";

    if (character === "\n") return "NEWLINE";

    return character ?? "—";

}


// =========================================
// ERROR HANDLING
// =========================================

function showError(message) {

    errorMessage.textContent = message;

    errorMessage.classList.remove("hidden");

}


function hideError() {

    errorMessage.textContent = "";

    errorMessage.classList.add("hidden");

}


// =========================================
// INITIALIZE APPLICATION
// =========================================

initializeApplication();