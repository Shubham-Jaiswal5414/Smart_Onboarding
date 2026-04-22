import { useState } from "react";
import "./styles.css";

const STEPS = ["Dataset Info", "AI Analysis", "Review & Edit", "Quality Checks", "Confirm"];

const SAMPLE_SCHEMA = `column_name,data_type,nullable
user_id,INTEGER,false
email,VARCHAR(255),false
full_name,VARCHAR(100),true
date_of_birth,DATE,true
phone_number,VARCHAR(20),true
created_at,TIMESTAMP,false
is_active,BOOLEAN,false`;

export default function App() {
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_ANTHROPIC_KEY || "");
  const [datasetInfo, setDatasetInfo] = useState({ name: "", service: "BigQuery", schema_text: SAMPLE_SCHEMA });
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newTag, setNewTag] = useState("");
  const [qualityChecks, setQualityChecks] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const runAIAnalysis = async () => {
    if (!apiKey.trim()) { setError("Please enter your Anthropic API key above or enable demo mode."); return; }
    setLoading(true); setError("");

    if (apiKey === 'demo') {
      // Mock AI response for demo
      setTimeout(() => {
        const mockSuggestions = {
          description: "A comprehensive user dataset containing personal information, contact details, and account status for customer management and analytics.",
          owner: "data-engineering@company.com",
          tags: ["user", "customer", "personal", "contact"],
          pii_detected: true,
          pii_columns: ["email", "full_name", "phone_number", "date_of_birth"],
          tier: "Tier1",
          domain: "Customer Data",
          quality_checks: [
            {"id": "q1", "name": "Null check on primary key", "column": "user_id", "type": "columnValuesToNotBeNull"},
            {"id": "q2", "name": "Email format validation", "column": "email", "type": "columnValuesToMatchRegex"},
            {"id": "q3", "name": "Row count greater than zero", "column": "table", "type": "tableRowCountToBeBetween"}
          ]
        };
        setSuggestions(mockSuggestions);
        setQualityChecks(mockSuggestions.quality_checks.map(q => ({ ...q, checked: true })));
        setStep(2);
        setLoading(false);
      }, 2000);
      return;
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a metadata expert for OpenMetadata. Analyze this dataset and return ONLY a raw JSON object, no markdown, no backticks, no explanation.

Dataset Name: ${datasetInfo.name || "users"}
Database/Service: ${datasetInfo.service}
Schema:
${datasetInfo.schema_text}

Return exactly this JSON:
{
  "description": "1-2 sentence description of what this table contains",
  "owner": "suggested_team@company.com",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "pii_detected": true,
  "pii_columns": ["col1", "col2"],
  "tier": "Tier1",
  "domain": "domain name",
  "quality_checks": [
    {"id": "q1", "name": "Null check on primary key", "column": "user_id", "type": "columnValuesToNotBeNull"},
    {"id": "q2", "name": "Email format validation", "column": "email", "type": "columnValuesToMatchRegex"},
    {"id": "q3", "name": "Row count greater than zero", "column": "table", "type": "tableRowCountToBeBetween"}
  ]
}`
          }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setSuggestions(parsed);
      setQualityChecks(parsed.quality_checks.map(q => ({ ...q, checked: true })));
      setStep(2);
    } catch (err) {
      setError("AI analysis failed: " + err.message);
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const addTag = (e) => {
    if (e.key === "Enter" && newTag.trim()) {
      setSuggestions(s => ({ ...s, tags: [...s.tags, newTag.trim()] }));
      setNewTag("");
    }
  };
  const removeTag = (t) => setSuggestions(s => ({ ...s, tags: s.tags.filter(x => x !== t) }));
  const toggleCheck = (id) => setQualityChecks(qs => qs.map(q => q.id === id ? { ...q, checked: !q.checked } : q));

  const finalPayload = suggestions ? {
    name: datasetInfo.name || "users",
    service: datasetInfo.service,
    description: suggestions.description,
    owner: suggestions.owner,
    tags: suggestions.tags,
    tier: suggestions.tier,
    domain: suggestions.domain,
    pii_detected: suggestions.pii_detected,
    pii_columns: suggestions.pii_columns,
    quality_checks_enabled: qualityChecks.filter(q => q.checked).map(q => q.name),
  } : null;

  const displayStep = loading ? 1 : step;

  const renderStep = () => {
    if (loading) return (
      <div className="ai-loader">
        <div className="ai-loader-ring" />
        <p className="ai-loader-text">🤖 AI is analyzing your dataset schema…<br />detecting PII · suggesting tags · generating quality checks</p>
      </div>
    );

    switch (step) {
      case 0: return (
        <>
          <div className="card-title"><span className="card-icon">📋</span> Dataset Information</div>
          <div className="card-sub">Paste your schema and let AI curate the metadata for you.</div>

          <div className="api-key-banner">
            Anthropic API Key Required
            <input type="password" className="api-key-input" placeholder="sk-ant-..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
            <label className="demo-mode-toggle">
              <input type="checkbox" onChange={(e) => { if (e.target.checked) { setApiKey('demo'); setError(''); } else setApiKey(''); }} />
              Use Demo Mode
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Dataset / Table Name</label>
            <input className="form-input" placeholder="e.g. users, orders, events" value={datasetInfo.name} onChange={e => setDatasetInfo(d => ({ ...d, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Data Service / Platform</label>
            <select className="form-select" value={datasetInfo.service} onChange={e => setDatasetInfo(d => ({ ...d, service: e.target.value }))}>
              {["BigQuery", "Snowflake", "Redshift", "PostgreSQL", "MySQL", "Databricks", "Other"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Schema (CSV or DDL format)</label>
            <textarea className="form-textarea" value={datasetInfo.schema_text} onChange={e => setDatasetInfo(d => ({ ...d, schema_text: e.target.value }))} />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="btn-row">
            <span />
            <button className="btn btn-primary" onClick={() => { setStep(1); runAIAnalysis(); }} disabled={!datasetInfo.schema_text.trim()}>
              ✨ Analyze with AI →
            </button>
          </div>
        </>
      );

      case 2: return suggestions && (
        <>
          <div className="card-title"><span className="card-icon">✨</span> AI Suggestions</div>
          <div className="card-sub">Review and edit before pushing to OpenMetadata.</div>

          <div className="suggestions-grid">
            <div className="suggestion-card">
              <div className="suggestion-header">
                <span className="suggestion-label">Description</span>
              </div>
              <textarea className="suggestion-value" value={suggestions.description} onChange={e => setSuggestions(s => ({ ...s, description: e.target.value }))} />
            </div>

            <div className="suggestion-card">
              <div className="suggestion-header">
                <span className="suggestion-label">Suggested Owner</span>
              </div>
              <input className="suggestion-value" value={suggestions.owner} onChange={e => setSuggestions(s => ({ ...s, owner: e.target.value }))} />
            </div>

            <div className="suggestion-card">
              <div className="suggestion-header">
                <span className="suggestion-label">Tags</span>
              </div>
              <div className="tags-container">
                {suggestions.tags.map(t => (
                  <span key={t} className="tag">{t}<button className="tag-remove" onClick={() => removeTag(t)}>×</button></span>
                ))}
              </div>
              <input className="add-tag-input" placeholder="Add tag and press Enter" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={addTag} />
            </div>

            {suggestions.pii_detected && (
              <div className="suggestion-card" style={{ borderColor: 'var(--accent-tertiary)', background: 'rgba(255,107,107,0.05)' }}>
                <div className="suggestion-header">
                  <span className="suggestion-label" style={{ color: 'var(--accent-tertiary)' }}>⚠️ PII Detected</span>
                </div>
                <div className="suggestion-value">Columns: {suggestions.pii_columns?.join(", ")}</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="suggestion-card">
                <div className="suggestion-header">
                  <span className="suggestion-label">Tier</span>
                </div>
                <select className="suggestion-value" value={suggestions.tier} onChange={e => setSuggestions(s => ({ ...s, tier: e.target.value }))}>
                  {["Tier1", "Tier2", "Tier3"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="suggestion-card">
                <div className="suggestion-header">
                  <span className="suggestion-label">Domain</span>
                </div>
                <input className="suggestion-value" value={suggestions.domain} onChange={e => setSuggestions(s => ({ ...s, domain: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Quality Checks →</button>
          </div>
        </>
      );

      case 3: return (
        <>
          <div className="card-title"><span className="card-icon">🔍</span> Quality Checks</div>
          <div className="card-sub">Select data quality tests to enable for this dataset.</div>
          <div className="quality-list">
            {qualityChecks.map(q => (
              <div key={q.id} className={`quality-item ${q.checked ? "checked" : ""}`} onClick={() => toggleCheck(q.id)}>
                <div className="quality-checkbox"></div>
                <div className="quality-content">
                  <div className="quality-name">{q.name}</div>
                  <div className="quality-details">{q.type} · column: {q.column}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Review Final →</button>
          </div>
        </>
      );

      case 4: return submitted ? (
        <div className="success-container">
          <div className="success-icon">🚀</div>
          <h2 className="success-title">Dataset Onboarded!</h2>
          <p className="success-message">Your metadata has been prepared and is ready to push to OpenMetadata. Connect the MCP server to complete the write.</p>
          <div className="payload-container">
            <div className="payload-title">Generated Metadata Payload</div>
            <pre className="payload-content">{JSON.stringify(finalPayload, null, 2)}</pre>
          </div>
          <button className="btn btn-secondary"
            onClick={() => { setStep(0); setSubmitted(false); setSuggestions(null); setDatasetInfo({ name: "", service: "BigQuery", schema_text: SAMPLE_SCHEMA }); }}>
            ↩ Onboard Another Dataset
          </button>
        </div>
      ) : (
        <>
          <div className="card-title"><span className="card-icon">🎯</span> Confirm & Push</div>
          <div className="card-sub">Final review before pushing to OpenMetadata.</div>
          <div className="review-section">
            {[
              ["Dataset", datasetInfo.name || "users"],
              ["Service", datasetInfo.service],
              ["Description", suggestions?.description],
              ["Owner", suggestions?.owner],
              ["Tags", suggestions?.tags?.join(", ")],
              ["Tier", suggestions?.tier],
              ["Domain", suggestions?.domain],
              ["PII", suggestions?.pii_detected ? `Yes — ${suggestions.pii_columns?.join(", ")}` : "None detected"],
              ["Quality Checks", qualityChecks.filter(q => q.checked).length + " enabled"],
            ].map(([k, v]) => (
              <div key={k} className="review-item">
                <span className="review-key">{k}</span>
                <span className="review-value">{v}</span>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setSubmitted(true)}>🚀 Push to OpenMetadata</button>
          </div>
        </>
      );

      default: return null;
    }
  };

  return (
    <div className="app">
      <div className="header">
        <span className="header-tag">OpenMetadata × WeMakeDevs Hackathon 2026</span>
        <h1>Smart Dataset<br />Onboarding Assistant</h1>
        <p>AI-powered metadata curation — tags, owners, quality checks, auto-generated.</p>
      </div>

      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={s} className="step-item">
            <div className={`step-circle ${i < displayStep ? "completed" : i === displayStep ? "active" : ""}`}>
              {i < displayStep ? "✓" : i + 1}
            </div>
            <span className="step-label">{s}</span>
          </div>
        ))}
      </div>
      <div className="card">{renderStep()}</div>
    </div>
  );
}
