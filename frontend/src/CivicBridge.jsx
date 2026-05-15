import { useState, useEffect } from "react";

/* ─── FONT INJECTION ─────────────────────────────────────────────────── */
/* Add this to your index.html <head> for production:
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
*/

const HOUSING_OPTIONS = ["🏠 I own my home", "🏢 I rent my home", "🛋️ I live with family or friends", "📦 Other / Temporary housing"];
const INCOME_OPTIONS = ["Under $25,000", "$25,000 – $50,000", "$50,000 – $100,000", "$100,000 – $200,000", "Over $200,000"];
const EMPLOYMENT_OPTIONS = ["💼 Full-time employee", "🧾 Self-employed or freelancer", "🚗 Gig worker (Uber, DoorDash, etc.)", "🎓 Student", "🔍 Currently unemployed", "🏖️ Retired"];
const DEPENDENTS_OPTIONS = ["No dependents", "1 child", "2 children", "3 or more children", "I care for an elderly parent or family member"];
const INSURANCE_OPTIONS = ["🏢 Through my employer", "🛒 I buy my own (Marketplace/ACA)", "🏥 Medicaid or Medicare", "⚔️ VA / Military benefits", "❌ I'm currently uninsured"];

const AGE_RANGES = ["Under 26", "26 – 40", "41 – 60", "61 – 64", "65 or older"];



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
  const [form, setForm] = useState({ 
    name: "", email: "", state: "",
    housing: "", income: "", employment: "", 
    dependents: "", health_insurance: "", 
    age: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const canSubmit = form.name.trim() && form.email.includes("@") && form.state && form.housing && form.income && form.employment && form.dependents && form.health_insurance && form.age;

  const handleSubmit = async () => { 
    if (canSubmit) {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        
        if (response.ok) {
          setSubmitted(true);
        } else if (response.status === 409) {
          setErrorMsg("This email is already registered. Please use a different one.");
        } else {
          setErrorMsg("Server returned an error");
        }
      } catch (error) {
        setErrorMsg("Failed to connect to server.");
        console.error("Failed to submit:", error);
      } finally {
        setIsLoading(false);
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
    color: C.white,
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
        <div style={{ fontFamily: F.display, fontSize: "22px", letterSpacing: "0.06em", color: C.white }}>POLIS</div>
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
              <span style={monoLabel}>State</span>
              <select
                value={form.state} onChange={e => set("state", e.target.value)}
                onFocus={() => setFocused("state")} onBlur={() => setFocused(null)}
                style={{ ...inputBase("state"), WebkitAppearance: "none", borderRadius: 0 }}
              >
                <option value="" disabled style={{color: "black"}}>Select your state...</option>
                <option value="AL" style={{color: "black"}}>Alabama</option>
                <option value="AK" style={{color: "black"}}>Alaska</option>
                <option value="AZ" style={{color: "black"}}>Arizona</option>
                <option value="AR" style={{color: "black"}}>Arkansas</option>
                <option value="CA" style={{color: "black"}}>California</option>
                <option value="CO" style={{color: "black"}}>Colorado</option>
                <option value="CT" style={{color: "black"}}>Connecticut</option>
                <option value="DE" style={{color: "black"}}>Delaware</option>
                <option value="FL" style={{color: "black"}}>Florida</option>
                <option value="GA" style={{color: "black"}}>Georgia</option>
                <option value="HI" style={{color: "black"}}>Hawaii</option>
                <option value="ID" style={{color: "black"}}>Idaho</option>
                <option value="IL" style={{color: "black"}}>Illinois</option>
                <option value="IN" style={{color: "black"}}>Indiana</option>
                <option value="IA" style={{color: "black"}}>Iowa</option>
                <option value="KS" style={{color: "black"}}>Kansas</option>
                <option value="KY" style={{color: "black"}}>Kentucky</option>
                <option value="LA" style={{color: "black"}}>Louisiana</option>
                <option value="ME" style={{color: "black"}}>Maine</option>
                <option value="MD" style={{color: "black"}}>Maryland</option>
                <option value="MA" style={{color: "black"}}>Massachusetts</option>
                <option value="MI" style={{color: "black"}}>Michigan</option>
                <option value="MN" style={{color: "black"}}>Minnesota</option>
                <option value="MS" style={{color: "black"}}>Mississippi</option>
                <option value="MO" style={{color: "black"}}>Missouri</option>
                <option value="MT" style={{color: "black"}}>Montana</option>
                <option value="NE" style={{color: "black"}}>Nebraska</option>
                <option value="NV" style={{color: "black"}}>Nevada</option>
                <option value="NH" style={{color: "black"}}>New Hampshire</option>
                <option value="NJ" style={{color: "black"}}>New Jersey</option>
                <option value="NM" style={{color: "black"}}>New Mexico</option>
                <option value="NY" style={{color: "black"}}>New York</option>
                <option value="NC" style={{color: "black"}}>North Carolina</option>
                <option value="ND" style={{color: "black"}}>North Dakota</option>
                <option value="OH" style={{color: "black"}}>Ohio</option>
                <option value="OK" style={{color: "black"}}>Oklahoma</option>
                <option value="OR" style={{color: "black"}}>Oregon</option>
                <option value="PA" style={{color: "black"}}>Pennsylvania</option>
                <option value="RI" style={{color: "black"}}>Rhode Island</option>
                <option value="SC" style={{color: "black"}}>South Carolina</option>
                <option value="SD" style={{color: "black"}}>South Dakota</option>
                <option value="TN" style={{color: "black"}}>Tennessee</option>
                <option value="TX" style={{color: "black"}}>Texas</option>
                <option value="UT" style={{color: "black"}}>Utah</option>
                <option value="VT" style={{color: "black"}}>Vermont</option>
                <option value="VA" style={{color: "black"}}>Virginia</option>
                <option value="WA" style={{color: "black"}}>Washington</option>
                <option value="WV" style={{color: "black"}}>West Virginia</option>
                <option value="WI" style={{color: "black"}}>Wisconsin</option>
                <option value="WY" style={{color: "black"}}>Wyoming</option>
              </select>
            </div>
          </div>

          {/* Section: Background */}
          <div style={{ fontFamily: F.mono, fontSize: "10px", letterSpacing: "0.18em", color: C.red, textTransform: "uppercase", margin: "8px 0 36px", display: "flex", alignItems: "center", gap: "12px" }}>
            02 &nbsp;·&nbsp; Your Background
            <div style={{ flex: 1, height: "1px", backgroundColor: C.border }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 40px", marginBottom: "56px" }}>
            <div>
              <span style={monoLabel}>Housing</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                {HOUSING_OPTIONS.map(a => <button key={a} onClick={() => set("housing", a)} style={{ ...topicPill(form.housing === a), textAlign: "left", fontSize: "11px" }}>{a}</button>)}
              </div>
            </div>

            <div>
              <span style={monoLabel}>Income</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                {INCOME_OPTIONS.map(a => <button key={a} onClick={() => set("income", a)} style={{ ...topicPill(form.income === a), textAlign: "left", fontSize: "11px" }}>{a}</button>)}
              </div>
              <div style={{ fontSize: "11px", color: C.mid, marginTop: "8px", lineHeight: 1.4 }}>Used strictly to find tax credits and benefits you qualify for.</div>
            </div>

            <div>
              <span style={monoLabel}>Employment</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                {EMPLOYMENT_OPTIONS.map(a => <button key={a} onClick={() => set("employment", a)} style={{ ...topicPill(form.employment === a), textAlign: "left", fontSize: "11px" }}>{a}</button>)}
              </div>
            </div>

            <div>
              <span style={monoLabel}>Dependents</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                {DEPENDENTS_OPTIONS.map(a => <button key={a} onClick={() => set("dependents", a)} style={{ ...topicPill(form.dependents === a), textAlign: "left", fontSize: "11px" }}>{a}</button>)}
              </div>
            </div>

            <div>
              <span style={monoLabel}>Health Insurance</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                {INSURANCE_OPTIONS.map(a => <button key={a} onClick={() => set("health_insurance", a)} style={{ ...topicPill(form.health_insurance === a), textAlign: "left", fontSize: "11px" }}>{a}</button>)}
              </div>
            </div>

            <div>
              <span style={monoLabel}>Age Range</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                {AGE_RANGES.map(a => <button key={a} onClick={() => set("age", a)} style={{ ...topicPill(form.age === a), textAlign: "left", fontSize: "11px" }}>{a}</button>)}
              </div>
            </div>
          </div>



          {/* ── SUBMIT ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
            <p style={{ fontFamily: F.ui, fontWeight: 300, fontSize: "13px", color: C.mid, margin: 0, maxWidth: "320px", lineHeight: 1.6 }}>
              Your data is never sold. We use it only to personalize your civic analysis.
            </p>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isLoading}
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
                cursor: canSubmit && !isLoading ? "pointer" : "not-allowed",
                borderRadius: "2px",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (canSubmit && !isLoading) e.currentTarget.style.backgroundColor = C.redDim; }}
              onMouseLeave={e => { if (canSubmit && !isLoading) e.currentTarget.style.backgroundColor = C.red; }}
            >
              {isLoading ? "Processing..." : "Submit & Continue →"}
            </button>
          </div>
          {errorMsg && (
            <div style={{ color: C.red, fontFamily: F.ui, fontSize: "14px", marginTop: "16px", textAlign: "right" }}>
              {errorMsg}
            </div>
          )}

        </div>

        {/* ── FOOTER NOTE ── */}
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontFamily: F.mono, fontSize: "10px", letterSpacing: "0.14em", color: C.mid, textTransform: "uppercase" }}>
            © 2025 Polis
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
