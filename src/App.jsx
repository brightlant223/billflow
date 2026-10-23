import { useEffect, useMemo, useState } from "react";
import { Calculator as CalculatorIcon, Clock3, Copy, Delete, History, RotateCcw, Sparkles } from "lucide-react";

const operations = {
  "+": (a, b) => a + b,
  "−": (a, b) => a - b,
  "×": (a, b) => a * b,
  "÷": (a, b) => b === 0 ? NaN : a / b,
};
const fmt = (n) => Number.isFinite(n) ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 10 }).format(Number(n.toPrecision(11))) : "Error";
const keys = [
  ["AC", "utility", "clear"], ["±", "utility", "sign"], ["%", "utility", "percent"], ["÷", "operator", "operator"],
  ["7", "number", "digit"], ["8", "number", "digit"], ["9", "number", "digit"], ["×", "operator", "operator"],
  ["4", "number", "digit"], ["5", "number", "digit"], ["6", "number", "digit"], ["−", "operator", "operator"],
  ["1", "number", "digit"], ["2", "number", "digit"], ["3", "number", "digit"], ["+", "operator", "operator"],
  ["⌫", "utility", "backspace"], ["0", "number", "digit"], [".", "number", "decimal"], ["=", "equals", "equals"],
];

export default function App() {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatted = useMemo(() => {
    if (display === "Error" || display === "-") return display;
    if (display.includes(".")) {
      const parts = display.split(".");
      return (parts[0] === "-" ? "-" : fmt(Number(parts[0] || 0))) + "." + parts[1];
    }
    return fmt(Number(display));
  }, [display]);

  function clear() {
    setDisplay("0"); setStored(null); setOperator(null); setWaiting(false);
    setExpression(""); setCalculated(false);
  }
  function digit(d) {
    if (display === "Error" || waiting || calculated) {
      setDisplay(d); setWaiting(false); setCalculated(false);
      if (calculated) { setStored(null); setOperator(null); setExpression(""); }
    } else setDisplay((v) => v === "0" ? d : v.length < 16 ? v + d : v);
  }
  function decimal() {
    if (display === "Error" || waiting || calculated) {
      setDisplay("0."); setWaiting(false); setCalculated(false);
      if (calculated) { setStored(null); setOperator(null); setExpression(""); }
    } else if (!display.includes(".")) setDisplay(display + ".");
  }
  function chooseOperator(next) {
    if (display === "Error") return;
    const value = Number(display);
    if (operator && !waiting) {
      const result = operations[operator](stored, value);
      if (!Number.isFinite(result)) { setDisplay("Error"); setStored(null); setOperator(null); setExpression(""); setWaiting(true); return; }
      const clean = Number(result.toPrecision(11));
      setDisplay(String(clean)); setStored(clean); setExpression(fmt(clean) + " " + next);
    } else {
      setStored(value); setExpression(fmt(value) + " " + next);
    }
    setOperator(next); setWaiting(true); setCalculated(false);
  }
  function calculate() {
    if (!operator || stored === null || display === "Error") return;
    const right = Number(display);
    const result = operations[operator](stored, right);
    if (!Number.isFinite(result)) { setDisplay("Error"); setStored(null); setOperator(null); setExpression(""); setWaiting(true); return; }
    const clean = Number(result.toPrecision(11));
    const line = fmt(stored) + " " + operator + " " + fmt(right);
    setHistory((items) => [{ id: Date.now(), expression: line, result: fmt(clean) }, ...items].slice(0, 8));
    setDisplay(String(clean)); setExpression(line + " ="); setStored(null); setOperator(null);
    setWaiting(true); setCalculated(true);
  }
  function sign() {
    if (display !== "Error" && Number(display) !== 0) { setDisplay(String(Number(display) * -1)); setCalculated(false); }
  }
  function percent() {
    if (display !== "Error") { setDisplay(String(Number(display) / 100)); setCalculated(false); }
  }
  function backspace() {
    if (display === "Error" || waiting || calculated) { setDisplay("0"); setWaiting(false); setCalculated(false); return; }
    setDisplay((v) => v.length <= 1 || (v.length === 2 && v.startsWith("-")) ? "0" : v.slice(0, -1));
  }
  function act(action, label) {
    if (action === "clear") clear();
    if (action === "sign") sign();
    if (action === "percent") percent();
    if (action === "operator") chooseOperator(label);
    if (action === "digit") digit(label);
    if (action === "decimal") decimal();
    if (action === "backspace") backspace();
    if (action === "equals") calculate();
  }

  useEffect(() => {
    function onKey(event) {
      if (/^[0-9]$/.test(event.key)) { event.preventDefault(); digit(event.key); }
      else if (event.key === ".") { event.preventDefault(); decimal(); }
      else if (event.key === "+") chooseOperator("+");
      else if (event.key === "-") chooseOperator("−");
      else if (event.key === "*") chooseOperator("×");
      else if (event.key === "/") { event.preventDefault(); chooseOperator("÷"); }
      else if (event.key === "Enter" || event.key === "=") { event.preventDefault(); calculate(); }
      else if (event.key === "Backspace") backspace();
      else if (event.key === "Escape") clear();
      else if (event.key === "%") percent();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function copyResult() {
    if (display === "Error") return;
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch { setCopied(false); }
  }
  function restore(item) {
    setDisplay(item.result.replaceAll(",", "")); setStored(null); setOperator(null);
    setWaiting(true); setExpression(item.expression + " ="); setCalculated(true); setHistoryOpen(false);
  }

  return <main className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <a className="brand" href="#" aria-label="Cal home"><span className="brand-mark"><CalculatorIcon size={20} /></span><span>cal<span className="brand-dot">.</span></span></a>
      <div className="topbar-right"><span className="status-pill"><span className="status-dot" /> Ready to calculate</span>
        <button className="icon-button" onClick={() => setHistoryOpen((v) => !v)} aria-label="Toggle calculation history" title="History">{historyOpen ? <RotateCcw size={18} /> : <History size={18} />}</button>
      </div>
    </header>
    <section className="workspace">
      <div className="intro">
        <div className="eyebrow"><Sparkles size={14} /> YOUR DAILY CALC COMPANION</div>
        <h1>Numbers, with<br /><span>a little glow.</span></h1>
        <p>A simple, beautiful space for your next calculation.</p>
        <div className="intro-meta"><span><span className="meta-dot" /> Fast &amp; lightweight</span><span>·</span><span>Keyboard friendly</span></div>
      </div>
      <div className="calculator-card">
        <div className="card-glow" />
        <div className="calculator-head"><div className="calc-title"><span className="calc-icon"><CalculatorIcon size={17} /></span><div><strong>Calculator</strong><small>STANDARD MODE</small></div></div>
          <button className="icon-button subtle" onClick={clear} aria-label="Reset calculator" title="Reset"><RotateCcw size={17} /></button>
        </div>
        <div className="display-panel" aria-live="polite">
          <div className="expression-line">{expression || " "}</div>
          <div className={"result-line " + (display.length > 11 ? "result-small " : "") + (display === "Error" ? "result-error" : "")} title={display}>{formatted}</div>
          <button className="copy-button" onClick={copyResult} aria-label="Copy result" title="Copy result"><Copy size={14} /> {copied ? "Copied!" : "Copy"}</button>
        </div>
        <div className="keypad" aria-label="Calculator keypad">{keys.map(([label, kind, action]) =>
          <button key={label} className={"key key-" + kind + (action === "operator" && operator === label ? " key-active" : "")} onClick={() => act(action, label)} aria-label={label === "⌫" ? "Backspace" : label}>{label === "⌫" ? <Delete size={19} /> : label}</button>
        )}</div>
        <div className="calculator-foot"><span><span className="foot-light" /> ORANGE GLASS EDITION</span><span>v1.0</span></div>
      </div>
      {historyOpen && <aside className="history-panel">
        <div className="history-heading"><div><Clock3 size={17} /><strong>Recent calculations</strong></div><span>{history.length} saved</span></div>
        {history.length ? <div className="history-list">{history.map((item) =>
          <button className="history-item" key={item.id} onClick={() => restore(item)}><span>{item.expression}</span><strong>{item.result}</strong></button>
        )}</div> : <div className="history-empty"><span className="empty-icon"><History size={20} /></span><strong>No calculations yet</strong><p>Your recent results will show up here.</p></div>}
        {history.length > 0 && <button className="clear-history" onClick={() => setHistory([])}>Clear history</button>}
      </aside>}
    </section>
    <footer className="page-footer"><span>Made for the curious mind <span className="footer-heart">✦</span></span><span className="keyboard-hint"><kbd>Enter</kbd> calculate <kbd>Esc</kbd> clear</span></footer>
  </main>;
}