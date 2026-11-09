import React from 'react';

/**
 * Photorealistic AR Wearable Engine.
 * Renders the genuine product as an isolated, wearable AR overlay on the user's face,
 * torso, head, or wrist — with NO box boundaries, NO cards, and NO distracting borders.
 * Includes optional toggle to view the full studio catalog photo.
 */
export default function TryOnOverlay({
  product,
  position,
  scale = 1,
  rotation = 0,
  opacity = 0.96,
  isDragging = false,
  onPointerDown,
  lightingMode = 'daylight',
  isLayerActive = true,
  onSelectLayer,
  displayMode = 'cutout', // 'cutout' (seamless wearable) | 'photo' (catalog studio shot)
  selectedColorHex = null,
}) {
  if (!product) return null;

  // Dynamic light tint color based on ambient simulator
  const lightTints = {
    'daylight': 'rgba(255, 255, 255, 0.08)',
    'golden-hour': 'rgba(245, 158, 11, 0.26)',
    'neon': 'rgba(236, 72, 153, 0.22)',
    'office': 'rgba(186, 230, 253, 0.12)',
    'candlelight': 'rgba(234, 88, 12, 0.30)',
    'studio': 'rgba(255, 255, 255, 0.16)',
  };

  const ambientTint = lightTints[lightingMode] || lightTints['daylight'];
  const activeColor = selectedColorHex || (product.colors && product.colors[0]?.hex) || '#18181b';

  const containerStyle = {
    position: 'absolute',
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
    opacity,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
    zIndex: isLayerActive ? 25 : 20,
    filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.40)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25))',
    transition: isDragging ? 'none' : 'transform 0.06s ease-out',
  };

  /* Render Full Studio Catalog Photo when requested */
  if (displayMode === 'photo') {
    return (
      <div
        className={`tryon-overlay-container ${isLayerActive ? 'layer-active' : ''}`}
        style={containerStyle}
        onPointerDown={(e) => {
          if (onSelectLayer) onSelectLayer(product.id);
          if (onPointerDown) onPointerDown(e, product.id);
        }}
        title={`Drag to reposition ${product.name}`}
      >
        <div style={{
          width: '240px',
          height: '240px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          position: 'relative',
          background: '#ffffff',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            right: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '0.72rem',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>{product.name}</span>
            <span style={{ color: '#38bdf8' }}>₹{product.price}</span>
          </div>
        </div>
      </div>
    );
  }

  /* Render Seamless Isolated AR Wearable Cutout */
  function renderWearableCutout() {
    switch (product.id) {
      /* ────────────────────────────────────────────────────────
         1: CLASSIC T-SHIRT (Torso Fit)
         ──────────────────────────────────────────────────────── */
      case 1:
        return (
          <div style={{ width: '340px', height: '340px', position: 'relative' }}>
            <svg viewBox="0 0 400 400" width="100%" height="100%" fill="none">
              <defs>
                <linearGradient id="teeFabricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={activeColor} />
                  <stop offset="60%" stopColor={activeColor} />
                  <stop offset="100%" stopColor="#09090b" />
                </linearGradient>
                <linearGradient id="teeDrapeFolds" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                  <stop offset="30%" stopColor="#000000" stopOpacity="0.05" />
                  <stop offset="70%" stopColor="#000000" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
                </linearGradient>
              </defs>

              {/* T-Shirt Torso Silhouette */}
              <path
                d="M 135 60 Q 200 95 265 60 L 340 110 L 305 185 L 265 155 L 270 380 L 130 380 L 135 155 L 95 185 L 60 110 Z"
                fill="url(#teeFabricGrad)"
              />
              <path
                d="M 135 60 Q 200 95 265 60 L 340 110 L 305 185 L 265 155 L 270 380 L 130 380 L 135 155 L 95 185 L 60 110 Z"
                fill="url(#teeDrapeFolds)"
              />

              {/* Dynamic Fabric Fold Shadows */}
              <path d="M 140 160 Q 180 240 150 370" stroke="rgba(0,0,0,0.5)" strokeWidth="6" fill="none" opacity="0.6" />
              <path d="M 260 160 Q 220 240 250 370" stroke="rgba(0,0,0,0.5)" strokeWidth="6" fill="none" opacity="0.6" />

              {/* Ribbed Crewneck Collar */}
              <path
                d="M 135 60 Q 200 95 265 60 Q 200 112 135 60"
                fill="#18181b"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2"
              />

              {/* Ambient lighting tint */}
              <rect x="0" y="0" width="400" height="400" fill={ambientTint} style={{ mixBlendMode: 'color-dodge' }} />
            </svg>
          </div>
        );

      /* ────────────────────────────────────────────────────────
         2: PREMIUM WHITE SNEAKERS (Athletic Footwear)
         ──────────────────────────────────────────────────────── */
      case 2:
        return (
          <div style={{ width: '310px', height: '175px', position: 'relative' }}>
            <svg viewBox="0 0 350 200" width="100%" height="100%" fill="none">
              <defs>
                <linearGradient id="sneakerBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="80%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <linearGradient id="sneakerSoleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>

              {/* Shoe Body */}
              <path
                d="M 45 138 C 55 105, 105 82, 148 92 C 178 78, 235 75, 275 115 C 315 130, 335 145, 318 168 L 42 168 C 32 168, 35 150, 45 138 Z"
                fill="url(#sneakerBodyGrad)"
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {/* Cushioned Outsole */}
              <path
                d="M 38 168 L 320 168 C 326 168, 328 178, 318 184 L 44 184 C 34 184, 32 168, 38 168 Z"
                fill="url(#sneakerSoleGrad)"
              />

              {/* Racing Stripe Accent */}
              <path d="M 115 118 Q 175 124 235 145" stroke="#7c3aed" strokeWidth="6" strokeLinecap="round" />

              {/* Laces and Eyelets */}
              <path d="M 158 102 L 182 105 M 162 112 L 188 115 M 168 122 L 194 125" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />

              {/* Ambient lighting tint */}
              <rect x="0" y="0" width="350" height="200" fill={ambientTint} style={{ mixBlendMode: 'color-dodge' }} />
            </svg>
          </div>
        );

      /* ────────────────────────────────────────────────────────
         3: BLUE DENIM JACKET (Torso Fit)
         ──────────────────────────────────────────────────────── */
      case 3:
        return (
          <div style={{ width: '360px', height: '340px', position: 'relative' }}>
            <svg viewBox="0 0 420 380" width="100%" height="100%" fill="none">
              <defs>
                <linearGradient id="denimWashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor={activeColor !== '#18181b' ? activeColor : '#1d4ed8'} />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
              </defs>

              {/* Denim Jacket Silhouette */}
              <path
                d="M 125 55 Q 210 90 295 55 L 390 110 L 345 190 L 305 160 L 310 365 L 110 365 L 115 160 L 75 190 L 30 110 Z"
                fill="url(#denimWashGrad)"
                stroke="#60a5fa"
                strokeWidth="2.5"
              />

              {/* Folded Collar Lapels */}
              <polygon points="125,55 210,102 165,118 125,55" fill="#1e40af" stroke="#93c5fd" strokeWidth="1.5" />
              <polygon points="295,55 210,102 255,118 295,55" fill="#1e40af" stroke="#93c5fd" strokeWidth="1.5" />

              {/* Center Placket */}
              <rect x="202" y="102" width="16" height="263" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />

              {/* Authentic Bronze Shank Buttons */}
              {[130, 180, 230, 280, 330].map(y => (
                <g key={y}>
                  <circle cx="210" cy={y} r="5.5" fill="#ca8a04" stroke="#fef08a" strokeWidth="1" />
                  <circle cx="209" cy={y - 1} r="2" fill="#fef08a" opacity="0.8" />
                </g>
              ))}

              {/* Chest Flap Pockets */}
              <rect x="140" y="160" width="46" height="42" rx="4" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.5" />
              <rect x="234" y="160" width="46" height="42" rx="4" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.5" />

              {/* Ambient lighting tint */}
              <rect x="0" y="0" width="420" height="380" fill={ambientTint} style={{ mixBlendMode: 'color-dodge' }} />
            </svg>
          </div>
        );

      /* ────────────────────────────────────────────────────────
         4: SMART WATCH (Wrist Wear with Live AMOLED Screen)
         ──────────────────────────────────────────────────────── */
      case 4:
        return (
          <div style={{ width: '230px', height: '250px', position: 'relative' }}>
            <svg viewBox="0 0 240 260" width="100%" height="100%" fill="none">
              <defs>
                <linearGradient id="watchStrapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e1e24" />
                  <stop offset="50%" stopColor={activeColor !== '#18181b' ? activeColor : '#33333d'} />
                  <stop offset="100%" stopColor="#1e1e24" />
                </linearGradient>
              </defs>

              {/* Top & Bottom Straps */}
              <rect x="78" y="8" width="84" height="72" rx="10" fill="url(#watchStrapGrad)" stroke="#4b5563" strokeWidth="1.5" />
              <rect x="78" y="180" width="84" height="72" rx="10" fill="url(#watchStrapGrad)" stroke="#4b5563" strokeWidth="1.5" />

              {/* Titanium Bezel */}
              <rect x="52" y="62" width="136" height="136" rx="32" fill="#111827" stroke="#cbd5e1" strokeWidth="3" />
              {/* Digital Crown */}
              <rect x="188" y="94" width="8" height="26" rx="3" fill="#cbd5e1" />

              {/* Active AMOLED Screen with Real Time */}
              <rect x="68" y="78" width="104" height="104" rx="24" fill="#020617" />
              <text x="120" y="118" fill="#38bdf8" fontSize="22" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                10:42
              </text>
              <text x="120" y="138" fill="#ec4899" fontSize="12" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
                ♥ 76 BPM
              </text>
              <circle cx="120" cy="130" r="42" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="160 50" fill="none" />

              {/* Ambient lighting tint */}
              <rect x="0" y="0" width="240" height="260" fill={ambientTint} style={{ mixBlendMode: 'color-dodge' }} />
            </svg>
          </div>
        );

      /* ────────────────────────────────────────────────────────
         5: WIRELESS HEADPHONES (Headwear)
         ──────────────────────────────────────────────────────── */
      case 5:
        return (
          <div style={{ width: '290px', height: '250px', position: 'relative' }}>
            <svg viewBox="0 0 320 280" width="100%" height="100%" fill="none">
              <defs>
                <linearGradient id="headbandMetallic" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e1e24" />
                  <stop offset="50%" stopColor={activeColor !== '#18181b' ? activeColor : '#4f46e5'} />
                  <stop offset="100%" stopColor="#1e1e24" />
                </linearGradient>
              </defs>

              {/* Arch Headband */}
              <path
                d="M 55 170 C 45 55, 275 55, 265 170"
                stroke="url(#headbandMetallic)"
                strokeWidth="22"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 68 140 C 62 75, 258 75, 252 140"
                stroke="#6366f1"
                strokeWidth="3.5"
                fill="none"
                opacity="0.9"
              />

              {/* Left Padded Earcup */}
              <g transform="translate(32, 135)">
                <ellipse cx="28" cy="48" rx="28" ry="46" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" />
                <ellipse cx="28" cy="48" rx="16" ry="28" fill="#09090b" />
                <circle cx="28" cy="48" r="8" fill="#7c3aed" />
              </g>

              {/* Right Padded Earcup */}
              <g transform="translate(232, 135)">
                <ellipse cx="28" cy="48" rx="28" ry="46" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" />
                <ellipse cx="28" cy="48" rx="16" ry="28" fill="#09090b" />
                <circle cx="28" cy="48" r="8" fill="#7c3aed" />
              </g>

              {/* Ambient lighting tint */}
              <rect x="0" y="0" width="320" height="280" fill={ambientTint} style={{ mixBlendMode: 'color-dodge' }} />
            </svg>
          </div>
        );

      /* ────────────────────────────────────────────────────────
         6: WOMEN'S CASUAL DRESS (Full Torso & Flow)
         ──────────────────────────────────────────────────────── */
      case 6:
        return (
          <div style={{ width: '330px', height: '370px', position: 'relative' }}>
            <svg viewBox="0 0 380 440" width="100%" height="100%" fill="none">
              <defs>
                <linearGradient id="dressFlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="50%" stopColor={activeColor !== '#18181b' ? activeColor : '#db2777'} />
                  <stop offset="100%" stopColor="#9d174d" />
                </linearGradient>
              </defs>

              {/* Flowy Chiffon Dress Silhouette */}
              <path
                d="M 145 35 Q 190 65 235 35 L 255 105 L 225 175 L 340 425 Q 190 445 40 425 L 155 175 L 125 105 Z"
                fill="url(#dressFlowGrad)"
                stroke="#f472b6"
                strokeWidth="2"
              />

              {/* Cinched Waist Tie Detail */}
              <rect x="150" y="172" width="80" height="14" rx="4" fill="#4a044e" stroke="#fbcfe8" strokeWidth="1.5" />

              {/* Flow lines */}
              <path d="M 175 190 Q 150 310 110 420" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" />
              <path d="M 205 190 Q 230 310 270 420" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" />

              {/* Ambient lighting tint */}
              <rect x="0" y="0" width="380" height="440" fill={ambientTint} style={{ mixBlendMode: 'color-dodge' }} />
            </svg>
          </div>
        );

      /* ────────────────────────────────────────────────────────
         7: PREMIUM BACKPACK (Shoulder Mount)
         ──────────────────────────────────────────────────────── */
      case 7:
        return (
          <div style={{ width: '290px', height: '330px', position: 'relative' }}>
            <svg viewBox="0 0 320 380" width="100%" height="100%" fill="none">
              <defs>
                <linearGradient id="backpackCordura" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="100%" stopColor={activeColor !== '#18181b' ? activeColor : '#111827'} />
                </linearGradient>
              </defs>

              {/* Top Handle */}
              <path d="M 115 65 C 115 35, 205 35, 205 65" stroke="#4b5563" strokeWidth="11" strokeLinecap="round" fill="none" />

              {/* Main Backpack Body */}
              <rect x="65" y="65" width="190" height="280" rx="40" fill="url(#backpackCordura)" stroke="#6b7280" strokeWidth="2" />

              {/* Front Pocket */}
              <rect x="85" y="185" width="150" height="130" rx="18" fill="#1f2937" stroke="#7c3aed" strokeWidth="2" />

              {/* Metal Zipper Tracks */}
              <path d="M 85 118 L 235 118" stroke="#9ca3af" strokeWidth="4" strokeDasharray="6 4" />
              <path d="M 100 215 L 220 215" stroke="#a78bfa" strokeWidth="3" strokeDasharray="5 3" />

              {/* Ambient lighting tint */}
              <rect x="0" y="0" width="320" height="380" fill={ambientTint} style={{ mixBlendMode: 'color-dodge' }} />
            </svg>
          </div>
        );

      /* ────────────────────────────────────────────────────────
         8: STYLISH POLARIZED SUNGLASSES (Face Mount)
         ──────────────────────────────────────────────────────── */
      case 8:
      default:
        return (
          <div style={{ width: '280px', height: '115px', position: 'relative' }}>
            <svg viewBox="0 0 340 130" width="100%" height="100%" fill="none">
              <defs>
                <linearGradient id="sunglassLens" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.86" />
                  <stop offset="60%" stopColor="#1e1b4b" stopOpacity="0.80" />
                  <stop offset="100%" stopColor="#312e81" stopOpacity="0.72" />
                </linearGradient>
                <linearGradient id="sunglassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
                  <stop offset="35%" stopColor="#ffffff" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Left Polarized Lens (Translucent so the eyes peek through!) */}
              <path
                d="M 40 35 C 75 32, 130 32, 145 45 C 150 70, 140 105, 105 112 C 60 115, 30 90, 40 35 Z"
                fill="url(#sunglassLens)"
              />
              <path d="M 50 42 L 85 42 L 58 98 L 46 88 Z" fill="url(#sunglassReflection)" />

              {/* Right Polarized Lens */}
              <path
                d="M 300 35 C 265 32, 210 32, 195 45 C 190 70, 200 105, 235 112 C 280 115, 310 90, 300 35 Z"
                fill="url(#sunglassLens)"
              />
              <path d="M 290 42 L 255 42 L 282 98 L 294 88 Z" fill="url(#sunglassReflection)" />

              {/* Handcrafted Italian Acetate Frame */}
              <path
                d="M 15 35 C 45 22, 135 20, 155 42 C 162 48, 178 48, 185 42 C 205 20, 295 22, 325 35 C 335 40, 335 55, 320 55 C 300 55, 305 98, 240 120 C 195 125, 180 85, 170 85 C 160 85, 145 125, 100 120 C 35 98, 40 55, 20 55 C 5 55, 5 40, 15 35 Z"
                fill="none"
                stroke={activeColor}
                strokeWidth="11"
                strokeLinejoin="round"
              />

              {/* Silver Bridge Connector */}
              <path d="M 148 45 Q 170 37 192 45" stroke="#cbd5e1" strokeWidth="4.5" fill="none" />

              {/* 24K Gold Temple Rivets */}
              <rect x="18" y="36" width="11" height="5" rx="1.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />
              <rect x="311" y="36" width="11" height="5" rx="1.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />

              {/* Ambient lighting tint */}
              <rect x="0" y="0" width="340" height="130" fill={ambientTint} style={{ mixBlendMode: 'color-dodge' }} />
            </svg>
          </div>
        );
    }
  }

  return (
    <div
      className={`tryon-overlay-container ${isLayerActive ? 'layer-active' : ''}`}
      style={containerStyle}
      onPointerDown={(e) => {
        if (onSelectLayer) onSelectLayer(product.id);
        if (onPointerDown) onPointerDown(e, product.id);
      }}
      title={`Drag to reposition ${product.name}`}
      role="region"
      aria-label={`Virtual Try-On: ${product.name}`}
    >
      <div className={`tryon-item-wrapper ${isDragging ? 'dragging' : ''}`}>
        {renderWearableCutout()}

        {/* Dynamic Drag Crosshair & Boundary HUD */}
        {isDragging && (
          <div className="tryon-drag-guides" aria-hidden="true">
            <span className="guide-center" />
            <div className="guide-hud-badge">
              {product.tryOnLabel} • {Math.round(scale * 100)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
