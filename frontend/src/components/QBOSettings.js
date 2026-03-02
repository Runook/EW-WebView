import React, { useState, useEffect, useCallback } from 'react';
import { qboApi } from '../config/employeeApi';

const QBOSettings = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null);
  const [syncingPayments, setSyncingPayments] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await qboApi.getStatus();
      setStatus(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchStatus();
  }, [isOpen, fetchStatus]);

  const handleConnect = () => {
    const token = localStorage.getItem('idToken') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    const authUrl = qboApi.getAuthUrl();
    window.location.href = `${authUrl}?token=${encodeURIComponent(token)}`;
  };

  const handleDisconnect = async () => {
    if (!window.confirm('确定断开 QuickBooks 连接？')) return;
    setDisconnecting(true);
    try {
      await qboApi.disconnect();
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSyncPayments = async () => {
    setSyncingPayments(true); setSyncResult(null);
    try {
      const res = await qboApi.syncPayments();
      setSyncResult(res.data);
    } catch (err) {
      setSyncResult({ error: err.message });
    } finally {
      setSyncingPayments(false);
    }
  };

  if (!isOpen) return null;

  const fmtDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const tokenStatusLabel = {
    valid: { text: '正常', color: '#10b981' },
    needs_refresh: { text: '需要刷新', color: '#f59e0b' },
    expired: { text: '已过期', color: '#ef4444' },
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 16 }}>QuickBooks Online 设置</h3>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>

        <div style={bodyStyle}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#6b7280' }}>加载中...</div>
          ) : error ? (
            <div style={{ padding: 16 }}>
              <div style={{ color: '#ef4444', marginBottom: 12 }}>错误: {error}</div>
              <button onClick={fetchStatus} style={retryBtnStyle}>重试</button>
            </div>
          ) : status?.connected ? (
            <div>
              <div style={connectedBadgeStyle}>
                <span style={{ color: '#10b981', fontSize: 18 }}>&#9679;</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>已连接</span>
              </div>

              <div style={infoGridStyle}>
                <div style={infoRowStyle}>
                  <span style={labelStyle}>公司名称</span>
                  <span style={valueStyle}>{status.companyName}</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={labelStyle}>Realm ID</span>
                  <span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: 12 }}>{status.realmId}</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={labelStyle}>连接时间</span>
                  <span style={valueStyle}>{fmtDate(status.connectedAt)}</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={labelStyle}>最后同步</span>
                  <span style={valueStyle}>{fmtDate(status.lastSyncAt)}</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={labelStyle}>Token 状态</span>
                  <span style={{ ...valueStyle, color: tokenStatusLabel[status.tokenStatus]?.color || '#6b7280' }}>
                    {tokenStatusLabel[status.tokenStatus]?.text || status.tokenStatus}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 20, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Payment Sync / 付款状态同步
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px', lineHeight: 1.5 }}>
                  从 QBO 同步付款状态到 Welogx。会计在 QBO 标记发票为已付款后，点击此按钮更新系统记录。
                </p>
                <button onClick={handleSyncPayments} disabled={syncingPayments}
                  style={{ ...actionBtnStyle, background: '#1565C0', color: '#fff', border: 'none', opacity: syncingPayments ? 0.6 : 1 }}>
                  {syncingPayments ? '同步中...' : '同步付款状态'}
                </button>
                {syncResult && !syncResult.error && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#374151', background: '#ecfdf5', padding: 10, borderRadius: 6 }}>
                    <div>已检查 {syncResult.checked} 张发票，更新 {syncResult.updated} 条记录</div>
                    {syncResult.details?.length > 0 && (
                      <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
                        {syncResult.details.map((d, i) => (
                          <li key={i}>{d.invoiceNumber}: {d.oldStatus} → {d.newStatus}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {syncResult?.error && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#ef4444', background: '#fef2f2', padding: 10, borderRadius: 6 }}>
                    同步失败: {syncResult.error}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={fetchStatus} style={{ ...actionBtnStyle, background: '#f3f4f6', color: '#374151' }}>
                  刷新状态
                </button>
                <button onClick={() => window.open('/accounting-guide', '_blank')}
                  style={{ ...actionBtnStyle, background: '#f0f9ff', color: '#1565C0', border: '1px solid #bfdbfe' }}>
                  会计操作指南
                </button>
                <button onClick={handleDisconnect} disabled={disconnecting}
                  style={{ ...actionBtnStyle, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                  {disconnecting ? '断开中...' : '断开连接'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>&#128210;</div>
              <h4 style={{ margin: '0 0 8px', color: '#374151' }}>未连接 QuickBooks</h4>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                连接后，生成的 Invoice 可以一键同步到 QuickBooks Online，<br />
                自动创建客户和发票记录。
              </p>
              <button onClick={handleConnect} style={connectBtnStyle}>
                连接 QuickBooks Online
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 10000,
};

const modalStyle = {
  background: '#fff', borderRadius: 12, width: 440, maxWidth: '90vw',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden',
};

const headerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 20px', borderBottom: '1px solid #e5e7eb',
};

const closeBtnStyle = {
  background: 'none', border: 'none', fontSize: 22, cursor: 'pointer',
  color: '#9ca3af', lineHeight: 1, padding: 0,
};

const bodyStyle = { padding: 20 };

const connectedBadgeStyle = {
  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
  padding: '8px 14px', background: '#ecfdf5', borderRadius: 8,
};

const infoGridStyle = {
  display: 'flex', flexDirection: 'column', gap: 10,
};

const infoRowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '4px 0', borderBottom: '1px solid #f3f4f6',
};

const labelStyle = { fontSize: 13, color: '#6b7280' };
const valueStyle = { fontSize: 13, fontWeight: 500, color: '#111827' };

const actionBtnStyle = {
  padding: '8px 16px', borderRadius: 6, border: '1px solid #e5e7eb',
  cursor: 'pointer', fontSize: 13, fontWeight: 500,
};

const retryBtnStyle = {
  padding: '8px 16px', borderRadius: 6, border: '1px solid #e5e7eb',
  background: '#f3f4f6', cursor: 'pointer', fontSize: 13,
};

const connectBtnStyle = {
  padding: '10px 24px', borderRadius: 8, border: 'none',
  background: '#2ca01c', color: '#fff', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', boxShadow: '0 2px 8px rgba(44,160,28,0.3)',
};

export default QBOSettings;
