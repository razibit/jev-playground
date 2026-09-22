import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, Braces, Check, ChevronDown, Clock3, Download, Heart, History,
  LoaderCircle, Plus, RotateCcw, Trash2, X,
} from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ScrollArea } from "./components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import { Switch } from "./components/ui/switch";
import { Textarea } from "./components/ui/textarea";
import "./styles.css";

type Question = { name: string; type: "boolean" | "choice" | "score"; instructions: string; options: string[]; scale: string[] };
type Evaluation = { title: string; state: string; questions: Record<string, Omit<Question, "name">>; answers: Record<string, any>; raw?: any; elapsed?: number; date: string };
type Scenario = { label: string; state: string; questions: Question[] };
const presets: Record<string, Scenario> = {
  support: { label: "Support triage", state: "A customer writes: “I was charged twice for order #8421. Both charges have posted. I need the duplicate charge reversed today because my rent is due tomorrow.” The order total is $48.50 and the account email matches the order.", questions: [
    { name: "queue", type: "choice", instructions: "Which team should handle this request?", options: ["Billing", "Shipping", "Technical support", "General inquiries"], scale: [] },
    { name: "priority", type: "score", instructions: "How urgent is this request? Use the defined scale.", options: [], scale: ["Low — routine", "Normal — soon", "High — significant impact", "Critical — immediate action"] },
    { name: "needs_human", type: "boolean", instructions: "Does this require a human agent to review before any account action?", options: [], scale: [] },
  ] },
  moderation: { label: "Content moderation", state: "A verified customer says: “This blender caught fire after two uses and filled my kitchen with smoke. I want a refund. Also, the company is run by idiots.” No photo is included.", questions: [
    { name: "publish", type: "choice", instructions: "What moderation action should be taken?", options: ["Publish as is", "Publish with warning", "Hold for human review", "Reject"], scale: [] },
    { name: "safety_issue", type: "boolean", instructions: "Does this describe a potential product safety issue that should be escalated?", options: [], scale: [] },
  ] },
  agent: { label: "Agent next step", state: "An assistant found the right configuration file and proposed a small reversible change. The user asked it to fix the issue, but no tests have been run yet.", questions: [
    { name: "next_step", type: "choice", instructions: "What should the agent do next?", options: ["Apply the change", "Ask the user for approval", "Run tests", "Stop and summarize"], scale: [] },
    { name: "ready_to_finish", type: "boolean", instructions: "Is the task ready to be reported as complete?", options: [], scale: [] },
  ] },
  hiring: { label: "Resume screening", state: "Resume excerpt: “Built an internal dashboard in React and TypeScript. Worked with product managers to define requirements. Added a reusable table component and participated in code reviews.” Role requires React, TypeScript, accessibility, and customer-facing product experience.", questions: [
    { name: "fit", type: "score", instructions: "How well does the evidence match the role requirements?", options: [], scale: ["Weak match", "Partial match", "Good match", "Strong match"] },
    { name: "missing_evidence", type: "choice", instructions: "What evidence should be assessed next?", options: ["Accessibility work", "Customer-facing delivery", "Employment dates", "All equally important"], scale: [] },
    { name: "advance", type: "boolean", instructions: "Is there enough evidence to confidently recommend advancing?", options: [], scale: [] },
  ] },
};
const cloneQuestions = (qs: Question[]) => qs.map((q) => ({ ...q, options: [...q.options], scale: [...q.scale] }));
function readHistory(): Evaluation[] { try { const value = JSON.parse(localStorage.getItem("jev-history") || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
function ChatGPTMark() {
  return (
    <svg
      className="creator-chatgpt-icon"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      imageRendering="optimizeQuality"
      fillRule="evenodd"
      clipRule="evenodd"
      viewBox="0 0 512 509.639"
    >
      <path
        fill="#fff"
        d="M115.612 0h280.775C459.974 0 512 52.026 512 115.612v278.415c0 63.587-52.026 115.613-115.613 115.613H115.612C52.026 509.64 0 457.614 0 394.027V115.612C0 52.026 52.026 0 115.612 0z"
      />
      <path
        fillRule="nonzero"
        d="M412.037 221.764a90.834 90.834 0 004.648-28.67 90.79 90.79 0 00-12.443-45.87c-16.37-28.496-46.738-46.089-79.605-46.089-6.466 0-12.943.683-19.264 2.04a90.765 90.765 0 00-67.881-30.515h-.576c-.059.002-.149.002-.216.002-39.807 0-75.108 25.686-87.346 63.554-25.626 5.239-47.748 21.31-60.682 44.03a91.873 91.873 0 00-12.407 46.077 91.833 91.833 0 0023.694 61.553 90.802 90.802 0 00-4.649 28.67 90.804 90.804 0 0012.442 45.87c16.369 28.504 46.74 46.087 79.61 46.087a91.81 91.81 0 0019.253-2.04 90.783 90.783 0 0067.887 30.516h.576l.234-.001c39.829 0 75.119-25.686 87.357-63.588 25.626-5.242 47.748-21.312 60.682-44.033a91.718 91.718 0 0012.383-46.035 91.83 91.83 0 00-23.693-61.553l-.004-.005zM275.102 413.161h-.094a68.146 68.146 0 01-43.611-15.8 56.936 56.936 0 002.155-1.221l72.54-41.901a11.799 11.799 0 005.962-10.251V241.651l30.661 17.704c.326.163.55.479.596.84v84.693c-.042 37.653-30.554 68.198-68.21 68.273h.001zm-146.689-62.649a68.128 68.128 0 01-9.152-34.085c0-3.904.341-7.817 1.005-11.663.539.323 1.48.897 2.155 1.285l72.54 41.901a11.832 11.832 0 0011.918-.002l88.563-51.137v35.408a1.1 1.1 0 01-.438.94l-73.33 42.339a68.43 68.43 0 01-34.11 9.12 68.359 68.359 0 01-59.15-34.11l-.001.004zm-19.083-158.36a68.044 68.044 0 0135.538-29.934c0 .625-.036 1.731-.036 2.5v83.801l-.001.07a11.79 11.79 0 005.954 10.242l88.564 51.13-30.661 17.704a1.096 1.096 0 01-1.034.093l-73.337-42.375a68.36 68.36 0 01-34.095-59.143 68.412 68.412 0 019.112-34.085l-.004-.003zm251.907 58.621l-88.563-51.137 30.661-17.697a1.097 1.097 0 011.034-.094l73.337 42.339c21.109 12.195 34.132 34.746 34.132 59.132 0 28.604-17.849 54.199-44.686 64.078v-86.308c.004-.032.004-.065.004-.096 0-4.219-2.261-8.119-5.919-10.217zm30.518-45.93c-.539-.331-1.48-.898-2.155-1.286l-72.54-41.901a11.842 11.842 0 00-5.958-1.611c-2.092 0-4.15.558-5.957 1.611l-88.564 51.137v-35.408l-.001-.061a1.1 1.1 0 01.44-.88l73.33-42.303a68.301 68.301 0 0134.108-9.129c37.704 0 68.281 30.577 68.281 68.281a68.69 68.69 0 01-.984 11.545v.005zm-191.843 63.109l-30.668-17.704a1.09 1.09 0 01-.596-.84v-84.692c.016-37.685 30.593-68.236 68.281-68.236a68.332 68.332 0 0143.689 15.804 63.09 63.09 0 00-2.155 1.222l-72.54 41.9a11.794 11.794 0 00-5.961 10.248v.068l-.05 102.23zm16.655-35.91l39.445-22.782 39.444 22.767v45.55l-39.444 22.767-39.445-22.767v-45.535z"
      />
    </svg>
  );
}

function App() {
  const [scenario, setScenario] = useState("support");
  const [state, setState] = useState(presets.support.state);
  const [questions, setQuestions] = useState<Question[]>(cloneQuestions(presets.support.questions));
  const [answers, setAnswers] = useState<Record<string, any> | null>(null);
  const [raw, setRaw] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [history, setHistory] = useState<Evaluation[]>(readHistory);
  const [activeRun, setActiveRun] = useState<Evaluation | null>(null);

  useEffect(() => { fetch("/api/status").then((r) => r.ok ? r.json() : null).then((d) => setConfigured(Boolean(d?.configured))).catch(() => setConfigured(null)); }, []);
  const chooseScenario = (key: string) => { setScenario(key); setState(presets[key].state); setQuestions(cloneQuestions(presets[key].questions)); setAnswers(null); setRaw(null); setActiveRun(null); setError(""); };
  const clearResult = () => { setActiveRun(null); setAnswers(null); setRaw(null); };
  const updateQuestion = (index: number, patch: Partial<Question>) => { clearResult(); setQuestions((items) => items.map((q, i) => i === index ? { ...q, ...patch } : q)); };
  const persistHistory = (entries: Evaluation[]) => { setHistory(entries); try { localStorage.setItem("jev-history", JSON.stringify(entries)); } catch { setError("Could not save this session in local storage."); } };
  const run = async () => {
    setBusy(true); setError(""); setAnswers(null); setRaw(null); setActiveRun(null);
    try {
      const questionMap = Object.fromEntries(questions.map(({ name, ...q }) => [name, q]));
      const response = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state, questions: questionMap }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
      const result = data.result?.answers || data.answers || {};
      const entry: Evaluation = { title: `${presets[scenario].label} evaluation`, state, questions: questionMap, answers: result, raw: data.result || data, elapsed: data.elapsedMs, date: new Date().toISOString() };
      setAnswers(result); setRaw(data.result || data); setActiveRun(entry); persistHistory([entry, ...history].slice(0, 100));
    } catch (err) { setError(err instanceof Error ? err.message : "Evaluation failed."); }
    finally { setBusy(false); }
  };
  const loadRun = (entry: Evaluation) => {
    setActiveRun(entry); setState(entry.state); setAnswers(entry.answers); setRaw(entry.raw || entry); setError(""); setShowRaw(false);
    const match = Object.entries(presets).find(([, p]) => p.label === entry.title.replace(/ evaluation$/, ""));
    if (match) setScenario(match[0]);
    setQuestions(Object.entries(entry.questions || {}).map(([name, q]) => ({ name, ...q, options: q.options || [], scale: q.scale || [] })));
  };
  const exportHistory = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(history, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = "jev-session-log.json"; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const addQuestion = () => { clearResult(); setQuestions((items) => [...items, { name: `decision${items.length + 1}`, type: "boolean", instructions: "", options: [], scale: [] }]); };

  return <div className="app-shell" onKeyDown={(event) => { if (event.ctrlKey && event.key === "Enter") { event.preventDefault(); if (!busy) void run(); } }}>
    <aside className="nav-rail">
      <div className="wordmark"><span className="wordmark-icon">J</span><span>Jev <small>Playground</small></span></div>
      <div className="rail-section"><div className="rail-heading">SCENARIOS</div>{Object.entries(presets).map(([key, item]) => <Button key={key} variant="ghost" size="sm" className={`rail-item ${scenario === key && !activeRun ? "is-active" : ""}`} onClick={() => chooseScenario(key)}><span className="scenario-dot" />{item.label}</Button>)}</div>
      <Separator />
      <div className="rail-heading recent-heading"><span>RECENT</span><span>{String(history.length).padStart(2, "0")}</span></div>
      <ScrollArea className="history-list">{history.map((item, i) => <Button key={`${item.date}-${i}`} variant="ghost" size="sm" className={`rail-item history-link ${activeRun === item ? "is-active" : ""}`} onClick={() => loadRun(item)}><Clock3 size={14} /><span className="history-label">{item.title}</span></Button>)}</ScrollArea>
      <div className="rail-footer"><Separator /><div className="credit" aria-label="Made with love by"><span>Made with</span><Heart size={13} fill="currentColor" className="credit-heart"/><span>by</span><ChatGPTMark/><img src="/creator-avatar.png" alt="" width="19" height="19" /></div></div>
    </aside>

    <aside className="control-pane">
      <div className="pane-top"><div><div className="pane-overline">PLAYGROUND</div><div className="pane-title">{presets[scenario].label}</div></div></div>
      <ScrollArea className="controls-scroll">
        <section className="control-section questions-section"><div className="section-heading"><span>QUESTIONS</span><Button variant="ghost" size="sm" className="compact-button" onClick={addQuestion}><Plus size={14}/> Add</Button></div>
          {questions.map((q, i) => <div className="question-editor" key={`${i}-${q.name}`}><div className="question-topline"><span className="question-index">{String(i + 1).padStart(2, "0")}</span><Input className="question-name" aria-label={`Question ${i + 1} name`} value={q.name} onChange={(event) => updateQuestion(i, { name: event.target.value.replace(/[^a-zA-Z0-9_-]/g, "_") })} /><Select value={q.type} onValueChange={(type: Question["type"]) => updateQuestion(i, { type })}><SelectTrigger aria-label={`Question ${i + 1} type`} className="type-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="boolean">Boolean</SelectItem><SelectItem value="choice">Choice</SelectItem><SelectItem value="score">Score</SelectItem></SelectContent></Select><Button variant="ghost" size="icon" className="remove-question" aria-label={`Remove question ${i + 1}`} onClick={() => { clearResult(); setQuestions((items) => items.filter((_, index) => index !== i)); }}><Trash2 size={14}/></Button></div>
            <Textarea aria-label={`Question ${i + 1} instructions`} className="instruction-input" value={q.instructions} onChange={(event) => updateQuestion(i, { instructions: event.target.value })} placeholder="Question instructions" rows={2}/>
            {q.type === "choice" && <div className="typed-control"><Label htmlFor={`options-${i}`}>OPTIONS</Label><Textarea id={`options-${i}`} aria-label={`Question ${i + 1} choices`} className="instruction-input" value={q.options.join("\n")} onChange={(event) => updateQuestion(i, { options: event.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} placeholder={"One option per line"} rows={3}/></div>}
            {q.type === "score" && <div className="typed-control"><Label htmlFor={`scale-${i}`}>SCALE · LOW TO HIGH</Label><Textarea id={`scale-${i}`} aria-label={`Question ${i + 1} scale`} className="instruction-input" value={q.scale.join("\n")} onChange={(event) => updateQuestion(i, { scale: event.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} placeholder={"One level per line"} rows={3}/></div>}
          </div>)}
        </section>
      </ScrollArea>
      <div className="pane-bottom"><span><span className={`status-light ${configured === false ? "status-off" : ""}`} />{configured === true ? "Gateway ready" : configured === false ? "Gateway key missing" : "Checking gateway"}</span><span>typesafe-ai/jev</span></div>
    </aside>

    <main className="result-canvas">
      <header className="canvas-header"><div className="canvas-context"><Activity size={16}/><span>{activeRun?.title || presets[scenario].label}</span><ChevronDown size={14}/></div><div className="canvas-actions"><Button variant="ghost" size="icon" aria-label="Clear output" onClick={() => { setAnswers(null); setRaw(null); setActiveRun(null); setError(""); }}><RotateCcw size={15}/></Button><Button variant="ghost" size="icon" aria-label="Export session log" onClick={exportHistory} disabled={!history.length}><Download size={15}/></Button><Button variant="ghost" size="icon" aria-label="Clear session history" onClick={() => { persistHistory([]); setActiveRun(null); }} disabled={!history.length}><Trash2 size={15}/></Button></div></header>
      <div className="result-scroll">
        {error && <div className="error-banner" role="alert"><X size={16}/><span>{error}</span></div>}
        {answers ? <div className="response-block"><div className="response-heading"><div className="response-avatar">J</div><div><div className="response-title">Evaluation</div><div className="response-meta">{activeRun?.elapsed ?? "—"} ms <span>·</span> {Object.keys(answers).length} outputs</div></div></div>
          <div className="answer-list">{Object.entries(answers).map(([name, answer]: [string, any]) => {
            const definition = questions.find((q) => q.name === name);
            const probability = typeof answer?.probability === "number" ? answer.probability : undefined;
            const type = answer?.type || definition?.type || "result";
            const value = answer?.choice ?? answer?.score ?? (typeof answer?.value === "boolean" ? (answer.value ? "True" : "False") : answer?.value ?? (probability === undefined ? JSON.stringify(answer) : probability >= .5 ? "True" : "False"));
            const distribution = answer?.probabilities && typeof answer.probabilities === "object" ? Object.entries(answer.probabilities).filter(([, score]) => typeof score === "number").map(([key, score]) => ({ label: type === "score" && /^\d+$/.test(key) ? definition?.scale[Number(key)] || key : key, score: score as number })).sort((left, right) => right.score - left.score) : [];
            return <div className="answer-row" key={name}>
              <div className="answer-label"><span>{name}</span><Badge variant="outline">{type}</Badge></div>
              <div className="answer-value">{String(value)}</div>
              {probability !== undefined && <div className="probability-row"><span>Probability</span><strong>{(probability * 100).toFixed(1)}%</strong><div className="probability-track"><i style={{ width: `${Math.max(0, Math.min(100, probability * 100))}%` }}/></div></div>}
              {distribution.length > 0 && <div className="distribution-list">{distribution.map(({ label, score }) => <div className="distribution-item" key={label}><div className="distribution-meta"><span>{label}</span><strong>{(score * 100).toFixed(1)}%</strong></div><div className="distribution-track"><i style={{ width: `${Math.max(0, Math.min(100, score * 100))}%` }}/></div></div>)}</div>}
              {typeof answer?.confidence === "number" && <div className="confidence-line"><span>Confidence</span><strong>{(answer.confidence * 100).toFixed(1)}%</strong></div>}
            </div>;
          })}</div>
          <div className="raw-toggle"><div className="raw-label"><Braces size={15}/>Raw response</div><Switch checked={showRaw} onCheckedChange={setShowRaw} aria-label="Show raw API response"/></div>{showRaw && <pre className="raw-output">{JSON.stringify(raw, null, 2)}</pre>}
        </div> : <div className="canvas-empty"><div className="empty-glyph"><Activity size={21}/></div><div className="empty-title">{busy ? "Evaluating" : "No output"}</div>{busy && <LoaderCircle className="loading-spin" size={16}/>}</div>}
      </div>
      <div className="composer-wrap"><div className="composer"><div className="composer-label">STATE</div><Label htmlFor="state-input" className="sr-only">Evaluation state</Label><Textarea id="state-input" className="composer-state" value={state} onChange={(event) => { setState(event.target.value); clearResult(); }} /><div className="composer-bottom"><span>{state.length.toLocaleString()} chars<span className="composer-sep">·</span>{questions.length} {questions.length === 1 ? "question" : "questions"}</span><Button onClick={run} disabled={busy || !state.trim()} className="run-button">{busy ? <LoaderCircle className="loading-spin" size={15}/> : <Check size={15}/>} {busy ? "Evaluating" : "Run evaluation"}</Button></div></div><div className="composer-caption"><kbd>Ctrl</kbd> <span>+</span> <kbd>Enter</kbd> to run</div></div>
    </main>
  </div>;
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
