import React from "react";

interface ThemeCustomizerProps {
  theme: { background: string; text: string };
  setTheme: (theme: { background: string; text: string }) => void;
  useVideoBg: boolean;
  setUseVideoBg: (v: boolean) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  theme,
  setTheme,
  useVideoBg,
  setUseVideoBg,
  videoUrl,
  setVideoUrl,
}) => {
  return (
    <div className="bg-white p-6 rounded shadow max-w-xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-2">Theme & Background</h2>
      <div className="mb-4">
        <label className="block mb-1">Background Color</label>
        <input
          type="color"
          value={theme.background}
          onChange={e => setTheme({ ...theme, background: e.target.value })}
          className="w-16 h-8 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Background Style</label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useVideoBg}
            onChange={e => setUseVideoBg(e.target.checked)}
            id="mp4-bg-toggle"
          />
          <label htmlFor="mp4-bg-toggle" className="text-sm">Use MP4 Video Background</label>
        </div>
        {useVideoBg && (
          <input
            type="text"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="MP4 video URL"
            className="border p-1 rounded text-xs w-full mt-2"
          />
        )}
        {useVideoBg && videoUrl && (
          <div className="mt-2 rounded overflow-hidden border">
            <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-32 object-cover" />
          </div>
        )}
      </div>
      <div className="mb-4">
        <label className="block mb-1">Text Color</label>
        <input
          type="color"
          value={theme.text}
          onChange={e => setTheme({ ...theme, text: e.target.value })}
          className="w-16 h-8 border rounded"
        />
      </div>
      <div className="p-4 rounded" style={{ background: theme.background, color: theme.text }}>
        <p>Preview: This is your store's theme!</p>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
