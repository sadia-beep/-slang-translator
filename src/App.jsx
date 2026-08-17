import React, { useState, useRef, useEffect } from "react";

const EXAMPLES_SLANG = [
  "ngl this meeting could've been an email fr fr",
  "no cap my boss said we're cooked if the deadline slips",
  "the vibes in this office are not it chief",
];

const EXAMPLES_FORMAL = [
  "I regret to inform you that I will be unable to attend.",
  "Please find attached the requested documentation.",
  "We appreciate your continued patience during this process.",
];

export default function App() {
  const [direction, setDirection] = useState("toFormal"); // toFormal | toSlang
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [typedOutput, setTypedOutput] = useState("");
  const [slangCount, setSlangCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pressed, setPressed] = useState(false);
  const [copied, setCopied] = useState(false);

  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const typeTimerRef = useRef(null);

  const isToFormal = direction === "toFormal";

  const placeholder = isToFormal
    ? EXAMPLES_SLANG[Math.floor(Math.random() * EXAMPLES_SLANG.length)]
    : EXAMPLES_FORMAL[Math.floor(Math.random() * EXAMPLES_FORMAL.length)];

  // Typewriter reveal whenever a fresh output arrives
  useEffect(() => {
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    if (!output) {
      setTypedOutput("");
      return;
    }
    setTypedOutput("");
    let i = 0;
    typeTimerRef.current = setInterval(() => {
      i += 1;
      setTypedOutput(output.slice(0, i));
      if (i >= output.length) clearInterval(typeTimerRef.current);
    }, 18);
    return () => clearInterval(typeTimerRef.current);
  }, [output]);

  // Mouse-follow tilt for both panels
  function handleTilt(e, ref) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--tiltX", `${(-y * 5).toFixed(2)}deg`);
    el.style.setProperty("--tiltY", `${(x * 5).toFixed(2)}deg`);
    el.style.setProperty("--glowX", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--glowY", `${(y + 0.5) * 100}%`);
  }

  function resetTilt(ref) {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tiltX", "0deg");
    el.style.setProperty("--tiltY", "0deg");
  }

  async function handleTranslate() {
    if (!input.trim()) return;
    setPressed(true);
    setTimeout(() => setPressed(false), 220);
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await fetch("/.netlify/functions/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, direction }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setOutput(data.translated || "");
      setSlangCount(data.slangTermsFound?.length || 0);
    } catch (e) {
      setError("Something broke. Check your API key / dev server and try again.");
    } finally {
      setLoading(false);
    }
  }

  function swapDirection() {
    setDirection(isToFormal ? "toSlang" : "toFormal");
    setInput(output || "");
    setOutput("");
    setTypedOutput("");
    setSlangCount(0);
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="page" data-direction={direction}>
      <header className="topbar">
        <div className="wordmark">
          <span className="wm-brain">brainrot</span>
          <span className="wm-dot">.</span>
          <span className="wm-exe">exe</span>
        </div>
        <p className="tagline">a translator for two very different vocabularies</p>
      </header>

      <main className="stage">
        <section
          ref={leftPanelRef}
          className={`panel panel-left panel-tilt ${isToFormal ? "panel-active" : "panel-quiet"}`}
          onMouseMove={(e) => isToFormal && handleTilt(e, leftPanelRef)}
          onMouseLeave={() => resetTilt(leftPanelRef)}
        >
          <div className="panel-glow" aria-hidden="true" />
          <div className="panel-label">
            <span className="panel-index">01</span>
            <span>BRAINROT INPUT</span>
            {!isToFormal && output && (
              <button className="copy-btn" onClick={handleCopy} aria-label="Copy output">
                {copied ? "copied ✓" : "copy"}
              </button>
            )}
          </div>
          <textarea
            className="panel-textarea slang-font"
            placeholder={isToFormal ? placeholder : "your formal text lands here after swap ✨"}
            value={isToFormal ? input : typedOutput}
            onChange={(e) => isToFormal && setInput(e.target.value)}
            readOnly={!isToFormal}
          />
        </section>

        <div className="knob-column">
          <button
            className={`knob ${pressed ? "knob-pressed" : ""}`}
            onClick={handleTranslate}
            disabled={loading || !input.trim()}
            aria-label="Translate"
          >
            {loading ? (
              <span className="knob-spinner" />
            ) : (
              <span className="knob-arrow">{isToFormal ? "→" : "←"}</span>
            )}
          </button>
          <button className="swap-btn" onClick={swapDirection} aria-label="Swap direction">
            ⇅ swap
          </button>

          <div className={`chaos-meter ${slangCount > 0 ? "chaos-active" : ""}`} aria-hidden="true">
            <div className="chaos-label">chaos detected</div>
            <div className="chaos-track">
              <div
                className="chaos-fill"
                style={{ width: `${Math.min(slangCount * 20, 100)}%` }}
              />
            </div>
            <div className="chaos-count">{slangCount} term{slangCount === 1 ? "" : "s"}</div>
          </div>
        </div>

        <section
          ref={rightPanelRef}
          className={`panel panel-right panel-tilt ${!isToFormal ? "panel-active" : "panel-quiet"}`}
          onMouseMove={(e) => !isToFormal && handleTilt(e, rightPanelRef)}
          onMouseLeave={() => resetTilt(rightPanelRef)}
        >
          <div className="panel-glow" aria-hidden="true" />
          <div className="panel-label">
            <span className="panel-index">02</span>
            <span>BOARDROOM OUTPUT</span>
            {isToFormal && output && (
              <button className="copy-btn" onClick={handleCopy} aria-label="Copy output">
                {copied ? "copied ✓" : "copy"}
              </button>
            )}
          </div>
          <textarea
            className="panel-textarea formal-font"
            placeholder={!isToFormal ? placeholder : "your translation lands here"}
            value={!isToFormal ? input : typedOutput}
            onChange={(e) => !isToFormal && setInput(e.target.value)}
            readOnly={isToFormal}
          />
        </section>
      </main>

      {error && <p className="error">{error}</p>}

      <footer className="footer">
        <span>built with an actual LLM, not a dictionary lookup</span>
      </footer>
    </div>
  );
}
