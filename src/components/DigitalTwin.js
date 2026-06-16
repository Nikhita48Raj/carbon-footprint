import React from 'react';

export default function DigitalTwin({ co2e = 0, energySource = 'grid', goalsCompleted = 0 }) {
  // Determine severity based on carbon footprint score
  // Low: < 200 kg CO2e/month, Medium: 200 - 500, High: > 500
  const isLow = co2e < 200;
  const isHigh = co2e >= 500;
  const isMedium = !isLow && !isHigh;

  // Environmental colors
  const skyColor = isLow ? '#a5f3fc' : isMedium ? '#fed7aa' : '#9ca3af';
  const groundColor = isLow ? '#10b981' : isMedium ? '#f59e0b' : '#b45309';
  const foliageColor = isLow ? '#047857' : isMedium ? '#d97706' : '#78350f';
  const cloudColor = isLow ? 'white' : isMedium ? 'rgba(255,255,255,0.7)' : 'rgba(75,85,99,0.8)';

  // Solar & Wind flags
  const showSolar = energySource === 'solar' || energySource === 'mixed';
  const showWind = energySource === 'wind' || energySource === 'mixed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', background: skyColor, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
        
        {/* SVG Drawing Canvas */}
        <svg viewBox="0 0 400 300" width="100%" height="100%" style={{ transition: 'all 0.5s ease' }}>
          {/* Sun or Hazy Light */}
          {isLow && (
            <circle cx="340" cy="60" r="30" fill="#fef08a" filter="drop-shadow(0px 0px 8px #fef08a)" />
          )}
          {isMedium && (
            <circle cx="340" cy="60" r="25" fill="#fde047" opacity="0.8" />
          )}
          {isHigh && (
            <circle cx="340" cy="60" r="20" fill="#e5e7eb" opacity="0.3" />
          )}

          {/* Clouds or Smog */}
          <path d="M50 80 a20 20 0 0 1 30 -10 a25 25 0 0 1 40 0 a20 20 0 0 1 10 20 z" fill={cloudColor} opacity="0.9" />
          {isHigh && (
            <>
              {/* Extra heavy smog clouds */}
              <path d="M120 110 a15 15 0 0 1 20 -5 a20 20 0 0 1 30 0 a15 15 0 0 1 10 10 z" fill="#4b5563" opacity="0.6" />
              <path d="M280 90 a15 15 0 0 1 20 -5 a20 20 0 0 1 30 0 a15 15 0 0 1 10 10 z" fill="#374151" opacity="0.5" />
            </>
          )}

          {/* Island Ground */}
          <ellipse cx="200" cy="240" rx="180" ry="60" fill={groundColor} />

          {/* House Structure */}
          <rect x="160" y="170" width="80" height="60" fill="#1e293b" rx="4" />
          {/* Roof */}
          <polygon points="150,170 200,130 250,170" fill="#ef4444" />
          {/* Door */}
          <rect x="190" y="200" width="20" height="30" fill="#d97706" />
          {/* Windows (glowing if energy is active) */}
          <rect x="175" y="180" width="15" height="15" fill={isHigh ? '#f59e0b' : '#fef08a'} rx="2" />
          <rect x="210" y="180" width="15" height="15" fill={isHigh ? '#f59e0b' : '#fef08a'} rx="2" />

          {/* Solar Panels on Roof */}
          {showSolar && (
            <g transform="translate(160, 150) rotate(-38)">
              <rect x="0" y="0" width="30" height="12" fill="#1e40af" stroke="#60a5fa" strokeWidth="1" />
              <line x1="10" y1="0" x2="10" y2="12" stroke="#60a5fa" />
              <line x1="20" y1="0" x2="20" y2="12" stroke="#60a5fa" />
            </g>
          )}

          {/* Wind Turbine */}
          {showWind && (
            <g transform="translate(80, 160)">
              {/* Mast */}
              <line x1="0" y1="0" x2="0" y2="70" stroke="#cbd5e1" strokeWidth="4" />
              {/* Blades */}
              <g className="turb-blades" style={{ transformOrigin: '0px 0px', animation: 'spin 4s linear infinite' }}>
                <line x1="0" y1="0" x2="0" y2="-25" stroke="#f1f5f9" strokeWidth="3" />
                <line x1="0" y1="0" x2="22" y2="12" stroke="#f1f5f9" strokeWidth="3" />
                <line x1="0" y1="0" x2="-22" y2="12" stroke="#f1f5f9" strokeWidth="3" />
              </g>
            </g>
          )}

          {/* Chimney & Smoke */}
          {isHigh && (
            <g transform="translate(230, 135)">
              <rect x="0" y="0" width="10" height="20" fill="#475569" />
              {/* Animated/Layered Smoke particles */}
              <ellipse cx="5" cy="-10" rx="8" ry="4" fill="#374151" opacity="0.6" />
              <ellipse cx="12" cy="-22" rx="12" ry="6" fill="#4b5563" opacity="0.4" />
              <ellipse cx="20" cy="-35" rx="16" ry="8" fill="#6b7280" opacity="0.2" />
            </g>
          )}

          {/* Trees */}
          {/* Tree 1 */}
          <g transform="translate(280, 200)">
            <rect x="-3" y="0" width="6" height="25" fill="#78350f" />
            <circle cx="0" cy="-10" r="16" fill={foliageColor} />
            <circle cx="-8" cy="-5" r="12" fill={foliageColor} />
            <circle cx="8" cy="-5" r="12" fill={foliageColor} />
          </g>
          {/* Tree 2 (Only if low/medium emissions - otherwise dead/withering) */}
          {!isHigh ? (
            <g transform="translate(320, 215)">
              <rect x="-2" y="0" width="4" height="20" fill="#78350f" />
              <circle cx="0" cy="-8" r="12" fill={foliageColor} />
              <circle cx="-6" cy="-4" r="9" fill={foliageColor} />
            </g>
          ) : (
            // Dead branches
            <g transform="translate(320, 215)" stroke="#78350f" strokeWidth="2" strokeLinecap="round">
              <line x1="0" y1="20" x2="0" y2="5" />
              <line x1="0" y1="12" x2="-8" y2="6" />
              <line x1="0" y1="8" x2="6" y2="3" />
            </g>
          )}

          {/* Goal Completion Flowers */}
          {goalsCompleted > 0 && (
            <g transform="translate(130, 235)" fill="#f43f5e">
              <circle cx="0" cy="0" r="3" />
              <circle cx="-4" cy="0" r="2.5" fill="#ec4899" />
              <circle cx="4" cy="0" r="2.5" fill="#ec4899" />
              <circle cx="0" cy="-4" r="2.5" fill="#ec4899" />
              <circle cx="0" cy="4" r="2.5" fill="#ec4899" />
            </g>
          )}
          {goalsCompleted > 1 && (
            <g transform="translate(260, 240)" fill="#3b82f6">
              <circle cx="0" cy="0" r="3" />
              <circle cx="-4" cy="0" r="2.5" fill="#60a5fa" />
              <circle cx="4" cy="0" r="2.5" fill="#60a5fa" />
              <circle cx="0" cy="-4" r="2.5" fill="#60a5fa" />
              <circle cx="0" cy="4" r="2.5" fill="#60a5fa" />
            </g>
          )}
        </svg>

        {/* Dynamic HUD Overlay */}
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', color: 'white' }}>
          <span>Twin Status: <strong>{isLow ? 'ECO-HERO 🌱' : isMedium ? 'BALANCED ⚖️' : 'HEAVY LOAD ⚠️'}</strong></span>
          <span>Monthly: <strong>{co2e.toFixed(0)} kg</strong></span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
