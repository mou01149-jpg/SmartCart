import { useState, useRef, useCallback, useEffect } from 'react';
import { products, MODEL_PRESETS } from '../data/products.js';
import TryOnOverlay from './TryOnOverlay.jsx';
import {
  playHeadphonesANC,
  updateANC,
  playSneakerStepSound,
  playFabricZipperSound,
  stopSensoryAudio,
} from '../utils/audioSensory.js';
import './CameraPreview.css';

export default function CameraPreview({
  selectedProductId = 8,
  onAddToCart,
  onBuyNow,
  onOpenBargain,
}) {
  // Find current product or default to Sunglasses (#8)
  const initialProduct = products.find(p => p.id === selectedProductId) || products[7] || products[0];
  const [activeProductId, setActiveProductId] = useState(initialProduct.id);
  const [selectedColor, setSelectedColor] = useState(
    initialProduct.colors ? initialProduct.colors[0]?.hex : null
  );

  /* ─── Wearable Display Mode: 'cutout' (AR Wear) vs 'photo' (Catalog Studio) ─── */
  const [displayMode, setDisplayMode] = useState('cutout');

  /* ─── Multi-Item Wardrobe Layering State ────────────────── */
  // By default, selecting an item swaps cleanly (removes earlier item).
  // Users can optionally toggle "Multi-Item Layering" to stack items.
  const [multiLayerMode, setMultiLayerMode] = useState(false);
  const [layers, setLayers] = useState(() => {
    return {
      [initialProduct.id]: {
        product: initialProduct,
        position: { x: initialProduct.arDefault.x, y: initialProduct.arDefault.y },
        scale: initialProduct.arDefault.scale,
        rotation: initialProduct.arDefault.rotation,
        opacity: 0.96,
        visible: true,
      },
    };
  });

  // Track prop changes to immediately switch to new product (REMOVING PREVIOUS PRODUCT)
  const [prevPropId, setPrevPropId] = useState(selectedProductId);
  if (selectedProductId !== prevPropId) {
    setPrevPropId(selectedProductId);
    const found = products.find(p => p.id === selectedProductId);
    if (found) {
      setActiveProductId(found.id);
      setSelectedColor(found.colors ? found.colors[0]?.hex : null);
      if (multiLayerMode) {
        setLayers(prev => ({
          ...prev,
          [found.id]: {
            product: found,
            position: { x: found.arDefault.x, y: found.arDefault.y },
            scale: found.arDefault.scale,
            rotation: found.arDefault.rotation,
            opacity: 0.96,
            visible: true,
          },
        }));
      } else {
        // CLEAN SWAP: REMOVES THE PREVIOUS PRODUCT
        setLayers({
          [found.id]: {
            product: found,
            position: { x: found.arDefault.x, y: found.arDefault.y },
            scale: found.arDefault.scale,
            rotation: found.arDefault.rotation,
            opacity: 0.96,
            visible: true,
          },
        });
      }
    }
  }

  const activeProduct = products.find(p => p.id === activeProductId) || initialProduct;
  const activeLayer = layers[activeProductId] || {
    product: activeProduct,
    position: { x: activeProduct.arDefault.x, y: activeProduct.arDefault.y },
    scale: activeProduct.arDefault.scale,
    rotation: activeProduct.arDefault.rotation,
    opacity: 0.96,
    visible: true,
  };

  /* ─── Model & Camera Stage Source ──────────────────────── */
  // 'live' | 'model-female' | 'model-male' | 'model-mannequin' | 'uploaded'
  const [stageSource, setStageSource] = useState('live');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [uploadedUserImage, setUploadedUserImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  /* ─── Saved Looks Snapshots Gallery ────────────────────── */
  const [savedLooks, setSavedLooks] = useState([]);

  /* ─── 4D Ambient Lighting Simulator ────────────────────── */
  // 'daylight' | 'golden-hour' | 'neon' | 'office' | 'candlelight' | 'studio'
  const [lightingMode, setLightingMode] = useState('daylight');

  /* ─── Dual-Mirror Split Comparison ─────────────────────── */
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const isDraggingSplitRef = useRef(false);

  /* ─── Sensory Audio Acoustics ──────────────────────────── */
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAncActive, setIsAncActive] = useState(false);
  const [ancEnv, setAncEnv] = useState('airplane');

  /* ─── Live Co-Shopping & Friend Poll ───────────────────── */
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollReactions, setPollReactions] = useState({ fire: 48, heart: 35, style: 19 });
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  /* ─── AI Bargaining & Deal Haggler ────────────────────── */
  const [isHagglerOpen, setIsHagglerOpen] = useState(false);
  const [hagglerOffer, setHagglerOffer] = useState('');
  const [hagglerMessage, setHagglerMessage] = useState(null);
  const [unlockedCoupon, setUnlockedCoupon] = useState(null);

  /* ─── Sizing & Body Caliper ────────────────────────────── */
  const [userHeight, setUserHeight] = useState(172);
  const [fitPreference, setFitPreference] = useState('regular'); // slim, regular, relaxed

  /* ─── Drag Handling Refs & State ───────────────────────── */
  const [isDragging, setIsDragging] = useState(false);
  const [draggingLayerId, setDraggingLayerId] = useState(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialPosX: 50, initialPosY: 38, targetId: null });
  const viewportRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ─── Camera Media Stream Control ──────────────────────── */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  }, []);

  const openCamera = useCallback(async (mode = 'user') => {
    setCameraError(null);
    setCameraLoading(true);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API is not supported in this browser. Showing Studio Model.');
      setStageSource('model-female');
      setCameraLoading(false);
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      setCameraLoading(false);
      setFacingMode(mode);
      setStageSource('live');
    } catch {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
        setCameraLoading(false);
        setStageSource('live');
      } catch {
        setCameraError('Camera unavailable or permission denied. Switched to Studio Model.');
        setStageSource('model-female');
        setCameraLoading(false);
      }
    }
  }, []);

  // Auto-start camera on mount & cleanup on unmount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) {
        await openCamera('user');
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
      stopSensoryAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Layer Adjustment Handlers ────────────────────────── */
  function updateActiveLayerProp(key, value) {
    setLayers(prev => {
      const current = prev[activeProductId] || {
        product: activeProduct,
        position: { x: activeProduct.arDefault.x, y: activeProduct.arDefault.y },
        scale: activeProduct.arDefault.scale,
        rotation: activeProduct.arDefault.rotation,
        opacity: 0.96,
        visible: true,
      };
      return {
        ...prev,
        [activeProductId]: { ...current, [key]: value },
      };
    });
  }

  /* ─── SELECT PRODUCT HANDLER (REMOVES EARLIER PRODUCT) ── */
  function handleSelectProduct(prod) {
    setActiveProductId(prod.id);
    setSelectedColor(prod.colors ? prod.colors[0]?.hex : null);

    if (multiLayerMode) {
      // Stack mode
      setLayers(prev => ({
        ...prev,
        [prod.id]: {
          product: prod,
          position: { x: prod.arDefault.x, y: prod.arDefault.y },
          scale: prod.arDefault.scale,
          rotation: prod.arDefault.rotation,
          opacity: 0.96,
          visible: true,
        },
      }));
    } else {
      // DEFAULT: CLEAN SWAP (REMOVES PREVIOUS ITEM)
      setLayers({
        [prod.id]: {
          product: prod,
          position: { x: prod.arDefault.x, y: prod.arDefault.y },
          scale: prod.arDefault.scale,
          rotation: prod.arDefault.rotation,
          opacity: 0.96,
          visible: true,
        },
      });
    }

    // Reset sensory audio on product switch
    stopSensoryAudio();
    setIsAudioPlaying(false);
  }

  function handleRemoveActiveProduct() {
    setLayers({});
  }

  /* ─── AI Smart Auto-Snap Fit ────────────────────────────── */
  function handleAutoSnapFit() {
    if (!activeProduct) return;
    const snap = activeProduct.autoSnap || activeProduct.arDefault;
    updateActiveLayerProp('position', { x: snap.x, y: snap.y });
    updateActiveLayerProp('scale', snap.scale);
    updateActiveLayerProp('rotation', 0);
  }

  function resetFit() {
    updateActiveLayerProp('position', { x: activeProduct.arDefault.x, y: activeProduct.arDefault.y });
    updateActiveLayerProp('scale', activeProduct.arDefault.scale);
    updateActiveLayerProp('rotation', activeProduct.arDefault.rotation);
    updateActiveLayerProp('opacity', 0.96);
  }

  /* ─── Drag Handling (Pointer Events) ───────────────────── */
  function handlePointerDown(e, productId) {
    if (!viewportRef.current) return;
    e.preventDefault();
    setActiveProductId(productId);
    setIsDragging(true);
    setDraggingLayerId(productId);

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const targetLayer = layers[productId] || activeLayer;

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialPosX: targetLayer.position.x,
      initialPosY: targetLayer.position.y,
      targetId: productId,
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function handlePointerMove(e) {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const deltaX = clientX - dragStartRef.current.startX;
    const deltaY = clientY - dragStartRef.current.startY;

    const percentX = (deltaX / rect.width) * 100;
    const percentY = (deltaY / rect.height) * 100;

    const newX = Math.min(95, Math.max(5, dragStartRef.current.initialPosX + percentX));
    const newY = Math.min(95, Math.max(5, dragStartRef.current.initialPosY + percentY));

    const targetId = dragStartRef.current.targetId;
    if (targetId) {
      setLayers(prev => {
        if (!prev[targetId]) return prev;
        return {
          ...prev,
          [targetId]: {
            ...prev[targetId],
            position: { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 },
          },
        };
      });
    }
  }

  function handlePointerUp() {
    setIsDragging(false);
    setDraggingLayerId(null);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }

  /* ─── Snapshot Capture to Saved Looks Gallery ──────────── */
  function capturePhoto() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    if (stageSource === 'live' && videoRef.current && cameraActive) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      if (facingMode === 'user') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const newLook = {
      id: Date.now(),
      url: dataUrl,
      productName: activeProduct.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSavedLooks(prev => [newLook, ...prev]);
  }

  /* ─── User Photo Upload ─────────────────────────────────── */
  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    setCameraError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedUserImage(ev.target.result);
      setStageSource('uploaded');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  /* ─── Split Screen Divider Dragging ────────────────────── */
  function handleSplitPointerDown(e) {
    e.preventDefault();
    isDraggingSplitRef.current = true;
    window.addEventListener('pointermove', handleSplitPointerMove);
    window.addEventListener('pointerup', handleSplitPointerUp);
  }

  function handleSplitPointerMove(e) {
    if (!isDraggingSplitRef.current || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const percent = Math.min(90, Math.max(10, (relativeX / rect.width) * 100));
    setSplitPercent(Math.round(percent));
  }

  function handleSplitPointerUp() {
    isDraggingSplitRef.current = false;
    window.removeEventListener('pointermove', handleSplitPointerMove);
    window.removeEventListener('pointerup', handleSplitPointerUp);
  }

  /* ─── Sensory Audio Handlers ───────────────────────────── */
  function toggleSensoryAudio() {
    if (isAudioPlaying) {
      stopSensoryAudio();
      setIsAudioPlaying(false);
    } else {
      if (activeProduct.sensoryType === 'anc') {
        playHeadphonesANC(ancEnv, isAncActive);
      } else if (activeProduct.sensoryType === 'step') {
        playSneakerStepSound();
      } else {
        playFabricZipperSound();
      }
      setIsAudioPlaying(true);
    }
  }

  function handleAncToggle() {
    const nextAnc = !isAncActive;
    setIsAncActive(nextAnc);
    if (isAudioPlaying) {
      updateANC(nextAnc, ancEnv);
    } else {
      playHeadphonesANC(ancEnv, nextAnc);
      setIsAudioPlaying(true);
    }
  }

  /* ─── Co-Shopping Friend Poll Reaction ──────────────────── */
  function handlePollVote(type) {
    setPollReactions(prev => ({
      ...prev,
      [type]: prev[type] + 1,
    }));

    const id = Date.now() + Math.random();
    const symbol = type === 'fire' ? '🔥 Cop It!' : type === 'heart' ? '💖 Stunning!' : '✨ Stylish!';
    const left = 30 + Math.random() * 40;
    setFloatingEmojis(prev => [...prev, { id, symbol, left }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(f => f.id !== id));
    }, 2000);
  }

  /* ─── AI Bargaining Deal Evaluator ──────────────────────── */
  function handleHagglerSubmit(e) {
    e.preventDefault();
    const numericOffer = parseInt(hagglerOffer, 10);
    if (isNaN(numericOffer) || numericOffer <= 0) return;

    const basePrice = activeProduct.price;
    const discountRatio = (basePrice - numericOffer) / basePrice;

    if (discountRatio <= 0.05) {
      setHagglerMessage(`Deal Accepted! You got ${activeProduct.name} for ₹${numericOffer}.`);
      setUnlockedCoupon({ code: 'DEALSMART5', discount: '5% OFF' });
    } else if (discountRatio <= 0.22) {
      setHagglerMessage(`AI Counter-Offer accepted! Instant checkout price: ₹${numericOffer}!`);
      setUnlockedCoupon({ code: 'AISPECIAL15', discount: '15% OFF' });
    } else {
      const bestOffer = Math.round(basePrice * 0.82);
      setHagglerMessage(`AI VIP Offer: Best instant checkout price is ₹${bestOffer}!`);
      setUnlockedCoupon({ code: 'VIPDEAL18', discount: '18% OFF' });
    }
  }

  /* ─── Body Size Calculator Logic ───────────────────────── */
  function calculateRecommendedSize() {
    if (userHeight < 165) return fitPreference === 'slim' ? 'S' : 'M';
    if (userHeight < 178) return fitPreference === 'relaxed' ? 'XL' : 'L';
    return fitPreference === 'slim' ? 'L' : 'XL';
  }

  const activeLayersList = Object.values(layers).filter(l => l.visible);

  return (
    <section className="tryon-section" id="tryon" aria-label="Virtual Try-On Studio">
      <div className="container tryon-container">

        {/* ── Top Header ───────────────────────────────────── */}
        <div className="tryon-topbar">
          <div className="tryon-badge-live">
            <span className="ar-pulse" />
            VIRTUAL TRY-ON STUDIO • REAL-TIME AR PREVIEW
          </div>
          <h1 className="tryon-heading">
            Try on <span className="text-highlight">{activeProduct.name}</span> Live
          </h1>
          <p className="tryon-subtext">
            Experience genuine item drape and textures on your live camera or our studio models. Drag to reposition, change lighting, or compare before & after.
          </p>
        </div>

        {/* ── Main Studio Grid ─────────────────────────────── */}
        <div className="tryon-grid">

          {/* Left Side: Viewport & Live AR Stage */}
          <div className="tryon-stage-card">

            {/* Model & Source Bar */}
            <div className="stage-source-bar" role="tablist" aria-label="Preview Model Switcher">
              <span className="source-bar-label">Stage Source:</span>
              {MODEL_PRESETS.map(preset => {
                if (preset.id === 'live') {
                  return (
                    <button
                      key={preset.id}
                      className={`source-chip ${stageSource === 'live' && cameraActive ? 'active' : ''}`}
                      onClick={() => openCamera('user')}
                      title="Use your real webcam"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      {preset.name}
                    </button>
                  );
                }
                return (
                  <button
                    key={preset.id}
                    className={`source-chip ${stageSource === preset.id ? 'active' : ''}`}
                    onClick={() => {
                      stopCamera();
                      setCameraError(null);
                      setStageSource(preset.id);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    {preset.name}
                  </button>
                );
              })}

              <label htmlFor="user-photo-upload" className={`source-chip upload-chip ${stageSource === 'uploaded' ? 'active' : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Upload Photo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                id="user-photo-upload"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>

            {/* Viewport Frame */}
            <div
              className={`tryon-viewport ${isDragging ? 'is-dragging' : ''} lighting-${lightingMode}`}
              ref={viewportRef}
              aria-label="Try-On Viewport"
            >
              {/* Camera Notification Pill (Dismissible) */}
              {cameraError && (
                <div className="tryon-notice-banner" role="status">
                  <span className="notice-icon">ℹ</span>
                  <span className="notice-text">{cameraError}</span>
                  <button className="notice-retry-btn" onClick={() => openCamera('user')}>
                    Retry Camera
                  </button>
                  <button className="notice-close-btn" onClick={() => setCameraError(null)} aria-label="Dismiss">
                    ✕
                  </button>
                </div>
              )}

              {/* Camera Initializing Spinner */}
              {cameraLoading && (
                <div className="camera-connecting-overlay">
                  <div className="connecting-spinner" />
                  <span>Activating Camera Feed...</span>
                </div>
              )}

              {/* STAGE BACKGROUND: Studio Model, User Photo, or Live Video */}
              {stageSource === 'live' && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`tryon-video ${cameraActive ? 'active' : ''}`}
                  style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                />
              )}

              {stageSource === 'uploaded' && (
                <img
                  src={uploadedUserImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80&auto=format&fit=crop'}
                  alt="User uploaded model"
                  className="tryon-model-image"
                />
              )}

              {stageSource === 'model-female' && (
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80&auto=format&fit=crop"
                  alt="Studio Fashion Model"
                  className="tryon-model-image"
                />
              )}

              {stageSource === 'model-male' && (
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80&auto=format&fit=crop"
                  alt="Urban Streetwear Model"
                  className="tryon-model-image"
                />
              )}

              {stageSource === 'model-mannequin' && (
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80&auto=format&fit=crop"
                  alt="Atelier Boutique Mannequin"
                  className="tryon-model-image"
                />
              )}

              {/* Ambient Lighting Overlay Shader */}
              <div className={`viewport-ambient-light-layer lighting-overlay-${lightingMode}`} aria-hidden="true" />

              {/* 🌟 AR OVERLAYS: Clean Isolated Cutouts or Photo Mode 🌟 */}
              <div
                className="layers-container"
                style={
                  isSplitMode
                    ? { clipPath: `polygon(${splitPercent}% 0, 100% 0, 100% 100%, ${splitPercent}% 100%)` }
                    : {}
                }
              >
                {Object.entries(layers).map(([idStr, layer]) => {
                  if (!layer.visible) return null;
                  const isCurActive = parseInt(idStr, 10) === activeProductId;
                  return (
                    <TryOnOverlay
                      key={idStr}
                      product={layer.product}
                      position={layer.position}
                      scale={layer.scale}
                      rotation={layer.rotation}
                      opacity={layer.opacity}
                      isDragging={isDragging && draggingLayerId === parseInt(idStr, 10)}
                      onPointerDown={handlePointerDown}
                      lightingMode={lightingMode}
                      isLayerActive={isCurActive}
                      onSelectLayer={(pId) => setActiveProductId(pId)}
                      displayMode={displayMode}
                      selectedColorHex={selectedColor}
                    />
                  );
                })}
              </div>

              {/* Dual-Mirror Split Divider */}
              {isSplitMode && (
                <div
                  className="split-divider-line"
                  style={{ left: `${splitPercent}%` }}
                  onPointerDown={handleSplitPointerDown}
                >
                  <div className="split-handle-pill">
                    <span className="split-arrow-left">◀</span>
                    <span className="split-label">DRAG</span>
                    <span className="split-arrow-right">▶</span>
                  </div>
                  <div className="split-tag-left">NATURAL (BEFORE)</div>
                  <div className="split-tag-right">SMARTCART AR (AFTER)</div>
                </div>
              )}

              {/* Floating Reaction Confetti from Co-Shopping */}
              <div className="floating-reactions-area" aria-hidden="true">
                {floatingEmojis.map(f => (
                  <div key={f.id} className="floating-reaction-badge" style={{ left: `${f.left}%` }}>
                    {f.symbol}
                  </div>
                ))}
              </div>

              {/* Viewport Floating Status Badges */}
              <div className="viewport-overlay-tags">
                <div className="tag-item">
                  <span className="live-dot" />
                  {activeProduct.tryOnLabel} • Drag to Position
                </div>
              </div>

              {/* Viewport Branding Badge */}
              <div className="viewport-branding">
                Smart<span>Cart</span> AR Studio
              </div>
            </div>

            {/* Quick Action Toolbar directly under camera */}
            <div className="tryon-toolbar">
              {stageSource === 'live' && cameraActive && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={capturePhoto} title="Snap and save look">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/>
                      <circle cx="12" cy="12" r="4"/>
                    </svg>
                    Snap Look
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => openCamera(facingMode === 'user' ? 'environment' : 'user')}
                    title="Flip Camera"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                    Flip
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={stopCamera}>
                    Stop Camera
                  </button>
                </>
              )}

              {/* Mode Toggle: Seamless AR Cutout vs Studio Photo Card */}
              <button
                className={`btn btn-outline btn-sm ${displayMode === 'photo' ? 'active-toggle' : ''}`}
                onClick={() => setDisplayMode(m => m === 'cutout' ? 'photo' : 'cutout')}
                title="Toggle between wearable AR cutout and catalog photo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                {displayMode === 'cutout' ? 'View Catalog Photo' : 'Wear AR Cutout'}
              </button>

              {/* Split Screen Before & After Button */}
              <button
                className={`btn btn-outline btn-sm ${isSplitMode ? 'active-toggle' : ''}`}
                onClick={() => setIsSplitMode(prev => !prev)}
                title="Split screen before and after comparison"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="12" y1="3" x2="12" y2="21"/>
                </svg>
                {isSplitMode ? 'Exit Split' : 'Before / After'}
              </button>

              {/* Auto-Snap Fit button */}
              <button className="btn btn-outline btn-sm" onClick={handleAutoSnapFit} title="Snap item to anatomical position">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>
                </svg>
                Auto-Fit
              </button>

              {/* Remove Current Item Button */}
              {activeLayersList.length > 0 && (
                <button className="btn btn-outline btn-sm" onClick={handleRemoveActiveProduct} title="Take off the current item">
                  ✕ Remove Item
                </button>
              )}

              {/* Sensory Audio Preview button */}
              <button
                className={`btn btn-outline btn-sm ${isAudioPlaying ? 'active-toggle' : ''}`}
                onClick={toggleSensoryAudio}
                title="Listen to real acoustic simulation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                {isAudioPlaying ? 'Stop Audio' : 'Sensory Acoustics'}
              </button>

              {/* Co-Shopping Friend Poll Button */}
              <button
                className={`btn btn-outline btn-sm ${isPollOpen ? 'active-toggle' : ''}`}
                onClick={() => setIsPollOpen(prev => !prev)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Ask Friends
              </button>

              {/* AI Haggler Bargain Button */}
              <button
                className={`btn btn-outline btn-sm ${isHagglerOpen ? 'active-toggle' : ''}`}
                onClick={() => {
                  if (onOpenBargain) {
                    onOpenBargain(activeProduct);
                  } else {
                    setIsHagglerOpen(prev => !prev);
                  }
                }}
                title="Bargain live with SmartCart AI for this product"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Bargain AI
              </button>
            </div>

            {/* 🌟 SAVED LOOKS GALLERY 🌟 */}
            {savedLooks.length > 0 && (
              <div className="saved-looks-gallery">
                <div className="saved-looks-header">
                  <span className="saved-looks-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 6 }}>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    My Try-On Snapshots ({savedLooks.length})
                  </span>
                  <span className="saved-looks-subtitle">Click to enlarge or download</span>
                </div>
                <div className="saved-looks-row">
                  {savedLooks.map(look => (
                    <div key={look.id} className="saved-look-card">
                      <img src={look.url} alt={look.productName} />
                      <div className="saved-look-info">
                        <span>{look.productName}</span>
                        <a href={look.url} download={`${look.productName}-tryon.jpg`} className="saved-look-dl" title="Download">
                          ↓
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Side: Studio Control Panel & Product Options */}
          <div className="tryon-sidebar">

            {/* Active Product Summary Box */}
            <div className="ar-product-summary">
              <img
                src={activeProduct.image}
                alt={activeProduct.name}
                className="ar-product-thumb"
              />
              <div className="ar-product-details">
                <div className="ar-category-badge-row">
                  <span className="ar-category-pill">{activeProduct.category}</span>
                  {activeProduct.badge && (
                    <span className="ar-badge-pill">{activeProduct.badge}</span>
                  )}
                </div>
                <h3 className="ar-product-title">{activeProduct.name}</h3>
                <div className="ar-price-row">
                  <span className="ar-price">₹{activeProduct.price.toLocaleString('en-IN')}</span>
                  {activeProduct.originalPrice && (
                    <span className="ar-orig-price">₹{activeProduct.originalPrice.toLocaleString('en-IN')}</span>
                  )}
                  <span className="ar-discount-tag">
                    {Math.round(((activeProduct.originalPrice - activeProduct.price) / activeProduct.originalPrice) * 100)}% OFF
                  </span>
                </div>
                <p className="ar-product-materials">{activeProduct.materials}</p>
              </div>
            </div>

            {/* 🌟 COLORWAY & VARIANT SWITCHER 🌟 */}
            {activeProduct.colors && (
              <div className="studio-card">
                <div className="studio-card-header">
                  <h4>Available Colorways</h4>
                  <span className="color-name-tag">
                    {activeProduct.colors.find(c => c.hex === selectedColor)?.name || 'Default'}
                  </span>
                </div>
                <div className="color-swatches-row">
                  {activeProduct.colors.map(c => (
                    <button
                      key={c.hex}
                      className={`color-swatch-btn ${selectedColor === c.hex ? 'active' : ''}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setSelectedColor(c.hex)}
                      title={c.name}
                    >
                      {selectedColor === c.hex && <span className="swatch-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 🌟 4D AMBIENT LIGHTING SIMULATOR 🌟 */}
            <div className="studio-card">
              <div className="studio-card-header">
                <h4>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  </svg>
                  4D Ambient Lighting Simulator
                </h4>
                <span className="lighting-indicator">{lightingMode.toUpperCase()}</span>
              </div>
              <p className="studio-card-desc">
                Simulate how fabric and materials reflect real-world environment lighting:
              </p>
              <div className="lighting-chips-grid">
                {[
                  { id: 'daylight', label: 'Daylight', sub: '5500K Clear Sky' },
                  { id: 'golden-hour', label: 'Golden Hour', sub: '3200K Sunset' },
                  { id: 'neon', label: 'Neon Club', sub: 'Cyberpunk Rim' },
                  { id: 'office', label: 'Corporate Office', sub: '4200K Neutral' },
                  { id: 'candlelight', label: 'Dinner Candle', sub: 'Intimate Warm' },
                  { id: 'studio', label: 'Runway Flash', sub: 'High Contrast' },
                ].map(light => (
                  <button
                    key={light.id}
                    className={`lighting-btn ${lightingMode === light.id ? 'active' : ''}`}
                    onClick={() => setLightingMode(light.id)}
                  >
                    <span className="lighting-btn-title">{light.label}</span>
                    <span className="lighting-btn-sub">{light.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 🌟 SENSORY AUDIO (ANC & ACOUSTICS) 🌟 */}
            {activeProduct.sensoryType === 'anc' && (
              <div className="studio-card sensory-audio-card">
                <div className="studio-card-header">
                  <h4>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                    </svg>
                    Live ANC & Sound Simulator
                  </h4>
                  <button className="anc-toggle-pill" onClick={handleAncToggle}>
                    ANC: {isAncActive ? 'ACTIVE (ON)' : 'PASSIVE (OFF)'}
                  </button>
                </div>
                <div className="anc-env-row">
                  {['airplane', 'subway', 'cafe'].map(env => (
                    <button
                      key={env}
                      className={`anc-env-btn ${ancEnv === env ? 'active' : ''}`}
                      onClick={() => {
                        setAncEnv(env);
                        if (isAudioPlaying) playHeadphonesANC(env, isAncActive);
                      }}
                    >
                      {env === 'airplane' ? '✈ Jet Cabin' : env === 'subway' ? '🚇 Subway Rail' : '☕ Coffee Shop'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 🌟 360° MATERIAL & FABRIC LAB 🌟 */}
            {activeProduct.specs && (
              <div className="studio-card specs-card">
                <div className="studio-card-header">
                  <h4>🔬 Fabric & Material Lab</h4>
                  <span className="specs-badge">LAB VERIFIED</span>
                </div>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Weight / GSM</span>
                    <span className="spec-val">{activeProduct.specs.weight}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Stretch Profile</span>
                    <span className="spec-val">{activeProduct.specs.stretch}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Air Flow</span>
                    <span className="spec-val">{activeProduct.specs.breathability}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Durability</span>
                    <span className="spec-val">{activeProduct.specs.durability}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 🌟 BODY PROPORTION & SIZE CALCULATOR 🌟 */}
            <div className="studio-card size-calc-card">
              <div className="studio-card-header">
                <h4>📏 Smart Fit & Size Caliper</h4>
                <span className="size-result-pill">Recommended: Size {calculateRecommendedSize()}</span>
              </div>
              <div className="slider-label-row">
                <span>Height: {userHeight} cm ({Math.floor(userHeight / 30.48)}' {Math.round((userHeight % 30.48) / 2.54)}")</span>
              </div>
              <input
                type="range"
                min="150"
                max="200"
                value={userHeight}
                onChange={(e) => setUserHeight(parseInt(e.target.value, 10))}
                className="ar-slider"
              />
              <div className="fit-pref-row">
                {['slim', 'regular', 'relaxed'].map(pref => (
                  <button
                    key={pref}
                    className={`fit-pref-btn ${fitPreference === pref ? 'active' : ''}`}
                    onClick={() => setFitPreference(pref)}
                  >
                    {pref.charAt(0).toUpperCase() + pref.slice(1)} Fit
                  </button>
                ))}
              </div>
            </div>

            {/* 🌟 CO-SHOPPING FRIEND POLL 🌟 */}
            {isPollOpen && (
              <div className="studio-card poll-card">
                <div className="studio-card-header">
                  <h4>Ask Friends (Live Co-Shopping Poll)</h4>
                  <span className="poll-badge">LIVE VOTE</span>
                </div>
                <p className="studio-card-desc">
                  Tap to record friend reactions directly on your Try-On feed:
                </p>
                <div className="poll-reaction-buttons">
                  <button className="poll-btn fire-btn" onClick={() => handlePollVote('fire')}>
                    Cop It! ({pollReactions.fire})
                  </button>
                  <button className="poll-btn heart-btn" onClick={() => handlePollVote('heart')}>
                    Stunning! ({pollReactions.heart})
                  </button>
                  <button className="poll-btn style-btn" onClick={() => handlePollVote('style')}>
                    Stylish! ({pollReactions.style})
                  </button>
                </div>
              </div>
            )}

            {/* AI BARGAINING BOT */}
            {isHagglerOpen && (
              <div className="studio-card haggler-card">
                <div className="studio-card-header">
                  <h4>Bargain with SmartCart AI</h4>
                  <span className="haggler-badge">SMART NEGOTIATOR</span>
                </div>
                <form onSubmit={handleHagglerSubmit} className="haggler-form">
                  <div className="haggler-input-wrapper">
                    <span className="haggler-currency">₹</span>
                    <input
                      type="number"
                      placeholder={`Try ${Math.round(activeProduct.price * 0.88)}`}
                      value={hagglerOffer}
                      onChange={(e) => setHagglerOffer(e.target.value)}
                      className="haggler-input"
                    />
                    <button type="submit" className="btn btn-primary btn-sm haggler-submit-btn">
                      Counter-Offer
                    </button>
                  </div>
                </form>
                {hagglerMessage && (
                  <div className="haggler-response-box">
                    <p>{hagglerMessage}</p>
                    {unlockedCoupon && (
                      <div className="unlocked-coupon-pill">
                        <span>PROMO CODE: <strong>{unlockedCoupon.code}</strong> ({unlockedCoupon.discount})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Fine-Tune Placement & Sizing Controls */}
            <div className="ar-controls-box">
              <div className="ar-controls-header">
                <h4>Fine-Tune Placement & Scale</h4>
                <button className="btn-link-reset" onClick={resetFit}>
                  Reset Auto-Fit
                </button>
              </div>

              {/* Size / Scale Slider */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>Size & Scale</span>
                  <span className="slider-val">{Math.round(activeLayer.scale * 100)}%</span>
                </div>
                <div className="slider-input-wrapper">
                  <button className="stepper-btn" onClick={() => updateActiveLayerProp('scale', Math.max(0.4, activeLayer.scale - 0.05))}>−</button>
                  <input
                    type="range"
                    min="0.4"
                    max="2.2"
                    step="0.05"
                    value={activeLayer.scale}
                    onChange={(e) => updateActiveLayerProp('scale', parseFloat(e.target.value))}
                    className="ar-slider"
                  />
                  <button className="stepper-btn" onClick={() => updateActiveLayerProp('scale', Math.min(2.2, activeLayer.scale + 0.05))}>+</button>
                </div>
              </div>

              {/* Rotation Slider */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>Tilt / Rotation</span>
                  <span className="slider-val">{activeLayer.rotation}°</span>
                </div>
                <div className="slider-input-wrapper">
                  <button className="stepper-btn" onClick={() => updateActiveLayerProp('rotation', Math.max(-45, activeLayer.rotation - 5))}>↺</button>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="2"
                    value={activeLayer.rotation}
                    onChange={(e) => updateActiveLayerProp('rotation', parseInt(e.target.value, 10))}
                    className="ar-slider"
                  />
                  <button className="stepper-btn" onClick={() => updateActiveLayerProp('rotation', Math.min(45, activeLayer.rotation + 5))}>↻</button>
                </div>
              </div>

              {/* Transparency Slider */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>Material Opacity</span>
                  <span className="slider-val">{Math.round(activeLayer.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={activeLayer.opacity}
                  onChange={(e) => updateActiveLayerProp('opacity', parseFloat(e.target.value))}
                  className="ar-slider"
                />
              </div>

              {/* Multi-Item Stacking Toggle */}
              <div className="stacking-toggle-row">
                <label className="stack-toggle-label">
                  <input
                    type="checkbox"
                    checked={multiLayerMode}
                    onChange={(e) => setMultiLayerMode(e.target.checked)}
                  />
                  <span>Stack & wear multiple items together</span>
                </label>
              </div>
            </div>

            {/* Direct Purchase Actions */}
            <div className="ar-actions-card">
              <button
                className="btn btn-primary btn-block ar-cart-btn"
                onClick={() => onAddToCart && onAddToCart(activeProduct)}
              >
                Add {activeProduct.name} to Cart • ₹{activeProduct.price.toLocaleString('en-IN')}
              </button>
              <button
                className="btn btn-secondary btn-block ar-buy-btn"
                onClick={() => onBuyNow && onBuyNow(activeProduct)}
              >
                Instant 1-Click Checkout
              </button>
            </div>

          </div>

        </div>

        {/* ── Bottom Carousel: Switch Items (Clean Swap) ── */}
        <div className="tryon-carousel-section">
          <div className="carousel-title-row">
            <div>
              <h3>Select Product to Wear</h3>
              <span className="carousel-subtitle">Tap any item to immediately wear it on your screen (swaps cleanly)</span>
            </div>
            <div className="carousel-count-badge">
              {products.length} Products Available
            </div>
          </div>

          <div className="tryon-carousel-track">
            {products.map(p => {
              const isSelected = activeProductId === p.id && activeLayersList.length > 0;
              return (
                <button
                  key={p.id}
                  className={`carousel-item-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectProduct(p)}
                >
                  <div className="carousel-item-img-box">
                    <img src={p.image} alt={p.name} />
                    {isSelected && <span className="carousel-active-badge">Wearing</span>}
                  </div>
                  <div className="carousel-item-meta">
                    <span className="carousel-item-name">{p.tryOnLabel}</span>
                    <span className="carousel-item-price">₹{p.price.toLocaleString('en-IN')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
