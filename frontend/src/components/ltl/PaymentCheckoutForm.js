import React, { useState } from 'react';
import { CreditCard, Building, Zap, FileText, ChevronDown, ChevronRight, Download, CheckCircle, Mail, MessageCircle, Gift, Lock } from 'lucide-react';

const RECHARGE_TIERS = [
  { amount: 2000, bonus: 2, total: 2040 },
  { amount: 5000, bonus: 2.5, total: 5125 },
  { amount: 7500, bonus: 3, total: 7725 },
  { amount: 10000, bonus: 3.5, total: 10350 },
  { amount: 15000, bonus: 4, total: 15600 },
];

const PaymentCheckoutForm = ({ selectedQuote, formData, shipmentDetails, onSubmit, onBack, isSubmitting }) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showWireDetails, setShowWireDetails] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!paymentMethod) { alert('Please select a payment method'); return; }
    if (!agreedToTerms) { alert('Please agree to the payment terms'); return; }
    onSubmit(e, paymentMethod);
  };

  const origin = formData?.origin || [shipmentDetails?.pickupCity, shipmentDetails?.pickupState].filter(Boolean).join(', ') || '—';
  const dest = formData?.destination || [shipmentDetails?.deliveryCity, shipmentDetails?.deliveryState].filter(Boolean).join(', ') || '—';

  return (
    <div className="payment-checkout-form">
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem', color: '#1d2939' }}>Payment & Checkout</h2>

      {/* Order Summary */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#15803d' }}>Order Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', fontSize: '0.88rem' }}>
          {selectedQuote && (
            <>
              <div><span style={{ color: '#6b7280' }}>Carrier:</span> <strong>{selectedQuote.carrier}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Price:</span> <strong style={{ color: '#16a34a', fontSize: '1.1rem' }}>${(selectedQuote.price || 0).toFixed(2)}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Transit:</span> <strong>{selectedQuote.transitDays || 'TBD'}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Service:</span> <strong>{selectedQuote.serviceLevel || selectedQuote.serviceType || 'Standard LTL'}</strong></div>
            </>
          )}
          <div><span style={{ color: '#6b7280' }}>Route:</span> <strong>{origin} → {dest}</strong></div>
          {shipmentDetails?.companyName && <div><span style={{ color: '#6b7280' }}>Company:</span> <strong>{shipmentDetails.companyName}</strong></div>}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#1d2939' }}>Select Payment Method</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { id: 'zelle', label: 'Zelle', icon: <Zap size={18} />, desc: 'Instant transfer' },
            { id: 'wire', label: 'Wire Transfer', icon: <Building size={18} />, desc: 'Bank wire (domestic/intl)' },
            { id: 'ach', label: 'ACH Transfer', icon: <CreditCard size={18} />, desc: 'US bank transfer' },
            { id: 'stripe', label: 'Credit / Debit Card', icon: <Lock size={18} />, desc: 'Visa, Mastercard, Amex' },
            { id: 'prepaid', label: 'Prepaid Balance', icon: <CheckCircle size={18} />, desc: 'Use prepaid credits' },
          ].map(method => (
            <label key={method.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '0.85rem 1rem',
                border: paymentMethod === method.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: 10, cursor: 'pointer', background: paymentMethod === method.id ? '#eff6ff' : '#fff',
                transition: 'all 0.15s',
              }}>
              <input type="radio" name="paymentMethod" value={method.id} checked={paymentMethod === method.id}
                onChange={() => setPaymentMethod(method.id)} style={{ display: 'none' }} />
              <div style={{ color: paymentMethod === method.id ? '#2563eb' : '#6b7280' }}>{method.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: paymentMethod === method.id ? '#1d4ed8' : '#374151' }}>{method.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{method.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Details based on selection */}
      {paymentMethod === 'zelle' && (
        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#7c3aed' }}>Zelle Payment</h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Send payment to:</p>
          <div style={{ marginTop: 8, padding: '0.75rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #e9d5ff' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: '0.78rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>Company Name:</span>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#5b21b6' }}>EW Logistics Group Inc</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>Zelle Email:</span>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#5b21b6' }}>ceo.ewlogistics@gmail.com</span>
            </div>
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Please include your order number in the memo.</p>
        </div>
      )}

      {(paymentMethod === 'wire' || paymentMethod === 'ach') && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#0369a1' }}>
            {paymentMethod === 'wire' ? 'Wire Transfer' : 'ACH Transfer'} Details
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1.5rem', fontSize: '0.85rem', padding: '0.75rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #bae6fd' }}>
            <div><span style={{ color: '#6b7280' }}>Beneficiary:</span><br /><strong>EW LOGISTICS GROUP INC</strong></div>
            <div><span style={{ color: '#6b7280' }}>Beneficiary Address:</span><br /><strong>55 Kennedy Dr, Hauppauge NY 11788, USA</strong></div>
            <div><span style={{ color: '#6b7280' }}>Bank:</span><br /><strong>JP Morgan Chase</strong></div>
            <div><span style={{ color: '#6b7280' }}>Bank Address:</span><br /><strong>200 Motor Pkwy, Hauppauge, NY 11788</strong></div>
            <div><span style={{ color: '#6b7280' }}>Account #:</span><br /><strong style={{ fontSize: '1rem', letterSpacing: 1 }}>620585999</strong></div>
            <div><span style={{ color: '#6b7280' }}>Routing #:</span><br /><strong style={{ fontSize: '1rem', letterSpacing: 1 }}>021000021</strong></div>
            {paymentMethod === 'wire' && (
              <div><span style={{ color: '#6b7280' }}>SWIFT:</span><br /><strong style={{ fontSize: '1rem', letterSpacing: 1 }}>CHASUS33</strong></div>
            )}
            <div><span style={{ color: '#6b7280' }}>Tel:</span><br /><strong>(646) 529-8575 / (347) 201-6888</strong></div>
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Please include your order number as reference.</p>
        </div>
      )}

      {paymentMethod === 'stripe' && (
        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#6d28d9' }}>
            <Lock size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Credit / Debit Card (Stripe)
          </h4>
          <div style={{ padding: '0.75rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #ddd6fe', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>💳</span>
              <span style={{ fontWeight: 600, color: '#374151' }}>Visa, Mastercard, American Express, Discover</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.6 }}>
              Secure payment powered by <strong style={{ color: '#6d28d9' }}>Stripe</strong>. Your card information is encrypted and never stored on our servers.
            </div>
          </div>
          <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 6, padding: '0.6rem 0.85rem', fontSize: '0.82rem', color: '#92400e' }}>
            <strong>Coming Soon</strong> — Credit and debit card payments will be available shortly. In the meantime, please use Zelle, Wire Transfer, or ACH.
          </div>
        </div>
      )}

      {paymentMethod === 'prepaid' && (
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#a16207' }}>Prepaid Balance</h4>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.88rem' }}>Your order will be deducted from your prepaid balance. If you don't have sufficient balance, please recharge first.</p>
        </div>
      )}

      {/* Prepaid Recharge Tiers */}
      <div style={{ marginBottom: '1.25rem', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <button type="button" onClick={() => setShowRecharge(!showRecharge)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', border: 'none', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, color: '#15803d' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Gift size={18} /> Prepaid Recharge — Save Up to 4%</span>
          {showRecharge ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        {showRecharge && (
          <div style={{ padding: '1rem 1.25rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Recharge Amount</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>Bonus %</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>Bonus Value</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Total Credit</th>
                </tr>
              </thead>
              <tbody>
                {RECHARGE_TIERS.map(tier => (
                  <tr key={tier.amount} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>${tier.amount.toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>+{tier.bonus}%</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>${(tier.amount * tier.bonus / 100).toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#1d4ed8' }}>
                      ${tier.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 4px' }}>New customer first order: <strong style={{ color: '#16a34a' }}>$50 discount</strong></p>
              <p style={{ margin: '0 0 4px' }}>Credits never expire. Can offset freight, warehouse, and FBA delivery fees.</p>
              <p style={{ margin: 0 }}>Contact: <strong>Amy</strong> | WeChat: EWlogistics | Cell: 718-750-9888</p>
              <p style={{ margin: '2px 0 0' }}>Email: hauppauge.receiver@smithtowntransportation.com</p>
            </div>
          </div>
        )}
      </div>

      {/* After Payment Notice */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={16} /> After Payment
        </h4>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#78350f', lineHeight: 1.6 }}>
          Please send your payment confirmation (screenshot or receipt) to:
        </p>
        <div style={{ padding: '0.5rem 0.75rem', background: '#fff', borderRadius: 6, border: '1px solid #fde68a', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Mail size={14} style={{ color: '#d97706' }} />
          <a href="mailto:ltl.ftl@ewftl.com" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#92400e', textDecoration: 'none' }}>ltl.ftl@ewftl.com</a>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#78350f', lineHeight: 1.6, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <CheckCircle size={12} style={{ color: '#16a34a', flexShrink: 0 }} />
            <span>Our team will verify and confirm within <strong>1–3 business days</strong>.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageCircle size={12} style={{ color: '#2563eb', flexShrink: 0 }} />
            <span>For any questions, email us at <a href="mailto:ltl.ftl@ewftl.com" style={{ color: '#1d4ed8', fontWeight: 600 }}>ltl.ftl@ewftl.com</a></span>
          </div>
        </div>
      </div>

      {/* W9 & Company Info */}
      <div style={{ marginBottom: '1.25rem', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <button type="button" onClick={() => setShowWireDetails(!showWireDetails)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, color: '#374151' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} /> W9 & Company Information</span>
          {showWireDetails ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        {showWireDetails && (
          <div style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
              <div><strong>Mail to: EW LOGISTICS GROUP INC</strong></div>
              <div>135-10 35th Ave Apt213, Flushing NY 11354</div>
              <div>Tel: (347) 201-6888 / (646) 529-8575</div>
            </div>
            <a href="/EW-W9.pdf" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', background: '#1d4ed8', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
              <Download size={14} /> Download W9 (PDF)
            </a>
          </div>
        )}
      </div>

      {/* Terms & Submit */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: '1rem', cursor: 'pointer', fontSize: '0.88rem' }}>
          <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
            style={{ marginTop: 3, width: 16, height: 16, accentColor: '#2563eb' }} />
          <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>payment terms</a> and confirm the order details are correct. Payment must be received before shipment pickup.</span>
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={onBack}
            style={{ padding: '0.7rem 1.5rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
            Back
          </button>
          <button type="submit" onClick={handleSubmit}
            disabled={!paymentMethod || !agreedToTerms || isSubmitting}
            style={{
              flex: 1, padding: '0.7rem 1.5rem', borderRadius: 8, border: 'none', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              background: (!paymentMethod || !agreedToTerms) ? '#d1d5db' : '#16a34a', color: '#fff',
              transition: 'background 0.15s',
            }}>
            {isSubmitting ? 'Processing...' : `Place Order${selectedQuote?.price ? ` — $${selectedQuote.price.toFixed(2)}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckoutForm;
