const { EdgeTTS } = require('node-edge-tts');
const path = require('path');
const fs = require('fs');

const audioDir = path.join(__dirname, 'audio');

const segments = [
  {
    id: 'vo_01_problem',
    text: "In Kubernetes, when a production Pod drops into CrashLoopBackOff, or a critical node goes NotReady right before release, you can't guess. On the Certified Kubernetes Administrator exam, Troubleshooting accounts for thirty percent of your total score. And in that two-hour terminal session, hesitation is what fails candidates."
  },
  {
    id: 'vo_02_solution',
    text: "That's why we engineered The CKA Mastery Blueprint. Built specifically for the 2026 and 2027 official curriculum, targeting Kubernetes v1.31 and v1.32 with full forward compatibility. It's not a generic study guide. It's an integrated, five-volume practical engineering system."
  },
  {
    id: 'vo_03_diagrams',
    text: "Inside, you get sixty-six original architectural schematics and systematic decision trees that guide you step-by-step through failure recovery, from etcd quorum loss to gateway routing."
  },
  {
    id: 'vo_04_workbook_fieldguide',
    text: "Sixty-seven hands-on production labs with exact verification commands, and a dedicated Command Field Guide completely free of deprecated syntax, teaching modern rollout annotations and Linux diagnostics."
  },
  {
    id: 'vo_05_mock_exams',
    text: "Plus, four full proctored mock exams that simulate the exact PSI remote desktop environment with automated testing harnesses, so you build true command-line speed."
  },
  {
    id: 'vo_06_the_offer',
    text: "Get the complete five-volume bundle, the hands-on lab repository, and the premium study suite today for just fifteen dollars."
  },
  {
    id: 'vo_07_cta_outro',
    text: "Master Kubernetes administration. Pass on your very first attempt. Download your copy now at Gumroad."
  }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateSegment(seg) {
  const outFile = path.join(audioDir, `${seg.id}.mp3`);
  if (fs.existsSync(outFile) && fs.statSync(outFile).size > 5000) {
    console.log(`Skipping existing ${seg.id}.mp3`);
    return;
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const tts = new EdgeTTS({
        voice: 'en-US-ChristopherNeural',
        rate: '-3%',
        pitch: '+0Hz'
      });
      console.log(`Generating ${seg.id} (attempt ${attempt})...`);
      await tts.ttsPromise(seg.text, outFile);
      const stat = fs.statSync(outFile);
      console.log(`  -> Generated: ${seg.id}.mp3 (${stat.size} bytes)`);
      return;
    } catch (err) {
      console.warn(`  Attempt ${attempt} failed: ${err.message}. Retrying in ${attempt * 3}s...`);
      await sleep(attempt * 3000);
    }
  }
  throw new Error(`Failed to generate ${seg.id} after 4 attempts`);
}

async function generateAll() {
  console.log("Synthesizing voiceover audio tracks...");
  for (const seg of segments) {
    await generateSegment(seg);
    await sleep(2000); // 2 second pause to prevent 429
  }
  console.log("All voiceover audio tracks ready!");
}

generateAll().catch(err => {
  console.error("Audio generation failed:", err);
  process.exit(1);
});
