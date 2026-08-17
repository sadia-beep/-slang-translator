import React, { useState } from "react";

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
  const [slangCount, setSlangCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isToFormal = direction === "toFormal";

  const placeholder = isToFormal
    ? EXAMPLES_SLANG[Math.floor(Math.random() * EXAMPLES_SLANG.length)]
    : EXAMPLES_FORMAL[Math.floor(Math.random() * EXAMPLES_FORMAL.length)];

  async function handleTranslate() {
    if (!input.trim()) return;
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
    setSlangCount(0);
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
        <section className={`panel panel-left ${isToFormal ? "panel-active" : "panel-quiet"}`}>
          <div className="panel-label">
            <span className="panel-index">01</span>
            <span>BRAINROT INPUT</span>
          </div>
          <textarea
            className="panel-textarea slang-font"
            placeholder={isToFormal ? placeholder : "your formal text lands here after swap ✨"}
            value={isToFormal ? input : output}
            onChange={(e) => isToFormal && setInput(e.target.value)}
            readOnly={!isToFormal}
          />
        </section>

        <div className="knob-column">
          <button
            className="knob"
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

          <div className="chaos-meter" aria-hidden="true">
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

        <section className={`panel panel-right ${!isToFormal ? "panel-active" : "panel-quiet"}`}>
          <div className="panel-label">
            <span className="panel-index">02</span>
            <span>BOARDROOM OUTPUT</span>
          </div>
          <textarea
            className="panel-textarea formal-font"
            placeholder={!isToFormal ? placeholder : "your translation lands here"}
            value={!isToFormal ? input : output}
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
