const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'PublicBio.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find the start line of the video background block
// We look for: {profile.theme.backgroundType === 'video' && profile.theme.backgroundVideo && !isPlanExpired && (
let startLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("profile.theme.backgroundType === 'video' && profile.theme.backgroundVideo && !isPlanExpired")) {
    startLine = i;
    break;
  }
}

if (startLine === -1) {
  console.error('Could not find start line');
  process.exit(1);
}

console.log(`Found start line at ${startLine + 1}`);

// The block starts at startLine.
// We want to keep startLine (1033 in read) and startLine + 1 (1034: <div...>)
// The content to replace starts at startLine + 2 (1035: {extract...)
// The content ends at startLine + 71 (1104: )}) - based on line count from Read
// Let's verify the end line by looking for the overlay div
// <div className="absolute inset-0 bg-black/30" />

let endLine = -1;
for (let i = startLine + 2; i < lines.length; i++) {
  if (lines[i].includes('<div className="absolute inset-0 bg-black/30" />')) {
    endLine = i - 1; // The line before the overlay is the closing brace of the conditional we want to replace
    break;
  }
}

if (endLine === -1) {
  console.error('Could not find end line');
  process.exit(1);
}

console.log(`Found end line at ${endLine + 1}`);

// New content to insert
const newContent = `          <div className="absolute inset-0 w-full h-full">
            <ReactPlayer
              url={profile.theme.backgroundVideo}
              playing={isVideoPlaying}
              loop={true}
              muted={isVideoMuted}
              width="100%"
              height="100%"
              className="react-player"
              style={{ position: 'absolute', top: 0, left: 0 }}
              config={{
                youtube: {
                  playerVars: { showinfo: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, rel: 0, modestbranding: 1 }
                },
                vimeo: {
                  playerOptions: { background: 1, controls: false, title: false, byline: false, portrait: false }
                },
                file: {
                  attributes: {
                    style: { width: '100%', height: '100%', objectFit: 'cover' },
                    playsInline: true,
                  }
                }
              }}
              onReady={() => console.log('Video background ready')}
              onError={(e) => console.log('Video background error', e)}
            />
          </div>
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsVideoMuted(!isVideoMuted)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-sm transition-all"
              title={isVideoMuted ? "Unmute background video" : "Mute background video"}
            >
              {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsVideoPlaying(!isVideoPlaying)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-sm transition-all"
              title={isVideoPlaying ? "Pause background video" : "Play background video"}
            >
              {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>`;

// Replace lines from startLine + 2 to endLine (inclusive)
// But wait, the lines array is 0-indexed.
// splice(start, deleteCount, ...items)
// start index: startLine + 2
// delete count: endLine - (startLine + 2) + 1
const deleteCount = endLine - (startLine + 2) + 1;
lines.splice(startLine + 2, deleteCount, newContent);

fs.writeFileSync(filePath, lines.join('\n'));
console.log('File updated successfully');
