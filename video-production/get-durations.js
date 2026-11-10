const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ffprobe = 'C:\\Users\\yashs\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffprobe.exe';
const audioDir = path.join(__dirname, 'audio');
const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3')).sort();

const durations = {};
let total = 0;
files.forEach(f => {
  const filePath = path.join(audioDir, f);
  const dur = parseFloat(execSync(`"${ffprobe}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`).toString().trim());
  durations[f] = dur;
  total += dur;
  console.log(`${f}: ${dur.toFixed(2)}s`);
});
console.log(`Total Voiceover Duration: ${total.toFixed(2)}s`);
fs.writeFileSync(path.join(__dirname, 'durations.json'), JSON.stringify(durations, null, 2));
