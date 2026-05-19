'use client';

import { useState } from 'react';

type AnalyzeResult = {
  topMatches: { make: string; model: string; yearRange: string; confidence: number; reason: string }[];
  bodyStyle: string;
  visibleClues: string[];
  imageQuality: string;
  caution: string;
};

type CompareResult = {
  matchPercentage: number;
  likelihood: 'Low' | 'Medium' | 'High';
  summary: string;
  matchingFeatures: string[];
  differences: string[];
  imageQualityConcerns: string[];
  recommendedWording: string;
};

function preview(file?: File | null) {
  return file ? URL.createObjectURL(file) : '';
}
function saveFeedback(status: string, match: any) {
  const existing = JSON.parse(
    localStorage.getItem('vehicleiq_feedback') || '[]'
  );

  const entry = {
    status,
    match,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem(
    'vehicleiq_feedback',
    JSON.stringify([...existing, entry])
  );

  alert(`Feedback saved: ${status}`);
}
export default function Home() {
  const [singleImage, setSingleImage] = useState<File | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [suspectImage, setSuspectImage] = useState<File | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vehicleType, setVehicleType] = useState('');
  const [sizeClass, setSizeClass] = useState('');
  const [viewAngle, setViewAngle] = useState('');
  const [colorFamily, setColorFamily] = useState('');

  const [savedFeedback, setSavedFeedback] = useState<any[]>([]);

  async function analyzeVehicle() {
    if (!singleImage) return;
    setError(null);
    setAnalyzeLoading(true);
    setAnalyzeResult(null);
    const form = new FormData();
    form.append('image', singleImage);
    const res = await fetch('/api/analyze', { method: 'POST', body: form });
    const data = await res.json();
    setAnalyzeLoading(false);
    if (!res.ok) return setError(data.error || 'Analysis failed.');
    setAnalyzeResult(data);
  }

  async function compareVehicles() {
    if (!suspectImage || !referenceImage) return;
    setError(null);
    setCompareLoading(true);
    setCompareResult(null);
    const form = new FormData();
    form.append('suspect', suspectImage);
    form.append('reference', referenceImage);
    const res = await fetch('/api/compare', { method: 'POST', body: form });
    const data = await res.json();
    setCompareLoading(false);
    if (!res.ok) return setError(data.error || 'Comparison failed.');
    setCompareResult(data);
  }

  return (
    <main className="container">
      <section className="hero">
        <span className="badge">Vehicle identification + visual comparison MVP</span>
        <img
  src="/vehicleiq-logo.png"
  alt="VehicleIQ logo"
  style={{ maxWidth: 360, width: '100%', marginBottom: 16 }}
/>
        <p>
          Upload a vehicle photo to estimate make/model/year range, or compare a suspect vehicle
          against a possible match. Results are visual estimates, not legal conclusions.
        </p>
      </section>

      {error && <div className="card" style={{ marginBottom: 18 }}>{error}</div>}

      <section className="grid">
        <div className="card">
          <h2>Identify One Vehicle</h2>
          <p>Upload one image and get the top likely matches.</p>
          <div className="uploader">
            <input type="file" accept="image/*" onChange={(e) => setSingleImage(e.target.files?.[0] || null)} />
            {singleImage && <img className="preview" src={preview(singleImage)} alt="Vehicle preview" />}
          </div>
          <div className="card" style={{ marginTop: 12 }}>
  <h3>Optional Investigator Observations</h3>

  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
    <option value="">Vehicle type unknown</option>
    <option value="SUV/crossover">SUV / crossover</option>
    <option value="pickup truck">Pickup truck</option>
    <option value="sedan">Sedan</option>
    <option value="coupe">Coupe</option>
    <option value="hatchback">Hatchback</option>
    <option value="van/minivan">Van / minivan</option>
  </select>

  <select value={sizeClass} onChange={(e) => setSizeClass(e.target.value)}>
    <option value="">Size unknown</option>
    <option value="compact">Compact</option>
    <option value="midsize">Midsize</option>
    <option value="full-size">Full-size</option>
  </select>

  <select value={viewAngle} onChange={(e) => setViewAngle(e.target.value)}>
    <option value="">View angle unknown</option>
    <option value="front">Front</option>
    <option value="rear">Rear</option>
    <option value="side">Side</option>
    <option value="front-quarter">Front-quarter</option>
    <option value="rear-quarter">Rear-quarter</option>
  </select>

  <select value={colorFamily} onChange={(e) => setColorFamily(e.target.value)}>
    <option value="">Color unknown</option>
    <option value="black">Black</option>
    <option value="white">White</option>
    <option value="gray/slate">Gray / slate</option>
    <option value="silver">Silver</option>
    <option value="red">Red</option>
    <option value="blue">Blue</option>
    <option value="green">Green</option>
    <option value="tan/gold/champagne">Tan / gold / champagne</option>
  </select>
</div>
          <button disabled={!singleImage || analyzeLoading} onClick={analyzeVehicle}>
            {analyzeLoading ? 'Analyzing...' : 'Analyze Vehicle'}
          </button>

          {analyzeResult && (
            <div className="result">
              <h3>Likely Matches</h3>
              <div className="list">
                {analyzeResult.topMatches.map((m, i) => (
                  <div className="item" key={`${m.make}-${m.model}-${i}`}>
                    <strong>{<strong>{m.confidence <= 1 ? Math.round(m.confidence * 100) : Math.round(m.confidence)}</strong>}% — {m.yearRange} {m.make} {m.model}</strong>
                    <p>{m.reason}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, position: 'relative', zIndex: 10 }}>
  <button type="button" onClick={() => saveFeedback('correct', m)}>
    ✓ Correct
  </button>

  <button type="button" onClick={() => saveFeedback('incorrect', m)}>
    ✗ Incorrect
  </button>

  <button type="button" onClick={() => saveFeedback('unsure', m)}>
    ? Unsure
  </button>
</div>
                  </div>
                ))}
              </div>
              <p><strong>Body style:</strong> {analyzeResult.bodyStyle}</p>
              <p><strong>Image quality:</strong> {analyzeResult.imageQuality}</p>
              <h4>Visible clues</h4>
              <ul>{analyzeResult.visibleClues.map((c) => <li key={c}>{c}</li>)}</ul>
              <p className="small">{analyzeResult.caution}</p>
            </div>
          )}
          <div className="card" style={{ marginTop: 16 }}>
  <button
    type="button"
    onClick={() => {
      const feedback = JSON.parse(localStorage.getItem('vehicleiq_feedback') || '[]');
      setSavedFeedback(feedback);
    }}
  >
    View Saved Feedback
  </button>

  {savedFeedback.length > 0 && (
    <div style={{ marginTop: 12 }}>
      <h3>Saved Feedback</h3>

      {savedFeedback.map((f, i) => (
        <div className="item" key={i}>
          <strong>{f.status.toUpperCase()}</strong>
          <p>
            {f.match?.yearRange} {f.match?.make} {f.match?.model}
          </p>
          <small>{f.timestamp}</small>
        </div>
      ))}
    </div>
  )}
</div>
        </div>

        <div className="card">
          <h2>Compare Two Vehicles</h2>
          <p>Upload a suspect image and a possible match image.</p>
          <div className="cols">
            <div className="uploader">
              <strong>Suspect vehicle</strong>
              <input type="file" accept="image/*" onChange={(e) => setSuspectImage(e.target.files?.[0] || null)} />
              {suspectImage && <img className="preview" src={preview(suspectImage)} alt="Suspect preview" />}
            </div>
            <div className="uploader">
              <strong>Possible match</strong>
              <input type="file" accept="image/*" onChange={(e) => setReferenceImage(e.target.files?.[0] || null)} />
              {referenceImage && <img className="preview" src={preview(referenceImage)} alt="Reference preview" />}
            </div>
          </div>
          <button disabled={!suspectImage || !referenceImage || compareLoading} onClick={compareVehicles}>
            {compareLoading ? 'Comparing...' : 'Compare Vehicles'}
          </button>

          {compareResult && (
            <div className="result">
              <div className="score">{compareResult.matchPercentage}%</div>
              <h3>{compareResult.likelihood} visual match likelihood</h3>
              <p>{compareResult.summary}</p>
              <h4>Matching features</h4>
              <ul>{compareResult.matchingFeatures.map((x) => <li key={x}>{x}</li>)}</ul>
              <h4>Differences</h4>
              <ul>{compareResult.differences.map((x) => <li key={x}>{x}</li>)}</ul>
              <h4>Image quality concerns</h4>
              <ul>{compareResult.imageQualityConcerns.map((x) => <li key={x}>{x}</li>)}</ul>
              <p className="small"><strong>Suggested wording:</strong> {compareResult.recommendedWording}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
