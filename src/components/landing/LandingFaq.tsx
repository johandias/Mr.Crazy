"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 1,
    question: "Preciso já saber inglês para conseguir usar o Mr. Crazy?",
    answer: "Não! O Mr. Crazy começa com você do zero se necessário. Ele orienta 100% em português brasileiro, passa frases curtas de 1 a 4 palavras para treinar o som inicial, dá o apoio fonético visual na tela e você só avança quando realmente assimilar a pronúncia."
  },
  {
    id: 2,
    question: "Como funciona o método de fala do Mr. Crazy?",
    answer: "É um ciclo dinâmico em 3 etapas: 1) O Mr. Crazy apresenta o desafio da situação em português e diz o modelo exato em inglês. 2) Você toca no microfone e fala em voz alta. 3) Nossa IA em milissegundos avalia sua resposta, faz a correção física (onde pôr a língua, lábios e dentes) e continua a conversa sem parar."
  },
  {
    id: 3,
    question: "E se eu tiver vergonha ou travar na hora de falar?",
    answer: "Essa é exatamente a razão pela qual o Mr. Crazy existe! Você pratica no seu celular, no conforto da sua casa, sem medo de ser julgado por outros alunos ou professores tradicionais. O Mr. Crazy é exigente no treino, mas é um ambiente 100% seguro para você errar quantas vezes precisar até destravar."
  },
  {
    id: 4,
    question: "O Mr. Crazy conversa de verdade ou são só frases gravadas?",
    answer: "Ele conversa de verdade em tempo real! Ele utiliza a tecnologia de ponta do OpenAI Realtime com WebRTC de altíssima velocidade. Ele escuta sua entonação, entende o significado da sua resposta, responde perguntas sobre o seu dia e faz correções fonéticas personalizadas na hora."
  },
  {
    id: 5,
    question: "Preciso instalar algum aplicativo pesado no celular?",
    answer: "Não! O Mr. Crazy roda diretamente no seu navegador (Chrome, Safari, Edge) tanto no celular quanto no computador. Você também pode clicar em 'Adicionar à tela inicial' para usá-lo como um aplicativo PWA leve e rápido, sem ocupar a memória do seu aparelho."
  },
  {
    id: 6,
    question: "Quanto tempo por dia eu preciso praticar?",
    answer: "Apenas 10 a 15 minutos de fala ativa por dia já geram mais resultados do que 2 horas de aula teórica tradicional por semana. A neurociência da fala prova que a repetição oral diária e espaçada cria a memória muscular necessária para você falar com espontaneidade."
  },
  {
    id: 7,
    question: "O que é o 'Chefão' no final dos módulos?",
    answer: "Ao terminar todas as fases de um módulo de ensino (como Restaurante ou Viagens), você encara a Prova Prática do Chefão. O examinador faz perguntas orais dinâmicas sem texto de apoio na tela. Você responde por voz, recebe nota de 0 a 10 com diagnóstico de pontos fortes e só avança de módulo quando for aprovado."
  },
  {
    id: 8,
    question: "Preciso cadastrar cartão de crédito para começar?",
    answer: "Não! O cadastro é simples, rápido e leva menos de 1 minuto. Você entra com seu e-mail e apelido e já começa a treinar imediatamente com o Mr. Crazy."
  }
];

export function LandingFaq() {
  const [openId, setOpenId] = useState<number | null>(1);

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="landing-faq-list">
      {FAQS.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className="landing-faq-item">
            <button
              type="button"
              className="landing-faq-question"
              onClick={() => toggle(faq.id)}
              aria-expanded={isOpen}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <HelpCircle size={18} className="text-amber-400" />
                {faq.question}
              </span>
              {isOpen ? (
                <ChevronUp size={18} className="text-amber-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </button>
            {isOpen && (
              <div className="landing-faq-answer">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
