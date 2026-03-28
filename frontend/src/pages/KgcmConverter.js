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
  const [errors, setErrors] = useState([]);

  // 解析输入行，支持多种格式
  const parseInputLine = (line) => {
    // 先将X、x转换为*号，然后移除其他字母单位，保留数字、空格、*号和小数点
    const cleaned = line
      .replace(/[Xx]/g, '*')  // 将X、x转换为*
      .replace(/[a-zA-Z]/g, '')  // 移除其他字母
      .trim();
    
    if (!cleaned) return null;
    
    if (cleaned.includes('*')) {
      // 包含*号的格式，如：55*65*76 100 或 200 44*33*33
      const parts = cleaned.split(/\s+/).filter(Boolean);
      let weights = [];
      let dimensions = [];
      
      // 分离重量和尺寸
      for (const part of parts) {
        if (part.includes('*')) {
          // 包含*的是尺寸
          const dims = part.split('*').map(Number).filter(n => !isNaN(n) && n > 0);
          dimensions = dimensions.concat(dims);
        } else {
          // 单独的数字可能是重量
          const num = Number(part);
          if (!isNaN(num) && num > 0) {
            weights.push(num);
          }
        }
      }
      
      // 确保只有一个重量和至少3个尺寸
      if (weights.length === 1 && dimensions.length >= 3) {
        return [weights[0], dimensions[0], dimensions[1], dimensions[2]];
      }
    } else {
      // 不包含*号，按空格分割，应该是原格式：重量 长 宽 高
      const numbers = cleaned.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
      if (numbers.length >= 4) {
        return [numbers[0], numbers[1], numbers[2], numbers[3]];
      }
    }
    
    return null;
  };

  const handleConvert = () => {
    const inputLines = input
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    
    const validLines = [];
    const errorLines = [];
    
    inputLines.forEach((line, index) => {
      const parsed = parseInputLine(line);
      if (parsed) {
        validLines.push(parsed);
      } else {
        errorLines.push(`第${index + 1}行格式错误: "${line}"`);
      }
    });
    
    setErrors(errorLines);
    const lines = validLines;

    // 分组
    const grouped = groupRows(lines);

    // 第一列
    let col1Arr = [];
    let total = 0;
    grouped.forEach(g => {
      const lbs = Math.ceil(g.values[0] * 2.20462);
      const p = g.count;
      if (p > 1) {
        col1Arr.push(`${lbs}*${p}p`);
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
      const [, l, w, h] = g.values;
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
        rows={10}
      placeholder={`[可复制粘贴] 支持多种输入格式：

标准格式：
50 30 20 10    (重量kg 长cm 宽cm 高cm)

带符号格式（符号会被自动忽略）：
55*65*76 100kg
88X22X33 300kg  
200kg 44x33x33
500 44*33*44
400 33cm*33cm*33cm
300kg 50X60X70

单独数字自动识别为重量(kg)
支持的分隔符：* X x
`}
        value={input}
        onChange={e => setInput(e.target.value)}
        className="kgcm-converter-input"
      />
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button onClick={handleConvert} className="btn kgcm-converter-btn">转换</button>
        <button onClick={() => { setInput(''); setResult({ col1: '', col2: '' }); setErrors([]); }} className="btn kgcm-converter-btn">重置</button>
      </div>
      
      {errors.length > 0 && (
        <div className="kgcm-converter-errors">
          <h4>⚠️ 输入格式错误</h4>
          {errors.map((error, index) => (
            <div key={index} className="error-item">{error}</div>
          ))}
        </div>
      )}
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