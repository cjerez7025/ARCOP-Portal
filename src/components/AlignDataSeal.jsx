// ============================================================
// src/components/AlignDataSeal.jsx  v3
// viewBox="-10 -20 340 370" — muestra círculo + ambos arcos completos
// Relación de aspecto 340:370 → height = size * 1.088
// ============================================================

const CX = 160, CY = 160, R = 110;
const RA = R + 30;  // 140 — arco AlignData
const RP = R + 68;  // 178 — arco Protect™

const arcAlignData = `M ${CX - RA},${CY} a ${RA},${RA} 0 0,0 ${2 * RA},0`;
const arcProtect   = `M ${CX - RP},${CY} a ${RP},${RP} 0 0,0 ${2 * RP},0`;

const VB    = "-10 -20 340 370";
const RATIO = 370 / 340;

export default function AlignDataSeal({ size = 80, animated = false }) {
  const w = size;
  const h = Math.round(size * RATIO);
  const p = { viewBox: VB, width: w, height: h, style: { display: 'block', overflow: 'visible' } };

  if (animated) return (
    <svg {...p}>
      <defs>
        <linearGradient id="abg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A6E"/><stop offset="100%" stopColor="#0C1F40"/>
        </linearGradient>
        <linearGradient id="aga" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB"/><stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
        <path id="aarc1" d={arcAlignData}/>
        <path id="aarc2" d={arcProtect}/>
      </defs>

      <circle cx={CX} cy={CY} r="10" fill="none" stroke="#06B6D4" strokeWidth="2">
        <animate attributeName="r" from="10" to="130" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.9" to="0" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="stroke-width" from="2" to="0.3" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx={CX} cy={CY} r="10" fill="none" stroke="#3B82F6" strokeWidth="1.5">
        <animate attributeName="r" from="10" to="130" dur="3s" begin="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.6" to="0" dur="3s" begin="1.5s" repeatCount="indefinite"/>
        <animate attributeName="stroke-width" from="1.5" to="0.2" dur="3s" begin="1.5s" repeatCount="indefinite"/>
      </circle>

      <circle cx={CX} cy={CY} r={R} fill="url(#abg)"/>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#2563EB" strokeWidth="2.5">
        <animate attributeName="stroke-opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="stroke-width" values="2.5;4;2.5" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx={CX} cy={CY} r={R - 14} fill="none" stroke="#06B6D4" strokeWidth="0.8" opacity="0.3"/>
      <circle cx={CX} cy={CY} r={R - 6} fill="none" stroke="#06B6D4" strokeWidth="1" strokeDasharray="8 6" opacity="0.35">
        <animateTransform attributeName="transform" type="rotate" from="0 160 160" to="360 160 160" dur="12s" repeatCount="indefinite"/>
      </circle>

      <text x={CX} y={CY + 16} textAnchor="middle" fontFamily="Georgia,serif" fontWeight="bold" fontSize="82" fill="url(#aga)">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite"/>
        AD
      </text>
      <text fontFamily="Georgia,serif" fontWeight="bold" fontSize="34">
        <textPath href="#aarc1" startOffset="50%" textAnchor="middle">
          <tspan fill="url(#aga)">Align</tspan><tspan fill="#60A5FA">Data</tspan>
        </textPath>
      </text>
      <text fontFamily="Georgia,serif" fontSize="22" letterSpacing="5" fill="#22D3EE">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
        <textPath href="#aarc2" startOffset="50%" textAnchor="middle">Protect™</textPath>
      </text>
    </svg>
  );

  return (
    <svg {...p}>
      <defs>
        <linearGradient id="sbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A6E"/><stop offset="100%" stopColor="#0C1F40"/>
        </linearGradient>
        <linearGradient id="sga" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB"/><stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
        <path id="sarc1" d={arcAlignData}/>
        <path id="sarc2" d={arcProtect}/>
      </defs>
      <circle cx={CX} cy={CY} r={R} fill="url(#sbg)"/>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#2563EB" strokeWidth="2.5" opacity="0.85"/>
      <circle cx={CX} cy={CY} r={R - 14} fill="none" stroke="#06B6D4" strokeWidth="0.8" opacity="0.3"/>
      <text x={CX} y={CY + 16} textAnchor="middle" fontFamily="Georgia,serif" fontWeight="bold" fontSize="82" fill="url(#sga)">AD</text>
      <text fontFamily="Georgia,serif" fontWeight="bold" fontSize="34">
        <textPath href="#sarc1" startOffset="50%" textAnchor="middle">
          <tspan fill="url(#sga)">Align</tspan><tspan fill="#60A5FA">Data</tspan>
        </textPath>
      </text>
      <text fontFamily="Georgia,serif" fontSize="22" letterSpacing="5" fill="#22D3EE">
        <textPath href="#sarc2" startOffset="50%" textAnchor="middle">Protect™</textPath>
      </text>
    </svg>
  );
}