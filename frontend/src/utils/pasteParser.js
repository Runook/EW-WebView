/**
 * 批量粘贴解析工具
 * 用于解析重量和尺寸的批量粘贴数据
 */

/**
 * 解析重量列表
 * 输入示例：
 * 4260
 * 2820
 * 677
 * 1493
 * 3482
 * 4046
 * total: 16778
 * 
 * @param {string} text - 粘贴的文本
 * @returns {Object} { weights: number[], total: number }
 */
export const parseWeightList = (text) => {
  if (!text || typeof text !== 'string') {
    return { weights: [], total: 0 };
  }
  
  const lines = text.trim().split('\n');
  const weights = [];
  let total = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase();
    
    // 跳过空行
    if (!trimmedLine) continue;
    
    // 检查是否是total行
    if (trimmedLine.startsWith('total')) {
      const match = trimmedLine.match(/[\d,]+\.?\d*/);
      if (match) {
        total = parseFloat(match[0].replace(/,/g, ''));
      }
      continue;
    }
    
    // 解析数字
    const number = parseFloat(trimmedLine.replace(/,/g, ''));
    if (!isNaN(number) && number > 0) {
      weights.push(number);
    }
  }
  
  // 如果没有提供total，自动计算
  if (total === 0 && weights.length > 0) {
    total = weights.reduce((sum, w) => sum + w, 0);
  }
  
  return { weights, total };
};

/**
 * 解析尺寸列表
 * 输入示例：
 * 16*97*15 1p
 * 9*41*19 1p
 * 8*73*6 1p
 * 21*39*9 1p
 * 17*80*17 1p
 * 16*95*16 1p
 * 
 * @param {string} text - 粘贴的文本
 * @returns {Array} [{ length, width, height, pieces, volume, original }]
 */
export const parseDimensionsList = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const lines = text.trim().split('\n');
  const dimensions = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳过空行
    if (!trimmedLine) continue;
    
    // 匹配格式：数字*数字*数字 数字p 或 数字*数字*数字
    // 支持: 16*97*15 1p, 16x97x15 1p, 16*97*15, 等
    const match = trimmedLine.match(/(\d+\.?\d*)[*xX×](\d+\.?\d*)[*xX×](\d+\.?\d*)(?:\s*(\d+\.?\d*)\s*[pP])?/);
    
    if (match) {
      const length = parseFloat(match[1]);
      const width = parseFloat(match[2]);
      const height = parseFloat(match[3]);
      const pieces = match[4] ? parseFloat(match[4]) : 1;
      
      // 计算体积（立方英寸转立方英尺）
      const volumeCubicInches = length * width * height * pieces;
      const volumeCubicFeet = volumeCubicInches / 1728; // 1728 = 12^3
      
      dimensions.push({
        length,
        width,
        height,
        pieces,
        volume: volumeCubicFeet,
        original: trimmedLine
      });
    }
  }
  
  return dimensions;
};

/**
 * 计算总体积
 * @param {Array} dimensions - 尺寸数组
 * @returns {number} 总体积（立方英尺）
 */
export const calculateTotalVolume = (dimensions) => {
  if (!Array.isArray(dimensions)) return 0;
  return dimensions.reduce((sum, dim) => sum + (dim.volume || 0), 0);
};

/**
 * 格式化重量显示
 * @param {Array} weights - 重量数组
 * @returns {string} 格式化的文本
 */
export const formatWeightList = (weights) => {
  if (!Array.isArray(weights) || weights.length === 0) {
    return '';
  }
  
  const lines = weights.map(w => w.toString());
  const total = weights.reduce((sum, w) => sum + w, 0);
  lines.push(`total: ${total}`);
  
  return lines.join('\n');
};

/**
 * 格式化尺寸显示
 * @param {Array} dimensions - 尺寸数组
 * @returns {string} 格式化的文本
 */
export const formatDimensionsList = (dimensions) => {
  if (!Array.isArray(dimensions) || dimensions.length === 0) {
    return '';
  }
  
  return dimensions.map(dim => {
    const pieces = dim.pieces && dim.pieces !== 1 ? ` ${dim.pieces}p` : '';
    return `${dim.length}*${dim.width}*${dim.height}${pieces}`;
  }).join('\n');
};

/**
 * 验证重量和尺寸数量是否匹配
 * @param {Array} weights - 重量数组
 * @param {Array} dimensions - 尺寸数组
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateWeightDimensionMatch = (weights, dimensions) => {
  if (!weights || !dimensions) {
    return { isValid: true, message: '' };
  }
  
  const weightCount = weights.length;
  const dimensionCount = dimensions.length;
  
  if (weightCount !== dimensionCount) {
    return {
      isValid: false,
      message: `重量数量(${weightCount})与尺寸数量(${dimensionCount})不匹配`
    };
  }
  
  return { isValid: true, message: '数量匹配' };
};

// 测试函数（仅开发环境）
export const testParser = () => {
  console.log('=== 测试重量解析 ===');
  const weightText = `4260
2820
677
1493
3482
4046
total: 16778`;
  
  const weightResult = parseWeightList(weightText);
  console.log('重量结果:', weightResult);
  
  console.log('\n=== 测试尺寸解析 ===');
  const dimensionText = `16*97*15 1p
9*41*19 1p
8*73*6 1p
21*39*9 1p
17*80*17 1p
16*95*16 1p`;
  
  const dimensionResult = parseDimensionsList(dimensionText);
  console.log('尺寸结果:', dimensionResult);
  console.log('总体积:', calculateTotalVolume(dimensionResult), '立方英尺');
  
  console.log('\n=== 验证匹配 ===');
  const validation = validateWeightDimensionMatch(weightResult.weights, dimensionResult);
  console.log('验证结果:', validation);
};

export default {
  parseWeightList,
  parseDimensionsList,
  calculateTotalVolume,
  formatWeightList,
  formatDimensionsList,
  validateWeightDimensionMatch,
  testParser
};

