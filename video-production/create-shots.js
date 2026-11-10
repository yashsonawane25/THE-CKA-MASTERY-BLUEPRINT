const fs = require('fs');
const path = require('path');

const scenesDir = path.join(__dirname, 'scenes');
if (!fs.existsSync(scenesDir)) {
  fs.mkdirSync(scenesDir, { recursive: true });
}

// Convert local paths for HTML
const marketingDir = path.resolve(__dirname, '../marketing/images').replace(/\\/g, '/');

// Common CSS styling
const baseStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #080d1a;
    font-family: 'Inter', -apple-system, sans-serif;
    color: #f1f5f9;
    position: relative;
  }
  .bg-glow {
    position: absolute;
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(30, 58, 138, 0.05) 50%, transparent 70%);
    top: -200px;
    right: -200px;
    pointer-events: none;
  }
  .bg-glow-bottom {
    position: absolute;
    width: 900px;
    height: 900px;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0) 70%);
    bottom: -300px;
    left: -200px;
    pointer-events: none;
  }
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .badge-red {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #f87171;
  }
  .badge-blue {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
  }
  .badge-emerald {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34d399;
  }
  .badge-amber {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fbbf24;
  }
`;

// SHOT 1A: Developer Workstation & Incident Alert
const shot1a = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${baseStyle}
    .container {
      width: 1920px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      padding: 60px 80px;
      position: relative;
      z-index: 10;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .brand {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand span {
      color: #38bdf8;
    }
    .content-split {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 50px;
      flex: 1;
      align-items: center;
    }
    .headline-area h1 {
      font-size: 56px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: 24px;
      color: #ffffff;
    }
    .headline-area h1 span.highlight {
      background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtext {
      font-size: 22px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 36px;
    }
    .stats-row {
      display: flex;
      gap: 30px;
    }
    .stat-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 20px 24px;
      border-radius: 12px;
      min-width: 180px;
    }
    .stat-val {
      font-size: 38px;
      font-weight: 800;
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
    }
    .stat-val.red { color: #f87171; }
    .stat-lbl {
      font-size: 13px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    .monitor-panel {
      background: #0b1120;
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(239, 68, 68, 0.15);
      overflow: hidden;
    }
    .panel-header {
      background: rgba(239, 68, 68, 0.1);
      border-bottom: 1px solid rgba(239, 68, 68, 0.2);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .panel-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #f87171;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .pulse-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 12px #ef4444;
    }
    .panel-body {
      padding: 28px;
    }
    .incident-item {
      margin-bottom: 20px;
    }
    .incident-meta {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 6px;
      font-family: 'JetBrains Mono', monospace;
    }
    .incident-name {
      font-size: 20px;
      font-weight: 700;
      color: #f1f5f9;
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 8px;
    }
    .incident-desc {
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .terminal-snippet {
      background: #030712;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      padding: 16px;
      margin-top: 18px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.5;
    }
    .terminal-snippet .err { color: #f87171; font-weight: 700; }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-glow-bottom"></div>
  <div class="grid-pattern"></div>
  <div class="container">
    <div class="top-bar">
      <div class="brand">
        <span>CKA</span> MASTERY BLUEPRINT // MISSION CRITICAL OPERATIONS
      </div>
      <div class="badge badge-red">
        ● LIVE EXAM CHALLENGE
      </div>
    </div>
    <div class="content-split">
      <div class="headline-area">
        <div class="badge badge-amber" style="margin-bottom: 20px;">
          DOMAIN 5 • 30% OF YOUR EXAM SCORE
        </div>
        <h1>When Production Crashes, <span class="highlight">You Cannot Guess.</span></h1>
        <p class="subtext">
          On the official CKA examination, you get 120 minutes inside a live terminal. Troubleshooting is the single highest-weighted domain. Hesitation is what fails candidates.
        </p>
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-val red">30%</div>
            <div class="stat-lbl">Exam Weight (Domain 5)</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">120m</div>
            <div class="stat-lbl">Live Terminal Clock</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">66%</div>
            <div class="stat-lbl">Passing Score Cutoff</div>
          </div>
        </div>
      </div>
      <div class="monitor-panel">
        <div class="panel-header">
          <div class="panel-title">
            <span class="pulse-dot"></span> CLUSTER INCIDENT: WORKLOAD OUTAGE
          </div>
          <div class="badge badge-red" style="padding: 4px 10px; font-size: 11px;">CRITICAL</div>
        </div>
        <div class="panel-body">
          <div class="incident-item">
            <div class="incident-meta">
              <span>NAMESPACE: production</span>
              <span>NODE: worker-01</span>
            </div>
            <div class="incident-name">api-gateway-74b8897c-9k2px</div>
            <div class="incident-desc">
              Pod status entering continuous restart loop. Application service degraded across cluster ingress.
            </div>
          </div>
          <div class="terminal-snippet">
            <div>$ kubectl get pods -n production</div>
            <div style="color: #64748b; margin: 4px 0;">NAME&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;READY&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;RESTARTS</div>
            <div>api-gateway-74b8897c-9k2px&nbsp;&nbsp;&nbsp;0/1&nbsp;&nbsp;&nbsp;&nbsp;<span class="err">CrashLoopBackOff</span>&nbsp;&nbsp;5 (74s ago)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// SHOT 1B: Real Terminal Deep Dive (Exit Code 137 OOMKilled)
const shot1b = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${baseStyle}
    .container {
      width: 1920px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      padding: 50px 80px;
      position: relative;
      z-index: 10;
    }
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .title-block h2 {
      font-size: 32px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.01em;
    }
    .title-block p {
      font-size: 16px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .terminal-window {
      background: #070c18;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.08);
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'JetBrains Mono', monospace;
    }
    .term-titlebar {
      background: #0f172a;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .term-dots {
      display: flex;
      gap: 8px;
    }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }
    .term-tabs {
      font-size: 13px;
      color: #94a3b8;
      display: flex;
      gap: 20px;
    }
    .term-tab.active {
      color: #38bdf8;
      font-weight: 600;
    }
    .term-body {
      padding: 24px 30px;
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
      flex: 1;
      overflow: hidden;
    }
    .prompt {
      color: #10b981;
      font-weight: 700;
    }
    .cmd {
      color: #f8fafc;
      font-weight: 600;
    }
    .table-head {
      color: #64748b;
      font-weight: 700;
      margin-top: 6px;
    }
    .fail {
      color: #f87171;
      font-weight: 700;
      background: rgba(239,68,68,0.12);
      padding: 1px 6px;
      border-radius: 4px;
    }
    .hl {
      color: #38bdf8;
      font-weight: 600;
    }
    .badge-bar {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 16px 28px;
      border-radius: 12px;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="grid-pattern"></div>
  <div class="container">
    <div class="top-header">
      <div class="title-block">
        <h2>Live Ubuntu Terminal Diagnostic Session</h2>
        <p>Real-time cluster failure triage: root-cause diagnosis in seconds, not minutes.</p>
      </div>
      <div class="badge badge-red">
        ● TERMINAL TIME REMAINING: 01:48:22
      </div>
    </div>
    <div class="terminal-window">
      <div class="term-titlebar">
        <div class="term-dots">
          <div class="dot dot-red"></div>
          <div class="dot dot-yellow"></div>
          <div class="dot dot-green"></div>
        </div>
        <div class="term-tabs">
          <span class="term-tab active">bash: candidate@k8s-control-plane:~</span>
          <span class="term-tab">context: k8s-production</span>
          <span class="term-tab">k8s v1.31.2</span>
        </div>
        <div style="font-size: 12px; color: #64748b;">UTF-8 • 1920x1080</div>
      </div>
      <div class="term-body">
        <div><span class="prompt">candidate@k8s-control-plane:~$</span> <span class="cmd">kubectl get pods -n production -o wide</span></div>
        <div class="table-head">NAME&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;READY&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;RESTARTS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;AGE&nbsp;&nbsp;&nbsp;IP&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NODE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NOMINATED NODE</div>
        <div>api-gateway-74b8897c-9k2px&nbsp;&nbsp;&nbsp;0/1&nbsp;&nbsp;&nbsp;&nbsp;<span class="fail">CrashLoopBackOff</span>&nbsp;&nbsp;5 (82s ago)&nbsp;&nbsp;4m12s&nbsp;10.244.1.48&nbsp;worker-01&nbsp;&nbsp;&lt;none&gt;</div>
        <div>order-service-6d8b9f47c-2x7wz&nbsp;1/1&nbsp;&nbsp;&nbsp;&nbsp;Running&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;18m&nbsp;&nbsp;&nbsp;10.244.2.19&nbsp;worker-02&nbsp;&nbsp;&lt;none&gt;</div>
        <br>
        <div><span class="prompt">candidate@k8s-control-plane:~$</span> <span class="cmd">kubectl describe pod api-gateway-74b8897c-9k2px -n production | grep -E "Last State|Reason|Exit Code"</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;Last State:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Terminated</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Reason:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="fail">OOMKilled</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Exit Code:&nbsp;&nbsp;&nbsp;&nbsp;<span class="fail">137</span></div>
        <br>
        <div><span class="prompt">candidate@k8s-control-plane:~$</span> <span class="cmd">kubectl logs api-gateway-74b8897c-9k2px -n production --previous --tail=2</span></div>
        <div style="color: #94a3b8;">[2026-11-10T16:21:04.112Z] FATAL: runtime: out of memory: cannot allocate 536870912-byte block</div>
        <div style="color: #94a3b8;">[2026-11-10T16:21:04.113Z] Container memory threshold (256Mi) exceeded. Process terminated with SIGKILL (Exit 137).</div>
        <br>
        <div><span class="prompt">candidate@k8s-control-plane:~$</span> <span class="cmd">kubectl set resources deployment api-gateway -n production --limits=memory=512Mi</span></div>
        <div style="color: #34d399;">deployment.apps/api-gateway resource requirements updated</div>
      </div>
    </div>
    <div class="badge-bar">
      <div style="display: flex; gap: 14px; align-items: center;">
        <span class="badge badge-emerald">✔ ROOT CAUSE RESOLVED IN 45s</span>
        <span style="font-size: 15px; color: #94a3b8;">Exit Code 137 (OOMKilled) solved with zero guesswork.</span>
      </div>
      <div style="font-size: 14px; color: #64748b;">
        CKA Blueprint Volume III • Diagram 42 Diagnostic Branch
      </div>
    </div>
  </div>
</body>
</html>`;

// SHOT 2A: The CKA Mastery Blueprint - Product Hero Reveal
const shot2a = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${baseStyle}
    .container {
      width: 1920px;
      height: 1080px;
      display: flex;
      padding: 60px 90px;
      position: relative;
      z-index: 10;
      align-items: center;
      gap: 70px;
    }
    .left-cover {
      flex: 0 0 540px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    .cover-img {
      width: 480px;
      border-radius: 12px;
      box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.9), 0 0 50px rgba(56, 189, 248, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .right-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .edition-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .main-title {
      font-size: 58px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: #ffffff;
      margin-bottom: 20px;
    }
    .main-title span {
      background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      font-size: 22px;
      line-height: 1.5;
      color: #94a3b8;
      margin-bottom: 36px;
      font-weight: 500;
    }
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
    }
    .feature-box {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 18px 22px;
    }
    .feature-title {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .feature-title span { color: #38bdf8; }
    .feature-desc {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 6px;
      line-height: 1.4;
    }
    .spec-bar {
      display: flex;
      align-items: center;
      gap: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 24px;
      font-size: 14px;
      color: #64748b;
    }
    .spec-bar strong { color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-glow-bottom"></div>
  <div class="grid-pattern"></div>
  <div class="container">
    <div class="left-cover">
      <img src="file:///${marketingDir}/01_main_cover_mockup.jpg" class="cover-img" alt="CKA Mastery Blueprint Cover">
    </div>
    <div class="right-details">
      <div class="edition-badge">
        <span class="badge badge-blue">OFFICIAL 2026–2027 PROFESSIONAL EDITION</span>
        <span class="badge badge-emerald">K8S v1.31 & v1.32 ALIGNED</span>
      </div>
      <h1 class="main-title">THE CKA MASTERY<br><span>BLUEPRINT</span></h1>
      <p class="subtitle">
        The complete Kubernetes administration, troubleshooting, and certification preparation system. Built from the ground up for real production engineering.
      </p>
      <div class="features-grid">
        <div class="feature-box">
          <div class="feature-title"><span>✦</span> 80 In-Depth Chapters</div>
          <div class="feature-desc">Complete core architecture, internals, and step-by-step administration.</div>
        </div>
        <div class="feature-box">
          <div class="feature-title"><span>✦</span> 67 Hands-On Labs</div>
          <div class="feature-desc">Production-grade scenarios with automated verification test scripts.</div>
        </div>
        <div class="feature-box">
          <div class="feature-title"><span>✦</span> 66 Architectural Schematics</div>
          <div class="feature-desc">Visual decision trees and component interaction diagrams.</div>
        </div>
        <div class="feature-box">
          <div class="feature-title"><span>✦</span> 4 Proctored Mock Exams</div>
          <div class="feature-desc">Exact PSI remote desktop simulation with 73 graded exam tasks.</div>
        </div>
      </div>
      <div class="spec-bar">
        <div>FORMAT: <strong>PDF + Companion Git Repo</strong></div>
        <div>PAGES: <strong>600+ Across 5 Volumes</strong></div>
        <div>GUARANTEE: <strong>Zero Deprecated Syntax</strong></div>
      </div>
    </div>
  </div>
</body>
</html>`;

// SHOT 2B: 5-Volume Boxset Bundle Showcase
const shot2b = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${baseStyle}
    .container {
      width: 1920px;
      height: 1080px;
      display: flex;
      padding: 50px 80px;
      position: relative;
      z-index: 10;
      align-items: center;
      gap: 60px;
    }
    .left-bundle {
      flex: 0 0 720px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .bundle-img {
      width: 680px;
      border-radius: 12px;
      box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.9), 0 0 50px rgba(56, 189, 248, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .right-volumes {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .header-badge {
      margin-bottom: 16px;
    }
    .header-title {
      font-size: 42px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 24px;
      letter-spacing: -0.02em;
    }
    .header-title span {
      color: #38bdf8;
    }
    .vol-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .vol-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-left: 4px solid #38bdf8;
      border-radius: 8px;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .vol-card:nth-child(2) { border-left-color: #10b981; }
    .vol-card:nth-child(3) { border-left-color: #f59e0b; }
    .vol-card:nth-child(4) { border-left-color: #a855f7; }
    .vol-card:nth-child(5) { border-left-color: #ef4444; }
    .vol-info h4 {
      font-size: 17px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 3px;
    }
    .vol-info p {
      font-size: 13px;
      color: #94a3b8;
    }
    .vol-tag {
      font-size: 12px;
      font-weight: 700;
      color: #cbd5e1;
      background: rgba(255,255,255,0.06);
      padding: 6px 12px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-glow-bottom"></div>
  <div class="grid-pattern"></div>
  <div class="container">
    <div class="left-bundle">
      <img src="file:///${marketingDir}/02_5_volume_boxset_bundle.jpg" class="bundle-img" alt="5 Volume Boxset">
    </div>
    <div class="right-volumes">
      <div class="header-badge">
        <span class="badge badge-blue">AN INTEGRATED ENGINEERING SYSTEM</span>
      </div>
      <h2 class="header-title">The Complete <span>5-Volume Boxset</span></h2>
      <div class="vol-list">
        <div class="vol-card">
          <div class="vol-info">
            <h4>VOLUME I — Comprehensive Textbook</h4>
            <p>80 deep chapters covering the entire CNCF curriculum & cluster internals.</p>
          </div>
          <div class="vol-tag">80 CHAPTERS</div>
        </div>
        <div class="vol-card">
          <div class="vol-info">
            <h4>VOLUME II — Practical Lab Workbook</h4>
            <p>67 hands-on production labs with automated verification bash test harnesses.</p>
          </div>
          <div class="vol-tag">67 LABS</div>
        </div>
        <div class="vol-card">
          <div class="vol-info">
            <h4>VOLUME III — Visual Architecture Atlas</h4>
            <p>66 vector schematics, etcd consensus graphs, and failure decision trees.</p>
          </div>
          <div class="vol-tag">66 DIAGRAMS</div>
        </div>
        <div class="vol-card">
          <div class="vol-info">
            <h4>VOLUME IV — Command & Troubleshooting Field Guide</h4>
            <p>Strictly zero deprecated flags. Modern rollout annotations & Linux triage.</p>
          </div>
          <div class="vol-tag">FIELD READY</div>
        </div>
        <div class="vol-card">
          <div class="vol-info">
            <h4>VOLUME V — Mock Examination & Assessment System</h4>
            <p>4 full proctored simulations replicating the official PSI exam terminal.</p>
          </div>
          <div class="vol-tag">4 FULL MOCKS</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// SHOT 3: Volume III Visual Architecture Atlas & Decision Trees
const shot3 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${baseStyle}
    .container {
      width: 1920px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      padding: 50px 80px;
      position: relative;
      z-index: 10;
    }
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .header-left h2 {
      font-size: 34px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.01em;
    }
    .header-left p {
      font-size: 16px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .schematic-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 30px;
      flex: 1;
    }
    .card {
      background: #0b1120;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6);
    }
    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .flow-tree {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-family: 'JetBrains Mono', monospace;
    }
    .tree-node {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 13px;
    }
    .tree-node.root {
      border-color: rgba(56, 189, 248, 0.4);
      background: rgba(56, 189, 248, 0.08);
    }
    .branch-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    .branch {
      background: rgba(15, 23, 42, 0.9);
      border-radius: 8px;
      padding: 12px 14px;
      border-left: 3px solid #64748b;
    }
    .branch.red { border-left-color: #ef4444; }
    .branch.amber { border-left-color: #f59e0b; }
    .branch.green { border-left-color: #10b981; }
    .branch-code {
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .branch-desc {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
    }
    .etcd-box {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
    }
    .raft-cluster {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 24px 0;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 10px;
      border: 1px dashed rgba(255,255,255,0.1);
    }
    .raft-node {
      text-align: center;
      padding: 14px 20px;
      background: #0f172a;
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
    }
    .raft-node.leader {
      border-color: #10b981;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
    }
    .cmd-box {
      background: #030712;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .cmd-box span.hl { color: #38bdf8; font-weight: 700; }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="grid-pattern"></div>
  <div class="container">
    <div class="top-header">
      <div class="header-left">
        <h2>Volume III: Visual Architecture Atlas</h2>
        <p>66 Original technical schematics and systematic decision trees for instant recall.</p>
      </div>
      <div class="badge badge-blue">
        ● 66 VECTOR BLUEPRINTS
      </div>
    </div>
    <div class="schematic-grid">
      <div class="card">
        <div class="card-title">
          <span>DIAGRAM 42: CrashLoopBackOff Diagnostic Tree</span>
          <span class="badge badge-amber" style="font-size: 11px;">FAILURE RECOVERY</span>
        </div>
        <div class="flow-tree">
          <div class="tree-node root">
            <span style="color: #38bdf8; font-weight: 700;">TRIGGER:</span> Pod enters CrashLoopBackOff &nbsp;➔&nbsp; Execute <code style="color: #f1f5f9;">kubectl describe pod &lt;name&gt;</code>
          </div>
          <div class="branch-row">
            <div class="branch red">
              <div class="branch-code" style="color: #f87171;">Exit Code 137</div>
              <div class="branch-desc">OOMKilled. Container memory exceeded cgroup quota. Raise <code>resources.limits.memory</code>.</div>
            </div>
            <div class="branch amber">
              <div class="branch-code" style="color: #fbbf24;">Exit Code 1</div>
              <div class="branch-desc">Application Crash. Check <code>kubectl logs --previous</code> for unhandled exception or missing env.</div>
            </div>
            <div class="branch green">
              <div class="branch-code" style="color: #34d399;">Exit Code 0</div>
              <div class="branch-desc">Completed. Process finished cleanly without keep-alive loop. Wrap in worker script.</div>
            </div>
          </div>
          <div class="tree-node" style="margin-top: 8px;">
            <span style="color: #a855f7; font-weight: 700;">LIVENESS PROBE CHECK:</span> Probe failed 3 consecutive times ➔ Increase <code>initialDelaySeconds</code> or fix health endpoint.
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">
          <span>DIAGRAM 34: etcd Disaster Recovery & Quorum</span>
          <span class="badge badge-emerald" style="font-size: 11px;">HIGH AVAILABILITY</span>
        </div>
        <div class="etcd-box">
          <div class="raft-cluster">
            <div class="raft-node leader">
              <div style="font-size: 11px; color: #10b981; font-weight: 700;">LEADER</div>
              <div style="font-size: 14px; font-weight: 700;">etcd-01</div>
            </div>
            <div style="color: #64748b; font-size: 18px;">⇄</div>
            <div class="raft-node">
              <div style="font-size: 11px; color: #64748b;">FOLLOWER</div>
              <div style="font-size: 14px; font-weight: 700;">etcd-02</div>
            </div>
            <div style="color: #64748b; font-size: 18px;">⇄</div>
            <div class="raft-node">
              <div style="font-size: 11px; color: #64748b;">FOLLOWER</div>
              <div style="font-size: 14px; font-weight: 700;">etcd-03</div>
            </div>
          </div>
          <div class="cmd-box">
            <div><span class="hl">ETCDCTL_API=3</span> etcdctl snapshot save /var/lib/etcd-backup.db \\</div>
            <div>&nbsp;&nbsp;--endpoints=https://127.0.0.1:2379 \\</div>
            <div>&nbsp;&nbsp;--cacert=/etc/kubernetes/pki/etcd/ca.crt \\</div>
            <div>&nbsp;&nbsp;--cert=/etc/kubernetes/pki/etcd/server.crt \\</div>
            <div>&nbsp;&nbsp;--key=/etc/kubernetes/pki/etcd/server.key</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// SHOT 4: Volume II 67 Labs & Volume IV Field Guide (Modern Syntax vs Deprecated)
const shot4 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${baseStyle}
    .container {
      width: 1920px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      padding: 50px 80px;
      position: relative;
      z-index: 10;
    }
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }
    .top-header h2 {
      font-size: 34px;
      font-weight: 800;
      color: #ffffff;
    }
    .top-header p {
      font-size: 16px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .split-view {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 36px;
      flex: 1;
    }
    .card {
      background: #0b1120;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 26px;
      display: flex;
      flex-direction: column;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .card-head h3 {
      font-size: 18px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .rubric-steps {
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
    }
    .rubric-item {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 12px 16px;
    }
    .rubric-tag {
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 4px;
    }
    .contrast-box {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }
    .deprecated-item {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      padding: 18px;
    }
    .modern-item {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 10px;
      padding: 18px;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.05em;
    }
    .cmd-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="grid-pattern"></div>
  <div class="container">
    <div class="top-header">
      <div>
        <h2>Volume II (Workbook) & Volume IV (Field Guide)</h2>
        <p>Strictly zero deprecated commands. Modern Kubernetes v1.31 and v1.32 standards.</p>
      </div>
      <div class="badge badge-emerald">
        ● 67 LABS + COMPANION GIT REPO
      </div>
    </div>
    <div class="split-view">
      <div class="card">
        <div class="card-head">
          <h3>VOLUME II: LAB 55 (Multi-Container Pods)</h3>
          <span class="badge badge-blue">18-POINT RUBRIC</span>
        </div>
        <div class="rubric-steps">
          <div class="rubric-item">
            <div class="rubric-tag">[1] OBJECTIVE & TOPOLOGY</div>
            <div style="color: #94a3b8;">Deploy multi-container pod with shared volume for log collection.</div>
          </div>
          <div class="rubric-item">
            <div class="rubric-tag">[2] PRODUCTION MANIFEST</div>
            <div style="color: #94a3b8;">Shared <code>emptyDir: {}</code> mounted at <code>/var/log</code> across app & sidecar.</div>
          </div>
          <div class="rubric-item">
            <div class="rubric-tag" style="color: #10b981;">[3] AUTOMATED VERIFICATION</div>
            <div style="color: #cbd5e1;">$ ./verify-lab-55.sh<br><span style="color: #34d399;">✔ [PASS] Sidecar streaming logs from shared volume</span></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <h3>VOLUME IV: FIELD GUIDE (Zero Deprecations)</h3>
          <span class="badge badge-amber">EXAM WARNING</span>
        </div>
        <div class="contrast-box">
          <div class="deprecated-item">
            <div class="label-row" style="color: #f87171;">
              <span>❌ DEPRECATED SYNTAX (FAILS EXAM)</span>
              <span>REMOVED IN v1.31</span>
            </div>
            <div class="cmd-text" style="color: #fca5a5;">
              kubectl set image deployment/web nginx=nginx:1.27 --record
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
              The <code>--record</code> flag was permanently removed. Using it fails task evaluation.
            </div>
          </div>
          <div class="modern-item">
            <div class="label-row" style="color: #34d399;">
              <span>✅ OFFICIAL CKA STANDARD (MODERN v1.31+)</span>
              <span>FULL SCORE</span>
            </div>
            <div class="cmd-text" style="color: #86efac;">
              kubectl annotate deployment web kubernetes.io/change-cause="update to nginx:1.27"
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
              Records rollout history cleanly into metadata.annotations.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// SHOT 5: Volume V Realistic PSI Exam Simulation & Automated Test Harness
const shot5 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${baseStyle}
    .container {
      width: 1920px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 10;
      background: #030712;
    }
    .psi-topbar {
      background: #111827;
      border-bottom: 2px solid #1f2937;
      padding: 12px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'JetBrains Mono', monospace;
    }
    .psi-title {
      font-size: 15px;
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .psi-clock {
      font-size: 18px;
      font-weight: 800;
      color: #f87171;
      background: rgba(239,68,68,0.12);
      padding: 6px 16px;
      border-radius: 6px;
      border: 1px solid rgba(239,68,68,0.3);
    }
    .psi-main {
      flex: 1;
      display: grid;
      grid-template-columns: 460px 1fr;
      overflow: hidden;
    }
    .question-pane {
      background: #0f172a;
      border-right: 2px solid #1e293b;
      padding: 30px;
      display: flex;
      flex-direction: column;
    }
    .q-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 12px;
      font-family: 'JetBrains Mono', monospace;
    }
    .q-title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 16px;
    }
    .q-body {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      flex: 1;
    }
    .terminal-pane {
      background: #020617;
      padding: 24px 30px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      overflow: hidden;
    }
    .term-prompt { color: #10b981; font-weight: 700; }
    .term-cmd { color: #ffffff; font-weight: 600; }
    .term-out { color: #94a3b8; }
    .pass-banner {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 14px 20px;
      border-radius: 8px;
      margin-top: 20px;
      color: #34d399;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="psi-topbar">
      <div class="psi-title">
        <span style="color: #38bdf8;">PSI SECURE BROWSER</span> • CKA CERTIFICATION EXAMINATION
      </div>
      <div style="color: #94a3b8; font-size: 13px;">CONTEXT: <strong>k8s-controlplane</strong></div>
      <div class="psi-clock">01:38:45 REMAINING</div>
    </div>
    <div class="psi-main">
      <div class="question-pane">
        <div class="q-meta">
          <span>TASK 14 OF 17</span>
          <span style="color: #38bdf8;">WEIGHT: 7%</span>
        </div>
        <h3 class="q-title">etcd Snapshot & Verification</h3>
        <div class="q-body">
          <p>You are required to perform an emergency snapshot of the etcd data store running on the control-plane node.</p>
          <br>
          <p><strong>Requirements:</strong></p>
          <p>1. Save snapshot to <code>/var/lib/etcd-backup.db</code>.</p>
          <p>2. Use the local server certificates at <code>/etc/kubernetes/pki/etcd/</code>.</p>
          <p>3. Verify snapshot integrity status before proceeding.</p>
        </div>
        <div class="badge badge-emerald" style="margin-top: 20px;">
          ● VOLUME V: MOCK EXAM 2 (TASK 14)
        </div>
      </div>
      <div class="terminal-pane">
        <div><span class="term-prompt">candidate@k8s-controlplane:~$</span> <span class="term-cmd">ETCDCTL_API=3 etcdctl snapshot save /var/lib/etcd-backup.db \</span></div>
        <div>&nbsp;&nbsp;<span class="term-cmd">--endpoints=https://127.0.0.1:2379 \</span></div>
        <div>&nbsp;&nbsp;<span class="term-cmd">--cacert=/etc/kubernetes/pki/etcd/ca.crt \</span></div>
        <div>&nbsp;&nbsp;<span class="term-cmd">--cert=/etc/kubernetes/pki/etcd/server.crt \</span></div>
        <div>&nbsp;&nbsp;<span class="term-cmd">--key=/etc/kubernetes/pki/etcd/server.key</span></div>
        <div class="term-out">Snapshot saved at /var/lib/etcd-backup.db</div>
        <br>
        <div><span class="term-prompt">candidate@k8s-controlplane:~$</span> <span class="term-cmd">ETCDCTL_API=3 etcdctl snapshot status /var/lib/etcd-backup.db --write-out=table</span></div>
        <div class="term-out">+----------+----------+------------+------------+</div>
        <div class="term-out">|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |</div>
        <div class="term-out">+----------+----------+------------+------------+</div>
        <div class="term-out">| 3e8f49a1 |    18429 |       1432 |      15 MB |</div>
        <div class="term-out">+----------+----------+------------+------------+</div>
        <br>
        <div><span class="term-prompt">candidate@k8s-controlplane:~$</span> <span class="term-cmd">/opt/grading/verify-task-14.sh</span></div>
        <div class="pass-banner">
          <div>✔ [VERIFIED] Task 14: etcd snapshot valid & SHA256 matches.</div>
          <div>SCORE: 7 / 7 POINTS (100%)</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// SHOT 6: The Commercial Offer - Complete System for $15 USD
const shot6 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${baseStyle}
    .container {
      width: 1920px;
      height: 1080px;
      display: flex;
      padding: 60px 80px;
      position: relative;
      z-index: 10;
      align-items: center;
      gap: 70px;
    }
    .bundle-preview {
      flex: 0 0 680px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .bundle-img {
      width: 650px;
      border-radius: 14px;
      box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.9), 0 0 50px rgba(56, 189, 248, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .offer-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .offer-badge {
      margin-bottom: 14px;
    }
    .offer-title {
      font-size: 50px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin-bottom: 20px;
    }
    .offer-title span {
      background: linear-gradient(135deg, #38bdf8 0%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .price-box {
      background: rgba(15, 23, 42, 0.8);
      border: 2px solid #38bdf8;
      border-radius: 14px;
      padding: 20px 28px;
      display: flex;
      align-items: baseline;
      gap: 20px;
      margin-bottom: 28px;
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.2);
    }
    .price-main {
      font-size: 64px;
      font-weight: 900;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
    }
    .price-strike {
      font-size: 26px;
      color: #64748b;
      text-decoration: line-through;
      font-family: 'JetBrains Mono', monospace;
    }
    .price-tagline {
      font-size: 15px;
      color: #34d399;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .checklist {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 30px;
    }
    .check-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      color: #cbd5e1;
    }
    .check-item span {
      color: #10b981;
      font-weight: 900;
      font-size: 18px;
    }
    .download-note {
      font-size: 14px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-glow-bottom"></div>
  <div class="grid-pattern"></div>
  <div class="container">
    <div class="bundle-preview">
      <img src="file:///${marketingDir}/03_digital_ecosystem_preview.jpg" class="bundle-img" alt="Digital Ecosystem Preview">
    </div>
    <div class="offer-details">
      <div class="offer-badge">
        <span class="badge badge-emerald">LIMITED TIME RELEASE OFFER</span>
      </div>
      <h2 class="offer-title">The Complete System.<br><span>Just $15 USD.</span></h2>
      <div class="price-box">
        <div class="price-main">$15 USD</div>
        <div class="price-strike">$59 USD</div>
        <div class="price-tagline">Save 75% • Instant Download</div>
      </div>
      <div class="checklist">
        <div class="check-item"><span>✔</span> All 7 Master PDFs (Full Edition + 5 Modular Volumes + Premium Suite)</div>
        <div class="check-item"><span>✔</span> 67 Hands-On Labs with Automated Verification Test Harnesses</div>
        <div class="check-item"><span>✔</span> 66 Vector Architecture Schematics & Troubleshooting Trees</div>
        <div class="check-item"><span>✔</span> 4 Proctored Mock Exams & 73 Performance Tasks</div>
        <div class="check-item"><span>✔</span> Companion Lab Git Repository Access & Lifelong Reference</div>
      </div>
      <div class="download-note">
        Instant PDF download • Mobile & tablet optimized • Zero DRM restrictions
      </div>
    </div>
  </div>
</body>
</html>`;

// SHOT 7: CTA Outro & Official Links
const shot7 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${baseStyle}
    .container {
      width: 1920px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 60px 100px;
      position: relative;
      z-index: 10;
      text-align: center;
    }
    .outro-badge {
      margin-bottom: 24px;
    }
    .hero-h1 {
      font-size: 64px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 20px;
      max-width: 1300px;
    }
    .hero-h1 span {
      background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-sub {
      font-size: 24px;
      color: #94a3b8;
      margin-bottom: 44px;
      max-width: 900px;
      line-height: 1.5;
    }
    .cta-card {
      background: rgba(15, 23, 42, 0.9);
      border: 2px solid #38bdf8;
      border-radius: 18px;
      padding: 28px 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      box-shadow: 0 0 50px rgba(56, 189, 248, 0.25);
      margin-bottom: 30px;
    }
    .cta-btn {
      background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%);
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      padding: 16px 44px;
      border-radius: 9999px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
    }
    .cta-url {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px;
      color: #f1f5f9;
      font-weight: 600;
    }
    .cta-url span { color: #38bdf8; }
    .footer-links {
      display: flex;
      gap: 40px;
      font-size: 15px;
      color: #64748b;
    }
    .footer-links strong { color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="bg-glow" style="top: 100px; left: 50%; transform: translateX(-50%); width: 1200px;"></div>
  <div class="grid-pattern"></div>
  <div class="container">
    <div class="outro-badge">
      <span class="badge badge-emerald" style="font-size: 15px; padding: 8px 20px;">
        ● CERTIFIED KUBERNETES ADMINISTRATOR (CKA) 2026–2027
      </span>
    </div>
    <h1 class="hero-h1">Master Kubernetes Administration.<br><span>Pass on Your Very First Attempt.</span></h1>
    <p class="hero-sub">
      Get the complete 5-volume preparation system, 67 production labs, 66 schematics, and 4 full mock exams today.
    </p>
    <div class="cta-card">
      <div class="cta-btn">GET THE COMPLETE BUNDLE — $15 USD</div>
      <div class="cta-url">yashsonawane1.gumroad.com/l/<span>cka-mastery-blueprint</span></div>
    </div>
    <div class="footer-links">
      <div>COMPANION REPO: <strong>github.com/yashsonawane25/THE-CKA-MASTERY-BLUEPRINT</strong></div>
      <div>EDITION: <strong>2026–2027 Professional Edition</strong></div>
      <div>PRICE: <strong>$15 USD (Limited Release)</strong></div>
    </div>
  </div>
</body>
</html>`;

const shots = [
  { name: 'shot_1a_alert.html', content: shot1a },
  { name: 'shot_1b_terminal.html', content: shot1b },
  { name: 'shot_2a_book_hero.html', content: shot2a },
  { name: 'shot_2b_boxset.html', content: shot2b },
  { name: 'shot_3_diagrams.html', content: shot3 },
  { name: 'shot_4_workbook_fieldguide.html', content: shot4 },
  { name: 'shot_5_exam_simulator.html', content: shot5 },
  { name: 'shot_6_offer_pricing.html', content: shot6 },
  { name: 'shot_7_cta_outro.html', content: shot7 },
];

shots.forEach(s => {
  const p = path.join(scenesDir, s.name);
  fs.writeFileSync(p, s.content);
  console.log(`Created scene file: ${s.name}`);
});
console.log('All 9 scene templates generated successfully.');
