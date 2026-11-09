import { useState, useRef, useEffect } from 'react';
import { products } from '../data/products.js';
import './AIBargainModal.css';

export default function AIBargainModal({
  isOpen,
  onClose,
  initialProduct = null,
  onApplyDiscount,
}) {
  const [selectedProduct, setSelectedProduct] = useState(initialProduct || products[0]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unlockedDeal, setUnlockedDeal] = useState(null);
  const [messages, setMessages] = useState(() => {
    const prod = initialProduct || products[0];
    return [
      {
        id: 1,
        sender: 'ai',
        text: `Hello! I'm BargainBot, your personal SmartCart AI deal negotiator.\n\nI see you're eyeing the ${prod.name} for ₹${prod.price.toLocaleString('en-IN')}. What's your target offer? Make me a pitch and let's strike a deal!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });
  const messagesEndRef = useRef(null);

  function handleProductChange(newProd) {
    setSelectedProduct(newProd);
    setUnlockedDeal(null);
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        text: `Switched to ${newProd.name} (listed at ₹${newProd.price.toLocaleString('en-IN')}). What price would you like to offer?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  function evaluateOffer(userText) {
    const numbers = userText.match(/\d+/g);
    const prod = selectedProduct;
    const basePrice = prod.price;

    let targetPrice = null;
    if (numbers && numbers.length > 0) {
      // Find the number closest to the product price range
      const parsed = numbers.map(n => parseInt(n, 10)).filter(n => n > 50 && n < basePrice * 2);
      if (parsed.length > 0) {
        targetPrice = parsed[0];
      }
    }

    if (!targetPrice) {
      // Generic conversational answer
      return {
        reply: `I love the spirit! But give me a number to work with. How much are you willing to pay for the ${prod.name} (regular price: ₹${basePrice})?`,
        deal: null,
      };
    }

    const discountRatio = (basePrice - targetPrice) / basePrice;

    // Condition 1: Higher than price or exact
    if (targetPrice >= basePrice) {
      return {
        reply: `That's generous of you! You can buy it right now for the listed price of ₹${basePrice}, but as an AI friend, I'll give you an instant 5% loyalty bonus coupon!`,
        deal: {
          code: 'LOYALTY5',
          discountPercent: 5,
          finalPrice: Math.round(basePrice * 0.95),
        },
      };
    }

    // Condition 2: Sweet spot (5% to 22% discount) -> ACCEPT!
    if (discountRatio > 0 && discountRatio <= 0.22) {
      const percent = Math.round(discountRatio * 100);
      return {
        reply: `You drive a solid bargain, and I like your style! Deal accepted at ₹${targetPrice.toLocaleString('en-IN')} (${percent}% OFF)!\n\nUse the coupon code below at checkout to claim this exclusive price.`,
        deal: {
          code: `DEAL${percent}`,
          discountPercent: percent,
          finalPrice: targetPrice,
        },
      };
    }

    // Condition 3: Slightly too ambitious (23% to 40% discount) -> Counter-offer!
    if (discountRatio > 0.22 && discountRatio <= 0.45) {
      const counterPrice = Math.round(basePrice * 0.82); // 18% off
      return {
        reply: `₹${targetPrice} is a bit steep for manager approval.\n\nHow about we meet in the middle? I can do ₹${counterPrice.toLocaleString('en-IN')} (18% OFF) if you complete checkout today! Do we have a deal?`,
        deal: {
          code: 'SMART18',
          discountPercent: 18,
          finalPrice: counterPrice,
        },
      };
    }

    // Condition 4: Extreme low-ball (> 45% discount) -> Respectful counter + VIP offer
    const vipPrice = Math.round(basePrice * 0.80); // 20% off maximum
    return {
      reply: `₹${targetPrice} is below our manufacturing and craftsmanship cost.\n\nThe absolute best VIP discount my algorithms can unlock is ₹${vipPrice.toLocaleString('en-IN')} (20% OFF). That's our guaranteed rock-bottom price!`,
      deal: {
        code: 'VIPBOT20',
        discountPercent: 20,
        finalPrice: vipPrice,
      },
    };
  }

  function handleSendMessage(textToSend = null) {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // AI typing delay simulation
    setTimeout(() => {
      const evaluation = evaluateOffer(text);
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: evaluation.reply,
        deal: evaluation.deal,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setIsTyping(false);
      setMessages(prev => [...prev, aiMsg]);

      if (evaluation.deal) {
        setUnlockedDeal(evaluation.deal);
      }
    }, 700);
  }

  function handleQuickOffer(discountPercent) {
    const offerPrice = Math.round(selectedProduct.price * (1 - discountPercent / 100));
    handleSendMessage(`How about ₹${offerPrice} (${discountPercent}% OFF)?`);
  }

  function handleClaimDeal() {
    if (unlockedDeal && onApplyDiscount) {
      onApplyDiscount(unlockedDeal.code, unlockedDeal.discountPercent, selectedProduct);
      onClose();
    }
  }

  return (
    <div className="bargain-modal-overlay" role="dialog" aria-modal="true" aria-label="Bargain with AI">
      <div className="bargain-modal-box">
        
        {/* Header */}
        <div className="bargain-header">
          <div className="bargain-header-brand">
            <span className="bot-status-dot" />
            <div className="bot-avatar-ring">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2"/>
                <circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
              </svg>
            </div>
            <div>
              <h3>Bargain with SmartCart AI</h3>
              <p className="bot-status-text">Active AI Negotiator • Online</p>
            </div>
          </div>
          <button className="bargain-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Product Being Negotiated Banner */}
        <div className="bargain-product-banner">
          <img src={selectedProduct.image} alt={selectedProduct.name} className="bargain-product-img" />
          <div className="bargain-product-info">
            <div className="bargain-product-title-row">
              <span className="bargain-product-name">{selectedProduct.name}</span>
              <span className="bargain-product-price">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
            </div>
            <p className="bargain-product-sub">Category: {selectedProduct.category} • Original Price: ₹{selectedProduct.originalPrice}</p>
          </div>

          {/* Switch product dropdown */}
          <select
            className="bargain-product-picker"
            value={selectedProduct.id}
            onChange={(e) => {
              const found = products.find(p => p.id === parseInt(e.target.value, 10));
              if (found) handleProductChange(found);
            }}
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>Switch: {p.name} (₹{p.price})</option>
            ))}
          </select>
        </div>

        {/* Chat History Messages */}
        <div className="bargain-chat-body">
          {messages.map(msg => (
            <div key={msg.id} className={`bargain-msg-row ${msg.sender}`}>
              {msg.sender === 'ai' && (
                <div className="msg-avatar ai">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                    <circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>
                  </svg>
                </div>
              )}
              <div className="msg-bubble">
                <div className="msg-text">{msg.text}</div>
                {msg.deal && (
                  <div className="deal-unlock-card">
                    <div className="deal-unlock-tag">EXCLUSIVE OFFER UNLOCKED</div>
                    <div className="deal-code-pill">
                      <span>COUPON: <strong>{msg.deal.code}</strong></span>
                      <span className="deal-save-badge">{msg.deal.discountPercent}% OFF</span>
                    </div>
                    <div className="deal-price-row">
                      <span>Your Negotiated Price:</span>
                      <span className="deal-final-price">₹{msg.deal.finalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="bargain-msg-row ai">
              <div className="msg-avatar ai">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2"/>
                  <circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>
                </svg>
              </div>
              <div className="msg-bubble typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Offer Suggestion Pills */}
        <div className="bargain-quick-offers">
          <span className="quick-label">Quick Pitches:</span>
          <button className="quick-chip" onClick={() => handleQuickOffer(10)}>
            ₹{Math.round(selectedProduct.price * 0.90)} (10% OFF)
          </button>
          <button className="quick-chip" onClick={() => handleQuickOffer(15)}>
            ₹{Math.round(selectedProduct.price * 0.85)} (15% OFF)
          </button>
          <button className="quick-chip" onClick={() => handleQuickOffer(20)}>
            ₹{Math.round(selectedProduct.price * 0.80)} (20% OFF)
          </button>
        </div>

        {/* Action / Claim Footer */}
        {unlockedDeal ? (
          <div className="bargain-claim-bar">
            <div className="claim-info">
              <span>Deal Active: <strong>{unlockedDeal.discountPercent}% OFF</strong> with code <code>{unlockedDeal.code}</code></span>
            </div>
            <button className="btn btn-primary claim-deal-btn" onClick={handleClaimDeal}>
              Apply Deal & Add to Cart (₹{unlockedDeal.finalPrice.toLocaleString('en-IN')})
            </button>
          </div>
        ) : (
          <form
            className="bargain-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              placeholder={`e.g. Can you do ₹${Math.round(selectedProduct.price * 0.85)}?`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="bargain-input"
            />
            <button type="submit" className="btn btn-primary bargain-send-btn">
              Pitch Offer
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
