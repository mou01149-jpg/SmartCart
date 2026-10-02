import { useState } from 'react';
import './Checkout.css';

export default function Checkout({
  cart,
  user,
  onOpenAuth,
  onOrderPlaced,
  onCancel,
}) {
  // Step control: 1 (Login), 2 (Address), 3 (Summary), 4 (Payment)
  const [currentStep, setCurrentStep] = useState(user ? 2 : 1);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  // Address state
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: user ? user.name : 'Rahul Sharma',
      phone: user && user.phone ? user.phone : '+91 98765 43210',
      pincode: '560103',
      locality: 'Outer Ring Road, Bellandur',
      address: 'Flat 402, Green Glen Heights, Near Ecospace',
      city: 'Bengaluru',
      state: 'Karnataka',
      type: 'Home',
    },
  ]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: '',
    phone: '',
    pincode: '',
    locality: '',
    address: '',
    city: '',
    state: '',
    type: 'Home',
  });

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('upi'); // upi | card | netbanking | cod
  const [upiOption, setUpiOption] = useState('gpay'); // gpay | phonepe | paytm | id | qr
  const [customUpiId, setCustomUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [codCaptcha, setCodCaptcha] = useState('');
  const [generatedCaptcha] = useState(() => Math.floor(100 + Math.random() * 900).toString());

  // Processing & Gateway Modal State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  // Calculate pricing
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discount = Math.round(subtotal * 0.15); // Flipkart style 15% promotional discount
  const deliveryCharge = subtotal >= 999 ? 0 : 99;
  const gst = Math.round((subtotal - discount) * 0.18);
  const finalTotal = subtotal - discount + deliveryCharge + gst;

  /* ─── Address Handlers ────────────────────────────────── */
  function handleSaveNewAddress(e) {
    e.preventDefault();
    if (!newAddr.name || !newAddr.phone || !newAddr.pincode || !newAddr.address) {
      alert('Please fill all required address fields.');
      return;
    }
    const added = { ...newAddr, id: Date.now() };
    setAddresses(prev => [...prev, added]);
    setSelectedAddressIndex(addresses.length);
    setShowNewAddressForm(false);
  }

  /* ─── Payment Execution Simulation ───────────────────── */
  function handleProceedToPay() {
    if (paymentMethod === 'cod' && codCaptcha !== generatedCaptcha) {
      alert(`Invalid captcha. Please enter "${generatedCaptcha}" to confirm COD.`);
      return;
    }

    if (paymentMethod === 'upi' && upiOption === 'id' && !customUpiId.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. user@okhdfcbank)');
      return;
    }

    if (paymentMethod === 'card' && cardDetails.number.replace(/\s/g, '').length < 16) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }

    // Launch Gateway Simulator
    setIsProcessing(true);
    setProcessingStage('Connecting to SmartCart 256-Bit Encrypted Gateway...');

    setTimeout(() => {
      setProcessingStage(
        paymentMethod === 'upi'
          ? `Authenticating with ${upiOption.toUpperCase()} UPI Gateway...`
          : paymentMethod === 'card'
          ? 'Authorizing with Visa / Mastercard 3D Secure...'
          : paymentMethod === 'netbanking'
          ? `Contacting ${selectedBank} Net Banking Server...`
          : 'Verifying Cash On Delivery Verification...'
      );
    }, 900);

    setTimeout(() => {
      setProcessingStage('Verifying token and authorizing amount...');
    }, 1800);

    setTimeout(() => {
      // Order completed
      const order = {
        orderId: `OD${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        items: [...cart],
        amount: finalTotal,
        paymentMethod:
          paymentMethod === 'upi'
            ? `UPI (${upiOption.toUpperCase()})`
            : paymentMethod === 'card'
            ? `Card (ending in ${cardDetails.number.slice(-4) || '4242'})`
            : paymentMethod === 'netbanking'
            ? `Net Banking (${selectedBank})`
            : 'Cash on Delivery (COD)',
        shippingAddress: addresses[selectedAddressIndex] || addresses[0],
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        estimatedDelivery: 'Tomorrow, by 8:00 PM',
        status: 'Order Confirmed',
      };

      setIsProcessing(false);
      setCompletedOrder(order);
      if (onOrderPlaced) onOrderPlaced(order);
    }, 2800);
  }

  /* ─── Render Order Confirmation View ─────────────────── */
  if (completedOrder) {
    return (
      <div className="order-success-screen container">
        <div className="success-card">
          <div className="success-anim-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <span className="success-tag">PAYMENT SUCCESSFUL</span>
          <h2 className="success-title">Order Placed Successfully!</h2>
          <p className="success-sub">
            Order ID: <strong>{completedOrder.orderId}</strong> • Confirmation SMS & Email sent
          </p>

          {/* Delivery estimate */}
          <div className="delivery-banner">
            <span>📦 Estimated Delivery:</span>
            <strong>{completedOrder.estimatedDelivery}</strong>
          </div>

          {/* Flipkart Style Order Tracker Steps */}
          <div className="order-tracker">
            <div className="tracker-step active">
              <div className="step-circle">✓</div>
              <span>Confirmed</span>
            </div>
            <div className="tracker-line active" />
            <div className="tracker-step active">
              <div className="step-circle">●</div>
              <span>Packing</span>
            </div>
            <div className="tracker-line" />
            <div className="tracker-step">
              <div className="step-circle">○</div>
              <span>Shipped</span>
            </div>
            <div className="tracker-line" />
            <div className="tracker-step">
              <div className="step-circle">○</div>
              <span>Delivered</span>
            </div>
          </div>

          {/* Items Summary */}
          <div className="success-items-list">
            <h4>Ordered Items ({completedOrder.items.length})</h4>
            {completedOrder.items.map((it) => (
              <div key={it.id} className="success-item-row">
                <img src={it.image} alt={it.name} className="success-item-img" />
                <div className="success-item-info">
                  <div className="success-item-name">{it.name}</div>
                  <div className="success-item-qty">Qty: {it.quantity} • ₹{it.price} each</div>
                </div>
                <div className="success-item-price">
                  ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery & Payment details */}
          <div className="success-details-grid">
            <div className="details-col">
              <h5>Delivery Address</h5>
              <p><strong>{completedOrder.shippingAddress.name}</strong></p>
              <p>{completedOrder.shippingAddress.address}, {completedOrder.shippingAddress.locality}</p>
              <p>{completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.state} - {completedOrder.shippingAddress.pincode}</p>
              <p>Phone: {completedOrder.shippingAddress.phone}</p>
            </div>
            <div className="details-col">
              <h5>Payment Mode</h5>
              <p><strong>{completedOrder.paymentMethod}</strong></p>
              <p>Total Paid: <span className="paid-amount">₹{completedOrder.amount.toLocaleString('en-IN')}</span></p>
              <p className="invoice-note">✓ Tax Invoice Generated</p>
            </div>
          </div>

          {/* Actions */}
          <div className="success-actions">
            <button
              className="btn btn-outline"
              onClick={() => alert(`Receipt downloaded for Order #${completedOrder.orderId}`)}
            >
              📄 Download Invoice
            </button>
            <button className="btn btn-primary" onClick={onCancel}>
              ← Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page container">
      
      {/* Processing Modal Overlay */}
      {isProcessing && (
        <div className="gateway-modal-overlay">
          <div className="gateway-modal-box">
            <div className="gateway-logo">
              🛒 Smart<span>Cart</span> Secure Gateway
            </div>
            <div className="gateway-spinner-ring" />
            <h3>Processing Payment</h3>
            <p className="gateway-stage-text">{processingStage}</p>
            <div className="gateway-trust-banner">
              🔒 256-Bit SSL Encryption • PCI-DSS Certified
            </div>
          </div>
        </div>
      )}

      {/* Main Checkout Grid */}
      <div className="checkout-grid">
        
        {/* Left Side: 4 Steps Accordion */}
        <div className="checkout-steps-column">
          
          {/* STEP 1: LOGIN */}
          <div className={`checkout-step-card ${currentStep === 1 ? 'open' : 'completed'}`}>
            <div className="step-header">
              <span className="step-number">1</span>
              <div className="step-title-wrap">
                <span className="step-title">LOGIN</span>
                {user ? (
                  <span className="step-summary-text">
                    {user.name} ({user.phone || user.contact})
                  </span>
                ) : (
                  <span className="step-summary-text">Login to access saved addresses and orders</span>
                )}
              </div>
              {user && currentStep > 1 && (
                <button className="btn-step-action" onClick={() => setCurrentStep(1)}>
                  CHANGE
                </button>
              )}
            </div>

            {currentStep === 1 && (
              <div className="step-body">
                {user ? (
                  <div className="logged-in-user-box">
                    <p>Logged in as <strong>{user.name}</strong> ({user.phone || user.contact})</p>
                    <button className="btn btn-primary" onClick={() => setCurrentStep(2)}>
                      CONTINUE TO DELIVERY ADDRESS
                    </button>
                  </div>
                ) : (
                  <div className="guest-login-box">
                    <p>Please log in for a seamless shopping experience:</p>
                    <div className="login-prompt-actions">
                      <button className="btn btn-primary" onClick={onOpenAuth}>
                        Log in / Sign up
                      </button>
                      <button className="btn btn-outline" onClick={() => setCurrentStep(2)}>
                        Continue as Guest
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: DELIVERY ADDRESS */}
          <div className={`checkout-step-card ${currentStep === 2 ? 'open' : currentStep > 2 ? 'completed' : 'locked'}`}>
            <div className="step-header">
              <span className="step-number">2</span>
              <div className="step-title-wrap">
                <span className="step-title">DELIVERY ADDRESS</span>
                {currentStep > 2 && addresses[selectedAddressIndex] && (
                  <span className="step-summary-text">
                    {addresses[selectedAddressIndex].name}, {addresses[selectedAddressIndex].locality}, {addresses[selectedAddressIndex].city} - {addresses[selectedAddressIndex].pincode}
                  </span>
                )}
              </div>
              {currentStep > 2 && (
                <button className="btn-step-action" onClick={() => setCurrentStep(2)}>
                  CHANGE
                </button>
              )}
            </div>

            {currentStep === 2 && (
              <div className="step-body">
                {/* Address List */}
                <div className="addresses-list">
                  {addresses.map((addr, idx) => (
                    <label
                      key={addr.id}
                      className={`address-option-card ${selectedAddressIndex === idx ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="delivery_address"
                        checked={selectedAddressIndex === idx}
                        onChange={() => setSelectedAddressIndex(idx)}
                      />
                      <div className="address-details">
                        <div className="addr-top-line">
                          <span className="addr-name">{addr.name}</span>
                          <span className="addr-type-pill">{addr.type}</span>
                          <span className="addr-phone">{addr.phone}</span>
                        </div>
                        <p className="addr-street">
                          {addr.address}, {addr.locality}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                        </p>
                        {selectedAddressIndex === idx && (
                          <button
                            className="btn btn-primary deliver-here-btn"
                            onClick={() => setCurrentStep(3)}
                          >
                            DELIVER HERE
                          </button>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Add New Address Accordion */}
                {!showNewAddressForm ? (
                  <button
                    className="btn-add-address"
                    onClick={() => setShowNewAddressForm(true)}
                  >
                    + Add a new address
                  </button>
                ) : (
                  <form onSubmit={handleSaveNewAddress} className="new-address-form">
                    <h4>Add a New Delivery Address</h4>
                    <div className="form-row">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        required
                        value={newAddr.name}
                        onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      />
                      <input
                        type="tel"
                        placeholder="10-digit mobile number *"
                        required
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="text"
                        placeholder="Pincode *"
                        required
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Locality / Area *"
                        required
                        value={newAddr.locality}
                        onChange={(e) => setNewAddr({ ...newAddr, locality: e.target.value })}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Flat, House no., Building, Company, Apartment *"
                      required
                      value={newAddr.address}
                      onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                    />
                    <div className="form-row">
                      <input
                        type="text"
                        placeholder="City / District *"
                        required
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="State *"
                        required
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        SAVE AND DELIVER HERE
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setShowNewAddressForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: ORDER SUMMARY */}
          <div className={`checkout-step-card ${currentStep === 3 ? 'open' : currentStep > 3 ? 'completed' : 'locked'}`}>
            <div className="step-header">
              <span className="step-number">3</span>
              <div className="step-title-wrap">
                <span className="step-title">ORDER SUMMARY</span>
                {currentStep > 3 && (
                  <span className="step-summary-text">{totalItems} Item(s)</span>
                )}
              </div>
              {currentStep > 3 && (
                <button className="btn-step-action" onClick={() => setCurrentStep(3)}>
                  CHANGE
                </button>
              )}
            </div>

            {currentStep === 3 && (
              <div className="step-body">
                <div className="order-items-scroll">
                  {cart.map((item) => (
                    <div key={item.id} className="order-summary-item">
                      <img src={item.image} alt={item.name} className="item-thumb" />
                      <div className="item-meta">
                        <div className="item-name">{item.name}</div>
                        <div className="item-seller">Seller: SmartCart Retail</div>
                        <div className="item-prices">
                          <span className="item-price">₹{item.price}</span>
                          {item.originalPrice && (
                            <span className="item-orig">₹{item.originalPrice}</span>
                          )}
                          <span className="item-qty">Qty: {item.quantity}</span>
                        </div>
                        <div className="delivery-timing">
                          🚚 Delivery by Tomorrow, Free
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-email-notification">
                  Order confirmation email will be sent to <strong>{user?.email || 'your registered email'}</strong>
                </div>

                <button
                  className="btn btn-primary continue-to-pay-btn"
                  onClick={() => setCurrentStep(4)}
                >
                  CONTINUE TO PAYMENT
                </button>
              </div>
            )}
          </div>

          {/* STEP 4: PAYMENT OPTIONS (PAYMENT GATEWAY) */}
          <div className={`checkout-step-card ${currentStep === 4 ? 'open' : 'locked'}`}>
            <div className="step-header">
              <span className="step-number">4</span>
              <div className="step-title-wrap">
                <span className="step-title">PAYMENT OPTIONS</span>
                <span className="step-summary-text">100% Safe and Secure Payments</span>
              </div>
            </div>

            {currentStep === 4 && (
              <div className="step-body payment-gateway-body">
                
                {/* Method 1: UPI */}
                <div className={`payment-method-box ${paymentMethod === 'upi' ? 'active' : ''}`}>
                  <label className="method-label">
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                    />
                    <span className="method-name">UPI (Google Pay, PhonePe, Paytm, QR)</span>
                    <span className="method-badge-fast">⚡ Instant</span>
                  </label>

                  {paymentMethod === 'upi' && (
                    <div className="method-content">
                      <div className="upi-app-options">
                        <label className={`upi-app-chip ${upiOption === 'gpay' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="upi_app"
                            checked={upiOption === 'gpay'}
                            onChange={() => setUpiOption('gpay')}
                          />
                          <span>Google Pay</span>
                        </label>
                        <label className={`upi-app-chip ${upiOption === 'phonepe' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="upi_app"
                            checked={upiOption === 'phonepe'}
                            onChange={() => setUpiOption('phonepe')}
                          />
                          <span>PhonePe</span>
                        </label>
                        <label className={`upi-app-chip ${upiOption === 'paytm' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="upi_app"
                            checked={upiOption === 'paytm'}
                            onChange={() => setUpiOption('paytm')}
                          />
                          <span>Paytm UPI</span>
                        </label>
                        <label className={`upi-app-chip ${upiOption === 'qr' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="upi_app"
                            checked={upiOption === 'qr'}
                            onChange={() => setUpiOption('qr')}
                          />
                          <span>Scan QR Code</span>
                        </label>
                        <label className={`upi-app-chip ${upiOption === 'id' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="upi_app"
                            checked={upiOption === 'id'}
                            onChange={() => setUpiOption('id')}
                          />
                          <span>Enter UPI ID</span>
                        </label>
                      </div>

                      {upiOption === 'qr' && (
                        <div className="upi-qr-card">
                          <div className="qr-box">
                            <svg width="120" height="120" viewBox="0 0 100 100" fill="#1e1b4b">
                              <rect x="10" y="10" width="24" height="24" fill="#000" />
                              <rect x="14" y="14" width="16" height="16" fill="#fff" />
                              <rect x="18" y="18" width="8" height="8" fill="#000" />
                              <rect x="66" y="10" width="24" height="24" fill="#000" />
                              <rect x="70" y="14" width="16" height="16" fill="#fff" />
                              <rect x="74" y="18" width="8" height="8" fill="#000" />
                              <rect x="10" y="66" width="24" height="24" fill="#000" />
                              <rect x="14" y="70" width="16" height="16" fill="#fff" />
                              <rect x="18" y="74" width="8" height="8" fill="#000" />
                              <rect x="42" y="20" width="8" height="16" fill="#000" />
                              <rect x="52" y="44" width="14" height="12" fill="#000" />
                              <rect x="70" y="66" width="16" height="20" fill="#000" />
                              <rect x="44" y="70" width="12" height="14" fill="#000" />
                            </svg>
                          </div>
                          <p>Scan with any UPI app to pay <strong>₹{finalTotal.toLocaleString('en-IN')}</strong></p>
                        </div>
                      )}

                      {upiOption === 'id' && (
                        <div className="upi-id-input-box">
                          <input
                            type="text"
                            placeholder="Enter your UPI ID (e.g. mobile@upi)"
                            value={customUpiId}
                            onChange={(e) => setCustomUpiId(e.target.value)}
                          />
                        </div>
                      )}

                      <button className="btn btn-primary pay-now-btn" onClick={handleProceedToPay}>
                        PAY ₹{finalTotal.toLocaleString('en-IN')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Method 2: Credit / Debit / ATM Card */}
                <div className={`payment-method-box ${paymentMethod === 'card' ? 'active' : ''}`}>
                  <label className="method-label">
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <span className="method-name">Credit / Debit / ATM Card</span>
                    <span className="card-icons-badge">Visa • Mastercard • RuPay</span>
                  </label>

                  {paymentMethod === 'card' && (
                    <div className="method-content card-form-grid">
                      <div className="card-input-full">
                        <label>Card Number</label>
                        <input
                          type="text"
                          maxLength={19}
                          placeholder="4532  ••••  ••••  8910"
                          value={cardDetails.number}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                            const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
                            setCardDetails({ ...cardDetails, number: formatted });
                          }}
                        />
                      </div>
                      <div className="card-input-half">
                        <label>Valid Thru (MM/YY)</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="12/28"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        />
                      </div>
                      <div className="card-input-half">
                        <label>CVV (3 Digits)</label>
                        <input
                          type="password"
                          maxLength={3}
                          placeholder="•••"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        />
                      </div>
                      <div className="card-input-full">
                        <label>Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="e.g. RAHUL SHARMA"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        />
                      </div>

                      <button className="btn btn-primary pay-now-btn" onClick={handleProceedToPay}>
                        PAY ₹{finalTotal.toLocaleString('en-IN')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Method 3: Net Banking */}
                <div className={`payment-method-box ${paymentMethod === 'netbanking' ? 'active' : ''}`}>
                  <label className="method-label">
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={paymentMethod === 'netbanking'}
                      onChange={() => setPaymentMethod('netbanking')}
                    />
                    <span className="method-name">Net Banking</span>
                  </label>

                  {paymentMethod === 'netbanking' && (
                    <div className="method-content">
                      <div className="bank-selection-grid">
                        {['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            className={`bank-chip ${selectedBank === b ? 'selected' : ''}`}
                            onClick={() => setSelectedBank(b)}
                          >
                            🏦 {b} Bank
                          </button>
                        ))}
                      </div>
                      <button className="btn btn-primary pay-now-btn" onClick={handleProceedToPay}>
                        PAY ₹{finalTotal.toLocaleString('en-IN')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Method 4: Cash on Delivery (COD) */}
                <div className={`payment-method-box ${paymentMethod === 'cod' ? 'active' : ''}`}>
                  <label className="method-label">
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <span className="method-name">Cash on Delivery</span>
                  </label>

                  {paymentMethod === 'cod' && (
                    <div className="method-content cod-content">
                      <p>Due to handling costs, nominal ₹50 COD fee may apply or free above ₹999.</p>
                      <div className="cod-captcha-box">
                        <span className="captcha-display">{generatedCaptcha}</span>
                        <input
                          type="text"
                          placeholder="Enter characters"
                          value={codCaptcha}
                          onChange={(e) => setCodCaptcha(e.target.value)}
                        />
                      </div>
                      <button className="btn btn-primary pay-now-btn" onClick={handleProceedToPay}>
                        CONFIRM ORDER
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Right Side: Flipkart Style Price Details Card */}
        <aside className="checkout-price-card">
          <h3 className="price-header">PRICE DETAILS</h3>

          <div className="price-row">
            <span>Price ({totalItems} items)</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="price-row green-text">
            <span>Discount</span>
            <span>− ₹{discount.toLocaleString('en-IN')}</span>
          </div>

          <div className="price-row">
            <span>Delivery Charges</span>
            <span className={deliveryCharge === 0 ? 'green-text' : ''}>
              {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
            </span>
          </div>

          <div className="price-row">
            <span>Tax (18% GST)</span>
            <span>₹{gst.toLocaleString('en-IN')}</span>
          </div>

          <div className="price-divider" />

          <div className="price-total-row">
            <span>Total Payable</span>
            <span className="total-highlight">₹{finalTotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="savings-banner">
            🎉 You will save ₹{discount.toLocaleString('en-IN')} on this order
          </div>

          <div className="safety-guarantee">
            <span className="shield-icon">🛡️</span>
            <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
          </div>
        </aside>

      </div>
    </div>
  );
}
