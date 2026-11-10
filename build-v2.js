const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require('marked');

marked.setOptions({
  gfm: true,
  breaks: false
});

const baseDir = __dirname;
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const printCss = `
  @page {
    size: A4 portrait;
    margin: 18mm 16mm 20mm 16mm;
    @bottom-right {
      content: counter(page);
    }
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.6;
    color: #1a202c;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #0b192c;
    font-weight: 700;
    page-break-after: avoid;
    break-after: avoid;
  }

  h1 {
    font-size: 24pt;
    border-bottom: 3px solid #1e3e62;
    padding-bottom: 6px;
    margin-top: 24pt;
    margin-bottom: 14pt;
  }

  h2 {
    font-size: 16pt;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 20pt;
    margin-bottom: 10pt;
  }

  h3 {
    font-size: 13pt;
    color: #1e3e62;
    margin-top: 16pt;
    margin-bottom: 8pt;
  }

  h4 {
    font-size: 11pt;
    color: #334155;
    margin-top: 12pt;
    margin-bottom: 6pt;
  }

  p, ul, ol {
    margin-top: 4pt;
    margin-bottom: 8pt;
  }

  code {
    font-family: 'Fira Code', 'Consolas', 'Courier New', monospace;
    font-size: 9pt;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 2px 4px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }

  pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 12px 14px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 8.5pt;
    line-height: 1.45;
    page-break-inside: avoid;
    break-inside: avoid;
    margin: 10pt 0;
    border-left: 4px solid #38bdf8;
  }

  pre code {
    background-color: transparent;
    color: inherit;
    padding: 0;
    border: none;
    font-size: inherit;
  }

  blockquote {
    border-left: 4px solid #2563eb;
    background-color: #eff6ff;
    padding: 10px 14px;
    margin: 12pt 0;
    border-radius: 0 6px 6px 0;
    color: #1e3a8a;
    page-break-inside: avoid;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  th, td {
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background-color: #0b192c;
    color: #ffffff;
    font-weight: 600;
  }

  tr:nth-child(even) {
    background-color: #f8fafc;
  }

  hr {
    border: 0;
    height: 1px;
    background: #e2e8f0;
    margin: 20pt 0;
    page-break-after: avoid;
  }

  .cover-page {
    text-align: center;
    padding-top: 100pt;
    padding-bottom: 80pt;
    page-break-after: always;
    break-after: page;
  }

  .cover-title {
    font-size: 32pt;
    font-weight: 900;
    color: #0b192c;
    line-height: 1.15;
    margin-bottom: 12pt;
  }

  .cover-subtitle {
    font-size: 16pt;
    color: #1e3e62;
    margin-bottom: 24pt;
    font-weight: 500;
  }

  .cover-edition {
    display: inline-block;
    background-color: #0b192c;
    color: #38bdf8;
    padding: 6px 18px;
    border-radius: 20px;
    font-size: 11pt;
    font-weight: 700;
    letter-spacing: 1px;
    margin-bottom: 40pt;
  }

  .cover-meta {
    font-size: 10pt;
    color: #64748b;
    line-height: 1.8;
  }

  .page-break {
    page-break-before: always;
    break-before: page;
  }

  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: bold;
    text-transform: uppercase;
  }
  .badge-pass { background-color: #dcfce7; color: #166534; }
  .badge-warn { background-color: #fef9c3; color: #854d0e; }
  .badge-crit { background-color: #fee2e2; color: #991b1b; }
`;

function buildHtmlDocument(title, subtitle, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${printCss}</style>
</head>
<body>
  <div class="cover-page">
    <div class="cover-edition">2026–2027 PROFESSIONAL EDITION (VERSION 2.0)</div>
    <div class="cover-title">${title}</div>
    <div class="cover-subtitle">${subtitle}</div>
    <div class="cover-meta">
      <strong>Cloud Native Engineering Press</strong><br/>
      Targeting Kubernetes v1.31.x / v1.32.x (Forward Compatible through v1.33+)<br/>
      Independent Professional Certification Study System<br/>
      Certified Kubernetes Administrator (CNCF / The Linux Foundation)
    </div>
  </div>
  <div class="page-break"></div>
  <div class="content-container">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

function renderPdfFromHtml(htmlPath, pdfPath) {
  console.log(`Rendering PDF: ${path.basename(pdfPath)} ...`);
  const cmd = `"${edgePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Execution error: ${err.message}`);
  }
  if (fs.existsSync(pdfPath)) {
    const size = fs.statSync(pdfPath).size;
    console.log(`[SUCCESS] Generated: ${path.basename(pdfPath)} (${(size / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    console.error(`[ERROR] Failed to generate: ${pdfPath}`);
  }
}

// 1. VOLUME CONFIGURATIONS
const volumeSpecs = [
  {
    name: "Volume_1_Textbook_v2.0",
    title: "Volume I: The Complete CKA Textbook",
    subtitle: "Mastering Kubernetes Administration, Architecture, Workloads & Scheduling (80 Chapters)",
    files: [
      "volume-1-textbook/part-1-fundamentals/01-containerization-and-architecture.md",
      "volume-1-textbook/part-1-fundamentals/02-api-yaml-kubectl-and-linux-networking.md",
      "volume-1-textbook/part-2-cluster-architecture/01-kubeadm-installation-and-lifecycle.md",
      "volume-1-textbook/part-2-cluster-architecture/02-rbac-etcd-ha-helm-kustomize.md",
      "volume-1-textbook/part-3-workloads-scheduling/01-workloads-and-lifecycle.md",
      "volume-1-textbook/part-3-workloads-scheduling/02-advanced-scheduling-and-autoscaling.md",
      "volume-1-textbook/part-4-services-networking/01-services-cni-and-dns.md",
      "volume-1-textbook/part-4-services-networking/02-ingress-gateway-api-and-network-policies.md",
      "volume-1-textbook/part-5-storage/01-storage-architecture-pv-pvc-csi.md",
      "volume-1-textbook/part-6-troubleshooting/01-methodology-workloads-nodes-and-kubelet.md",
      "volume-1-textbook/part-6-troubleshooting/02-control-plane-etcd-network-and-integrated-scenarios.md",
      "volume-1-textbook/part-7-exam-preparation/01-exam-strategy-and-environment-mastery.md",
      "volume-1-textbook/part-7-exam-preparation/02-historical-and-current-practice-review.md"
    ]
  },
  {
    name: "Volume_2_Practical_Workbook_v2.0",
    title: "Volume II: The CKA Practical Workbook",
    subtitle: "67 Hands-On Production Labs with Automated Verifications & Solutions",
    files: [
      "volume-2-practical-workbook/domain-1-cluster-architecture-labs.md",
      "volume-2-practical-workbook/domain-2-workloads-scheduling-labs.md",
      "volume-2-practical-workbook/domain-3-services-networking-labs.md",
      "volume-2-practical-workbook/domain-4-storage-labs.md",
      "volume-2-practical-workbook/domain-5-troubleshooting-labs.md"
    ]
  },
  {
    name: "Volume_3_Visual_Architecture_Atlas_v2.0",
    title: "Volume III: Visual Architecture Atlas",
    subtitle: "66 Original Technical Schematics, Packet Flows & Troubleshooting Decision Trees",
    files: [
      "volume-3-visual-atlas/01-architecture-diagrams.md",
      "volume-3-visual-atlas/02-troubleshooting-flowcharts.md"
    ]
  },
  {
    name: "Volume_4_Command_Field_Guide_v2.0",
    title: "Volume IV: Command & Troubleshooting Field Guide",
    subtitle: "Imperative CLI Recipes, JSONPath Filters & Linux Systemd Diagnostics",
    files: [
      "volume-4-field-guide/01-kubectl-and-workload-commands.md",
      "volume-4-field-guide/02-cluster-admin-and-linux-diagnostics.md"
    ]
  },
  {
    name: "Volume_5_Mock_Exams_System_v2.0",
    title: "Volume V: Proctored Mock Examination System",
    subtitle: "4 Full Certification Simulations, 73 Performance Tasks & Scoring Rubrics",
    files: [
      "volume-5-mock-exams/assessment-rubrics-and-scorecard.md",
      "volume-5-mock-exams/mock-exam-1-beginner-intermediate.md",
      "volume-5-mock-exams/mock-exam-2-intermediate-admin.md",
      "volume-5-mock-exams/mock-exam-3-advanced-troubleshooting.md",
      "volume-5-mock-exams/mock-exam-4-full-certification-simulation.md"
    ]
  },
  {
    name: "Premium_Features_Suite_v2.0",
    title: "CKA Mastery Blueprint: Premium Features Suite",
    subtitle: "Readiness Assessment, Study Plans, Flashcards, Tracker, Mistake Journal & Interview Guide",
    files: [
      "premium-features/01-cka-readiness-assessment.md",
      "premium-features/02-30-and-60-day-study-plans.md",
      "premium-features/03-command-memory-flashcards.md",
      "premium-features/04-troubleshooting-decision-trees-catalog.md",
      "premium-features/05-lab-progress-tracker.md",
      "premium-features/06-candidate-mistake-journal.md",
      "premium-features/07-kubernetes-administrator-interview-guide.md",
      "premium-features/08-quick-revision-system-and-last-7-days-plan.md"
    ]
  }
];

// 2. MASTER UNIFIED PUBLICATION SPECIFICATION
const masterFiles = [
  "AUDIT-REPORT.md",
  "RESEARCH-AND-CURRICULUM-v2.md",
  "VERSION-COMPATIBILITY-MATRIX-v2.md",
  "COMMERCIAL-PRICING-ASSESSMENT-v2.md",
  "FINAL-ACCEPTANCE-REPORT-v2.md",
  ...volumeSpecs[0].files,
  ...volumeSpecs[1].files,
  ...volumeSpecs[2].files,
  ...volumeSpecs[3].files,
  ...volumeSpecs[4].files,
  ...volumeSpecs[5].files
];

console.log("=== COMPILING VERSION 2.0 PUBLISHING ASSETS ===");

// Build Modular Volume PDFs
for (const vol of volumeSpecs) {
  let combinedMd = "";
  for (const f of vol.files) {
    const fullPath = path.join(baseDir, f);
    if (fs.existsSync(fullPath)) {
      combinedMd += fs.readFileSync(fullPath, 'utf8') + "\n\n<div class='page-break'></div>\n\n";
    } else {
      console.warn(`[WARN] File missing: ${f}`);
    }
  }
  const bodyHtml = marked.parse(combinedMd);
  const fullHtml = buildHtmlDocument(vol.title, vol.subtitle, bodyHtml);
  const htmlPath = path.join(baseDir, `${vol.name}.html`);
  const pdfPath = path.join(baseDir, `${vol.name}.pdf`);
  fs.writeFileSync(htmlPath, fullHtml, 'utf8');
  renderPdfFromHtml(htmlPath, pdfPath);
}

// Build Master Complete Edition
console.log("Compiling Master Complete Edition...");
let masterMd = "";
for (const f of masterFiles) {
  const fullPath = path.join(baseDir, f);
  if (fs.existsSync(fullPath)) {
    masterMd += fs.readFileSync(fullPath, 'utf8') + "\n\n<div class='page-break'></div>\n\n";
  }
}
const masterBodyHtml = marked.parse(masterMd);
const masterFullHtml = buildHtmlDocument(
  "THE CKA MASTERY BLUEPRINT",
  "The Complete Kubernetes Administration, Troubleshooting and Certification Preparation System (Version 2.0)",
  masterBodyHtml
);
const masterHtmlPath = path.join(baseDir, "THE_CKA_MASTERY_BLUEPRINT_v2.0_COMPLETE_EDITION.html");
const masterPdfPath = path.join(baseDir, "THE_CKA_MASTERY_BLUEPRINT_v2.0_COMPLETE_EDITION.pdf");
fs.writeFileSync(masterHtmlPath, masterFullHtml, 'utf8');
renderPdfFromHtml(masterHtmlPath, masterPdfPath);

console.log("=== VERSION 2.0 PUBLISHING COMPILATION FINISHED ===");
