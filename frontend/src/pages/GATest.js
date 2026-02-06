import React, { useEffect, useState } from 'react';

const GATest = () => {
  const [gaStatus, setGaStatus] = useState({
    gtagExists: false,
    dataLayerExists: false,
    dataLayerLength: 0,
    measurementId: 'G-HFZWKT7TVE',
    testEventSent: false
  });

  useEffect(() => {
    // 检查 GA 是否加载
    const checkGA = () => {
      const status = {
        gtagExists: typeof window.gtag === 'function',
        dataLayerExists: Array.isArray(window.dataLayer),
        dataLayerLength: window.dataLayer ? window.dataLayer.length : 0,
        measurementId: 'G-HFZWKT7TVE',
        testEventSent: false
      };
      setGaStatus(status);

      console.log('🔍 Google Analytics 诊断报告:', status);
      console.log('📊 DataLayer 内容:', window.dataLayer);
    };

    // 延迟检查，确保 GA 脚本已加载
    setTimeout(checkGA, 2000);
  }, []);

  const sendTestEvent = () => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'test_event', {
        event_category: 'Test',
        event_label: 'Manual Test',
        value: 1
      });
      setGaStatus(prev => ({ ...prev, testEventSent: true }));
      alert('✅ 测试事件已发送！请在 GA4 实时报告中查看（可能需要几分钟）');
    } else {
      alert('❌ GA 未正确加载，无法发送测试事件');
    }
  };

  const sendPageView = () => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', gaStatus.measurementId, {
        page_path: '/test-page-view',
        page_title: 'Test Page View'
      });
      alert('✅ 测试页面浏览已发送！');
    } else {
      alert('❌ GA 未正确加载');
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '50px auto', 
      padding: '30px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#34C759' }}>🔬 Google Analytics 诊断工具</h1>
      
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <h2>📊 GA 状态检查</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>gtag 函数存在</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>
                {gaStatus.gtagExists ? '✅ 是' : '❌ 否'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>dataLayer 存在</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>
                {gaStatus.dataLayerExists ? '✅ 是' : '❌ 否'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>dataLayer 事件数量</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>
                {gaStatus.dataLayerLength}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>测量 ID</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>
                {gaStatus.measurementId}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px' }}>测试事件已发送</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>
                {gaStatus.testEventSent ? '✅ 是' : '❌ 否'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>🧪 测试操作</h2>
        <button 
          onClick={sendTestEvent}
          style={{
            backgroundColor: '#34C759',
            color: 'white',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginRight: '10px',
            marginBottom: '10px'
          }}
        >
          发送测试事件
        </button>
        <button 
          onClick={sendPageView}
          style={{
            backgroundColor: '#007AFF',
            color: 'white',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          发送测试页面浏览
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '20px', 
        borderRadius: '10px',
        marginTop: '30px',
        border: '1px solid #ffc107'
      }}>
        <h3>📝 如何验证 GA 是否工作：</h3>
        <ol>
          <li>打开浏览器开发者工具（F12）</li>
          <li>切换到 "Network" 标签</li>
          <li>筛选 "google-analytics" 或 "collect"</li>
          <li>点击上面的测试按钮</li>
          <li>查看是否有请求发送到 GA 服务器</li>
          <li>登录 <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">Google Analytics</a></li>
          <li>进入 "报告" → "实时" 查看实时数据</li>
        </ol>
      </div>

      <div style={{ 
        backgroundColor: '#d1ecf1', 
        padding: '20px', 
        borderRadius: '10px',
        marginTop: '20px',
        border: '1px solid #bee5eb'
      }}>
        <h3>🔍 使用 Chrome 扩展调试：</h3>
        <p>推荐安装以下 Chrome 扩展来调试 GA：</p>
        <ul>
          <li><strong>Google Analytics Debugger</strong> - 在控制台显示详细的 GA 调试信息</li>
          <li><strong>GA4 Debug</strong> - 实时显示发送到 GA4 的事件</li>
          <li><strong>Tag Assistant (by Google)</strong> - Google 官方的标签调试工具</li>
        </ul>
      </div>
    </div>
  );
};

export default GATest;

