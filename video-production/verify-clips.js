const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ffprobe = 'C:\\Users\\yashs\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffprobe.exe';
const clips = [
  'clip_01_alert.mp4',
  'clip_02_terminal.mp4',
  'clip_03_book_hero.mp4',
  'clip_04_boxset.mp4',
  'clip_05_diagrams.mp4',
  'clip_06_workbook.mp4',
  'clip_07_simulator.mp4',
  'clip_08_offer.mp4',
  'clip_09_outro.mp4'
];

let total = 0;
clips.forEach(c => {
  const p = path.join(__dirname, 'output', c);
  const dur = parseFloat(execSync(`"${ffprobe}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${p}"`).toString().trim());
  total += dur;
  console.log(`${c}: ${dur.toFixed(2)}s`);
});
console.log('Total sum of clips:', total.toFixed(2) + 's');

const vmPath = path.join(__dirname, 'output', 'video_master.mp4');
const vmDur = parseFloat(execSync(`"${ffprobe}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${vmPath}"`).toString().trim());
console.log('video_master.mp4 duration:', vmDur.toFixed(2) + 's');

const finalPath = path.join(__dirname, 'output', 'CKA_Mastery_Blueprint_Official_Commercial_1080p.mp4');
const finalDur = parseFloat(execSync(`"${ffprobe}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalPath}"`).toString().trim());
console.log('Final commercial duration:', finalDur.toFixed(2) + 's');
