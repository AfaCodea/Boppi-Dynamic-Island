import React, { useState, useEffect, useRef } from "react";

export type BoppiMood = "idle" | "happy" | "wink" | "groove" | "surprised" | "sleepy" | "focus";

interface Props {
  size?: number;
  className?: string;
  mood?: BoppiMood;
  interactive?: boolean;
  bubblePlacement?: "top" | "bottom";
  showBubbleOnPoke?: boolean;
  onPoke?: () => void;
}

const BOPPI_QUIPS = [
  "Bop! ✨",
  "Hello, human! ᵔ ᵕ ᵔ",
  "A little bop above your apps!",
  "♪ Vibin' to the music!",
  "Focus mode ON! (•̀ᴗ•́)و",
  "Boop! 🎈",
  "You're doing awesome! 💖",
  "100% Good Vibes ⚡",
  "Notch sweet notch! 🏡",
  "Wheee! 🫧",
];

export const BoppiAvatar: React.FC<Props> = ({
  size = 24,
  className = "",
  mood = "idle",
  interactive = false,
  bubblePlacement = "bottom",
  showBubbleOnPoke = true,
  onPoke,
}) => {
  const [currentMood, setCurrentMood] = useState<BoppiMood>(mood);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isSquishing, setIsSquishing] = useState(false);
  const [speechText, setSpeechText] = useState<string | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const quipIndexRef = useRef(0);

  // Sync prop mood
  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  // Natural spontaneous blinking when in idle/groove
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (currentMood === "idle" || currentMood === "groove") {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 160);
      }
    }, 3800 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, [currentMood]);

  const handleMascotClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();

    // Trigger squash & stretch animation
    setIsSquishing(true);
    setTimeout(() => setIsSquishing(false), 500);

    // Pick next cute quip
    const nextQuip = BOPPI_QUIPS[quipIndexRef.current % BOPPI_QUIPS.length];
    quipIndexRef.current += 1;

    // Toggle playful expression (happy squint or wink)
    const randomMoods: BoppiMood[] = ["happy", "wink", "surprised", "groove"];
    const pick = randomMoods[Math.floor(Math.random() * randomMoods.length)];
    setCurrentMood(pick);

    if (showBubbleOnPoke) {
      setSpeechText(nextQuip);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => {
        setSpeechText(null);
        setCurrentMood(mood);
      }, 2000);
    } else {
      setTimeout(() => setCurrentMood(mood), 1600);
    }

    onPoke?.();
  };

  const handleMouseEnter = () => {
    if (!interactive) return;
    if (currentMood === "idle") {
      setCurrentMood("happy");
    }
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    if (!speechText) {
      setCurrentMood(mood);
    }
  };

  return (
    <div
      className={`boppi-avatar-wrapper ${interactive ? "is-interactive" : ""} ${className}`}
      onClick={handleMascotClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={interactive ? "Klik Boppi untuk menyapa!" : "Boppi • A little bop above your apps"}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Playful Floating Speech Bubble */}
      {speechText && (
        <div className={`boppi-speech-bubble placement-${bubblePlacement}`} aria-live="polite">
          <span className="boppi-bubble-text">{speechText}</span>
          <span className="boppi-bubble-caret" />
        </div>
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`boppi-mascot-svg mood-${currentMood} ${isSquishing ? "squish-bop" : ""} ${
          currentMood === "groove" ? "groove-bop" : ""
        }`}
        aria-label="Boppi Mascot"
      >
        {/* Organic pebble body adapting to active contrast theme */}
        <path
          d="M48 10C24 10 8 28 8 54C8 78 28 92 56 92C84 92 94 72 94 46C94 20 72 10 48 10Z"
          fill="var(--boppi-body, #ffffff)"
          stroke="var(--boppi-stroke, rgba(128, 128, 140, 0.25))"
          strokeWidth="2"
        />

        {/* Ambient subtle rim highlight */}
        <path
          d="M28 20C38 13 54 12 70 18"
          stroke="var(--boppi-rim, rgba(0, 0, 0, 0.12))"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Dynamic Expressions */}
        {renderEyes(currentMood, isBlinking)}
      </svg>
    </div>
  );
};

function renderEyes(mood: BoppiMood, isBlinking: boolean) {
  if (isBlinking && (mood === "idle" || mood === "groove")) {
    return (
      <g className="boppi-eyes blinking">
        <path d="M50 44C53 45 57 45 60 44" stroke="var(--boppi-eyes, #000000)" strokeWidth="3" strokeLinecap="round" />
        <path d="M68 41C71 42 75 42 78 41" stroke="var(--boppi-eyes, #000000)" strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }

  switch (mood) {
    case "happy":
      return (
        <g className="boppi-eyes happy">
          {/* Happy squint arcs ^ ^ */}
          <path d="M49 46C52 39 58 39 61 46" stroke="var(--boppi-eyes, #000000)" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M67 43C70 36 76 36 79 43" stroke="var(--boppi-eyes, #000000)" strokeWidth="3.2" strokeLinecap="round" />
          {/* Cute rosy blush */}
          <ellipse cx="46" cy="51" rx="4.5" ry="2.2" fill="rgba(255, 105, 180, 0.55)" />
          <ellipse cx="80" cy="48" rx="4.5" ry="2.2" fill="rgba(255, 105, 180, 0.55)" />
        </g>
      );

    case "wink":
      return (
        <g className="boppi-eyes wink">
          {/* Left eye round & open with glint */}
          <circle cx="55" cy="44" r="5.5" fill="var(--boppi-eyes, #000000)" />
          <circle cx="53.5" cy="42.5" r="1.8" fill="var(--boppi-glint, #ffffff)" />
          {/* Right eye playful wink arc - */}
          <path d="M68 42C71 37 76 37 79 42" stroke="var(--boppi-eyes, #000000)" strokeWidth="3.2" strokeLinecap="round" />
          {/* Cheerful blush */}
          <ellipse cx="46" cy="51" rx="4.5" ry="2.2" fill="rgba(255, 105, 180, 0.5)" />
          <ellipse cx="80" cy="48" rx="4.5" ry="2.2" fill="rgba(255, 105, 180, 0.5)" />
        </g>
      );

    case "surprised":
      return (
        <g className="boppi-eyes surprised">
          {/* Wide excited eyes O O */}
          <ellipse cx="55" cy="44" rx="7" ry="8" fill="var(--boppi-eyes, #000000)" />
          <ellipse cx="73" cy="41" rx="7" ry="8" fill="var(--boppi-eyes, #000000)" />
          {/* Inner pupils */}
          <circle cx="56" cy="44" r="3.2" fill="var(--boppi-body, #ffffff)" />
          <circle cx="74" cy="41" r="3.2" fill="var(--boppi-body, #ffffff)" />
          {/* Glints */}
          <circle cx="54" cy="41.5" r="1.6" fill="var(--boppi-glint, #ffffff)" />
          <circle cx="72" cy="38.5" r="1.6" fill="var(--boppi-glint, #ffffff)" />
        </g>
      );

    case "focus":
      return (
        <g className="boppi-eyes focus">
          {/* Determined slant brows */}
          <line x1="49" y1="36" x2="61" y2="39" stroke="var(--boppi-eyes, #000000)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="77" y1="34" x2="66" y2="37" stroke="var(--boppi-eyes, #000000)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="55" cy="44" r="5" fill="var(--boppi-eyes, #000000)" />
          <circle cx="73" cy="41" r="5" fill="var(--boppi-eyes, #000000)" />
          <circle cx="54" cy="43" r="1.6" fill="var(--boppi-glint, #ffffff)" />
          <circle cx="72" cy="40" r="1.6" fill="var(--boppi-glint, #ffffff)" />
        </g>
      );

    case "sleepy":
      return (
        <g className="boppi-eyes sleepy">
          {/* Peaceful closed eyes _ _ */}
          <path d="M50 44C53 48 57 48 60 44" stroke="var(--boppi-eyes, #000000)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M68 41C71 45 75 45 78 41" stroke="var(--boppi-eyes, #000000)" strokeWidth="2.5" strokeLinecap="round" />
          <text x="82" y="32" fill="var(--boppi-eyes, #000000)" opacity="0.65" fontSize="9" fontWeight="600">z</text>
          <text x="88" y="24" fill="var(--boppi-eyes, #000000)" opacity="0.45" fontSize="7" fontWeight="600">z</text>
        </g>
      );

    case "groove":
    case "idle":
    default:
      return (
        <g className="boppi-eyes default">
          {/* Two bright round eyes */}
          <circle cx="55" cy="44" r="5.5" fill="var(--boppi-eyes, #000000)" />
          <circle cx="73" cy="41" r="5.5" fill="var(--boppi-eyes, #000000)" />
          {/* Highlight glints */}
          <circle cx="53.5" cy="42" r="1.8" fill="var(--boppi-glint, #ffffff)" />
          <circle cx="71.5" cy="39" r="1.8" fill="var(--boppi-glint, #ffffff)" />
        </g>
      );
  }
}
