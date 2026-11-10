const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ffmpeg = 'C:\\Users\\yashs\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const ffprobe = 'C:\\Users\\yashs\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffprobe.exe';

const baseDir = __dirname;
const scenesDir = path.join(baseDir, 'scenes');
const audioDir = path.join(baseDir, 'audio');
const outputDir = path.join(baseDir, 'output');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 9 Shots with exact durations matching the voiceover tracks
// Total duration = 9.00 + 12.53 + 11.00 + 12.18 + 11.33 + 13.44 + 10.75 + 8.59 + 8.62 = 97.44s
const shots = [
  { id: 'clip_01_alert', img: 'shot_1a_alert.png', dur: 9.00, zoomSpeed: '0.00035', maxZoom: '1.04' },
  { id: 'clip_02_terminal', img: 'shot_1b_terminal.png', dur: 12.53, zoomSpeed: '0.00015', maxZoom: '1.02' },
  { id: 'clip_03_book_hero', img: 'shot_2a_book_hero.png', dur: 11.00, zoomSpeed: '0.00040', maxZoom: '1.04' },
  { id: 'clip_04_boxset', img: 'shot_2b_boxset.png', dur: 12.18, zoomSpeed: '0.00035', maxZoom: '1.04' },
  { id: 'clip_05_diagrams', img: 'shot_3_diagrams.png', dur: 11.33, zoomSpeed: '0.00020', maxZoom: '1.025' },
  { id: 'clip_06_workbook', img: 'shot_4_workbook_fieldguide.png', dur: 13.44, zoomSpeed: '0.00020', maxZoom: '1.025' },
  { id: 'clip_07_simulator', img: 'shot_5_exam_simulator.png', dur: 10.75, zoomSpeed: '0.00015', maxZoom: '1.02' },
  { id: 'clip_08_offer', img: 'shot_6_offer_pricing.png', dur: 8.59, zoomSpeed: '0.00040', maxZoom: '1.04' },
  { id: 'clip_09_outro', img: 'shot_7_cta_outro.png', dur: 8.62, zoomSpeed: '0.00035', maxZoom: '1.035' }
];

console.log('=== STEP 1: RENDERING 1080p VIDEO CLIPS WITH CINEMATIC MOTION ===');
const clipFiles = [];
for (let i = 0; i < shots.length; i++) {
  const s = shots[i];
  const imgPath = path.join(scenesDir, s.img);
  const clipPath = path.join(outputDir, `${s.id}.mp4`);
  clipFiles.push(clipPath);

  console.log(`[${i+1}/${shots.length}] Encoding ${s.id} (${s.dur}s @ 30fps)...`);
  const filter = `scale=2560x1440,zoompan=z='min(zoom+${s.zoomSpeed},${s.maxZoom})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30`;
  const cmd = `"${ffmpeg}" -framerate 30 -loop 1 -t ${s.dur} -i "${imgPath}" -vf "${filter}" -c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p "${clipPath}" -y`;
  execSync(cmd, { stdio: 'inherit' });
}

console.log('\n=== STEP 2: CONCATENATING VIDEO STREAM ===');
const concatListFile = path.join(outputDir, 'clips.txt');
const listContent = clipFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
fs.writeFileSync(concatListFile, listContent);

const videoMaster = path.join(outputDir, 'video_master.mp4');
const concatCmd = `"${ffmpeg}" -f concat -safe 0 -i "${concatListFile}" -c copy "${videoMaster}" -y`;
console.log('Concatenating clips...');
execSync(concatCmd, { stdio: 'inherit' });

console.log('\n=== STEP 3: CONCATENATING VOICEOVER AUDIO TRACKS ===');
const voFiles = [
  'vo_01_problem.mp3',
  'vo_02_solution.mp3',
  'vo_03_diagrams.mp3',
  'vo_04_workbook_fieldguide.mp3',
  'vo_05_mock_exams.mp3',
  'vo_06_the_offer.mp3',
  'vo_07_cta_outro.mp3'
];
const voListFile = path.join(outputDir, 'vo_list.txt');
const voListContent = voFiles.map(f => `file '${path.join(audioDir, f).replace(/\\/g, '/')}'`).join('\n');
fs.writeFileSync(voListFile, voListContent);

const voMaster = path.join(outputDir, 'vo_master.mp3');
const voConcatCmd = `"${ffmpeg}" -f concat -safe 0 -i "${voListFile}" -c copy "${voMaster}" -y`;
console.log('Concatenating voiceover...');
execSync(voConcatCmd, { stdio: 'inherit' });

console.log('\n=== STEP 4: MIXING VOICEOVER WITH AMBIENT BED ===');
const ambientBed = path.join(audioDir, 'ambient_bed.aac');
const audioMaster = path.join(outputDir, 'audio_master.aac');
// Mix voiceover (volume 1.15) with ambient bed (volume 0.35)
const mixCmd = `"${ffmpeg}" -i "${voMaster}" -i "${ambientBed}" -filter_complex "[0:a]volume=1.15[a0];[1:a]volume=0.35[a1];[a0][a1]amix=inputs=2:duration=first[aout]" -map "[aout]" -c:a aac -b:a 192k "${audioMaster}" -y`;
console.log('Mixing audio master...');
execSync(mixCmd, { stdio: 'inherit' });

console.log('\n=== STEP 5: FINAL PRODUCTION MUXING ===');
const finalCommercial = path.join(outputDir, 'CKA_Mastery_Blueprint_Official_Commercial_1080p.mp4');
const muxCmd = `"${ffmpeg}" -i "${videoMaster}" -i "${audioMaster}" -c:v copy -c:a copy -movflags +faststart "${finalCommercial}" -y`;
console.log('Muxing final video...');
execSync(muxCmd, { stdio: 'inherit' });

console.log('\n=== STEP 6: VERIFYING FINAL OUTPUT ===');
const infoCmd = `"${ffprobe}" -v error -show_entries format=duration,size,bit_rate -show_streams -of json "${finalCommercial}"`;
const info = JSON.parse(execSync(infoCmd).toString());

const duration = parseFloat(info.format.duration);
const sizeMB = (parseInt(info.format.size) / (1024 * 1024)).toFixed(2);
const videoStream = info.streams.find(s => s.codec_type === 'video');
const audioStream = info.streams.find(s => s.codec_type === 'audio');

console.log('\n******************************************************************');
console.log('🎬 CKA MASTERY BLUEPRINT COMMERCIAL PRODUCTION COMPLETE!');
console.log('******************************************************************');
console.log(`Output File: ${finalCommercial}`);
console.log(`Resolution:  ${videoStream.width}x${videoStream.height} (1080p Full HD)`);
console.log(`Framerate:   ${videoStream.r_frame_rate} fps`);
console.log(`Duration:    ${duration.toFixed(2)} seconds (${Math.floor(duration/60)}m ${Math.floor(duration%60)}s)`);
console.log(`File Size:   ${sizeMB} MB`);
console.log(`Audio Codec: ${audioStream.codec_name} (${audioStream.sample_rate} Hz, ${audioStream.channels} ch)`);
console.log('******************************************************************\n');
