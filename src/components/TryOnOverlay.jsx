import React from 'react';

/**
 * Interactive AR Try-On Overlays for products.
 * Returns high-fidelity vector / SVG cutouts positioned and scaled dynamically.
 */
export default function TryOnOverlay({
  product,
  position,
  scale,
  rotation,
  opacity,
  isDragging,
  onPointerDown,
}) {
  if (!product) return null;

  const style = {
    position: 'absolute',
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
    opacity: opacity,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
    zIndex: 20,
    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35))',
    transition: isDragging ? 'none' : 'transform 0.05s ease-out',
  };

  function renderProductGraphic() {
    switch (product.id) {
      // 1: Classic Black T-Shirt
      case 1:
        return (
          <div style={{ width: '320px', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 400 400" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="blackTeeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2a2a2e" />
                  <stop offset="45%" stopColor="#17171a" />
                  <stop offset="100%" stopColor="#0a0a0c" />
                </linearGradient>
                <linearGradient id="teeFold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3a3a42" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#111114" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Main T-Shirt Body */}
              <path
                d="M 140 70 Q 200 110 260 70 L 330 115 L 295 185 L 260 160 L 265 370 L 135 370 L 140 160 L 105 185 L 70 115 Z"
                fill="url(#blackTeeGrad)"
                stroke="#444450"
                strokeWidth="2"
              />
              {/* Collar ribbing */}
              <path
                d="M 140 70 Q 200 110 260 70 Q 200 125 140 70"
                fill="#1f1f24"
                stroke="#555565"
                strokeWidth="1.5"
              />
              {/* Fold highlights */}
              <path d="M 145 170 Q 180 230 155 350" stroke="url(#teeFold)" strokeWidth="3" fill="none" />
              <path d="M 255 170 Q 220 230 245 350" stroke="url(#teeFold)" strokeWidth="3" fill="none" />
              <path d="M 195 130 L 195 365" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
              {/* SmartCart subtle chest logo */}
              <circle cx="230" cy="180" r="10" fill="#7c3aed" opacity="0.85" />
              <path d="M 226 180 L 229 183 L 235 176" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );

      // 2: Premium White Sneakers
      case 2:
        return (
          <div style={{ width: '280px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 350 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sneakerWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e5e7eb" />
                </linearGradient>
                <linearGradient id="sneakerSole" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              {/* Shoe Body */}
              <path
                d="M 50 140 C 60 110, 110 90, 150 100 C 180 85, 230 80, 270 120 C 310 135, 330 150, 310 165 L 50 165 C 40 165, 40 150, 50 140 Z"
                fill="url(#sneakerWhite)"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              {/* Sole */}
              <rect x="40" y="165" width="280" height="20" rx="8" fill="url(#sneakerSole)" />
              <rect x="40" y="180" width="280" height="6" rx="3" fill="#4338ca" />
              {/* Purple Accent Stripe */}
              <path d="M 120 120 Q 180 125 240 145" stroke="#7c3aed" strokeWidth="6" strokeLinecap="round" />
              {/* Eyelets and laces */}
              <path d="M 160 105 L 185 108 M 165 115 L 190 118 M 170 125 L 195 128" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        );

      // 3: Blue Denim Jacket
      case 3:
        return (
          <div style={{ width: '350px', height: '330px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 420 380" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="denimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
              </defs>
              {/* Jacket body */}
              <path
                d="M 130 60 Q 210 95 290 60 L 380 115 L 340 190 L 300 165 L 305 360 L 115 360 L 120 165 L 80 190 L 40 115 Z"
                fill="url(#denimGrad)"
                stroke="#60a5fa"
                strokeWidth="2.5"
              />
              {/* Collar */}
              <polygon points="130,60 210,105 170,120 130,60" fill="#1e40af" stroke="#93c5fd" strokeWidth="1.5" />
              <polygon points="290,60 210,105 250,120 290,60" fill="#1e40af" stroke="#93c5fd" strokeWidth="1.5" />
              {/* Center Placket */}
              <rect x="202" y="105" width="16" height="255" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
              {/* Metal Buttons */}
              {[130, 175, 220, 265, 310].map(y => (
                <circle key={y} cx="210" cy={y} r="5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
              ))}
              {/* Chest pockets */}
              <rect x="145" y="160" width="45" height="40" rx="4" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.5" />
              <rect x="230" y="160" width="45" height="40" rx="4" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.5" />
            </svg>
          </div>
        );

      // 4: Smart Watch
      case 4:
        return (
          <div style={{ width: '220px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 240 260" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="watchStrap" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e1e24" />
                  <stop offset="50%" stopColor="#33333d" />
                  <stop offset="100%" stopColor="#1e1e24" />
                </linearGradient>
                <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>
              </defs>
              {/* Top strap */}
              <rect x="80" y="10" width="80" height="70" rx="8" fill="url(#watchStrap)" stroke="#4b5563" strokeWidth="1" />
              {/* Bottom strap */}
              <rect x="80" y="180" width="80" height="70" rx="8" fill="url(#watchStrap)" stroke="#4b5563" strokeWidth="1" />
              {/* Watch Case */}
              <rect x="55" y="65" width="130" height="130" rx="30" fill="#111827" stroke="#9ca3af" strokeWidth="3" />
              {/* Digital Crown */}
              <rect x="187" y="95" width="8" height="24" rx="3" fill="#cbd5e1" />
              {/* Screen */}
              <rect x="67" y="77" width="106" height="106" rx="22" fill="url(#screenGrad)" />
              {/* UI: Time */}
              <text x="120" y="122" fill="#38bdf8" fontSize="24" fontWeight="bold" textAnchor="middle" fontFamily="monospace">10:42</text>
              <text x="120" y="142" fill="#a855f7" fontSize="12" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">♥ 74 BPM</text>
              <circle cx="120" cy="130" r="44" stroke="#7c3aed" strokeWidth="3" strokeDasharray="180 50" fill="none" />
            </svg>
          </div>
        );

      // 5: Wireless Headphones
      case 5:
        return (
          <div style={{ width: '280px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 320 280" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="headbandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e1e24" />
                  <stop offset="50%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#1e1e24" />
                </linearGradient>
                <linearGradient id="earcupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
              </defs>
              {/* Arch Headband */}
              <path
                d="M 60 170 C 50 60, 270 60, 260 170"
                stroke="url(#headbandGrad)"
                strokeWidth="20"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 75 140 C 70 85, 250 85, 245 140"
                stroke="#6366f1"
                strokeWidth="4"
                fill="none"
                opacity="0.8"
              />
              {/* Left Earcup */}
              <g transform="translate(35, 140)">
                <ellipse cx="25" cy="45" rx="25" ry="40" fill="url(#earcupGrad)" stroke="#818cf8" strokeWidth="2.5" />
                <ellipse cx="25" cy="45" rx="14" ry="24" fill="#0f172a" />
                <circle cx="25" cy="45" r="7" fill="#7c3aed" />
              </g>
              {/* Right Earcup */}
              <g transform="translate(235, 140)">
                <ellipse cx="25" cy="45" rx="25" ry="40" fill="url(#earcupGrad)" stroke="#818cf8" strokeWidth="2.5" />
                <ellipse cx="25" cy="45" rx="14" ry="24" fill="#0f172a" />
                <circle cx="25" cy="45" r="7" fill="#7c3aed" />
              </g>
            </svg>
          </div>
        );

      // 6: Women's Casual Dress
      case 6:
        return (
          <div style={{ width: '320px', height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 380 440" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="dressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="50%" stopColor="#db2777" />
                  <stop offset="100%" stopColor="#be185d" />
                </linearGradient>
              </defs>
              {/* Dress body */}
              <path
                d="M 150 40 Q 190 70 230 40 L 250 110 L 220 180 L 330 420 Q 190 440 50 420 L 160 180 L 130 110 Z"
                fill="url(#dressGrad)"
                stroke="#f472b6"
                strokeWidth="2"
              />
              {/* Waist belt */}
              <rect x="155" y="175" width="70" height="14" rx="4" fill="#4a044e" stroke="#fbcfe8" strokeWidth="1" />
              {/* Flow folds */}
              <path d="M 175 190 Q 150 310 110 420" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" />
              <path d="M 205 190 Q 230 310 270 420" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" />
              <path d="M 190 190 L 190 425" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
            </svg>
          </div>
        );

      // 7: Premium Backpack
      case 7:
        return (
          <div style={{ width: '280px', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 320 380" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="bagGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
              </defs>
              {/* Top Handle */}
              <path d="M 120 70 C 120 40, 200 40, 200 70" stroke="#4b5563" strokeWidth="10" strokeLinecap="round" fill="none" />
              {/* Main bag body */}
              <rect x="70" y="70" width="180" height="270" rx="36" fill="url(#bagGrad)" stroke="#6b7280" strokeWidth="2" />
              {/* Front pocket */}
              <rect x="90" y="190" width="140" height="120" rx="18" fill="#1f2937" stroke="#7c3aed" strokeWidth="2" />
              {/* Zipper details */}
              <path d="M 90 120 L 230 120" stroke="#9ca3af" strokeWidth="4" strokeDasharray="6 4" />
              <path d="M 105 215 L 215 215" stroke="#a78bfa" strokeWidth="3" strokeDasharray="5 3" />
              {/* Accent tag */}
              <rect x="145" y="245" width="30" height="16" rx="4" fill="#7c3aed" />
            </svg>
          </div>
        );

      // 8: Stylish Sunglasses (Default)
      case 8:
      default:
        return (
          <div style={{ width: '270px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 340 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lensGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#4338ca" stopOpacity="0.88" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#18181b" />
                  <stop offset="50%" stopColor="#27272a" />
                  <stop offset="100%" stopColor="#09090b" />
                </linearGradient>
                <linearGradient id="reflection" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                  <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Left Lens */}
              <path
                d="M 40 35 C 75 32, 130 32, 145 45 C 150 70, 140 105, 105 112 C 60 115, 30 90, 40 35 Z"
                fill="url(#lensGrad)"
              />
              {/* Left Lens Reflection */}
              <path
                d="M 50 42 L 80 42 L 55 95 L 45 85 Z"
                fill="url(#reflection)"
              />
              {/* Right Lens */}
              <path
                d="M 300 35 C 265 32, 210 32, 195 45 C 190 70, 200 105, 235 112 C 280 115, 310 90, 300 35 Z"
                fill="url(#lensGrad)"
              />
              {/* Right Lens Reflection */}
              <path
                d="M 290 42 L 260 42 L 285 95 L 295 85 Z"
                fill="url(#reflection)"
              />
              {/* Full Eyewear Frame */}
              <path
                d="M 15 35 C 45 22, 135 20, 155 42 C 162 48, 178 48, 185 42 C 205 20, 295 22, 325 35 C 335 40, 335 55, 320 55 C 300 55, 305 98, 240 120 C 195 125, 180 85, 170 85 C 160 85, 145 125, 100 120 C 35 98, 40 55, 20 55 C 5 55, 5 40, 15 35 Z"
                fill="none"
                stroke="url(#frameGrad)"
                strokeWidth="10"
                strokeLinejoin="round"
              />
              {/* Bridge */}
              <path d="M 148 45 Q 170 38 192 45" stroke="#a1a1aa" strokeWidth="4" fill="none" />
              {/* Gold Temple Accents */}
              <rect x="18" y="36" width="12" height="6" rx="2" fill="#facc15" />
              <rect x="310" y="36" width="12" height="6" rx="2" fill="#facc15" />
            </svg>
          </div>
        );
    }
  }

  return (
    <div
      className="tryon-overlay-container"
      style={style}
      onPointerDown={onPointerDown}
      title="Click and drag to adjust position"
    >
      {/* Visual bounding indicator on hover/drag */}
      <div className={`tryon-item-wrapper ${isDragging ? 'dragging' : ''}`}>
        {renderProductGraphic()}
        
        {/* Floating alignment guides when dragging */}
        {isDragging && (
          <div className="tryon-drag-guides">
            <span className="guide-center" />
          </div>
        )}
      </div>
    </div>
  );
}
