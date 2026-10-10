const display = document.getElementById("display");
const expression = document.getElementById("expression");
const keypad = document.getElementById("keypad");
const historyContainer = document.getElementById("history");
const historyToggle = document.getElementById("history-toggle");

let current = "0";
let storedValue = null;
let operator = null;
let waitingForOperand = false;
let justCalculated = false;
const historyItems = [];

document.getElementById("year").textContent = new Date().getFullYear();

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}

function render() {
  display.textContent = current;
}

function calculate(a, b, op) {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? null : a / b;
    default: return b;
  }
}

function inputNumber(number) {
  if (current === "Error" || waitingForOperand || justCalculated) {
    current = number;
    waitingForOperand = false;
    justCalculated = false;
    if (storedValue === null) expression.textContent = "";
  } else if (current === "0") {
    current = number;
  } else if (current.replace("-", "").replace(".", "").length < 15) {
    current += number;
  }
  render();
}

function inputDecimal() {
  if (current === "Error" || waitingForOperand || justCalculated) {
    current = "0.";
    waitingForOperand = false;
    justCalculated = false;
    if (storedValue === null) expression.textContent = "";
  } else if (!current.includes(".")) {
    current += ".";
  }
  render();
}

function chooseOperator(nextOperator) {
  if (current === "Error") return;
  const inputValue = Number(current);

  if (operator && !waitingForOperand && storedValue !== null) {
    const result = calculate(storedValue, inputValue, operator);
    if (result === null || !Number.isFinite(result)) {
      showError();
      return;
    }
    current = formatNumber(result);
    storedValue = result;
  } else {
    storedValue = inputValue;
  }

  operator = nextOperator;
  waitingForOperand = true;
  justCalculated = false;
  expression.textContent = `${current} ${operator}`;
  render();
}

function inputEquals() {
  if (operator === null || storedValue === null || waitingForOperand) return;
  const a = storedValue;
  const b = Number(current);
  const op = operator;
  const result = calculate(a, b, op);

  if (result === null || !Number.isFinite(result)) {
    showError();
    return;
  }

  const answer = formatNumber(result);
  expression.textContent = `${a} ${op} ${b} =`;
  current = answer;
  addHistory(`${a} ${op} ${b}`, answer);
  storedValue = null;
  operator = null;
  waitingForOperand = false;
  justCalculated = true;
  render();
}

function showError() {
  current = "Error";
  storedValue = null;
  operator = null;
  waitingForOperand = false;
  justCalculated = true;
  expression.textContent = "Cannot divide by zero";
  render();
}

function doAction(action) {
  switch (action) {
    case "clear":
      current = "0";
      storedValue = null;
      operator = null;
      waitingForOperand = false;
      justCalculated = false;
      expression.textContent = "";
      break;
    case "sign":
      if (current !== "Error" && Number(current) !== 0) {
        current = formatNumber(-Number(current));
      }
      break;
    case "percent":
      if (current !== "Error") current = formatNumber(Number(current) / 100);
      break;
    case "decimal":
      inputDecimal();
      return;
    case "equals":
      inputEquals();
      return;
    default:
      return;
  }
  render();
}

function addHistory(formula, answer) {
  historyItems.unshift({ formula, answer });
  if (historyItems.length > 5) historyItems.pop();
  renderHistory();
}

function renderHistory() {
  historyContainer.replaceChildren();
  if (historyItems.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "Your recent calculations will appear here.";
    historyContainer.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "history-list";
  historyItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";
    const formula = document.createElement("span");
    formula.textContent = item.formula;
    const answer = document.createElement("strong");
    answer.textContent = item.answer;
    row.append(formula, answer);
    list.appendChild(row);
  });
  historyContainer.appendChild(list);
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.number !== undefined) {
    inputNumber(button.dataset.number);
  } else if (button.dataset.operator) {
    chooseOperator(button.dataset.operator);
  } else if (button.dataset.action) {
    doAction(button.dataset.action);
  }
});

historyToggle.addEventListener("click", () => {
  historyItems.length = 0;
  renderHistory();
});

document.addEventListener("keydown", (event) => {
  if (/^[0-9]$/.test(event.key)) {
    inputNumber(event.key);
  } else if (event.key === ".") {
    inputDecimal();
  } else if (event.key === "+") {
    chooseOperator("+");
  } else if (event.key === "-") {
    chooseOperator("−");
  } else if (event.key === "*") {
    chooseOperator("×");
  } else if (event.key === "/") {
    event.preventDefault();
    chooseOperator("÷");
  } else if (event.key === "Enter" || event.key === "=") {
    inputEquals();
  } else if (event.key === "Escape") {
    doAction("clear");
  } else if (event.key === "Backspace") {
    if (current !== "Error" && !waitingForOperand && !justCalculated) {
      current = current.length > 1 ? current.slice(0, -1) : "0";
      if (current === "-") current = "0";
      render();
    } else {
      doAction("clear");
    }
  } else if (event.key === "%") {
    doAction("percent");
  }
});

renderHistory();
render();
