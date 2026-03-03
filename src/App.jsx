import React, { useState, useRef, useEffect, useCallback } from "react";

/* ════════════════════════════════════════
   DATA & CONSTANTS
   ════════════════════════════════════════ */
const COUNTRIES = [
  { id: "us", label: "United States", flag: "US" },
  { id: "uk", label: "United Kingdom", flag: "UK" },
  { id: "jp", label: "Japan", flag: "JP" },
  { id: "sea", label: "Southeast Asia", flag: "SEA" },
  { id: "eu", label: "Europe", flag: "EU" },
  { id: "mena", label: "Middle East", flag: "MENA" },
];

const AUDIENCES = [
  { id: "genz", label: "Gen Z", desc: "18–27, meme-native, values authenticity" },
  { id: "millennial", label: "Millennials", desc: "28–42, brand-conscious, experience-driven" },
  { id: "genx", label: "Gen X+", desc: "43+, quality-focused" },
  { id: "broad", label: "Mass Market", desc: "Universal appeal" },
];

const PLATFORMS = [
  { id: "tiktok", label: "TikTok" }, { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "X / Twitter" }, { id: "youtube", label: "YouTube" },
  { id: "linkedin", label: "LinkedIn" }, { id: "website", label: "Website / PR" },
];

const GOALS = [
  { id: "awareness", label: "Awareness" }, { id: "engagement", label: "Engagement" },
  { id: "conversion", label: "Conversion" }, { id: "cultural", label: "Cultural Branding" },
];

const LENGTHS = [
  { id: "oneliner", label: "One-liner (Max 12 words)" },
  { id: "short", label: "Short (1-2 sentences)" },
  { id: "medium", label: "Medium (3-4 sentences)" },
];

const CASES = [
  { id: "deepspace", brand: "Love and Deepspace", icon: "💫",
    adapt: { text: "在这个世界，每一次心跳都是真实的。深空之中，与他命运相连。", ctx: "Love and Deepspace (Infold Games) — 3D romance action game global launch", audience: "genz", platform: "tiktok", country: "us", goal: "awareness", length: "short" },
    evaluate: { text: "In a world beyond the stars, every heartbeat is real. Dive into deep space — your destiny awaits.", ctx: "Love and Deepspace — US social media ads", country: "us", audience: "genz" }},
  { id: "songmont", brand: "Songmont 崧", icon: "👜",
    adapt: { text: "崧，以山为名，取松柏之姿。一针一线，皆是东方的从容与笃定。", ctx: "Songmont — premium leather goods expanding to US/EU luxury market", audience: "millennial", platform: "instagram", country: "us", goal: "cultural", length: "short" },
    evaluate: { text: "Songmont. Rooted in the East, crafted for the world. Every stitch tells a story of quiet confidence.", ctx: "Songmont — English tagline on global website", country: "us", audience: "millennial" }},
  { id: "genshin", brand: "原神 Genshin", icon: "⚔️",
    adapt: { text: "尘世的旅人啊，新的篇章已经开启。纳塔的烈焰与节拍，等待你的到来。", ctx: "Genshin Impact — Natlan region update announcement", audience: "genz", platform: "twitter", country: "us", goal: "engagement", length: "short" },
    evaluate: { text: "Traveler, a new chapter unfolds. The flames and rhythms of Natlan await your arrival.", ctx: "Genshin Impact — English social media announcement", country: "us", audience: "genz" }},
];

/* ════════════════════════════════════════
   PROMPT ENGINE (Gemini API Adaptation)
   ════════════════════════════════════════ */
function buildAdaptPrompt({ input, brandCtx, country, audience, platform, goal, length, retention, history }) {
  const c = COUNTRIES.find(x => x.id === country) || COUNTRIES[0];
  const a = AUDIENCES.find(x => x.id === audience) || AUDIENCES[0];
  const p = PLATFORMS.find(x => x.id === platform) || PLATFORMS[0];
  
  const retDesc = retention <= 20 ? "FULL LOCALIZATION: Erase all Chinese markers. Read as if a local copywriter wrote it."
    : retention <= 40 ? "LEAN LOCAL: Replace most cultural references. Keep only brand-name identity."
    : retention <= 60 ? "BALANCED: Adapt for comprehension but keep cultural flavor. Intrigue, don't confuse."
    : retention <= 80 ? "LEAN PRESERVE: Keep distinctive Chinese elements. Adapt only extreme confusion."
    : "FULL PRESERVE: Maximum cultural fidelity. Foreignness IS the brand appeal.";

  let iterationContext = "";
  if (history && history.length > 0) {
    const prev = history[history.length - 1];
    iterationContext = `\n\nITERATION CONTEXT:\nPrevious copy: "${prev.result.adapted_copy}"\nUser Feedback: "${prev.feedback}"\nCRITICAL: You must honor the user's feedback in this new version.`;
  }

  const systemPrompt = `You are CultureBridge — a senior cross-cultural brand strategist and high-end editorial copywriter. You specialize in helping Chinese brands transcreate content for overseas markets with absolute elegance and cultural nuance.
  
YOUR TARGET: ${c.label} Market -> ${a.label} (${a.desc})
PLATFORM: ${p.label}
GOAL: ${goal}
CULTURAL RETENTION: ${retention}/100 — ${retDesc}

Write breathtaking, native-feeling copy. Be concise. Match the platform's exact vibe. Do not sound like a translation. Sound like an award-winning local copywriter.${iterationContext}`;

  const userQuery = `Original Chinese Copy:\n"${input}"\n\nBrand Context: ${brandCtx || "General Brand"}`;

  return { systemPrompt, userQuery };
}

function buildEvalPrompt({ input, brandCtx, country, audience, history }) {
  const c = COUNTRIES.find(x => x.id === country) || COUNTRIES[0];
  const a = AUDIENCES.find(x => x.id === audience) || AUDIENCES[0];

  let iterationContext = "";
  if (history && history.length > 0) {
    const prev = history[history.length - 1];
    iterationContext = `\n\nITERATION CONTEXT:\nPrevious Rewrite: "${prev.result.rewrite || ''}"\nUser Feedback: "${prev.feedback}"\nIncorporate this feedback heavily into your new audit.`;
  }

  const systemPrompt = `You are CultureBridge Evaluator — a rigorous, high-end cultural resonance auditor. You analyze English/localized copy from Chinese brands and rate how native and effective it feels in the target market.
  
Evaluate strictly. A score above 75 means it competes with top local brands. 
TARGET MARKET: ${c.label}
TARGET AUDIENCE: ${a.label}${iterationContext}`;

  const userQuery = `Localized Copy to Audit:\n"${input}"\n\nBrand Context: ${brandCtx || "General Brand"}`;

  return { systemPrompt, userQuery };
}

/* ════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════ */
export default function CultureBridgeApp() {
  const [mode, setMode] = useState("adapt"); 
  
  // Form State
  const [input, setInput] = useState("");
  const [brandCtx, setBrandCtx] = useState("");
  const [country, setCountry] = useState("us");
  const [audience, setAudience] = useState("genz");
  const [platform, setPlatform] = useState("instagram");
  const [goal, setGoal] = useState("awareness");
  const [length, setLength] = useState("short");
  const [retention, setRetention] = useState(50);
  
  // App State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [iterations, setIterations] = useState([]);
  const [refineInput, setRefineInput] = useState("");
  const [activeCase, setActiveCase] = useState(null);
  
  const resultRef = useRef(null);
  const apiKey = ""; 

  useEffect(() => {
    if (result && resultRef.current && iterations.length === 0) {
      setTimeout(() => {
        resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [result, iterations.length]);

  const callGeminiAPI = async (history = []) => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    const { systemPrompt, userQuery } = mode === "adapt"
      ? buildAdaptPrompt({ input, brandCtx, country, audience, platform, goal, length, retention, history })
      : buildEvalPrompt({ input, brandCtx, country, audience, history });

    const schema = mode === "adapt" ? {
      type: "OBJECT",
      properties: {
        adapted_copy: { type: "STRING" },
        strategy: { type: "STRING" },
        culture_map: {
          type: "ARRAY", items: {
            type: "OBJECT", properties: {
              zh: { type: "STRING" }, localized: { type: "STRING" }, 
              action: { type: "STRING" }, logic: { type: "STRING" }
            }
          }
        },
        local_reaction: { type: "STRING" },
        brand_dna: { type: "STRING" },
        alt: { type: "OBJECT", properties: { approach: { type: "STRING" }, copy: { type: "STRING" } } }
      },
      required: ["adapted_copy", "strategy", "culture_map", "local_reaction"]
    } : {
      type: "OBJECT",
      properties: {
        scores: {
          type: "OBJECT", properties: {
            cultural_resonance: { type: "INTEGER" }, brand_identity: { type: "INTEGER" },
            emotional_impact: { type: "INTEGER" }, platform_fit: { type: "INTEGER" }, overall: { type: "INTEGER" }
          }
        },
        local_reaction: { type: "STRING" },
        strengths: { type: "ARRAY", items: { type: "STRING" } },
        issues: {
          type: "ARRAY", items: {
            type: "OBJECT", properties: { problem: { type: "STRING" }, severity: { type: "STRING" }, fix: { type: "STRING" } }
          }
        },
        rewrite: { type: "STRING" },
        rewrite_rationale: { type: "STRING" }
      },
      required: ["scores", "local_reaction", "strengths", "issues", "rewrite"]
    };

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: "application/json", responseSchema: schema }
    };

    let retries = 5;
    let delay = 1000;
    
    while (retries > 0) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (jsonText) {
          setResult(JSON.parse(jsonText));
          setLoading(false);
          return;
        } else throw new Error("Empty response");
      } catch (err) {
        retries--;
        if (retries === 0) {
          setError("Connection lost. The oracle is currently unavailable.");
          setLoading(false);
        } else {
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        }
      }
    }
  };

  const handleSubmit = () => { setIterations([]); setRefineInput(""); callGeminiAPI([]); };
  const handleRefine = () => {
    if (!refineInput.trim() || !result) return;
    const newHistory = [...iterations, { result, feedback: refineInput }];
    setIterations(newHistory); setRefineInput(""); callGeminiAPI(newHistory);
  };
  const switchMode = (m) => { setMode(m); setResult(null); setError(null); setIterations([]); setInput(""); setBrandCtx(""); setActiveCase(null); };

  const loadCase = (c) => {
    const d = mode === "adapt" ? c.adapt : c.evaluate;
    setInput(d.text); setBrandCtx(d.ctx); setCountry(d.country); setAudience(d.audience);
    if (mode === "adapt") { setPlatform(d.platform); setGoal(d.goal); setLength(d.length); }
    setActiveCase(c.id); setResult(null); setError(null); setIterations([]); setRefineInput("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Noto+Serif+SC:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap');

        :root {
          /* Color Palette - Deeper, richer paper and absolute black ink */
          --bg-paper: #EFECE6;
          --bg-panel: #FAF9F6;
          --ink-dark: #0A0A0A;
          --ink-mid: #4A4A48;
          --ink-light: #999995;
          --ink-faint: #D6D5D0;
          
          /* Accent Colors - High fashion editorial */
          --accent-red: #A82020;
          --accent-blue: #1A365D;
          --accent-gold: #A38035;
          
          /* Typography */
          --font-serif-en: 'Playfair Display', serif;
          --font-serif-cn: 'Noto Serif SC', serif;
          --font-mix: 'Playfair Display', 'Noto Serif SC', serif;
          --font-mono: 'DM Mono', monospace;

          /* Animation Easing */
          --ease-smooth: cubic-bezier(0.2, 0.8, 0.2, 1);
          --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background-color: var(--bg-paper);
          color: var(--ink-dark);
          font-family: var(--font-mix);
          line-height: 1.6;
          overflow-x: hidden;
          /* Refined noise texture */
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.045'/%3E%3C/svg%3E");
        }

        ::selection { background: rgba(168, 32, 32, 0.15); color: var(--ink-dark); }

        /* ══════ AMBIENT ATMOSPHERE (The "Expensive" Feel) ══════ */
        .ambient-blob {
          position: fixed; border-radius: 50%; filter: blur(80px);
          z-index: -1; opacity: 0.8; pointer-events: none;
          animation: breathe 12s infinite alternate var(--ease-smooth);
        }
        .blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(168,32,32,0.25), transparent 70%); }
        .blob-2 { bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(26,54,93,0.25), transparent 70%); animation-delay: -5s; }
        
        @keyframes breathe {
          0% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          100% { transform: scale(1.1) translate(40px, -40px); opacity: 0.9; }
        }

        /* ══════ ANIMATION UTILITIES ══════ */
        .stagger-1 { animation: slideFadeUp 0.8s var(--ease-out) 0.1s both; }
        .stagger-2 { animation: slideFadeUp 0.8s var(--ease-out) 0.2s both; }
        .stagger-3 { animation: slideFadeUp 0.8s var(--ease-out) 0.3s both; }
        .stagger-4 { animation: slideFadeUp 0.8s var(--ease-out) 0.4s both; }

        @keyframes slideFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ══════ LAYOUT ══════ */
        .app-container { display: flex; min-height: 100vh; position: relative; }
        
        /* Premium Sidebar */
        .sidebar {
          width: 80px; border-right: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column;
          align-items: center; padding: 40px 0; position: fixed; height: 100vh;
          background: rgba(245, 244, 240, 0.4); backdrop-filter: blur(20px); z-index: 100;
          box-shadow: 1px 0 20px rgba(0,0,0,0.02);
        }
        .sidebar-text-en { writing-mode: vertical-rl; text-orientation: mixed; font-family: var(--font-mono); letter-spacing: 6px; font-size: 0.75rem; color: var(--ink-light); text-transform: uppercase; }
        .sidebar-dot { width: 4px; height: 4px; background-color: var(--accent-red); border-radius: 50%; margin: 30px 0; transition: transform 0.3s var(--ease-out); }
        .sidebar:hover .sidebar-dot { transform: scaleY(4) scaleX(1.5); border-radius: 2px; }
        .sidebar-text-cn { writing-mode: vertical-rl; font-family: var(--font-serif-cn); font-weight: 500; font-size: 1.1rem; letter-spacing: 8px; color: var(--ink-dark); margin-top: auto; }

        .workspace { margin-left: 80px; flex: 1; padding: 8vh 10%; max-width: 1400px; margin-right: auto; position: relative; z-index: 1; }

        /* ══════ HEADERS & NAVIGATION ══════ */
        .header-area { margin-bottom: 80px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; padding-bottom: 30px; }
        .header-area::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, var(--ink-dark) 0%, rgba(0,0,0,0) 100%); }
        .title-en { font-family: var(--font-serif-en); font-size: 4rem; font-weight: 400; line-height: 1; margin-bottom: 15px; font-style: italic; letter-spacing: -1px; }
        .title-cn { font-family: var(--font-serif-cn); font-size: 1.1rem; font-weight: 400; letter-spacing: 6px; color: var(--ink-mid); }
        
        .mode-nav { display: flex; gap: 40px; }
        .mode-btn {
          position: relative; background: none; border: none; font-family: var(--font-mono); font-size: 0.8rem;
          text-transform: uppercase; letter-spacing: 3px; color: var(--ink-light); cursor: pointer; padding-bottom: 10px; transition: color 0.3s;
        }
        .mode-btn::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0%; height: 2px; background: var(--accent-red); transition: width 0.4s var(--ease-smooth); }
        .mode-btn:hover { color: var(--ink-dark); }
        .mode-btn.active { color: var(--ink-dark); font-weight: 500; }
        .mode-btn.active::after { width: 100%; }

        /* ══════ FORM ELEMENTS (Sleek Interactions) ══════ */
        .form-section { margin-bottom: 60px; position: relative; }
        .field-label {
          font-family: var(--font-mono); font-size: 0.7rem; text-transform: uppercase;
          letter-spacing: 3px; color: var(--ink-mid); margin-bottom: 20px;
          display: flex; align-items: center; gap: 15px;
        }
        .field-label::before { content: ''; display: block; width: 30px; height: 1px; background: var(--ink-faint); }
        
        .input-elegant {
          width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--ink-faint);
          padding: 10px 0 20px 0; font-family: var(--font-mix); font-size: 1.5rem; color: var(--ink-dark);
          outline: none; resize: none; transition: border-color 0.4s var(--ease-smooth); line-height: 1.6;
          box-shadow: inset 0 -1px 0 0 transparent;
        }
        .input-elegant:focus { border-bottom-color: var(--ink-dark); box-shadow: inset 0 -1px 0 0 var(--ink-dark); }
        .input-elegant::placeholder { color: var(--ink-faint); font-style: italic; font-family: var(--font-serif-en); }

        .chip-grid { display: flex; flex-wrap: wrap; gap: 12px; }
        .chip {
          background: rgba(255,255,255,0.3); border: 1px solid var(--ink-faint); padding: 12px 24px;
          font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-mid); cursor: pointer;
          border-radius: 40px; transition: all 0.4s var(--ease-smooth); position: relative; overflow: hidden;
        }
        .chip::before {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: var(--ink-dark); transform: translateY(100%); transition: transform 0.4s var(--ease-smooth); z-index: -1;
        }
        .chip:hover { border-color: var(--ink-dark); color: var(--ink-dark); transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .chip.active { background: transparent; color: var(--bg-paper); border-color: var(--ink-dark); }
        .chip.active::before { transform: translateY(0); }

        /* Slider - Minimalist */
        .slider-wrapper { margin-top: 30px; position: relative; height: 30px; display: flex; align-items: center; cursor: pointer; }
        .slider-track { position: absolute; width: 100%; height: 1px; background: var(--ink-faint); }
        .slider-fill { position: absolute; height: 2px; background: var(--ink-dark); transition: width 0.1s; }
        .slider-input { width: 100%; position: relative; z-index: 2; opacity: 0; cursor: pointer; }
        .slider-thumb {
          position: absolute; width: 12px; height: 12px; background: var(--ink-dark); border-radius: 0;
          transform: translate(-50%, 0) rotate(45deg); pointer-events: none; z-index: 1; transition: left 0.1s, transform 0.3s var(--ease-smooth);
        }
        .slider-wrapper:hover .slider-thumb { transform: translate(-50%, 0) rotate(135deg) scale(1.2); background: var(--accent-red); }
        .slider-labels { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.65rem; color: var(--ink-light); margin-top: 15px; text-transform: uppercase; letter-spacing: 2px;}

        /* Premium Action Button */
        .btn-wrapper { margin-top: 40px; position: relative; display: inline-block; width: 100%; }
        .action-btn {
          font-family: var(--font-mono); font-size: 0.95rem; letter-spacing: 4px;
          text-transform: uppercase; padding: 24px 40px; background: var(--ink-dark);
          color: var(--bg-paper); border: none; cursor: pointer; width: 100%;
          transition: all 0.4s var(--ease-smooth); position: relative; overflow: hidden;
          display: flex; justify-content: center; align-items: center; gap: 15px;
        }
        .action-btn::after {
          content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 100%;
          background: var(--accent-red); transform: translateY(100%); transition: transform 0.5s var(--ease-smooth); z-index: 1;
        }
        .action-btn:hover:not(:disabled)::after { transform: translateY(0); }
        .btn-text { position: relative; z-index: 2; transition: transform 0.4s var(--ease-smooth); display: flex; align-items: center; gap: 10px; }
        .action-btn:hover:not(:disabled) .btn-text { transform: scale(1.02); }
        .action-btn:disabled { background: var(--ink-faint); color: var(--ink-light); cursor: not-allowed; }

        /* Custom Loading State */
        .loader-dots { display: inline-flex; gap: 4px; }
        .loader-dots span { width: 4px; height: 4px; background: currentColor; border-radius: 50%; animation: pulse 1s infinite alternate; }
        .loader-dots span:nth-child(2) { animation-delay: 0.2s; } .loader-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 1; } }

        /* ══════ RESULTS AREA (The Big Reveal) ══════ */
        .results-container {
          margin-top: 100px; padding-top: 80px; position: relative;
          animation: slideFadeUp 1s var(--ease-out) forwards;
        }
        .results-container::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 1px; height: 40px; background: var(--ink-dark);
        }

        .pull-quote-wrapper { position: relative; margin: 60px 0 80px 0; padding: 60px 80px; background: var(--bg-panel); border: 1px solid var(--ink-faint); box-shadow: 0 30px 60px rgba(0,0,0,0.05); }
        .quote-mark {
          position: absolute; left: 10px; top: -50px; font-family: var(--font-serif-en);
          font-size: 14rem; color: var(--accent-red); opacity: 0.08; line-height: 1; user-select: none;
        }
        .adapted-text {
          font-family: var(--font-mix); font-size: 3.5rem; font-weight: 400;
          font-style: italic; line-height: 1.4; color: var(--ink-dark); margin: 0; position: relative; z-index: 2;
          letter-spacing: -0.5px; text-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .editorial-block {
          display: grid; grid-template-columns: 1fr 2fr; gap: 40px; margin-bottom: 80px;
          border-top: 1px solid var(--ink-faint); padding-top: 40px;
        }
        .editorial-label { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--ink-light); }
        .editorial-content { font-family: var(--font-serif-en); font-size: 1.3rem; color: var(--ink-mid); line-height: 1.7; }

        /* Elegant Table */
        .map-table { width: 100%; border-collapse: collapse; margin-bottom: 80px; }
        .map-table th { text-align: left; font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-light); text-transform: uppercase; letter-spacing: 2px; padding-bottom: 20px; border-bottom: 1px solid var(--ink-faint); }
        .map-table td { padding: 30px 0; border-bottom: 1px solid var(--ink-faint); vertical-align: top; transition: background 0.3s; }
        .map-table tr:hover td { background: rgba(0,0,0,0.01); }
        .cell-zh { font-family: var(--font-serif-cn); font-weight: 600; font-size: 1.4rem; width: 25%; padding-left: 20px;}
        .cell-arrow { font-family: var(--font-mono); color: var(--ink-light); width: 5%; font-size: 1.2rem; }
        .cell-en { font-family: var(--font-serif-en); font-weight: 600; font-size: 1.4rem; color: var(--ink-dark); width: 30%; }
        .cell-logic { font-family: var(--font-serif-en); font-size: 1rem; color: var(--ink-mid); padding-right: 20px;}
        
        /* Refine Area */
        .refine-area {
          background: var(--bg-panel); border: 1px solid var(--ink-faint); padding: 50px;
          position: relative; overflow: hidden;
        }
        .refine-area::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--accent-red); }
        .refine-input {
          width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--ink-dark);
          font-family: var(--font-mono); font-size: 1.1rem; padding: 15px 0; color: var(--ink-dark); outline: none; margin-bottom: 30px;
        }
        .refine-btn {
          background: transparent; border: 1px solid var(--ink-dark); padding: 15px 30px;
          font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px;
          cursor: pointer; transition: all 0.4s var(--ease-smooth); border-radius: 40px;
        }
        .refine-btn:hover { background: var(--ink-dark); color: var(--bg-paper); transform: translateY(-2px); }

        /* Scores Animation */
        .score-hero { font-family: var(--font-mono); font-size: 8rem; font-weight: 300; line-height: 1; color: var(--ink-dark); margin-bottom: 60px; letter-spacing: -5px; }
        .score-bar-wrapper { margin-bottom: 30px; }
        .score-bar-header { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 10px; color: var(--ink-mid); letter-spacing: 1px;}
        .score-bar-track { height: 2px; background: var(--ink-faint); position: relative; overflow: hidden; }
        .score-bar-fill { height: 100%; background: var(--ink-dark); position: absolute; top: 0; left: 0; transform-origin: left; animation: scaleX 1s var(--ease-out) forwards; }
        @keyframes scaleX { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        /* Utilities & Mobile */
        @media (max-width: 768px) {
          .ambient-blob { display: none; }
          .sidebar { width: 100%; height: auto; flex-direction: row; position: relative; padding: 20px; border-right: none; border-bottom: 1px solid var(--ink-faint); justify-content: space-between; backdrop-filter: none; background: var(--bg-paper);}
          .sidebar-text-en, .sidebar-text-cn { writing-mode: horizontal-tb; font-size: 1rem; letter-spacing: 2px;}
          .sidebar-dot { display: none; }
          .workspace { margin-left: 0; padding: 40px 5%; }
          .header-area { flex-direction: column; align-items: flex-start; gap: 30px; }
          .title-en { font-size: 2.8rem; }
          .adapted-text { font-size: 2rem; }
          .pull-quote-wrapper { padding: 30px 20px; }
          .editorial-block { grid-template-columns: 1fr; gap: 15px; }
          .map-table th { display: none; }
          .map-table td { display: block; width: 100%; padding: 10px 0; border: none; }
          .map-row { border-bottom: 1px solid var(--ink-faint); padding: 20px 0; display: block;}
          .cell-arrow { display: none; }
          .cell-zh { padding-left: 0; font-size: 1.2rem; }
          .cell-en { font-size: 1.2rem; margin: 5px 0 10px 0;}
          .score-hero { font-size: 5rem; }
        }
      `}</style>

      {/* Atmospheric Backgrounds */}
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>

      <div className="app-container">
        
        <aside className="sidebar">
          <div className="sidebar-text-en">C U L T U R E</div>
          <div className="sidebar-dot"></div>
          <div className="sidebar-text-en">B R I D G E</div>
          <div className="sidebar-text-cn">文化桥</div>
        </aside>

        <main className="workspace">
          
          <header className="header-area stagger-1">
            <div>
              <h1 className="title-en">The Editor's Desk</h1>
              <h2 className="title-cn">品牌跨文化创译工作台</h2>
            </div>
            <nav className="mode-nav">
              <button className={`mode-btn ${mode === 'adapt' ? 'active' : ''}`} onClick={() => switchMode('adapt')}>Transcreate</button>
              <button className={`mode-btn ${mode === 'evaluate' ? 'active' : ''}`} onClick={() => switchMode('evaluate')}>Audit</button>
            </nav>
          </header>

          {/* BRAND CASES ARCHIVE */}
          <div className="stagger-1" style={{ marginBottom: '50px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--ink-mid)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              Editorial Archives
              <div style={{ height: '1px', flex: 1, background: 'var(--ink-faint)' }}></div>
            </div>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {CASES.map(c => (
                <button key={c.id} onClick={() => loadCase(c)} style={{
                  background: activeCase === c.id ? 'var(--ink-dark)' : 'transparent',
                  color: activeCase === c.id ? 'var(--bg-paper)' : 'var(--ink-dark)',
                  border: `1px solid ${activeCase === c.id ? 'var(--ink-dark)' : 'var(--ink-faint)'}`,
                  padding: '8px 16px', fontFamily: 'var(--font-serif-cn)', fontSize: '0.9rem',
                  cursor: 'pointer', transition: 'all 0.4s var(--ease-smooth)', borderRadius: '2px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <span>{c.icon}</span> {c.brand}
                </button>
              ))}
            </div>
          </div>

          <section className="form-area">
            <div className="form-section stagger-2">
              <div className="field-label">{mode === 'adapt' ? 'Source Material' : 'Localized Copy'}</div>
              <textarea 
                className="input-elegant" 
                rows="2"
                placeholder={mode === 'adapt' ? "Drop your Chinese brand copy, poetry, or social post here..." : "Paste the translated/localized copy to audit..."}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </div>

            <div className="form-section stagger-3">
              <div className="field-label">Brand Identity & Context</div>
              <input 
                type="text"
                className="input-elegant" 
                style={{ fontSize: '1.2rem', paddingBottom: '10px' }}
                placeholder="e.g. Songmont — A premium Eastern aesthetic leather goods brand entering US..."
                value={brandCtx}
                onChange={e => setBrandCtx(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '50px', marginBottom: '60px' }} className="stagger-4">
              <div>
                <div className="field-label">Target Market</div>
                <div className="chip-grid">
                  {COUNTRIES.map(c => <button key={c.id} className={`chip ${country === c.id ? 'active' : ''}`} onClick={() => setCountry(c.id)}>{c.label}</button>)}
                </div>
              </div>
              <div>
                <div className="field-label">Audience Demographics</div>
                <div className="chip-grid">
                  {AUDIENCES.map(a => <button key={a.id} className={`chip ${audience === a.id ? 'active' : ''}`} onClick={() => setAudience(a.id)}>{a.label}</button>)}
                </div>
              </div>
            </div>

            {mode === 'adapt' && (
              <div className="stagger-4">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '50px', marginBottom: '60px' }}>
                  <div>
                    <div className="field-label">Platform Medium</div>
                    <div className="chip-grid">
                      {PLATFORMS.map(p => <button key={p.id} className={`chip ${platform === p.id ? 'active' : ''}`} onClick={() => setPlatform(p.id)}>{p.label}</button>)}
                    </div>
                  </div>
                  <div>
                    <div className="field-label">Format Length</div>
                    <div className="chip-grid">
                      {LENGTHS.map(l => <button key={l.id} className={`chip ${length === l.id ? 'active' : ''}`} onClick={() => setLength(l.id)}>{l.label}</button>)}
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="field-label" style={{ justifyContent: 'space-between' }}>
                    <span>Cultural Retention Matrix</span>
                    <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{retention}%</span>
                  </div>
                  <div className="slider-wrapper">
                    <div className="slider-track"></div>
                    <div className="slider-fill" style={{ width: `${retention}%` }}></div>
                    <input type="range" min="0" max="100" value={retention} onChange={e => setRetention(Number(e.target.value))} className="slider-input" />
                    <div className="slider-thumb" style={{ left: `${retention}%` }}></div>
                  </div>
                  <div className="slider-labels">
                    <span>Absolute Localization</span>
                    <span>Cultural Purity</span>
                  </div>
                </div>
              </div>
            )}

            <div className="btn-wrapper stagger-4" style={{ animationDelay: '0.5s' }}>
              <button className="action-btn" onClick={handleSubmit} disabled={loading || !input.trim()}>
                <div className="btn-text">
                  {loading ? (
                    <>Processing <div className="loader-dots"><span></span><span></span><span></span></div></>
                  ) : (
                    mode === 'adapt' ? 'Generate Transcreation' : 'Run Cultural Audit'
                  )}
                </div>
              </button>
            </div>
            {error && <div style={{ marginTop: '20px', color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textAlign: 'center' }}>Error: {error}</div>}
          </section>

          {/* ══════ RESULTS AREA ══════ */}
          {result && (
            <section className="results-container" ref={resultRef}>
              
              {iterations.length > 0 && (
                <div className="editorial-block" style={{ marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid var(--ink-faint)' }}>
                  <div className="editorial-label">Iteration Log</div>
                  <div>
                    {iterations.map((it, idx) => (
                      <div key={idx} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-mid)', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--accent-red)', marginRight: '15px' }}>v{idx + 1}.0</span> "{it.feedback}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----- ADAPT MODE OUTPUT ----- */}
              {mode === 'adapt' && (
                <>
                  <div className="field-label">Final Master Copy</div>
                  <div className="pull-quote-wrapper">
                    <span className="quote-mark">“</span>
                    <h3 className="adapted-text">{result.adapted_copy}</h3>
                  </div>

                  <div className="editorial-block">
                    <div className="editorial-label">Strategic Rationale</div>
                    <div className="editorial-content">{result.strategy}</div>
                  </div>

                  {result.culture_map && result.culture_map.length > 0 && (
                    <>
                      <div className="field-label" style={{ marginTop: '80px' }}>Linguistic Architecture</div>
                      <table className="map-table">
                        <thead>
                          <tr>
                            <th>Source Element</th><th></th><th>Localization</th><th>Logic</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.culture_map.map((item, i) => (
                            <tr key={i} className="map-row">
                              <td className="cell-zh">{item.zh}</td>
                              <td className="cell-arrow">→</td>
                              <td className="cell-en">
                                {item.localized}<br/>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: item.action === 'preserved' ? 'var(--accent-gold)' : 'var(--ink-light)', marginTop: '8px', display: 'inline-block' }}>[{item.action}]</span>
                              </td>
                              <td className="cell-logic">{item.logic}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  <div className="editorial-block" style={{ background: 'var(--bg-panel)', padding: '40px', borderTop: 'none', borderLeft: '4px solid var(--ink-dark)' }}>
                    <div className="editorial-label">Simulated Native Reaction</div>
                    <div className="editorial-content" style={{ fontStyle: 'italic' }}>"{result.local_reaction}"</div>
                  </div>
                  
                  {result.brand_dna && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-mid)', marginBottom: '40px', textAlign: 'right' }}>
                      <strong style={{ color: 'var(--ink-dark)' }}>PRESERVED DNA:</strong> {result.brand_dna}
                    </div>
                  )}
                </>
              )}

              {/* ----- EVALUATE MODE OUTPUT ----- */}
              {mode === 'evaluate' && result.scores && (
                <>
                  <div className="field-label">Cultural Resonance Index</div>
                  <div className="score-hero">
                    {result.scores.overall}<span style={{ fontSize: '2rem', color: 'var(--ink-light)' }}>/100</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', marginBottom: '80px' }}>
                    <div>
                      {['cultural_resonance', 'emotional_impact'].map(metric => (
                        <div className="score-bar-wrapper" key={metric}>
                          <div className="score-bar-header">
                            <span>{metric.replace('_', ' ')}</span>
                            <span>{result.scores[metric]}</span>
                          </div>
                          <div className="score-bar-track">
                            <div className="score-bar-fill" style={{ width: `${result.scores[metric]}%`, backgroundColor: result.scores[metric] > 75 ? 'var(--ink-dark)' : 'var(--accent-red)' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      {['brand_identity', 'platform_fit'].map(metric => (
                        <div className="score-bar-wrapper" key={metric}>
                          <div className="score-bar-header">
                            <span>{metric.replace('_', ' ')}</span>
                            <span>{result.scores[metric]}</span>
                          </div>
                          <div className="score-bar-track">
                            <div className="score-bar-fill" style={{ width: `${result.scores[metric]}%`, backgroundColor: result.scores[metric] > 75 ? 'var(--ink-dark)' : 'var(--accent-red)' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="editorial-block" style={{ background: 'var(--bg-panel)', padding: '40px', borderTop: 'none', borderLeft: '4px solid var(--ink-dark)' }}>
                    <div className="editorial-label">Native Audience Perception</div>
                    <div className="editorial-content" style={{ fontStyle: 'italic' }}>"{result.local_reaction}"</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', margin: '80px 0' }}>
                    <div>
                      <div className="field-label" style={{ color: 'var(--ink-dark)' }}>Strengths</div>
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {result.strengths?.map((s, i) => (
                          <li key={i} style={{ padding: '20px 0', borderBottom: '1px solid var(--ink-faint)', fontSize: '1.2rem', color: 'var(--ink-mid)' }}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="field-label" style={{ color: 'var(--accent-red)' }}>Critical Issues</div>
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {result.issues?.map((iss, i) => (
                          <li key={i} style={{ padding: '20px 0', borderBottom: '1px solid var(--ink-faint)' }}>
                            <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--ink-dark)', marginBottom: '8px' }}>{iss.problem}</strong>
                            <span style={{ fontSize: '1rem', color: 'var(--ink-mid)' }}>Fix: {iss.fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="field-label">Master Rewrite Recommendation</div>
                  <div className="pull-quote-wrapper" style={{ marginBottom: '30px' }}>
                    <span className="quote-mark" style={{ color: 'rgba(26, 54, 93, 0.1)' }}>“</span>
                    <h3 className="adapted-text" style={{ color: 'var(--accent-blue)' }}>{result.rewrite}</h3>
                  </div>
                  <div className="editorial-block" style={{ borderTop: 'none', paddingTop: 0 }}>
                    <div className="editorial-label">Rationale</div>
                    <div className="editorial-content">{result.rewrite_rationale}</div>
                  </div>
                </>
              )}

              {/* ----- REFINE LOOP ----- */}
              <div className="refine-area">
                <div className="field-label">Editorial Refinement</div>
                <input 
                  type="text" 
                  className="refine-input" 
                  placeholder='e.g. "Make it sound more poetic," or "Keep the Chinese proverb untranslated."'
                  value={refineInput}
                  onChange={e => setRefineInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleRefine(); }}
                />
                <button className="refine-btn" onClick={handleRefine} disabled={!refineInput.trim() || loading}>
                  {loading ? 'Iterating...' : 'Iterate Version'}
                </button>
              </div>

            </section>
          )}

          <footer style={{ marginTop: '120px', borderTop: '1px solid var(--ink-faint)', paddingTop: '40px', paddingBottom: '40px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <span>CultureBridge © 2024</span>
            <span>Paper, Ink & Motion</span>
          </footer>

        </main>
      </div>
    </>
  );
}