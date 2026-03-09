import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, MapPin, Calendar, Clock, Trash2, Eye, Plus, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './MyQuotes.css';

const MyQuotes = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const email = user?.email || user?.attributes?.email;
    if (!email) return;
    try {
      setLoading(true);
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${apiBase}/ltl-quotes/sessions?email=${encodeURIComponent(email)}&includeExpired=true`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) fetchSessions();
    else setLoading(false);
  }, [isAuthenticated, fetchSessions]);

  const handleDelete = async (sessionId) => {
    if (!window.confirm('确定要删除这个报价记录吗？')) return;
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${apiBase}/ltl-quotes/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="myquotes-page">
        <div className="myquotes-container">
          <p>请先登录查看报价记录。</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="myquotes-page">
      <div className="myquotes-container">
        <div className="myquotes-header">
          <h1>All Quotes</h1>
          <button className="btn-new-quote-primary" onClick={() => navigate('/get-quote-ltl')}>
            <Plus size={16} /> New Quote
          </button>
        </div>

        {loading ? (
          <div className="myquotes-loading">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="myquotes-empty">
            <Truck size={48} />
            <p>暂无报价记录</p>
            <button className="btn-new-quote-primary" onClick={() => navigate('/get-quote-ltl')}>
              获取第一个LTL报价
            </button>
          </div>
        ) : (
          <div className="myquotes-list">
            <div className="myquotes-table-header">
              <span>Quote #</span>
              <span>Route</span>
              <span>Date</span>
              <span>Carriers</span>
              <span>Lowest</span>
              <span>Expires</span>
              <span>Actions</span>
            </div>
            {sessions.map(session => {
              const isExpired = session.is_expired || new Date(session.expires_at) < new Date();
              return (
                <div key={session.id} className={`myquotes-row ${isExpired ? 'expired' : ''}`}>
                  <span className="quote-number">{session.session_id}</span>
                  <span className="quote-route">
                    <MapPin size={12} />
                    {session.origin_zip || session.origin_city} &rarr; {session.destination_zip || session.destination_city}
                  </span>
                  <span className="quote-date">
                    <Calendar size={12} />
                    {new Date(session.created_at).toLocaleDateString('en-US')}
                  </span>
                  <span className="quote-carriers">{session.quote_count}</span>
                  <span className="quote-price">
                    ${session.lowest_price ? parseFloat(session.lowest_price).toFixed(2) : 'N/A'}
                  </span>
                  <span className="quote-expires">
                    {isExpired ? (
                      <span className="expired-badge"><AlertTriangle size={12} /> Expired</span>
                    ) : (
                      <span className="active-badge">
                        <Clock size={12} />
                        {new Date(session.expires_at).toLocaleDateString('en-US')}
                      </span>
                    )}
                  </span>
                  <span className="quote-actions">
                    <button
                      className="btn-view"
                      onClick={() => navigate(`/quote/${session.session_id}`)}
                      title="View details"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(session.session_id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQuotes;
