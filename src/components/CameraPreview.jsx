import { useState, useRef, useCallback, useEffect } from 'react';
import { products } from '../data/products.js';
import TryOnOverlay from './TryOnOverlay.jsx';
import './CameraPreview.css';

export default function CameraPreview({
  selectedProductId = 8,
  onAddToCart,
  onBuyNow,
}) {
  // Find current product or default to Sunglasses (#8)
  const currentProduct = products.find(p => p.id === selectedProductId) || products[0];
  const [selectedProduct, setSelectedProduct] = useState(currentProduct);

  // Track prop changes to update selected product
  const [prevId, setPrevId] = useState(selectedProductId);
  if (selectedProductId !== prevId) {
    setPrevId(selectedProductId);
    const found = products.find(p => p.id === selectedProductId);
    if (found) {
      setSelectedProduct(found);
      setPosition({ x: found.arDefault.x, y: found.arDefault.y });
      setScale(found.arDefault.scale);
      setRotation(found.arDefault.rotation);
    }
  }

  /* ─── Camera & AR State ────────────────────────────── */
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [error, setError] = useState(null);
  const [cameraSupported] = useState(() => {
    return typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  });

  // Overlay transformation state
  const [position, setPosition] = useState({
    x: currentProduct.arDefault?.x ?? 50,
    y: currentProduct.arDefault?.y ?? 38,
  });
  const [scale, setScale] = useState(currentProduct.arDefault?.scale ?? 1);
  const [rotation, setRotation] = useState(currentProduct.arDefault?.rotation ?? 0);
  const [opacity, setOpacity] = useState(0.95);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Drag tracking refs
  const dragStartRef = useRef({ startX: 0, startY: 0, initialPosX: 50, initialPosY: 38 });
  const viewportRef = useRef(null);

  /* ─── Media & Stream Refs ──────────────────────────── */
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ─── Stop Camera ───────────────────────────────────── */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  /* ─── Open Camera ───────────────────────────────────── */
  const openCamera = useCallback(async (mode = 'user') => {
    setError(null);
    setCapturedImage(null);

    if (!cameraSupported) {
      setError('Your browser does not support camera access. Try Chrome, Edge, or Firefox.');
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    const constraints = {
      video: {
        facingMode: mode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      setFacingMode(mode);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Click "Allow" in browser address bar or upload a photo.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera was detected on this device. You can still test Try-On using "Upload Photo" below.');
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
          }
          setCameraActive(true);
        } catch {
          setError('Camera could not be started. Please click "Upload Photo" to test virtual try-on.');
        }
      }
    }
  }, [cameraSupported]);

  /* ─── Auto-start & Clean-up ─────────────────────────── */
  useEffect(() => {
    if (cameraSupported) {
      openCamera('user');
    }
    return () => stopCamera();
  }, [cameraSupported, openCamera, stopCamera]);

  /* ─── Change Product Handler ────────────────────────── */
  function handleSelectProduct(prod) {
    setSelectedProduct(prod);
    setPosition({ x: prod.arDefault.x, y: prod.arDefault.y });
    setScale(prod.arDefault.scale);
    setRotation(prod.arDefault.rotation);
  }


  /* ─── Switch Camera ─────────────────────────────────── */
  async function switchCamera() {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    await openCamera(nextMode);
  }

  /* ─── Drag Handling (Pointer Events for Touch & Mouse) ── */
  function handlePointerDown(e) {
    if (!viewportRef.current) return;
    e.preventDefault();
    setIsDragging(true);

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialPosX: position.x,
      initialPosY: position.y,
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

    setPosition({ x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
  }

  function handlePointerUp() {
    setIsDragging(false);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }

  /* ─── Capture Photo with Composite AR Overlay ────────── */
  function capturePhoto() {
    if (!videoRef.current || !viewportRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // 1. Draw base video frame (flipped horizontally if front camera)
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    // Reset transform for overlay rendering
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // 2. Draw snapshot
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
  }

  /* ─── Upload Photo Fallback ─────────────────────────── */
  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  /* ─── Reset AR Position to Product Default ───────────── */
  function resetPosition() {
    setPosition({ x: selectedProduct.arDefault.x, y: selectedProduct.arDefault.y });
    setScale(selectedProduct.arDefault.scale);
    setRotation(selectedProduct.arDefault.rotation);
    setOpacity(0.95);
  }

  return (
    <section className="tryon-section" id="tryon" aria-label="Virtual Try-On Studio">
      <div className="container tryon-container">
        
        {/* Top Header */}
        <div className="tryon-topbar">
          <div className="tryon-badge-live">
            <span className="ar-pulse" />
            LIVE AR VIRTUAL TRY-ON
          </div>
          <h1 className="tryon-heading">
            Try on <span className="text-highlight">{selectedProduct.name}</span> in Real-Time
          </h1>
          <p className="tryon-subtext">
            See it on yourself with your camera feed. Drag to adjust, scale, or switch items below.
          </p>
        </div>

        {/* Studio Viewport & Controls Grid */}
        <div className="tryon-grid">
          
          {/* Main Camera / AR Stage */}
          <div className="tryon-stage-card">
            
            {/* Viewport Frame */}
            <div
              className={`tryon-viewport ${isDragging ? 'is-dragging' : ''}`}
              ref={viewportRef}
              aria-label="Camera AR Viewport"
            >
              {/* Error Notice */}
              {error && (
                <div className="tryon-error-banner" role="alert">
                  <span>⚠️ {error}</span>
                  <button className="btn btn-sm btn-outline" onClick={() => openCamera('user')}>
                    Retry Camera
                  </button>
                </div>
              )}

              {/* Inactive Standby Screen */}
              {!cameraActive && !capturedImage && !error && (
                <div className="tryon-standby">
                  <div className="standby-icon">📷</div>
                  <h3>Camera is Offline</h3>
                  <p>Turn on your camera to preview {selectedProduct.name} directly on yourself.</p>
                  <button className="btn btn-primary btn-lg" onClick={() => openCamera('user')}>
                    Start Camera Try-On
                  </button>
                </div>
              )}

              {/* Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`tryon-video ${cameraActive ? 'active' : ''}`}
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />

              {/* Captured Photo */}
              {capturedImage && !cameraActive && (
                <img
                  src={capturedImage}
                  alt="Captured Try-On Preview"
                  className="tryon-captured-photo"
                />
              )}

              {/* 🌟 LIVE AR OVERLAY ON CAMERA 🌟 */}
              {(cameraActive || capturedImage) && showOverlay && (
                <TryOnOverlay
                  product={selectedProduct}
                  position={position}
                  scale={scale}
                  rotation={rotation}
                  opacity={opacity}
                  isDragging={isDragging}
                  onPointerDown={handlePointerDown}
                />
              )}

              {/* Status Tags */}
              <div className="viewport-overlay-tags">
                {cameraActive && (
                  <div className="tag-live">
                    <span className="dot-red" /> LIVE CAMERA
                  </div>
                )}
                {capturedImage && !cameraActive && (
                  <div className="tag-snapshot">
                    📷 SNAPSHOT PREVIEW
                  </div>
                )}
                <div className="tag-item">
                  {selectedProduct.tryOnLabel} • Drag to Position
                </div>
              </div>

              {/* Viewport Floating Watermark */}
              <div className="viewport-branding">
                Smart<span>Cart</span> AR
              </div>
            </div>

            {/* Quick Action Toolbar directly under camera */}
            <div className="tryon-toolbar">
              {!cameraActive && (
                <button className="btn btn-primary" onClick={() => openCamera(facingMode)}>
                  📷 Open Camera
                </button>
              )}

              {cameraActive && (
                <>
                  <button className="btn btn-primary capture-action-btn" onClick={capturePhoto}>
                    <span className="capture-shutter-ring" />
                    Snap Photo
                  </button>
                  <button className="btn btn-outline" onClick={switchCamera} title="Flip Camera">
                    🔄 Flip
                  </button>
                  <button className="btn btn-outline stop-action-btn" onClick={stopCamera}>
                    ✕ Stop Camera
                  </button>
                </>
              )}

              {capturedImage && (
                <button className="btn btn-primary" onClick={() => openCamera(facingMode)}>
                  📷 Back to Live Camera
                </button>
              )}

              {/* Upload photo button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                id="photo-upload-input"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <label htmlFor="photo-upload-input" className="btn btn-outline upload-action-label">
                🖼 Upload My Photo
              </label>

              <button
                className={`btn btn-outline ${!showOverlay ? 'active-toggle' : ''}`}
                onClick={() => setShowOverlay(prev => !prev)}
                title="Toggle item visibility"
              >
                {showOverlay ? '👁 Hide Item' : '👁 Show Item'}
              </button>
            </div>
          </div>

          {/* Right Panel: AR Fit Controls & Instant Purchase */}
          <div className="tryon-sidebar">
            
            {/* Active Product Card */}
            <div className="ar-product-summary">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="ar-product-thumb"
              />
              <div className="ar-product-details">
                <span className="ar-category-pill">{selectedProduct.category}</span>
                <h3 className="ar-product-title">{selectedProduct.name}</h3>
                <div className="ar-price-row">
                  <span className="ar-price">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
                  {selectedProduct.originalPrice && (
                    <span className="ar-orig-price">₹{selectedProduct.originalPrice.toLocaleString('en-IN')}</span>
                  )}
                  <span className="ar-discount-tag">
                    {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}% OFF
                  </span>
                </div>
              </div>
            </div>

            {/* Live AR Adjustments */}
            <div className="ar-controls-box">
              <div className="ar-controls-header">
                <h4>📐 Fine-Tune Fit & Placement</h4>
                <button className="btn-link-reset" onClick={resetPosition}>
                  Reset Auto-Fit
                </button>
              </div>

              {/* Size / Scale Slider */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>Size & Scale</span>
                  <span className="slider-val">{Math.round(scale * 100)}%</span>
                </div>
                <div className="slider-input-wrapper">
                  <button className="stepper-btn" onClick={() => setScale(s => Math.max(0.4, s - 0.05))}>−</button>
                  <input
                    type="range"
                    min="0.4"
                    max="2.2"
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="ar-slider"
                  />
                  <button className="stepper-btn" onClick={() => setScale(s => Math.min(2.2, s + 0.05))}>+</button>
                </div>
              </div>

              {/* Rotation Slider */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>Tilt / Rotation</span>
                  <span className="slider-val">{rotation}°</span>
                </div>
                <div className="slider-input-wrapper">
                  <button className="stepper-btn" onClick={() => setRotation(r => Math.max(-45, r - 5))}>↺</button>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="2"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                    className="ar-slider"
                  />
                  <button className="stepper-btn" onClick={() => setRotation(r => Math.min(45, r + 5))}>↻</button>
                </div>
              </div>

              {/* Transparency Slider */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>Overlay Opacity</span>
                  <span className="slider-val">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="ar-slider"
                />
              </div>

              <div className="ar-hint">
                💡 <strong>Tip:</strong> Click & drag directly on the video screen to move the item onto your face or body!
              </div>
            </div>

            {/* Direct Purchase Actions */}
            <div className="ar-actions-card">
              <button
                className="btn btn-primary btn-block ar-cart-btn"
                onClick={() => onAddToCart && onAddToCart(selectedProduct)}
              >
                🛒 Add to Cart • ₹{selectedProduct.price.toLocaleString('en-IN')}
              </button>
              <button
                className="btn btn-secondary btn-block ar-buy-btn"
                onClick={() => onBuyNow && onBuyNow(selectedProduct)}
              >
                ⚡ Buy Now with Instant Checkout
              </button>
            </div>

            {/* AWS AI Cloud Try-On Note */}
            <div className="ar-cloud-badge">
              <span className="cloud-icon">☁️</span>
              <div>
                <strong>AWS Rekognition / Bedrock Ready</strong>
                <p>Connect backend to unlock automated facial landmark tracking & body silhouette mapping.</p>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Swappable Products Carousel */}
        <div className="tryon-carousel-section">
          <div className="carousel-title-row">
            <h3>⚡ Switch Items on Camera</h3>
            <span className="carousel-subtitle">Tap any product to immediately wear it on your camera</span>
          </div>

          <div className="tryon-carousel-track">
            {products.map(p => {
              const isSelected = selectedProduct.id === p.id;
              return (
                <button
                  key={p.id}
                  className={`carousel-item-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectProduct(p)}
                >
                  <div className="carousel-item-img-box">
                    <img src={p.image} alt={p.name} />
                    {isSelected && <span className="carousel-active-badge">Active</span>}
                  </div>
                  <div className="carousel-item-meta">
                    <span className="carousel-item-name">{p.tryOnLabel}</span>
                    <span className="carousel-item-price">₹{p.price}</span>
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
