"use client";

import React from "react";

export function ProgrammaticArchipelagoTerrain() {
  return (
    <div className="programmatic-archipelago-wrap" aria-hidden="true">
      <svg
        className="archipelago-svg-canvas"
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ================================================================
              GRADIENTES E FILTROS DE ILUMINAÇÃO
              ================================================================ */}
          {/* Oceano Profundo */}
          <radialGradient id="oceanRadial" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0B1C2D" />
            <stop offset="40%" stopColor="#071422" />
            <stop offset="80%" stopColor="#040A12" />
            <stop offset="100%" stopColor="#020509" />
          </radialGradient>

          {/* Águas Costeiras com Iluminação Turquesa */}
          <linearGradient id="shallowWaterGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.25)" />
            <stop offset="100%" stopColor="rgba(6, 78, 59, 0.15)" />
          </linearGradient>

          {/* Platôs de Grama Isométrica */}
          <linearGradient id="grassPlatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E4D38" />
            <stop offset="50%" stopColor="#163A2A" />
            <stop offset="100%" stopColor="#0E281D" />
          </linearGradient>

          <linearGradient id="grassHighGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#28684A" />
            <stop offset="60%" stopColor="#1C4B35" />
            <stop offset="100%" stopColor="#123525" />
          </linearGradient>

          {/* Paredões de Rocha / Penhasco Isométrico */}
          <linearGradient id="cliffRockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#222B35" />
            <stop offset="40%" stopColor="#182028" />
            <stop offset="80%" stopColor="#10151B" />
            <stop offset="100%" stopColor="#0A0E13" />
          </linearGradient>

          <linearGradient id="cliffHighlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Asfalto da Pista e Rodovias */}
          <linearGradient id="roadAsphaltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2B3642" />
            <stop offset="100%" stopColor="#1A222B" />
          </linearGradient>

          {/* Telhados da Vila (Etapa 1) */}
          <linearGradient id="roofWoodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9A562B" />
            <stop offset="50%" stopColor="#783F1D" />
            <stop offset="100%" stopColor="#502810" />
          </linearGradient>

          {/* Paredes de Madeira */}
          <linearGradient id="woodWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A3B32" />
            <stop offset="100%" stopColor="#2E241E" />
          </linearGradient>

          {/* Vidros de Janelas Iluminadas (Luz Âmbar Acolhedora) */}
          <radialGradient id="windowWarmGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>

          {/* Arranha-céus (Etapa 6) */}
          <linearGradient id="skyscraperGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>

          <linearGradient id="skyscraperGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="15%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#071E33" />
          </linearGradient>

          {/* Cidadela do Mr. Crazy (Etapa 7) */}
          <linearGradient id="citadelStoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Glow Filtros */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="goldGlowBig" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="16" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="blueNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ================================================================
            1. FUNDO DO OCEANO E ONDULAÇÕES MARÍTIMAS VIVAS
            ================================================================ */}
        <rect x="0" y="0" width="1440" height="720" fill="url(#oceanRadial)" />

        {/* Brilhos de Luz e Refratários Marítimos */}
        <ellipse cx="720" cy="400" rx="680" ry="290" fill="url(#shallowWaterGlow)" />
        <ellipse cx="260" cy="380" rx="280" ry="180" fill="rgba(14, 165, 233, 0.08)" />
        <ellipse cx="1060" cy="380" rx="340" ry="210" fill="rgba(14, 165, 233, 0.07)" />

        {/* Ondulações de Água Animadas no Mar Aberto */}
        <g className="animated-ocean-waves">
          <path
            d="M 50 120 Q 140 105 230 120 T 410 120 T 590 120"
            stroke="rgba(56, 189, 248, 0.18)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="16 28"
          />
          <path
            d="M 680 160 Q 770 145 860 160 T 1040 160 T 1220 160"
            stroke="rgba(56, 189, 248, 0.14)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="20 32"
          />
          <path
            d="M 120 620 Q 220 605 320 620 T 520 620 T 720 620"
            stroke="rgba(56, 189, 248, 0.16)"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="22 36"
          />
          <path
            d="M 850 630 Q 960 615 1070 630 T 1280 630"
            stroke="rgba(56, 189, 248, 0.18)"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="24 40"
          />
        </g>

        {/* Barco a vela animado balançando na água */}
        <g className="scenery-sailboat" transform="translate(940, 560)">
          {/* Sombra na água */}
          <ellipse cx="0" cy="18" rx="20" ry="6" fill="rgba(0, 0, 0, 0.5)" filter="blur(2px)" />
          {/* Casco */}
          <path d="M -16 12 L 16 12 L 11 19 L -11 19 Z" fill="#78350F" stroke="#B45309" strokeWidth="1" />
          {/* Mastro */}
          <line x1="0" y1="12" x2="0" y2="-12" stroke="#D97706" strokeWidth="2" />
          {/* Vela Branca */}
          <path d="M 0 -10 L 14 6 L 0 6 Z" fill="#F8FAFC" opacity="0.9" />
          <path d="M -1 -8 L -10 6 L -1 6 Z" fill="#CBD5E1" opacity="0.8" />
        </g>

        {/* ================================================================
            2. CAMADAS DE PENHASCOS E PLATÔS DAS 7 ILHAS (BASE ISOMÉTRICA)
            ================================================================ */}

        {/* ----------------------------------------------------------------
            ILHA 1 & 2: VILA INICIAL & RESTAURANTE/CAFÉ (Oeste / Sudoeste)
            ---------------------------------------------------------------- */}
        <g id="island-cluster-west">
          {/* Sombra da massa rochosa oeste no mar */}
          <path
            d="M 70 540 C 90 620, 280 640, 480 570 C 560 540, 520 440, 470 380 C 440 320, 380 260, 280 230 C 180 200, 100 240, 60 320 C 30 380, 50 460, 70 540 Z"
            fill="rgba(0, 0, 0, 0.6)"
            filter="blur(16px)"
          />

          {/* Penhasco Baixo - Costão Rochoso Escuro */}
          <path
            d="M 60 480 L 100 560 L 180 590 L 300 580 L 400 540 L 470 480 L 480 430 L 430 400 L 380 420 L 260 440 L 160 430 L 90 440 Z"
            fill="url(#cliffRockGrad)"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* Detalhes de estratificação da rocha */}
          <path d="M 100 560 L 120 490 M 180 590 L 195 510 M 300 580 L 310 490 M 400 540 L 405 460" stroke="#0F172A" strokeWidth="2.5" />

          {/* Platô Gramado Baixo da Vila 1 (Greetings & Introductions) */}
          <path
            d="M 80 440 C 110 420, 160 420, 240 430 C 320 440, 390 420, 430 395 C 460 375, 430 340, 370 345 C 310 350, 250 360, 190 355 C 130 350, 90 370, 70 410 Z"
            fill="url(#grassPlatGrad)"
            stroke="#34D399"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* Penhasco Alto da Colina do Café (Etapa 2) */}
          <path
            d="M 180 355 L 260 360 L 380 345 L 430 310 L 440 260 L 390 230 L 310 220 L 230 235 L 170 270 L 160 315 Z"
            fill="url(#cliffRockGrad)"
            stroke="#263342"
            strokeWidth="2"
          />
          {/* Platô Superior do Restaurante & Café (Etapa 2) */}
          <path
            d="M 190 310 C 230 295, 290 290, 360 295 C 410 300, 430 270, 410 245 C 390 225, 330 215, 260 225 C 200 235, 170 260, 190 310 Z"
            fill="url(#grassHighGrad)"
            stroke="#6EE7B7"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />

          {/* Espuma bioluminescente na borda da praia/falésia */}
          <path
            d="M 65 485 C 95 565, 180 595, 300 585 C 400 545, 470 485, 480 435"
            fill="none"
            stroke="rgba(56, 189, 248, 0.45)"
            strokeWidth="3"
            strokeDasharray="8 6"
            className="animated-shore-foam"
          />
        </g>

        {/* ----------------------------------------------------------------
            ILHA 3: CENTRO COMERCIAL (Shopping & Daily Life - Sul Central)
            ---------------------------------------------------------------- */}
        <g id="island-shopping-valley">
          <path
            d="M 460 610 C 490 660, 640 660, 710 610 C 760 570, 750 490, 680 450 C 600 410, 520 420, 470 470 C 430 510, 430 560, 460 610 Z"
            fill="rgba(0, 0, 0, 0.55)"
            filter="blur(14px)"
          />
          {/* Rocha */}
          <path
            d="M 470 560 L 520 620 L 630 625 L 700 585 L 720 530 L 690 480 L 630 460 L 550 465 L 480 500 Z"
            fill="url(#cliffRockGrad)"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* Platô Comercial com Pavimentação de Paralelepípedos */}
          <path
            d="M 490 520 C 530 490, 600 480, 670 495 C 700 505, 700 540, 660 565 C 620 590, 550 590, 510 575 C 475 560, 465 535, 490 520 Z"
            fill="#1E293B"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          {/* Calçamento / Praça de Compras */}
          <ellipse cx="585" cy="535" rx="75" ry="32" fill="#293544" />
        </g>

        {/* ----------------------------------------------------------------
            ILHA 4: PLATÔ DO AEROPORTO INTERNACIONAL (Norte Central)
            ---------------------------------------------------------------- */}
        <g id="island-airport-plateau">
          <path
            d="M 640 370 C 670 430, 860 410, 940 350 C 990 310, 970 230, 890 190 C 810 160, 710 170, 660 210 C 610 250, 610 320, 640 370 Z"
            fill="rgba(0, 0, 0, 0.6)"
            filter="blur(16px)"
          />
          {/* Penhasco Alto Moderno */}
          <path
            d="M 660 330 L 730 385 L 850 380 L 930 335 L 940 270 L 900 220 L 790 190 L 700 210 L 650 260 Z"
            fill="url(#cliffRockGrad)"
            stroke="#334155"
            strokeWidth="2"
          />
          {/* Base de Concreto da Pista de Aviação */}
          <polygon points="675,280 810,215 920,240 780,335" fill="url(#roadAsphaltGrad)" stroke="#475569" strokeWidth="1.5" />
        </g>

        {/* ----------------------------------------------------------------
            ILHA 5: PRAÇA CENTRAL & FONTE (Intermediate - Centro-Leste)
            ---------------------------------------------------------------- */}
        <g id="island-plaza-fountain">
          <path
            d="M 830 580 C 870 630, 1010 630, 1070 580 C 1120 540, 1100 460, 1040 420 C 970 380, 890 400, 850 440 C 810 480, 800 540, 830 580 Z"
            fill="rgba(0, 0, 0, 0.55)"
            filter="blur(14px)"
          />
          {/* Falésia */}
          <path
            d="M 840 520 L 890 585 L 1000 580 L 1060 535 L 1065 470 L 1020 430 L 940 425 L 860 450 Z"
            fill="url(#cliffRockGrad)"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* Gramado e Praça Circular */}
          <path
            d="M 860 475 C 900 445, 980 445, 1035 465 C 1055 480, 1045 520, 1010 545 C 970 565, 900 565, 870 545 C 840 525, 840 495, 860 475 Z"
            fill="url(#grassPlatGrad)"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          {/* Praça de paralelepípedos */}
          <ellipse cx="945" cy="505" rx="60" ry="28" fill="#263445" />
        </g>

        {/* ----------------------------------------------------------------
            ILHA 6 & 7: METRÓPOLE CORPORATIVA & CIDADELA FINAL (Leste / Nordeste)
            ---------------------------------------------------------------- */}
        <g id="island-cluster-east">
          <path
            d="M 1030 500 C 1070 580, 1260 590, 1370 520 C 1440 470, 1440 320, 1380 230 C 1320 160, 1180 160, 1100 200 C 1030 240, 1000 320, 1010 410 C 1010 460, 1020 480, 1030 500 Z"
            fill="rgba(0, 0, 0, 0.65)"
            filter="blur(18px)"
          />
          {/* Grandes Paredões Montanhosos */}
          <path
            d="M 1040 450 L 1100 535 L 1220 545 L 1340 505 L 1380 435 L 1390 310 L 1340 210 L 1230 185 L 1130 210 L 1050 280 L 1030 370 Z"
            fill="url(#cliffRockGrad)"
            stroke="#334155"
            strokeWidth="2.5"
          />

          {/* Platô Metropolitano (Etapa 6 - Advanced Communication) */}
          <path
            d="M 1060 340 C 1100 300, 1180 290, 1240 310 C 1270 325, 1265 370, 1225 395 C 1175 420, 1110 415, 1070 395 C 1040 375, 1040 355, 1060 340 Z"
            fill="#131D28"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />

          {/* Pico Supremo da Cidadela / Castelo (Etapa 7 - Final Boss Stage) */}
          <path
            d="M 1220 320 L 1280 280 L 1360 295 L 1375 350 L 1350 430 L 1280 445 L 1235 410 Z"
            fill="url(#cliffRockGrad)"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          <path
            d="M 1245 365 C 1275 335, 1340 330, 1365 355 C 1375 375, 1355 415, 1320 425 C 1285 435, 1250 420, 1235 395 C 1230 380, 1235 375, 1245 365 Z"
            fill="url(#citadelStoneGrad)"
            stroke="#FBBF24"
            strokeWidth="2"
          />
        </g>

        {/* ================================================================
            3. PONTES SUSPENSAS E ARCOS DE CONEXÃO ENTRE AS ILHAS
            ================================================================ */}
        <g id="scenery-bridges">
          {/* Ponte de Madeira: Ilha 1 para Ilha 2 */}
          <path d="M 230 395 C 240 380, 235 360, 230 345" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
          <path d="M 230 395 C 240 380, 235 360, 230 345" stroke="#B45309" strokeWidth="5" strokeDasharray="3 3" />

          {/* Ponte de Pedra em Arco: Ilha 2 descendo para Ilha 3 */}
          <path d="M 375 345 C 430 380, 460 450, 495 495" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />
          <path d="M 375 345 C 430 380, 460 450, 495 495" stroke="#64748B" strokeWidth="6" strokeDasharray="6 3" />

          {/* Viaduto Moderno: Ilha 3 subindo para Aeroporto 4 */}
          <path d="M 640 480 C 670 430, 680 370, 715 325" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
          <path d="M 640 480 C 670 430, 680 370, 715 325" stroke="#38BDF8" strokeWidth="3" strokeDasharray="8 4" filter="url(#blueNeonGlow)" />

          {/* Passarela / Viaduto Suspenso: Aeroporto 4 para Praça 5 */}
          <path d="M 830 360 C 860 400, 875 435, 900 465" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />
          <path d="M 830 360 C 860 400, 875 435, 900 465" stroke="#94A3B8" strokeWidth="5" />

          {/* Ponte de Ferro / Arquitetônica: Praça 5 para Metrópole 6 */}
          <path d="M 1005 480 C 1045 460, 1060 420, 1085 385" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
          <path d="M 1005 480 C 1045 460, 1060 420, 1085 385" stroke="#F59E0B" strokeWidth="3" strokeDasharray="6 3" />

          {/* Grande Ponte Suspensa para a Cidadela 7 */}
          <path d="M 1210 385 C 1235 375, 1250 370, 1270 380" stroke="#78350F" strokeWidth="10" strokeLinecap="round" />
          <path d="M 1210 385 C 1235 375, 1250 370, 1270 380" stroke="#FBBF24" strokeWidth="4" strokeDasharray="4 2" />
        </g>

        {/* ================================================================
            4. EDIFÍCIOS VETORIAIS E MARCOS VISUAIS DOS 7 BIOMAS
            ================================================================ */}

        {/* ----------------------------------------------------------------
            BIOMA 1: VILA INICIAL COM CASINHAS E FOGUEIRA VIVA
            ---------------------------------------------------------------- */}
        <g id="landmark-village-1" transform="translate(140, 385)">
          {/* Casinha 1 (Esquerda) */}
          <g transform="translate(-40, 10)">
            {/* Sombra */}
            <polygon points="-5,35 45,35 55,20 5,20" fill="rgba(0,0,0,0.4)" />
            {/* Parede frontal */}
            <polygon points="0,15 30,15 30,35 0,35" fill="url(#woodWallGrad)" stroke="#1F1611" strokeWidth="1" />
            {/* Parede lateral isométrica */}
            <polygon points="30,15 48,6 48,24 30,35" fill="#3D2E26" />
            {/* Telhado inclinado frontal */}
            <polygon points="-4,15 15,-2 34,15" fill="url(#roofWoodGrad)" stroke="#502810" strokeWidth="1" />
            {/* Telhado lateral inclinado */}
            <polygon points="15,-2 52,-10 48,6 34,15" fill="#6B3718" />
            {/* Porta de madeira */}
            <rect x="11" y="24" width="8" height="11" fill="#1C140E" rx="1" />
            {/* Janelinha com Luz Acolhedora Acesa */}
            <rect x="5" y="18" width="5" height="5" fill="url(#windowWarmGlow)" filter="url(#softGlow)" />
            {/* Chaminé com fumaça */}
            <rect x="36" y="-6" width="4" height="10" fill="#4B5563" />
          </g>

          {/* Casinha 2 (Direita) */}
          <g transform="translate(45, -5)">
            <polygon points="0,15 32,15 32,36 0,36" fill="url(#woodWallGrad)" stroke="#1F1611" strokeWidth="1" />
            <polygon points="32,15 50,6 50,26 32,36" fill="#3D2E26" />
            <polygon points="-4,15 16,-4 36,15" fill="url(#roofWoodGrad)" stroke="#502810" strokeWidth="1" />
            <polygon points="16,-4 54,-12 50,6 36,15" fill="#6B3718" />
            <rect x="12" y="24" width="8" height="12" fill="#1C140E" rx="1" />
            <rect x="6" y="18" width="5" height="5" fill="url(#windowWarmGlow)" filter="url(#softGlow)" />
            <rect x="22" y="18" width="5" height="5" fill="url(#windowWarmGlow)" filter="url(#softGlow)" />
          </g>

          {/* Fogueira Acesa com Chamas Animadas */}
          <g className="animated-campfire" transform="translate(25, 42)">
            {/* Pedras ao redor */}
            <ellipse cx="0" cy="4" rx="12" ry="6" fill="#1F2937" stroke="#374151" strokeWidth="1" />
            {/* Brasas e Troncos */}
            <line x1="-8" y1="4" x2="8" y2="4" stroke="#78350F" strokeWidth="2.5" />
            <line x1="-5" y1="2" x2="5" y2="6" stroke="#451A03" strokeWidth="2" />
            {/* Chamas Vivas */}
            <path
              className="flame-core"
              d="M -5 3 Q 0 -12 2 -4 Q 5 -14 0 -18 Q -7 -10 -5 3 Z"
              fill="url(#goldCrownGrad)"
              filter="url(#softGlow)"
            />
            {/* Fagolhas / Centelhas subindo */}
            <circle cx="-2" cy="-18" r="1.2" fill="#FEF08A" className="campfire-spark-1" />
            <circle cx="3" cy="-22" r="1" fill="#F59E0B" className="campfire-spark-2" />
          </g>

          {/* Placa de Madeira: "START YOUR JOURNEY" */}
          <g transform="translate(-75, 55)">
            <line x1="8" y1="0" x2="8" y2="16" stroke="#502810" strokeWidth="2.5" />
            <rect x="-8" y="-12" width="50" height="15" fill="#783F1D" rx="2" stroke="#B45309" strokeWidth="1" />
            <text x="17" y="-2" fill="#FEF08A" fontSize="5.5" fontWeight="800" textAnchor="middle" letterSpacing="0.5">
              START
            </text>
            <text x="17" y="2" fill="#FBBF24" fontSize="4" fontWeight="700" textAnchor="middle">
              YOUR JOURNEY →
            </text>
          </g>

          {/* Pinheiros Isométricos */}
          <g transform="translate(-80, 0)">
            <polygon points="10,20 0,35 20,35" fill="#143826" />
            <polygon points="10,12 2,24 18,24" fill="#1B4D34" />
            <polygon points="10,4 4,14 16,14" fill="#28684A" />
          </g>
          <g transform="translate(100, 20)">
            <polygon points="10,20 0,35 20,35" fill="#143826" />
            <polygon points="10,12 2,24 18,24" fill="#1B4D34" />
            <polygon points="10,4 4,14 16,14" fill="#28684A" />
          </g>
        </g>

        {/* ----------------------------------------------------------------
            BIOMA 2: RESTAURANTE & CAFÉ BISTRÔ COM VAPOR ANIMADO
            ---------------------------------------------------------------- */}
        <g id="landmark-cafe-2" transform="translate(345, 255)">
          {/* Edifício do Bistrô */}
          <polygon points="0,20 50,20 50,55 0,55" fill="#261E1A" stroke="#161210" strokeWidth="1" />
          <polygon points="50,20 75,6 75,40 50,55" fill="#1A1411" />
          {/* Telhado Clássico */}
          <polygon points="-6,20 25,-4 56,20" fill="#991B1B" stroke="#7F1D1D" strokeWidth="1" />
          <polygon points="25,-4 80,-16 75,6 56,20" fill="#7F1D1D" />

          {/* Toldo Listrado da Varanda */}
          <polygon points="-2,28 52,28 48,36 -6,36" fill="#F59E0B" />
          <line x1="8" y1="28" x2="4" y2="36" stroke="#B45309" strokeWidth="3" />
          <line x1="22" y1="28" x2="18" y2="36" stroke="#B45309" strokeWidth="3" />
          <line x1="36" y1="28" x2="32" y2="36" stroke="#B45309" strokeWidth="3" />

          {/* Letreiro Neon: "Café" */}
          <rect x="8" y="10" width="34" height="10" fill="#181311" rx="2" stroke="#F59E0B" strokeWidth="1" />
          <text x="25" y="18" fill="#FDE68A" fontSize="7" fontWeight="900" textAnchor="middle" fontStyle="italic" filter="url(#softGlow)">
            Café
          </text>

          {/* XÍCARA DE CAFÉ GIGANTE NO TELHADO COM VAPOR ANIMADO */}
          <g className="steaming-cup-group" transform="translate(62, -8)">
            {/* Pires e Xícara */}
            <ellipse cx="0" cy="6" rx="12" ry="3.5" fill="#E2E8F0" />
            <path d="M -9 5 C -9 11, 9 11, 9 5 L 7 -4 L -7 -4 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
            {/* Asa da xícara */}
            <path d="M 7 -2 C 12 -2, 12 4, 7 4" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
            {/* Café Escuro Dentro */}
            <ellipse cx="0" cy="-3.5" rx="6.5" ry="2" fill="#451A03" />

            {/* Fumaça / Vapor Animado Subindo */}
            <path
              className="animated-steam steam-1"
              d="M -3 -6 C -6 -14, 0 -18, -2 -26"
              fill="none"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              className="animated-steam steam-2"
              d="M 2 -6 C 5 -14, -1 -20, 2 -28"
              fill="none"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>

          {/* Mesinhas de Rua com Guarda-sóis */}
          <g transform="translate(-30, 45)">
            <ellipse cx="0" cy="5" rx="8" ry="3.5" fill="#334155" />
            <circle cx="0" cy="-4" r="8" fill="#D97706" />
          </g>
          <g transform="translate(-10, 52)">
            <ellipse cx="0" cy="5" rx="8" ry="3.5" fill="#334155" />
            <circle cx="0" cy="-4" r="8" fill="#F59E0B" />
          </g>
        </g>

        {/* ----------------------------------------------------------------
            BIOMA 3: SHOPPING & CENTRO COMERCIAL COM NEON E POSTES
            ---------------------------------------------------------------- */}
        <g id="landmark-shopping-3" transform="translate(560, 480)">
          {/* Loja Principal */}
          <polygon points="0,20 60,20 60,65 0,65" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
          <polygon points="60,20 85,6 85,50 60,65" fill="#0F172A" />
          {/* Telhado Plano Moderno */}
          <polygon points="-4,20 25,2 89,6 60,20" fill="#334155" />

          {/* Vitrines Grandes Iluminadas */}
          <rect x="8" y="32" width="20" height="26" fill="url(#windowWarmGlow)" rx="1" filter="url(#softGlow)" />
          <rect x="32" y="32" width="20" height="26" fill="url(#windowWarmGlow)" rx="1" filter="url(#softGlow)" />

          {/* Letreiro Neon Pulsante "SHOP" */}
          <g className="animated-neon-shop" transform="translate(30, 10)">
            <rect x="-24" y="-8" width="48" height="15" fill="#0B0F17" rx="3" stroke="#F59E0B" strokeWidth="1.5" />
            <text x="0" y="3" fill="#FBBF24" fontSize="9.5" fontWeight="900" textAnchor="middle" letterSpacing="1.2" filter="url(#softGlow)">
              SHOP
            </text>
          </g>

          {/* Loja 24h ao lado */}
          <g transform="translate(-45, 12)">
            <polygon points="0,15 35,15 35,45 0,45" fill="#161E28" />
            <polygon points="35,15 50,6 50,35 35,45" fill="#0B1017" />
            <rect x="6" y="24" width="22" height="16" fill="rgba(56, 189, 248, 0.35)" stroke="#38BDF8" strokeWidth="0.8" />
            <text x="17" y="20" fill="#38BDF8" fontSize="5" fontWeight="800" textAnchor="middle">
              24h MARKET
            </text>
          </g>

          {/* Postes de Iluminação de Rua com Cone de Luz */}
          <g transform="translate(-10, 68)">
            <line x1="0" y1="0" x2="0" y2="-18" stroke="#64748B" strokeWidth="2" />
            <path d="M 0 -18 Q 4 -22 6 -18" fill="none" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="6" cy="-18" r="2.5" fill="#FEF08A" filter="url(#softGlow)" />
            {/* Cone de luz no chão */}
            <ellipse cx="6" cy="2" rx="14" ry="6" fill="rgba(254, 240, 138, 0.18)" />
          </g>
          <g transform="translate(75, 55)">
            <line x1="0" y1="0" x2="0" y2="-18" stroke="#64748B" strokeWidth="2" />
            <circle cx="0" cy="-18" r="2.5" fill="#FEF08A" filter="url(#softGlow)" />
            <ellipse cx="0" cy="2" rx="14" ry="6" fill="rgba(254, 240, 138, 0.18)" />
          </g>
        </g>

        {/* ----------------------------------------------------------------
            BIOMA 4: AEROPORTO INTERNACIONAL COM RADAR E PISTA
            ---------------------------------------------------------------- */}
        <g id="landmark-airport-4" transform="translate(775, 260)">
          {/* Terminal do Aeroporto */}
          <polygon points="0,20 70,20 70,60 0,60" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
          <polygon points="70,20 105,6 105,45 70,60" fill="#0F172A" />
          {/* Letreiro Iluminado: "AIRPORT" */}
          <rect x="8" y="10" width="54" height="12" fill="#0284C7" rx="2" stroke="#38BDF8" strokeWidth="1.2" />
          <text x="35" y="19" fill="#FFFFFF" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="1" filter="url(#softGlow)">
            AIRPORT
          </text>
          {/* Janelas de Vidro do Terminal */}
          <rect x="6" y="28" width="58" height="16" fill="rgba(56, 189, 248, 0.35)" stroke="#38BDF8" strokeWidth="0.8" />

          {/* Torre de Controle com Radar Giratório */}
          <g transform="translate(-30, -10)">
            {/* Coluna da torre */}
            <polygon points="-6,15 12,15 9,55 -3,55" fill="#334155" stroke="#1E293B" strokeWidth="1" />
            {/* Sala envidraçada panorâmica */}
            <rect x="-10" y="2" width="26" height="14" fill="#0284C7" rx="3" stroke="#38BDF8" strokeWidth="1.2" filter="url(#softGlow)" />
            {/* Cúpula do teto */}
            <polygon points="-12,2 3,-6 18,2" fill="#475569" />
            {/* Radar Giratório Animado */}
            <g className="animated-airport-radar" transform="translate(3, -9)">
              <line x1="0" y1="0" x2="0" y2="-6" stroke="#94A3B8" strokeWidth="2" />
              <ellipse cx="0" cy="-6" rx="7" ry="2.5" fill="#F8FAFC" stroke="#0284C7" strokeWidth="1" />
              <line x1="0" y1="-6" x2="4" y2="-10" stroke="#38BDF8" strokeWidth="1.5" />
            </g>
          </g>

          {/* Avião de Passageiros Estacionado na Pista */}
          <g transform="translate(60, 45) rotate(-18)">
            {/* Sombra no asfalto */}
            <ellipse cx="0" cy="12" rx="28" ry="8" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            {/* Fuselagem */}
            <ellipse cx="0" cy="0" rx="32" ry="7" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
            {/* Asas */}
            <polygon points="-6,-4 18,-24 10,-4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
            <polygon points="-6,4 18,24 10,4" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.8" />
            {/* Cauda Azul */}
            <polygon points="-28,-2 -36,-14 -22,-2" fill="#0284C7" stroke="#0369A1" strokeWidth="0.8" />
            {/* Janelinhas */}
            <circle cx="-10" cy="-1" r="1" fill="#0F172A" />
            <circle cx="-5" cy="-1" r="1" fill="#0F172A" />
            <circle cx="0" cy="-1" r="1" fill="#0F172A" />
            <circle cx="5" cy="-1" r="1" fill="#0F172A" />
            <circle cx="10" cy="-1" r="1" fill="#0F172A" />
          </g>

          {/* Outdoor Luminoso: "EXPLORE • PRACTICE • EVOLVE" */}
          <g transform="translate(110, -5)">
            <line x1="0" y1="0" x2="0" y2="18" stroke="#64748B" strokeWidth="2" />
            <line x1="45" y1="0" x2="45" y2="18" stroke="#64748B" strokeWidth="2" />
            <rect x="-4" y="-18" width="54" height="24" fill="#0F172A" rx="2" stroke="#38BDF8" strokeWidth="1" />
            <text x="23" y="-10" fill="#38BDF8" fontSize="4" fontWeight="800" textAnchor="middle">
              EXPLORE
            </text>
            <text x="23" y="-4" fill="#F8FAFC" fontSize="4.5" fontWeight="800" textAnchor="middle">
              PRACTICE
            </text>
            <text x="23" y="2" fill="#F59E0B" fontSize="4" fontWeight="800" textAnchor="middle">
              EVOLVE ✈
            </text>
          </g>

          {/* Luzes de Balizamento da Pista Pulsando */}
          <g className="animated-runway-lights">
            <circle cx="-25" cy="70" r="2.5" fill="#38BDF8" className="runway-led-1" filter="url(#softGlow)" />
            <circle cx="10" cy="75" r="2.5" fill="#38BDF8" className="runway-led-2" filter="url(#softGlow)" />
            <circle cx="45" cy="80" r="2.5" fill="#38BDF8" className="runway-led-3" filter="url(#softGlow)" />
            <circle cx="80" cy="85" r="2.5" fill="#F59E0B" className="runway-led-4" filter="url(#softGlow)" />
          </g>
        </g>

        {/* ----------------------------------------------------------------
            BIOMA 5: PRAÇA CENTRAL COM FONTE DE ÁGUA ONDULANTE
            ---------------------------------------------------------------- */}
        <g id="landmark-plaza-5" transform="translate(945, 505)">
          {/* Base da Fonte em Pedra */}
          <ellipse cx="0" cy="10" rx="34" ry="16" fill="#1E293B" stroke="#475569" strokeWidth="2" />
          <ellipse cx="0" cy="9" rx="30" ry="13" fill="#0284C7" />

          {/* Anéis de Ondulação da Água Animados na Fonte */}
          <ellipse cx="0" cy="9" rx="12" ry="5" fill="none" stroke="#7DD3FC" strokeWidth="1.5" className="fountain-ripple-1" />
          <ellipse cx="0" cy="9" rx="22" ry="9" fill="none" stroke="#BAE6FD" strokeWidth="1" className="fountain-ripple-2" />

          {/* Pilar Central da Fonte */}
          <path d="M -5 9 L -3 -6 L 3 -6 L 5 9 Z" fill="#64748B" stroke="#334155" strokeWidth="1" />
          <ellipse cx="0" cy="-6" rx="8" ry="3.5" fill="#94A3B8" />

          {/* Jato D'Água Animado Subindo e Espirrando */}
          <path
            className="animated-fountain-spray"
            d="M 0 -6 Q -6 -20 0 -24 Q 6 -20 0 -6 Z"
            fill="rgba(186, 230, 253, 0.75)"
            filter="url(#softGlow)"
          />

          {/* Balão de Diálogo Suspenso sobre a Praça */}
          <g className="floating-speech-prop" transform="translate(25, -28)">
            <rect x="-14" y="-12" width="28" height="18" fill="#0284C7" rx="6" stroke="#38BDF8" strokeWidth="1.2" filter="url(#softGlow)" />
            <polygon points="-2,6 4,6 0,11" fill="#0284C7" />
            <circle cx="-6" cy="-3" r="2" fill="#FFFFFF" />
            <circle cx="0" cy="-3" r="2" fill="#FFFFFF" />
            <circle cx="6" cy="-3" r="2" fill="#FFFFFF" />
          </g>

          {/* Placa Rústica: "SAVE LANGUAGE • BRIDGES DREAMS" */}
          <g transform="translate(55, 30)">
            <line x1="0" y1="0" x2="0" y2="18" stroke="#78350F" strokeWidth="2.5" />
            <rect x="-8" y="-16" width="56" height="20" fill="#78350F" rx="2" stroke="#B45309" strokeWidth="1" />
            <text x="20" y="-8" fill="#FDE68A" fontSize="4.2" fontWeight="800" textAnchor="middle">
              SAVE LANGUAGE
            </text>
            <text x="20" y="-1" fill="#FBBF24" fontSize="3.8" fontWeight="700" textAnchor="middle">
              BRIDGES DREAMS ✈
            </text>
          </g>

          {/* Bancos de Praça e Postes */}
          <rect x="-35" y="18" width="14" height="4" fill="#78350F" rx="1" />
          <rect x="25" y="24" width="14" height="4" fill="#78350F" rx="1" />
        </g>

        {/* ----------------------------------------------------------------
            BIOMA 6: METRÓPOLE CORPORATIVA COM ARRANHA-CÉUS ILUMINADOS
            ---------------------------------------------------------------- */}
        <g id="landmark-metropolis-6" transform="translate(1120, 275)">
          {/* Arranha-céu 1 (Fundo Esquerdo) */}
          <g transform="translate(-40, -40)">
            <rect x="0" y="0" width="36" height="95" fill="url(#skyscraperGrad1)" stroke="#1E293B" strokeWidth="1" />
            <polygon points="0,0 18,-15 36,0" fill="#0F172A" />
            <line x1="18" y1="-15" x2="18" y2="-30" stroke="#38BDF8" strokeWidth="1.5" />
            {/* Janelas Iluminadas em Grid */}
            <g fill="#38BDF8" opacity="0.65">
              <rect x="4" y="10" width="5" height="4" />
              <rect x="15" y="10" width="5" height="4" />
              <rect x="26" y="10" width="5" height="4" />
              <rect x="4" y="25" width="5" height="4" />
              <rect x="15" y="25" width="5" height="4" />
              <rect x="26" y="25" width="5" height="4" />
              <rect x="4" y="40" width="5" height="4" />
              <rect x="15" y="40" width="5" height="4" />
              <rect x="26" y="40" width="5" height="4" />
              <rect x="4" y="55" width="5" height="4" />
              <rect x="15" y="55" width="5" height="4" />
              <rect x="26" y="55" width="5" height="4" />
            </g>
          </g>

          {/* Arranha-céu 2 (Torre Principal Centro) */}
          <g transform="translate(0, -65)">
            <rect x="0" y="0" width="46" height="120" fill="url(#skyscraperGrad1)" stroke="#38BDF8" strokeWidth="1.2" />
            <polygon points="0,0 23,-20 46,0" fill="#0284C7" />
            <line x1="23" y1="-20" x2="23" y2="-45" stroke="#EF4444" strokeWidth="2" className="tower-beacon-blink" />
            {/* Grid de Vidros com Luzes Amarelas e Cianas */}
            <g fill="#FEF08A" opacity="0.8">
              <rect x="5" y="12" width="6" height="5" />
              <rect x="16" y="12" width="6" height="5" />
              <rect x="27" y="12" width="6" height="5" />
              <rect x="5" y="28" width="6" height="5" />
              <rect x="27" y="28" width="6" height="5" fill="#38BDF8" />
              <rect x="16" y="44" width="6" height="5" />
              <rect x="27" y="44" width="6" height="5" />
              <rect x="5" y="60" width="6" height="5" fill="#38BDF8" />
              <rect x="16" y="60" width="6" height="5" />
              <rect x="5" y="76" width="6" height="5" />
              <rect x="27" y="76" width="6" height="5" />
            </g>
          </g>

          {/* Telão Digital Corporativo */}
          <g transform="translate(-15, 30)">
            <rect x="-15" y="-12" width="68" height="26" fill="#030712" rx="3" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="19" y="-4" fill="#38BDF8" fontSize="4.2" fontWeight="800" textAnchor="middle">
              BIGGER CONVERSATIONS
            </text>
            <text x="19" y="3" fill="#F8FAFC" fontSize="4" fontWeight="800" textAnchor="middle">
              GREATER OPPORTUNITIES
            </text>
          </g>

          {/* Arranha-céu 3 (Direito Moderno) */}
          <g transform="translate(50, -35)">
            <rect x="0" y="0" width="34" height="90" fill="url(#skyscraperGrad1)" stroke="#1E293B" strokeWidth="1" />
            <polygon points="0,0 17,-12 34,0" fill="#0F172A" />
            <line x1="17" y1="-12" x2="17" y2="-25" stroke="#38BDF8" strokeWidth="1.5" />
            <g fill="#38BDF8" opacity="0.6">
              <rect x="4" y="8" width="5" height="4" />
              <rect x="14" y="8" width="5" height="4" />
              <rect x="24" y="8" width="5" height="4" />
              <rect x="4" y="22" width="5" height="4" />
              <rect x="14" y="22" width="5" height="4" />
              <rect x="24" y="22" width="5" height="4" />
              <rect x="14" y="36" width="5" height="4" />
              <rect x="24" y="36" width="5" height="4" />
            </g>
          </g>
        </g>

        {/* ----------------------------------------------------------------
            BIOMA 7: CIDADELA DO MR. CRAZY COM COROA FLUTUANTE & FAROL
            ---------------------------------------------------------------- */}
        <g id="landmark-citadel-7" transform="translate(1310, 360)">
          {/* Castelo / Cidadela Imponente com Torres Góticas */}
          <g transform="translate(-40, -45)">
            {/* Muralha Principal */}
            <polygon points="0,20 80,20 80,75 0,75" fill="url(#citadelStoneGrad)" stroke="#1E293B" strokeWidth="2" />
            {/* Arestas / Almenas da Muralha */}
            <rect x="0" y="14" width="10" height="7" fill="#1E293B" />
            <rect x="17" y="14" width="10" height="7" fill="#1E293B" />
            <rect x="35" y="14" width="10" height="7" fill="#1E293B" />
            <rect x="53" y="14" width="10" height="7" fill="#1E293B" />
            <rect x="70" y="14" width="10" height="7" fill="#1E293B" />

            {/* Torre Esquerda com Espiral */}
            <rect x="-12" y="-10" width="18" height="85" fill="#1A2433" stroke="#0F172A" strokeWidth="1.2" />
            <polygon points="-14,-10 -3,-35 8,-10" fill="#0F172A" stroke="#F59E0B" strokeWidth="0.8" />

            {/* Torre Direita com Espiral */}
            <rect x="74" y="-10" width="18" height="85" fill="#1A2433" stroke="#0F172A" strokeWidth="1.2" />
            <polygon points="72,-10 83,-35 94,-10" fill="#0F172A" stroke="#F59E0B" strokeWidth="0.8" />

            {/* Grande Torre Central Superior */}
            <rect x="20" y="-30" width="40" height="50" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
            <polygon points="16,-30 40,-60 64,-30" fill="#0F172A" stroke="#FBBF24" strokeWidth="1.5" />

            {/* Portal Gigante com Grade Dourada */}
            <path d="M 28 75 L 28 45 C 28 35, 52 35, 52 45 L 52 75 Z" fill="#080C11" stroke="#F59E0B" strokeWidth="2" />
            <line x1="40" y1="36" x2="40" y2="75" stroke="#F59E0B" strokeWidth="1.5" />
            <line x1="30" y1="52" x2="50" y2="52" stroke="#F59E0B" strokeWidth="1" />
            <line x1="30" y1="62" x2="50" y2="62" stroke="#F59E0B" strokeWidth="1" />

            {/* Banner Oficial: "MR. CRAZY" */}
            <rect x="18" y="24" width="44" height="12" fill="#78350F" rx="2" stroke="#FBBF24" strokeWidth="1.2" />
            <text x="40" y="33" fill="#FDE68A" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="1">
              MR. CRAZY
            </text>

            {/* COROA DOURADA GIGANTE FLUTUANDO SOBRE O CASTELO */}
            <g className="animated-floating-crown" transform="translate(40, -82)">
              {/* Halo Radiante Dourado */}
              <circle cx="0" cy="0" r="26" fill="url(#goldGlowBig)" opacity="0.6" />
              {/* Formato da Coroa Dourada */}
              <path
                d="M -18 8 L -14 -12 L -5 0 L 0 -18 L 5 0 L 14 -12 L 18 8 Z"
                fill="url(#goldCrownGrad)"
                stroke="#FDE68A"
                strokeWidth="1.8"
                filter="url(#softGlow)"
              />
              {/* Pedras Preciosas da Coroa */}
              <circle cx="-14" cy="-10" r="2.2" fill="#EF4444" />
              <circle cx="0" cy="-16" r="2.8" fill="#38BDF8" />
              <circle cx="14" cy="-10" r="2.2" fill="#10B981" />
            </g>
          </g>

          {/* Faixa Artística: "FLUENCY LIVES HERE 👑" */}
          <g transform="translate(15, -120)">
            <text x="0" y="0" fill="#FDE68A" fontSize="8" fontWeight="900" fontStyle="italic" letterSpacing="0.8" filter="url(#softGlow)">
              FLUENCY
            </text>
            <text x="0" y="10" fill="#FBBF24" fontSize="7.5" fontWeight="900" fontStyle="italic" letterSpacing="0.8">
              LIVES HERE 👑
            </text>
          </g>

          {/* FAROL COSTEIRO NA PONTA DA ROCHA COM FEIXE DE LUZ GIRATÓRIO */}
          <g id="scenery-lighthouse" transform="translate(30, 95)">
            {/* Base Rochosa do Farol */}
            <ellipse cx="0" cy="16" rx="20" ry="8" fill="#0A0E13" stroke="#1E293B" strokeWidth="1" />
            {/* Torre Cônica Listrada (Branco e Vermelho) */}
            <polygon points="-8,14 -4,-22 4,-22 8,14" fill="#F8FAFC" stroke="#334155" strokeWidth="1" />
            {/* Faixa Vermelha */}
            <polygon points="-6.5,2 -5,-8 5,-8 6.5,2" fill="#DC2626" />
            {/* Cúpula e Lanterna */}
            <rect x="-6" y="-28" width="12" height="7" fill="#FEF08A" rx="1" stroke="#D97706" strokeWidth="1" filter="url(#softGlow)" />
            <polygon points="-8,-28 0,-36 8,-28" fill="#1E293B" stroke="#B45309" strokeWidth="1" />

            {/* FEIXE DE LUZ GIRATÓRIO ANIMADO VARRENDO O OCEANO */}
            <g className="animated-lighthouse-sweep" transform="translate(0, -25)">
              <polygon points="0,0 -160,80 -120,130" fill="rgba(254, 240, 138, 0.28)" filter="url(#softGlow)" />
              <polygon points="0,0 160,80 120,130" fill="rgba(254, 240, 138, 0.12)" />
            </g>
          </g>
        </g>

        {/* ================================================================
            5. NUVENS TRANSLÚCIDAS E NÉVOAS FLUTUANTES PELO CENÁRIO
            ================================================================ */}
        <g className="animated-drifting-clouds">
          {/* Nuvem 1 (Noroeste) */}
          <path
            d="M 120 180 Q 140 160 170 170 Q 200 155 230 175 Q 260 170 280 190 Q 250 210 200 205 Q 150 215 120 180 Z"
            fill="rgba(255, 255, 255, 0.08)"
            filter="blur(10px)"
          />
          {/* Nuvem 2 (Central Alta) */}
          <path
            d="M 620 120 Q 650 95 690 110 Q 730 90 770 115 Q 810 105 840 130 Q 800 150 740 145 Q 670 155 620 120 Z"
            fill="rgba(255, 255, 255, 0.07)"
            filter="blur(12px)"
          />
          {/* Nuvem 3 (Leste) */}
          <path
            d="M 1150 140 Q 1180 115 1220 130 Q 1260 110 1300 135 Q 1340 125 1370 150 Q 1320 170 1250 165 Q 1180 175 1150 140 Z"
            fill="rgba(255, 255, 255, 0.09)"
            filter="blur(11px)"
          />
        </g>
      </svg>
    </div>
  );
}

