import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Zap, Building, CreditCard, CheckCircle, Coins,
  Mail, Clock, MessageCircle, ChevronRight, Gift
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/apiClient';

const RECHARGE_TIERS = [
  { amount: 2000, bonus: 2, total: 2040 },
  { amount: 5000, bonus: 2.5, total: 5125 },
  { amount: 7500, bonus: 3, total: 7725 },
  { amount: 10000, bonus: 3.5, total: 10350 },
  { amount: 15000, bonus: 4, total: 15600 },
];

const CreditRechargePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedCredits = searchParams.get('credits');
  const selectedPrice = searchParams.get('price');

  const [paymentMethod, setPaymentMethod] = useState('');
  const [rechargeRates, setRechargeRates] = useState(null);

  const fetchRates = useCallback(async () => {
    try {
      const res = await apiClient.get('/user-management/system-config', { keys: 'recharge_rates' });
      if (res.success && res.data?.recharge_rates) setRechargeRates(res.data.recharge_rates);
    } catch (err) { console.error('Failed to fetch recharge rates:', err); }
  }, []);

  useEffect(() => {
    if (user) fetchRates();
  }, [user, fetchRates]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const PAYMENT_METHODS = [
    { id: 'zelle', label: 'Zelle', icon: <Zap size={20} />, desc: 'Instant transfer / 即时转账' },
    { id: 'wire', label: 'Wire Transfer', icon: <Building size={20} />, desc: 'Bank wire (domestic/intl) / 银行电汇' },
    { id: 'ach', label: 'ACH Transfer', icon: <CreditCard size={20} />, desc: 'US bank transfer / 美国银行转账' },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem' }}>
      {/* Header */}
      <button
        onClick={() => navigate('/profile/credits')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: 0, marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> 返回积分中心
      </button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d2939', margin: '0 0 0.25rem' }}>积分充值 / Credit Recharge</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1.75rem' }}>请选择充值金额并通过以下方式完成付款</p>

      {/* Selected Plan or All Plans */}
      {selectedCredits && selectedPrice ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Coins size={24} style={{ color: '#16a34a' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#15803d' }}>{selectedCredits} 积分</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>充值金额: <strong>${selectedPrice}</strong></div>
          </div>
        </div>
      ) : rechargeRates && Object.keys(rechargeRates).length > 0 ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: '0 0 0.75rem' }}>
            <Coins size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            可选充值方案
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {Object.entries(rechargeRates).map(([credits, price]) => (
              <div
                key={credits}
                onClick={() => navigate(`/credit-recharge?credits=${credits}&price=${price}`, { replace: true })}
                style={{ padding: '0.85rem', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: '#fff', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1d4ed8' }}>{credits} 积分</div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 2 }}>${price}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Prepaid Recharge Tiers */}
      <div style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1.25rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', borderBottom: '1px solid #bbf7d0' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gift size={20} /> Prepaid Recharge — Save Up to 4%
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>充值越多，优惠越大 / The more you recharge, the bigger the bonus</p>
        </div>
        <div style={{ padding: '1rem 1.25rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Recharge Amount</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Bonus %</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Bonus Value</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Total Credit</th>
              </tr>
            </thead>
            <tbody>
              {RECHARGE_TIERS.map(tier => (
                <tr key={tier.amount} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>${tier.amount.toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>+{tier.bonus}%</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>${(tier.amount * tier.bonus / 100).toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#1d4ed8' }}>
                    ${tier.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 4px' }}>New customer first order: <strong style={{ color: '#16a34a' }}>$50 discount</strong></p>
            <p style={{ margin: '0 0 4px' }}>Credits never expire. Can offset freight, warehouse, and FBA delivery fees.</p>
            <p style={{ margin: 0 }}>Contact: <strong>Amy</strong> | WeChat: EWlogistics | Cell: 718-750-9888</p>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: '0 0 0.75rem' }}>选择付款方式 / Select Payment Method</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {PAYMENT_METHODS.map(method => (
            <label key={method.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.1rem',
                border: paymentMethod === method.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: 12, cursor: 'pointer',
                background: paymentMethod === method.id ? '#eff6ff' : '#fff',
                transition: 'all 0.15s',
              }}>
              <input type="radio" name="paymentMethod" value={method.id} checked={paymentMethod === method.id}
                onChange={() => setPaymentMethod(method.id)} style={{ display: 'none' }} />
              <div style={{ color: paymentMethod === method.id ? '#2563eb' : '#6b7280', flexShrink: 0 }}>{method.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: paymentMethod === method.id ? '#1d4ed8' : '#374151' }}>{method.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{method.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Details */}
      {paymentMethod === 'zelle' && (
        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#7c3aed' }}>Zelle Payment</h4>
          <div style={{ padding: '0.85rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #e9d5ff' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap', minWidth: 100 }}>Company Name:</span>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#5b21b6' }}>EW Logistics Group Inc</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap', minWidth: 100 }}>Zelle Email:</span>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#5b21b6' }}>ceo.ewlogistics@gmail.com</span>
            </div>
          </div>
        </div>
      )}

      {(paymentMethod === 'wire' || paymentMethod === 'ach') && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#0369a1' }}>
            {paymentMethod === 'wire' ? 'Wire Transfer' : 'ACH Transfer'} Details
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', fontSize: '0.88rem', padding: '0.85rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #bae6fd' }}>
            <div><span style={{ color: '#6b7280' }}>Beneficiary:</span><br /><strong>EW LOGISTICS GROUP INC</strong></div>
            <div><span style={{ color: '#6b7280' }}>Address:</span><br /><strong>55 Kennedy Dr, Hauppauge NY 11788, USA</strong></div>
            <div><span style={{ color: '#6b7280' }}>Bank:</span><br /><strong>JP Morgan Chase</strong></div>
            <div><span style={{ color: '#6b7280' }}>Bank Address:</span><br /><strong>200 Motor Pkwy, Hauppauge, NY 11788</strong></div>
            <div><span style={{ color: '#6b7280' }}>Account #:</span><br /><strong style={{ fontSize: '1rem', letterSpacing: 1 }}>620585999</strong></div>
            <div><span style={{ color: '#6b7280' }}>Routing #:</span><br /><strong style={{ fontSize: '1rem', letterSpacing: 1 }}>021000021</strong></div>
            {paymentMethod === 'wire' && (
              <div><span style={{ color: '#6b7280' }}>SWIFT:</span><br /><strong style={{ fontSize: '1rem', letterSpacing: 1 }}>CHASUS33</strong></div>
            )}
            <div><span style={{ color: '#6b7280' }}>Tel:</span><br /><strong>(646) 529-8575 / (347) 201-6888</strong></div>
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={18} /> 付款后请发送转账凭证 / After Payment
        </h4>
        <div style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            Please send your payment confirmation (screenshot or receipt) to the following email address so our team can verify and process your credit recharge:
          </p>
          <div style={{ padding: '0.75rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #fde68a', margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mail size={18} style={{ color: '#d97706', flexShrink: 0 }} />
            <a href="mailto:ltl.ftl@ewftl.com" style={{ fontWeight: 700, fontSize: '1.1rem', color: '#92400e', textDecoration: 'none' }}>ltl.ftl@ewftl.com</a>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.88rem', color: '#78350f' }}>
            <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
            <span>Our customer service team will contact you to confirm the payment within <strong>1–3 business days</strong>.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.88rem', color: '#78350f' }}>
            <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
            <span>Once verified, credits will be added to your account and reflected on your balance.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.88rem', color: '#78350f' }}>
            <MessageCircle size={16} style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
            <span>For any questions or inquiries, please email us directly at <a href="mailto:ltl.ftl@ewftl.com" style={{ color: '#1d4ed8', fontWeight: 600 }}>ltl.ftl@ewftl.com</a>.</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#334155' }}>充值流程 / How It Works</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: '1', text: 'Select the credit package and payment method above', textCN: '选择充值方案和付款方式' },
            { step: '2', text: 'Complete payment using the account details provided', textCN: '按照提供的账户信息完成付款' },
            { step: '3', text: 'Email your payment receipt to ltl.ftl@ewftl.com', textCN: '将付款凭证发送至 ltl.ftl@ewftl.com' },
            { step: '4', text: 'Credits will appear in your account within 1–3 business days', textCN: '1–3 个工作日内积分到账' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{item.step}</div>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{item.text}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.textCN}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/profile/credits')}
          style={{ padding: '0.65rem 1.5rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', cursor: 'pointer', color: '#374151' }}>
          <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 返回积分中心
        </button>
        <a href="mailto:ltl.ftl@ewftl.com"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.65rem 1.5rem', background: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
          <Mail size={16} /> 发送邮件 Email Us
        </a>
      </div>
    </div>
  );
};

export default CreditRechargePage;
