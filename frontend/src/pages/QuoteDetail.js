import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Phone, ChevronDown, ChevronUp,
  RefreshCw, AlertTriangle, ArrowLeft, Package
} from 'lucide-react';
import ShipmentDetailsForm from '../components/ltl/ShipmentDetailsForm';
import ProgressSteps from '../components/ltl/ProgressSteps';
import { orderApi } from '../config/employeeApi';
import { useAuth } from '../contexts/AuthContext';
import './GetQuote.css';

const QuoteDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuoteId, setExpandedQuoteId] = useState(null);
  const [breakdownQuoteId, setBreakdownQuoteId] = useState(null);
  const [sortBy, setSortBy] = useState('price');

  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState({
    companyName: '', contactPhone: '', contactEmail: '',
    pickupContactName: '', pickupContactPhone: '', pickupContactEmail: '',
    pickupAddress: '', pickupCity: '', pickupState: '', pickupZip: '',
    deliveryContactName: '', deliveryContactPhone: '', deliveryContactEmail: '',
    deliveryAddress: '', deliveryCity: '', deliveryState: '', deliveryZip: '',
    specialInstructions: ''
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${apiBase}/ltl-quotes/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data.data);
        }
      } catch (err) {
        console.error('Failed to load quote session:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  if (loading) {
    return <div className="get-quote-page"><div className="get-quote-container"><p>Loading...</p></div></div>;
  }

  if (!session) {
    return (
      <div className="get-quote-page">
        <div className="get-quote-container">
          <p>Quote not found.</p>
          <button onClick={() => navigate('/my-quotes')}>Back to All Quotes</button>
        </div>
      </div>
    );
  }

  const quotes = session.quote_results || [];
  const isExpired = session.is_expired || new Date(session.expires_at) < new Date();

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'time') {
      const dA = parseInt(String(a.transitDays).match(/\d+/)?.[0] || '999');
      const dB = parseInt(String(b.transitDays).match(/\d+/)?.[0] || '999');
      return dA - dB;
    }
    if (sortBy === 'name') return (a.carrier || '').localeCompare(b.carrier || '');
    return 0;
  });

  const items = session.items || [];
  const totalWeight = items.reduce((s, i) => s + parseFloat(i.weight || 0), 0);
  const totalPallets = items.reduce((s, i) => s + parseInt(i.pallets || 0), 0);

  const formDataFromSession = {
    origin: [session.origin_city, session.origin_state, session.origin_zip].filter(Boolean).join(', '),
    destination: [session.destination_city, session.destination_state, session.destination_zip].filter(Boolean).join(', '),
    pickupDate: session.pickup_date || '',
    deliveryDate: session.delivery_date || '',
    originLocationType: session.origin_location_type || 'business_with_dock',
    destinationLocationType: session.destination_location_type || 'business_with_dock',
    pickupServices: session.pickup_services || [],
    deliveryServices: session.delivery_services || [],
    cargoItems: items.map(i => ({
      id: i.id,
      description: i.description || '',
      weight: i.weight || '',
      length: i.length || '',
      width: i.width || '',
      height: i.height || '',
      pallets: i.pallets || 1,
      freightClass: i.freightClass || '',
      stackable: i.stackable || false,
      hazmat: i.hazmat || false,
    })),
  };

  const handleShipmentDetailChange = (e) => {
    const { name, value } = e.target;
    setShipmentDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updatePayload = {
        customer_name: shipmentDetails.companyName,
        customer_phone: shipmentDetails.contactPhone,
        customer_email: shipmentDetails.contactEmail || user?.email || '',
        inquiry_company: shipmentDetails.companyName,
        origin_address: shipmentDetails.pickupAddress,
        origin_city: shipmentDetails.pickupCity || session.origin_city || '',
        origin_state: shipmentDetails.pickupState || session.origin_state || '',
        origin_zipcode: shipmentDetails.pickupZip || session.origin_zip || '',
        destination_address: shipmentDetails.deliveryAddress,
        destination_city: shipmentDetails.deliveryCity || session.destination_city || '',
        destination_state: shipmentDetails.deliveryState || session.destination_state || '',
        destination_zipcode: shipmentDetails.deliveryZip || session.destination_zip || '',
        consignee_contact: [shipmentDetails.deliveryContactName, shipmentDetails.deliveryContactPhone, shipmentDetails.deliveryContactEmail].filter(Boolean).join(' | '),
        notes: [
          selectedQuote ? `Selected: ${selectedQuote.carrier} $${(selectedQuote.price || 0).toFixed(2)} (${selectedQuote.serviceLevel || 'Standard'})` : '',
          shipmentDetails.specialInstructions || ''
        ].filter(Boolean).join('\n'),
        ew_quote_price: selectedQuote?.price || null,
        workflow_stage: 'quote_confirmed',
      };

      if (session.employee_order_id) {
        await orderApi.updateOrder(session.employee_order_id, updatePayload);
      } else {
        const createPayload = {
          ...updatePayload,
          order_type: 'land_freight',
          status: 'quote',
          cargo_description: selectedQuote ? `${selectedQuote.carrier} LTL` : 'LTL Booking',
          total_weight_lbs: totalWeight || null,
          actual_pallets: totalPallets || null,
          pickup_date: session.pickup_date || null,
          delivery_date: session.delivery_date || null,
          transport_distance: session.distance_miles || null,
        };
        await orderApi.createOrder(createPayload);
      }

      alert('下单成功！员工会尽快处理您的订单。');
      setSelectedQuote(null);
      navigate('/my-quotes');
    } catch (err) {
      alert('提交失败: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedQuote) {
    return (
      <div className="get-quote-page">
        <div className="get-quote-container">
          <div className="quote-results-section">
            <ProgressSteps currentStep={3} />
            <ShipmentDetailsForm
              selectedQuote={selectedQuote}
              shipmentDetails={shipmentDetails}
              formData={formDataFromSession}
              selectedPlaces={{}}
              onChange={handleShipmentDetailChange}
              onSubmit={handleFinalSubmit}
              onBack={() => setSelectedQuote(null)}
              isSubmitting={isSubmitting}
              setShipmentDetails={setShipmentDetails}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="get-quote-page">
      <div className="get-quote-container">
        <div className="quote-results-section">

          {/* Navigation */}
          <div className="carrier-rates-header" style={{ marginBottom: '1rem' }}>
            <button className="btn-new-quote" onClick={() => navigate('/my-quotes')}>
              <ArrowLeft size={16} /> All Quotes
            </button>
            <div className="carrier-rates-nav">
              <button className="btn-new-quote" onClick={() => navigate('/get-quote-ltl')}>
                <RefreshCw size={16} /> New Quote
              </button>
            </div>
          </div>

          {/* Quote info */}
          <div className="shipment-summary-compact" style={{ marginBottom: '1rem' }}>
            <div className="summary-compact-row">
              <div className="route-info">
                <MapPin size={14} />
                <span className="route-value">
                  {session.origin_city || session.origin_zip} &rarr; {session.destination_city || session.destination_zip}
                </span>
              </div>
              <div className="summary-stats">
                <span className="stat"><Package size={12} /> {totalPallets} pallets</span>
                <span className="stat">{totalWeight.toFixed(0)} lbs</span>
                {session.distance_miles && <span className="stat">{session.distance_miles} mi</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: '#6b7280', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span>Quote: <strong>{session.session_id}</strong></span>
              <span>Created: {new Date(session.created_at).toLocaleDateString('en-US')}</span>
              <span>
                Expires: {new Date(session.expires_at).toLocaleDateString('en-US')}
                {isExpired && <span style={{ color: '#ef4444', marginLeft: 4 }}>(Expired)</span>}
              </span>
            </div>
          </div>

          {isExpired && (
            <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: '0.9rem' }}>
              <AlertTriangle size={16} /> This quote has expired. Prices may no longer be valid. Please request a new quote.
            </div>
          )}

          {/* Carrier Rates */}
          <div className="carrier-rates-section">
            <h2>CARRIER RATES ({quotes.length})</h2>

            <div className="sort-controls">
              <label>Sort:</label>
              <div className="sort-buttons">
                <button className={`sort-btn ${sortBy === 'price' ? 'active' : ''}`} onClick={() => setSortBy('price')}>Price</button>
                <button className={`sort-btn ${sortBy === 'time' ? 'active' : ''}`} onClick={() => setSortBy('time')}>Transit</button>
                <button className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSortBy('name')}>A-Z</button>
              </div>
            </div>

            <div className="quote-cards-container">
              {sortedQuotes.map((quote) => (
                <div key={quote.id} className="quote-card-ltl">
                  <div className="quote-card-main">
                    <button className="btn-expand-corner"
                      onClick={() => setExpandedQuoteId(expandedQuoteId === quote.id ? null : quote.id)}>
                      {expandedQuoteId === quote.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <div className="col-carrier">
                      {quote.logo && <img src={quote.logo} alt={quote.carrier} className="carrier-logo" />}
                      <div className="carrier-details">
                        <div className="carrier-name">{quote.carrier}</div>
                      </div>
                    </div>

                    <div className="col-price">
                      <div className={`service-level-badge ${quote.serviceBadge || 'standard'}`}
                        style={{ backgroundColor: quote.serviceColor || '#4CAF50' }}>
                        {quote.isGuaranteed && <span className="guarantee-icon">✓</span>}
                        {quote.serviceLevel || 'Standard LTL'}
                      </div>
                      <div className="price-big">
                        ${(quote.price || 0).toFixed(2)}
                      </div>
                      <button className="btn-price-breakdown"
                        onClick={(e) => { e.stopPropagation(); setBreakdownQuoteId(breakdownQuoteId === quote.id ? null : quote.id); }}>
                        {breakdownQuoteId === quote.id ? '收起明细' : '价格明细'}
                      </button>
                      <div className="exp-date-small">Exp: {quote.expDate || 'N/A'}</div>
                    </div>

                    <div className="col-service">
                      <div className="service-type-text">{quote.serviceType || 'LTL Service'}</div>
                      <div className="transit-time"><Clock size={14} className="inline-icon" /> {quote.transitDays || 'TBD'}</div>
                    </div>

                    <div className="col-transit">
                      <div className="transit-label">{quote.isGuaranteed ? 'Guaranteed' : 'Standard'}</div>
                      <div className="quote-id-small">#{quote.quoteId?.slice(-8) || 'N/A'}</div>
                    </div>

                    <div className="col-liability">
                      {quote.maxLiability ? (
                        <>
                          <div className="liability-title">Max Liability</div>
                          <div className="liability-amount">New: ${quote.maxLiability.new?.toLocaleString()}</div>
                          <div className="liability-amount used">Used: ${quote.maxLiability.used?.toLocaleString()}</div>
                        </>
                      ) : (
                        <div className="liability-title" style={{ color: '#ccc', fontSize: '0.75rem' }}>—</div>
                      )}
                    </div>

                    <div className="col-action">
                      {!isExpired ? (
                        <button
                          className="btn-book-it"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQuote(quote);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          立即预订
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Expired</span>
                      )}
                    </div>
                  </div>

                  {breakdownQuoteId === quote.id && (
                    <div className="quote-price-breakdown">
                      <h4>Price Breakdown</h4>
                      <div className="breakdown-list">
                        {quote.charges && quote.charges.length > 0 ? (
                          <>
                            {quote.charges.map((c, idx) => (
                              <div key={idx} className="breakdown-item">
                                <span className="breakdown-desc">{c.description}</span>
                                <span className="breakdown-amount">${parseFloat(c.amount || 0).toFixed(2)}</span>
                              </div>
                            ))}
                            {quote.fuelSurcharge && !quote.charges.some(c => (c.description || '').toLowerCase().includes('fuel')) && (
                              <div className="breakdown-item">
                                <span className="breakdown-desc">Fuel Surcharge</span>
                                <span className="breakdown-amount">${parseFloat(quote.fuelSurcharge).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="breakdown-item breakdown-total">
                              <span className="breakdown-desc">Total</span>
                              <span className="breakdown-amount">${(quote.price || 0).toFixed(2)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            {quote.fuelSurcharge ? (
                              <>
                                <div className="breakdown-item">
                                  <span className="breakdown-desc">Base Freight</span>
                                  <span className="breakdown-amount">${(Math.round((quote.price - parseFloat(quote.fuelSurcharge)) * 100) / 100).toFixed(2)}</span>
                                </div>
                                <div className="breakdown-item">
                                  <span className="breakdown-desc">Fuel Surcharge</span>
                                  <span className="breakdown-amount">${parseFloat(quote.fuelSurcharge).toFixed(2)}</span>
                                </div>
                                <div className="breakdown-item breakdown-total">
                                  <span className="breakdown-desc">Total</span>
                                  <span className="breakdown-amount">${(quote.price || 0).toFixed(2)}</span>
                                </div>
                              </>
                            ) : (
                              <div className="breakdown-item breakdown-total">
                                <span className="breakdown-desc">Total Charge</span>
                                <span className="breakdown-amount">${(quote.price || 0).toFixed(2)}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {expandedQuoteId === quote.id && (
                    <div className="quote-card-expanded">
                      <div className="terminals-container">
                        {[{ label: 'Pickup Terminal', data: quote.pickupTerminal }, { label: 'Drop Terminal', data: quote.dropTerminal }].map(({ label, data }) => (
                          <div key={label} className={`terminal-card ${!data || !Object.keys(data).length ? 'terminal-na' : ''}`}>
                            <div className="terminal-header"><MapPin size={14} /><h4>{label}</h4></div>
                            <div className="terminal-body">
                              {data && Object.keys(data).length > 0 ? (
                                <>
                                  <div className="terminal-item"><span className="label">Name:</span><span className="value">{data.name || 'N/A'}</span></div>
                                  <div className="terminal-item"><span className="label">Address:</span><span className="value">{data.address1 || 'N/A'}</span></div>
                                  <div className="terminal-item"><span className="label">City:</span><span className="value">{data.city}, {data.state} {data.zip}</span></div>
                                  {data.phone && <div className="terminal-item"><span className="label"><Phone size={12} /> Phone:</span><span className="value">{data.phone}</span></div>}
                                </>
                              ) : (
                                <p className="no-terminal-info">Terminal info unavailable</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;
