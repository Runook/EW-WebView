import React, { useState } from 'react';
import './KgcmConverter.css';

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

export default function KgcmConverter() {
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
    <div className="kgcm-converter-container">
      <h2>重量体积换算</h2>
      <textarea
        rows={8}
      placeholder={`[可复制粘贴]
每行输入重量kg 长cm 宽cm 高cm：
例如：
50 30 20 10
100 40 30 20
40 20 15 10
...
`}
        value={input}
        onChange={e => setInput(e.target.value)}
        className="kgcm-converter-input"
      />
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button onClick={handleConvert} className="btn kgcm-converter-btn">转换</button>
        <button onClick={() => { setInput(''); setResult({ col1: '', col2: '' }); }} className="btn kgcm-converter-btn">重置</button>
      </div>
      <div className="kgcm-converter-result">
        <div>
          <h4>lbs</h4>
          <pre>{result.col1}</pre>
        </div>
        <div>
          <h4>inches</h4>
          <pre>{result.col2}</pre>
        </div>
      </div>
    </div>
  );
}