import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, MapPin, Calendar, Clock, Truck, ChevronDown, ChevronRight,
  Phone, Building, FileText, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userOrderApi } from '../config/employeeApi';
import './MyOrders.css';

const STAGE_LABELS = {
  inquiry: 'Quoted',
  quoting: 'Quoted',
  quote_confirmed: 'Confirmed',
  pre_bol: 'Confirmed',
  bol_issued: 'Finding Carrier',
  carrier_sourcing: 'Finding Carrier',
  pickup: 'Pickup Scheduled',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  invoicing: 'Billing',
  settlement: 'Billing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STAGE_COLORS = {
  inquiry: { bg: '#f3f4f6', color: '#6b7280' },
  quoting: { bg: '#f3f4f6', color: '#6b7280' },
  quote_confirmed: { bg: '#dbeafe', color: '#1d4ed8' },
  pre_bol: { bg: '#dbeafe', color: '#1d4ed8' },
  bol_issued: { bg: '#fef3c7', color: '#d97706' },
  carrier_sourcing: { bg: '#fef3c7', color: '#d97706' },
  pickup: { bg: '#e0e7ff', color: '#4338ca' },
  in_transit: { bg: '#dbeafe', color: '#2563eb' },
  delivered: { bg: '#dcfce7', color: '#16a34a' },
  invoicing: { bg: '#fae8ff', color: '#9333ea' },
  settlement: { bg: '#fae8ff', color: '#9333ea' },
  completed: { bg: '#dcfce7', color: '#15803d' },
  cancelled: { bg: '#fee2e2', color: '#dc2626' },
};

const PROGRESS_STAGES = [
  'inquiry', 'quote_confirmed', 'bol_issued', 'carrier_sourcing',
  'pickup', 'in_transit', 'delivered', 'completed'
];

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detailData, setDetailData] = useState({});

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userOrderApi.getMyOrders();
      if (res.success) setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
    else setLoading(false);
  }, [isAuthenticated, fetchOrders]);

  const toggleExpand = async (orderId) => {
    if (expandedId === orderId) { setExpandedId(null); return; }
    setExpandedId(orderId);
    if (!detailData[orderId]) {
      try {
        const res = await userOrderApi.getMyOrderDetail(orderId);
        if (res.success) setDetailData(prev => ({ ...prev, [orderId]: res.data }));
      } catch { /* use list data as fallback */ }
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  if (!isAuthenticated) {
    return (
      <div className="myorders-page">
        <div className="myorders-container">
          <p>Please log in to view your orders.</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>Log In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="myorders-page">
      <div className="myorders-container">
        <div className="myorders-header">
          <div className="myorders-header-left">
            <h1>My Orders</h1>
            <p className="myorders-subtitle">Track your shipment status and details</p>
          </div>
          <div className="myorders-header-actions">
            <button className="btn-secondary" onClick={() => navigate('/my-quotes')}>
              <FileText size={16} /> My Quotes
            </button>
            <button className="btn-primary-green" onClick={() => navigate('/get-quote-ltl')}>
              <RefreshCw size={16} /> New Quote
            </button>
          </div>
        </div>

        {loading ? (
          <div className="myorders-loading">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="myorders-empty">
            <Package size={48} />
            <h3>No orders yet</h3>
            <p>Get a quote and book a carrier to see your orders here.</p>
            <button className="btn-primary-green" onClick={() => navigate('/get-quote-ltl')}>
              Get LTL Quote
            </button>
          </div>
        ) : (
          <div className="myorders-list">
            {orders.map(order => {
              const stage = order.workflow_stage || 'inquiry';
              const stageLabel = STAGE_LABELS[stage] || stage;
              const stageColor = STAGE_COLORS[stage] || STAGE_COLORS.inquiry;
              const isExpanded = expandedId === order.id;
              const detail = detailData[order.id] || order;
              const loads = detail.loads || [];

              const currentIdx = PROGRESS_STAGES.indexOf(
                PROGRESS_STAGES.find(s => s === stage) ||
                PROGRESS_STAGES.find(s => STAGE_LABELS[s] === stageLabel) ||
                'inquiry'
              );

              return (
                <div key={order.id} className={`myorders-card ${stage === 'cancelled' ? 'cancelled' : ''}`}>
                  <div className="myorders-card-header" onClick={() => toggleExpand(order.id)}>
                    <div className="order-expand-icon">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>

                    <div className="order-number-col">
                      <div className="order-number">{order.order_number}</div>
                      <div className="order-date">{fmtDate(order.created_at)}</div>
                    </div>

                    <div className="order-route-col">
                      <MapPin size={13} />
                      <span>
                        {[order.origin_city, order.origin_state].filter(Boolean).join(', ') || order.origin_zipcode || '—'}
                        {' → '}
                        {[order.destination_city, order.destination_state].filter(Boolean).join(', ') || order.destination_zipcode || '—'}
                      </span>
                    </div>

                    <div className="order-status-col">
                      <span className="status-pill" style={{ background: stageColor.bg, color: stageColor.color }}>
                        {stageLabel}
                      </span>
                    </div>

                    <div className="order-price-col">
                      {order.ew_final_price || order.ew_quote_price
                        ? <span className="order-price">${parseFloat(order.ew_final_price || order.ew_quote_price).toLocaleString()}</span>
                        : <span className="order-price muted">—</span>
                      }
                    </div>

                    <div className="order-pickup-col">
                      {order.pickup_date
                        ? <span className="pickup-date"><Calendar size={12} /> {fmtDate(order.pickup_date)}</span>
                        : <span className="pickup-date muted">TBD</span>
                      }
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="myorders-card-detail">
                      {stage !== 'cancelled' && (
                        <div className="progress-track">
                          {PROGRESS_STAGES.map((s, idx) => (
                            <div key={s} className={`progress-step ${idx <= currentIdx ? 'active' : ''} ${idx === currentIdx ? 'current' : ''}`}>
                              <div className="progress-dot" />
                              <span className="progress-label">{STAGE_LABELS[s]}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="detail-sections">
                        <div className="detail-section">
                          <h4><MapPin size={14} /> Route</h4>
                          <div className="detail-grid-2col">
                            <div>
                              <label>Origin</label>
                              <p>{detail.origin_address || [detail.origin_city, detail.origin_state, detail.origin_zipcode].filter(Boolean).join(', ') || '—'}</p>
                            </div>
                            <div>
                              <label>Destination</label>
                              <p>{detail.destination_address || [detail.destination_city, detail.destination_state, detail.destination_zipcode].filter(Boolean).join(', ') || '—'}</p>
                            </div>
                            {detail.transport_distance && (
                              <div><label>Distance</label><p>{Number(detail.transport_distance).toLocaleString()} miles</p></div>
                            )}
                            {detail.consignee_contact && (
                              <div><label>Consignee</label><p>{detail.consignee_contact}</p></div>
                            )}
                          </div>
                        </div>

                        <div className="detail-section">
                          <h4><Package size={14} /> Cargo</h4>
                          <div className="detail-grid-2col">
                            {detail.total_weight_lbs && <div><label>Weight</label><p>{Number(detail.total_weight_lbs).toLocaleString()} lbs</p></div>}
                            {detail.actual_pallets && <div><label>Pallets</label><p>{detail.actual_pallets}</p></div>}
                            {detail.cargo_description_detailed && <div className="full-width"><label>Description</label><p>{detail.cargo_description_detailed}</p></div>}
                          </div>
                          {loads.length > 0 && (
                            <div className="loads-mini">
                              <label>Items ({loads.length})</label>
                              <table>
                                <thead><tr><th>#</th><th>Weight</th><th>Dimensions</th><th>Class</th><th>Status</th></tr></thead>
                                <tbody>
                                  {loads.map((ld, idx) => (
                                    <tr key={ld.id}>
                                      <td>{ld.load_number || idx + 1}</td>
                                      <td>{ld.weight_lbs ? `${Number(ld.weight_lbs).toLocaleString()} lbs` : '—'}</td>
                                      <td>{ld.length_in && ld.width_in && ld.height_in ? `${ld.length_in}x${ld.width_in}x${ld.height_in} in` : '—'}</td>
                                      <td>{ld.freight_class || '—'}</td>
                                      <td><span className="load-status">{ld.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {(detail.truck_company_name || detail.driver_name) && (
                          <div className="detail-section">
                            <h4><Truck size={14} /> Carrier</h4>
                            <div className="detail-grid-2col">
                              {detail.truck_company_name && <div><label>Company</label><p>{detail.truck_company_name}</p></div>}
                              {detail.driver_name && <div><label>Driver</label><p>{detail.driver_name}{detail.driver_phone ? ` (${detail.driver_phone})` : ''}</p></div>}
                              {detail.bol_number && <div><label>BOL #</label><p>{detail.bol_number}</p></div>}
                            </div>
                          </div>
                        )}

                        <div className="detail-section">
                          <h4><Clock size={14} /> Timeline</h4>
                          <div className="timeline-items">
                            <div className="timeline-item"><label>Created</label><span>{fmtDate(detail.created_at)}</span></div>
                            {detail.pickup_date && <div className="timeline-item"><label>Pickup</label><span>{fmtDate(detail.pickup_date)}</span></div>}
                            {detail.delivery_date && <div className="timeline-item"><label>Est. Delivery</label><span>{fmtDate(detail.delivery_date)}</span></div>}
                            {detail.delivered_at && <div className="timeline-item delivered"><label>Delivered</label><span>{fmtDate(detail.delivered_at)}</span></div>}
                            {detail.invoiced_at && <div className="timeline-item"><label>Invoiced</label><span>{fmtDate(detail.invoiced_at)}</span></div>}
                            {detail.settled_at && <div className="timeline-item"><label>Settled</label><span>{fmtDate(detail.settled_at)}</span></div>}
                            {detail.cancelled_at && <div className="timeline-item cancelled"><label>Cancelled</label><span>{fmtDate(detail.cancelled_at)}{detail.cancel_reason ? ` — ${detail.cancel_reason}` : ''}</span></div>}
                          </div>
                        </div>

                        {detail.notes && (
                          <div className="detail-section">
                            <h4><FileText size={14} /> Notes</h4>
                            <p className="order-notes">{detail.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
