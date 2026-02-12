
import React, { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DroplinkSpinner } from "@/components/DroplinkSpinner";

// Random options for avatar generation
const GENDERS = ["male", "female", "nonbinary"];
const AGES = [18, 25, 30, 35, 40, 45, 50, 55, 60];
const OCCUPATIONS = [
  "baker", "creator", "coder", "seller", "mompreneur", "rider", "artist", "student", "boutique owner"
];
const HAIR_STYLES = ["short fade", "curly bob", "long waves", "ponytail", "textured curls"];
const HAIR_COLORS = ["brown", "black", "blonde", "pastel pink", "purple highlights"];
const SKIN_TONES = ["light", "tan", "olive", "rich brown", "deep"];
const OUTFITS = ["hoodie", "apron", "jacket", "casual shirt", "business casual"];
const ACCESSORIES = ["glasses", "earrings", "headset", "cap", "scarf"];
const BG_GRADIENTS = [
  "linear-gradient(135deg, #d1c4e9 0%, #b3e5fc 100%)", // purple to blue
  "linear-gradient(135deg, #f8bbd0 0%, #b2dfdb 100%)", // pink to teal
  "linear-gradient(135deg, #b2dfdb 0%, #f8bbd0 100%)", // teal to pink
  "linear-gradient(135deg, #e1bee7 0%, #b3e5fc 100%)",  // purple to blue
];

const BG_SCENES = [
  "inside a cozy coffee shop",
  "in a modern tech store",
  "in a stylish boutique",
  "in a sunlit home office",
  "in a creative art studio",
  "in a trendy urban apartment",
  "in a book-filled library",
  "in a lively street market",
  "in a peaceful garden",
  "in a minimalist living room"
];

function getRandom(arr: string[] | number[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePrompt() {
  const gender = getRandom(GENDERS);
  const age = getRandom(AGES);
  const occupation = getRandom(OCCUPATIONS);
  const hairStyle = getRandom(HAIR_STYLES);
  const hairColor = getRandom(HAIR_COLORS);
  const skinTone = getRandom(SKIN_TONES);
  const outfit = getRandom(OUTFITS);
  const accessory = getRandom(ACCESSORIES);
  const bg = getRandom(BG_GRADIENTS);
  const scene = getRandom(BG_SCENES);
  return {
    prompt: `Generate a 3D stylized profile avatar character in a warm, friendly Pixar-inspired style mixed with Google Material You softness. Rounded facial features, expressive eyes, clean soft shadows, and pastel color accents. No real humans — entirely animated style.\n\nInclude random variations such as: Gender: ${gender}, Age: ${age}, Occupation: ${occupation}, Hair Style: ${hairStyle}, Hair Color: ${hairColor}, Skin Tone: ${skinTone}, Outfit: ${outfit}, Accessory: ${accessory}.\n\nBackground: ${scene}, matching the character's vibe, with soft pastel colors and a subtle Material You glow. Lighting: soft Pixar ambient light + gentle rim light. Mood: friendly, warm, welcoming. Camera: clean portrait, centered, head and shoulders. Resolution: crisp 4K.`,
    bg,
    fallback: `${gender[0].toUpperCase()}${occupation[0].toUpperCase()}`
  };
}

const buildPollinationsUrl = (prompt: string, size = 512) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size}&height=${size}&nologo=true&seed=${Date.now()}`;

export const RandomAvatarGenerator: React.FC<{
  onAvatarGenerated?: (url: string) => void;
}> = ({ onAvatarGenerated }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bg, setBg] = useState<string>(BG_GRADIENTS[0]);
  const [fallback, setFallback] = useState<string>("AV");

  const FALLBACK_IMAGE =
    "https://ui-avatars.com/api/?name=Avatar&background=random&size=128";

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    const { prompt, bg, fallback } = generatePrompt();
    setBg(typeof bg === 'string' ? bg : BG_GRADIENTS[0]);
    setFallback(fallback);
    try {
      const url = buildPollinationsUrl(prompt, 512);
      // Preload image to check for errors
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const isValidSize = img.naturalWidth >= 128 && img.naturalHeight >= 128;
        if (!isValidSize) {
          setError("Avatar image was too small. Showing fallback avatar.");
          setAvatarUrl(FALLBACK_IMAGE);
          setLoading(false);
          if (onAvatarGenerated) onAvatarGenerated(FALLBACK_IMAGE);
          return;
        }
        setAvatarUrl(url);
        setLoading(false);
        if (onAvatarGenerated) onAvatarGenerated(url);
      };
      img.onerror = () => {
        setError("Failed to generate avatar from AI. Showing fallback avatar.");
        setAvatarUrl(FALLBACK_IMAGE);
        setLoading(false);
        if (onAvatarGenerated) onAvatarGenerated(FALLBACK_IMAGE);
      };
      img.src = url;
    } catch (e) {
      setError("Error generating avatar. Showing fallback avatar.");
      setAvatarUrl(FALLBACK_IMAGE);
      setLoading(false);
      if (onAvatarGenerated) onAvatarGenerated(FALLBACK_IMAGE);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center border border-border shadow-lg bg-white/60"
        style={{ background: bg, boxShadow: "0 0 24px 0 #e0e0e0" }}
      >
        {loading ? (
          <DroplinkSpinner size={64} />
        ) : (
          <Avatar className="w-24 h-24">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="Avatar" referrerPolicy="no-referrer" />
            ) : (
              <AvatarFallback>{fallback}</AvatarFallback>
            )}
          </Avatar>
        )}
      </div>
      <Button onClick={handleGenerate} disabled={loading} variant="outline">
        {loading ? "Generating..." : "Random Avatar"}
      </Button>
      {error && (
        <div className="text-xs text-red-500 mt-1">
          {error}
        </div>
      )}
      <div className="text-xs text-muted-foreground text-center max-w-xs">
        Generates a Pixar/Material You style 3D avatar with random friendly features and pastel background.
      </div>
    </div>
  );
};
