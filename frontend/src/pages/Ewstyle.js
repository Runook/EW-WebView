import React, { useState } from 'react';
import './Ewstyle.css';

function groupRows(rows) {
  // 判断是否有完全相同的行
  const map = {};
  rows.forEach(r => {
    const key = r.join(',');
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([key, count]) => ({
    values: key.split(',').map(Number),
    count,
  }));
}

export default function Ewstyle() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState({ col1: '', col2: '' });

  const handleConvert = () => {
    const lines = input
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => l.split(/\s+/).map(Number))
      .filter(arr => arr.length === 4);

    // 分组
    const grouped = groupRows(lines);

    // 第一列
    let col1Arr = [];
    let total = 0;
    grouped.forEach(g => {
      const lbs = Math.ceil(g.values[0] * 2.20462);
      const p = g.count;
      if (p > 1) {
        col1Arr.push(`${lbs}*${p}`);
        total += lbs * p;
      } else {
        col1Arr.push(`${lbs}`);
        total += lbs;
      }
    });
    col1Arr.push(`total: ${total}`);

    // 第二列
    let col2Arr = [];
    grouped.forEach(g => {
      const [kg, l, w, h] = g.values;
      const p = g.count;
      const lin = Math.ceil(l / 2.54);
      const win = Math.ceil(w / 2.54);
      const hin = Math.ceil(h / 2.54);
      col2Arr.push(`${lin}*${win}*${hin} ${p}p`);
    });

    setResult({
      col1: col1Arr.join('\n'),
      col2: col2Arr.join('\n'),
    });
  };

  return (
    <div className="ewstyle-container">
      <h2>EW格式转换工具</h2>
      <textarea
        rows={8}
        placeholder="每行输入：kg cm cm cm"
        value={input}
        onChange={e => setInput(e.target.value)}
        className="ewstyle-input"
      />
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button onClick={handleConvert} className="btn ewstyle-btn">转换</button>
        <button onClick={() => { setInput(''); setResult({ col1: '', col2: '' }); }} className="btn ewstyle-btn">重置</button>
      </div>
      <div className="ewstyle-result">
        <div>
          <h4>独立列1：</h4>
          <pre>{result.col1}</pre>
        </div>
        <div>
          <h4>独立列2：</h4>
          <pre>{result.col2}</pre>
        </div>
      </div>
    </div>
  );
}