"use client";

import React from "react";

interface MrCrazyCharacterProps {
  mode?: "standing" | "avatar" | "fortress";
  size?: number;
  animated?: boolean;
  speechBubble?: string;
  className?: string;
  onClick?: () => void;
}

export function MrCrazyCharacter({
  mode = "standing",
  size = 48,
  animated = true,
  speechBubble,
  className = "",
  onClick
}: MrCrazyCharacterProps) {
  const imgSrc =
    mode === "avatar"
      ? "/assets/character/mr_crazy_avatar_clean.png"
      : "/assets/character/mr_crazy_full_clean.png";

  return (
    <div
      className={`mr-crazy-character-wrap mode-${mode} ${animated ? "is-animated" : ""} ${className}`}
      onClick={onClick}
      style={{ "--char-size": `${size}px` } as React.CSSProperties}
    >
      {speechBubble && (
        <div className="char-speech-bubble animate-bounce-subtle">
          <span>{speechBubble}</span>
          <div className="bubble-arrow" />
        </div>
      )}

      <div className="char-sprite-box">
        <img
          src={imgSrc}
          alt="Mr.Crazy Pixel Art"
          className="char-pixel-img"
          draggable={false}
          style={{ width: `${size}px`, height: "auto" }}
        />
        {animated && mode === "standing" && (
          <div className="char-ground-shadow" />
        )}
      </div>
    </div>
  );
}

