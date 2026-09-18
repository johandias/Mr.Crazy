"use client";

import React, { useState } from "react";
import { Check, Copy, Volume2 } from "lucide-react";

type ConversationBubbleProps = Readonly<{
  label: string;
  children: React.ReactNode;
  tone?: "neutral" | "crazy" | "user";
  onSpeak?: () => void;
  isSpeaking?: boolean;
  isTyping?: boolean;
}>;

function formatQuotedText(text: string) {
  // Encontra citações em aspas simples, duplas ou tipográficas
  const parts = text.split(/([“"'][^”"'\n]{2,120}[”"'])/gu);
  if (parts.length <= 1) {
    return text;
  }

  return parts.map((part, index) => {
    if (/^[“"'][^”"']+[”"']$/u.test(part)) {
      return (
        <span key={index} className="quoted-english-token">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function ConversationBubble({
  label,
  children,
  tone = "neutral",
  onSpeak,
  isSpeaking = false,
  isTyping = false
}: ConversationBubbleProps) {
  const [copied, setCopied] = useState(false);

  const textContent = typeof children === "string" ? children : "";

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!textContent) return;
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignora silenciosamente se o clipboard não estiver disponível
    }
  };

  return (
    <article className={`conversation-bubble ${tone} ${isSpeaking ? "is-speaking" : ""}`}>
      <div className="bubble-header">
        <span>{label}</span>
        <div className="bubble-actions">
          {onSpeak && textContent && !isTyping && (
            <button
              type="button"
              className={`bubble-action-btn ${isSpeaking ? "playing" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSpeak();
              }}
              title={isSpeaking ? "Falando agora..." : "Ouvir esta mensagem"}
              aria-label="Ouvir áudio"
            >
              <Volume2 size={13} />
            </button>
          )}
          {textContent && !isTyping && (
            <button
              type="button"
              className="bubble-action-btn"
              onClick={handleCopy}
              title={copied ? "Copiado!" : "Copiar texto"}
              aria-label="Copiar texto"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          )}
        </div>
      </div>

      {isTyping ? (
        <div className="bubble-typing-indicator" aria-label="Mr.Crazy pensando...">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      ) : (
        <p>{typeof children === "string" ? formatQuotedText(children) : children}</p>
      )}
    </article>
  );
}
