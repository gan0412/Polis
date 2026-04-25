import { useState, useEffect } from "react";

/* ─── FONT INJECTION ─────────────────────────────────────────────────── */
/* Add this to your index.html <head> for production:
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
*/

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

const AGE_RANGES = ["Under 50", "50 – 60", "61 – 70", "71 – 80", "80 and above"];

const TOPICS = [
  { id: "healthcare",  label: "Healthcare & Medicare" },
  { id: "housing",     label: "Housing & Rent" },
  { id: "taxes",       label: "Taxes & Benefits" },
  { id: "education",   label: "Education" },
  { id: "immigration", label: "Immigration & Visas" },
  { id: "retirement",  label: "Social Security" },
  { id: "business",    label: "Small Business" },
  { id: "safety",      label: "Community Safety" },
];

/* ─── TOKENS ─────────────────────────────────────────────────────────── */
const C = {
  black:   "#080808",
  white:   "#f8f4ee",
  red:     "#d63426",
  redDim:  "#8a2218",
  gold:    "#c9a84c",
  mid:     "#6b6459",
  card:    "#111111",
  border:  "rgba(248,244,238,0.1)",
};

const F = {
  display:  "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
  serif:    "'Instrument Serif', Georgia, serif",
  ui:       "'DM Sans', system-ui, sans-serif",
  mono:     "'DM Mono', 'Courier New', monospace",
};

export default function CivicBridgeOnboarding() {
  const [form, setForm] = useState({ name: "", email: "", city: "", state: "", age: "", topics: [] });
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(null);

  /* Inject Google Fonts at runtime (works in most environments) */
  useEffect(() => {
    const id = "civicbridge-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleTopic = (id) => {
    setForm(f => ({
      ...f,
      topics: f.topics.includes(id) ? f.topics.filter(t => t !== id) : [...f.topics, id],
    }));
  };

  const canSubmit = form.name.trim() && form.email.includes("@") && form.city.trim() && form.state && form.age && form.topics.length > 0;

  const handleSubmit = async () => { 
    if (canSubmit) {
      try {
        const response = await fetch("http://localhost:3001/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        
        if (response.ok) {
          setSubmitted(true);
        } else {
          console.error("Server returned an error");
        }
      } catch (error) {
        console.error("Failed to submit:", error);
      }
    } 
  };

  /* ── SHARED STYLES ── */
  const inputBase = (name) => ({
    width: "100%",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: `1px solid ${focused === name ? C.red : C.border}`,
    color: C.white,
    fontFamily: F.ui,
    fontWeight: 300,
    fontSize: "17px",
    padding: "10px 0 10px",
    outline: "none",
    transition: "border-color 0.2s",
    caretColor: C.red,
    letterSpacing: "0.01em",
  });

  const monoLabel = {
    display: "block",
    fontFamily: F.mono,
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: C.mid,
    marginBottom: "6px",
  };

  const fieldWrap = { marginBottom: "32px" };

  const topicPill = (active) => ({
    padding: "8px 16px",
    border: `1px solid ${active ? C.red : C.border}`,
    borderRadius: "2px",
    backgroundColor: active ? "rgba(214,52,38,0.1)" : "transparent",
    color: active ? C.white : C.mid,
    fontFamily: F.mono,
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.2s",
  });

  /* ── SUCCESS SCREEN ── */
  if (submitted) return (
    <div style={{ backgroundColor: C.black, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ui }}>
      <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease both" }}>
        <div style={{ fontFamily: F.mono, fontSize: "11px", letterSpacing: "0.18em", color: C.mid, textTransform: "uppercase", marginBottom: "20px" }}>Access Granted</div>
        <h1 style={{ fontFamily: F.display, fontSize: "clamp(52px,8vw,96px)", color: C.white, margin: "0 0 16px", lineHeight: 1, letterSpacing: "0.02em" }}>
          Welcome,<br /><span style={{ color: C.red }}>{form.name.split(" ")[0]}.</span>
        </h1>
        <p style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: "20px", color: C.mid, margin: 0 }}>
          Your civic intelligence briefing is being prepared.
        </p>
        <div style={{ marginTop: "40px", width: "40px", height: "2px", backgroundColor: C.red, margin: "40px auto 0" }} />
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );

  /* ── MAIN FORM ── */
  return (
    <div style={{ backgroundColor: C.black, minHeight: "100vh", color: C.white, fontFamily: F.ui, overflowX: "hidden" }}>

      {/* ── TOP BAR ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: F.display, fontSize: "22px", letterSpacing: "0.06em", color: C.white }}>CIVICBRIDGE</div>
        <div style={{ fontFamily: F.mono, fontSize: "10px", letterSpacing: "0.16em", color: C.mid, textTransform: "uppercase" }}>
          Civic Intelligence Platform
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ padding: "72px 40px 56px", maxWidth: "900px", margin: "0 auto", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ fontFamily: F.mono, fontSize: "10px", letterSpacing: "0.18em", color: C.red, textTransform: "uppercase", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ display: "inline-block", width: "24px", height: "1px", backgroundColor: C.red }} />
          Community Access Portal
        </div>
        <h1 style={{ fontFamily: F.display, fontSize: "clamp(56px, 10vw, 110px)", lineHeight: 0.92, margin: "0 0 24px", letterSpacing: "0.02em", color: C.white }}>
          LAWS THAT<br />
          <span style={{ color: C.red }}>AFFECT YOU</span><br />
          EXPLAINED.
        </h1>
        <p style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: "20px", color: C.mid, margin: 0, maxWidth: "480px", lineHeight: 1.55 }}>
          Policies in your language, personalized to your community and your life.
        </p>
      </div>

      {/* ── DIVIDER LINE ── */}
      <div style={{ height: "1px", backgroundColor: C.border, margin: "0 40px" }} />

      {/* ── FORM ── */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "64px 40px 100px" }}>
        <div style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "4px",
          padding: "clamp(32px, 5vw, 56px) clamp(28px, 5vw, 56px)",
          boxShadow: `0 0 60px rgba(214,52,38,0.06)`,
          animation: "fadeUp 0.6s 0.15s ease both",
          opacity: 0,
        }}>

          {/* Section: Identity */}
          <div style={{ fontFamily: F.mono, fontSize: "10px", letterSpacing: "0.18em", color: C.red, textTransform: "uppercase", marginBottom: "36px", display: "flex", alignItems: "center", gap: "12px" }}>
            01 &nbsp;·&nbsp; Your Identity
            <div style={{ flex: 1, height: "1px", backgroundColor: C.border }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
            <div style={fieldWrap}>
              <span style={monoLabel}>Full Name</span>
              <input
                value={form.name} onChange={e => set("name", e.target.value)}
                onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                placeholder="Maria González"
                style={{ ...inputBase("name"), "::placeholder": { color: C.mid } }}
              />
            </div>
            <div style={fieldWrap}>
              <span style={monoLabel}>Email Address</span>
              <input
                type="email" value={form.email} onChange={e => set("email", e.target.value)}
                onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                placeholder="your@email.com"
                style={inputBase("email")}
              />
            </div>
            <div style={fieldWrap}>
              <span style={monoLabel}>City / Town</span>
              <input
                value={form.city} onChange={e => set("city", e.target.value)}
                onFocus={() => setFocused("city")} onBlur={() => setFocused(null)}
                placeholder="Los Angeles"
                style={inputBase("city")}
              />
            </div>
            <div style={fieldWrap}>
              <span style={monoLabel}>State</span>
              <select
                value={form.state} onChange={e => set("state", e.target.value)}
                onFocus={() => setFocused("state")} onBlur={() => setFocused(null)}
                style={{ ...inputBase("state"), cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}
              >
                <option value="" style={{ backgroundColor: "#1a1a1a", color: C.mid }}>Select state...</option>
                {US_STATES.map(s => <option key={s} value={s} style={{ backgroundColor: "#1a1a1a", color: C.white }}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Section: Background */}
          <div style={{ fontFamily: F.mono, fontSize: "10px", letterSpacing: "0.18em", color: C.red, textTransform: "uppercase", margin: "8px 0 36px", display: "flex", alignItems: "center", gap: "12px" }}>
            02 &nbsp;·&nbsp; Your Background
            <div style={{ flex: 1, height: "1px", backgroundColor: C.border }} />
          </div>

          <div style={{ ...fieldWrap, marginBottom: "44px" }}>
            <span style={monoLabel}>Age Range</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
              {AGE_RANGES.map(a => (
                <button key={a} onClick={() => set("age", a)} style={{
                  ...topicPill(form.age === a),
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Topics */}
          <div style={{ fontFamily: F.mono, fontSize: "10px", letterSpacing: "0.18em", color: C.red, textTransform: "uppercase", margin: "8px 0 12px", display: "flex", alignItems: "center", gap: "12px" }}>
            03 &nbsp;·&nbsp; What You Want to Hear About
            <div style={{ flex: 1, height: "1px", backgroundColor: C.border }} />
          </div>
          <p style={{ fontFamily: F.ui, fontWeight: 300, fontSize: "14px", color: C.mid, margin: "0 0 22px", letterSpacing: "0.01em" }}>
            Select all that apply — we'll prioritize these in every analysis.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "56px" }}>
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => toggleTopic(t.id)} style={topicPill(form.topics.includes(t.id))}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── SUBMIT ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
            <p style={{ fontFamily: F.ui, fontWeight: 300, fontSize: "13px", color: C.mid, margin: 0, maxWidth: "320px", lineHeight: 1.6 }}>
              Your data is never sold. We use it only to personalize your civic analysis.
            </p>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                backgroundColor: canSubmit ? C.red : "transparent",
                border: `1px solid ${canSubmit ? C.red : C.border}`,
                color: canSubmit ? C.white : C.mid,
                fontFamily: F.mono,
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "16px 40px",
                cursor: canSubmit ? "pointer" : "not-allowed",
                borderRadius: "2px",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = C.redDim; }}
              onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = C.red; }}
            >
              Submit &amp; Continue →
            </button>
          </div>

        </div>

        {/* ── FOOTER NOTE ── */}
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontFamily: F.mono, fontSize: "10px", letterSpacing: "0.14em", color: C.mid, textTransform: "uppercase" }}>
            © 2025 CivicBridge
          </span>
          <span style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: "14px", color: C.mid }}>
            Built for the communities America forgets to translate for.
          </span>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #6b6459; }
        select option { background-color: #1a1a1a; }
        button:active { transform: scale(0.98); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #6b6459; border-radius: 3px; }
      `}</style>
    </div>
  );
}
