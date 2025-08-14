// 初始化FBA数据的脚本
// 由于数据库连接问题，我们先创建一些模拟数据用于演示

const fbaLocations = [
  {
    id: 'ABE2',
    code: 'ABE2',
    name: 'Hazleton Fulfillment Center',
    type: 'FC',
    address: '25 Commerce Point',
    city: 'Hazleton',
    state: 'Pennsylvania',
    zip_code: '18202',
    country: 'US',
    description: 'Amazon FBA配送中心，处理标准尺寸商品'
  },
  {
    id: 'DFW7',
    code: 'DFW7',
    name: 'Haslet Fulfillment Center',
    type: 'FC',
    address: '1400 Alliance Gateway Fwy',
    city: 'Haslet',
    state: 'Texas',
    zip_code: '76052',
    country: 'US',
    description: 'Amazon FBA配送中心，支持大件商品处理'
  },
  {
    id: 'LAX9',
    code: 'LAX9',
    name: 'Redlands Fulfillment Center',
    type: 'FC',
    address: '1910 W Lugonia Ave',
    city: 'Redlands',
    state: 'California',
    zip_code: '92374',
    country: 'US',
    description: 'Amazon FBA配送中心，服务西海岸地区'
  },
  {
    id: 'JFK8',
    code: 'JFK8',
    name: 'Staten Island Fulfillment Center',
    type: 'FC',
    address: '2775 Richmond Ave',
    city: 'Staten Island',
    state: 'New York',
    zip_code: '10314',
    country: 'US',
    description: 'Amazon FBA配送中心，服务东海岸大都市区'
  },
  {
    id: 'PHX3',
    code: 'PHX3',
    name: 'Phoenix Fulfillment Center',
    type: 'FC',
    address: '4750 W Mohave St',
    city: 'Phoenix',
    state: 'Arizona',
    zip_code: '85043',
    country: 'US',
    description: 'Amazon FBA配送中心，服务西南地区'
  }
];

// 模拟评论数据
const mockComments = {
  'ABE2': [
    {
      id: 1,
      user: {
        id: 1,
        first_name: 'John',
        last_name: 'Smith',
        email: 'john@example.com'
      },
      content: '这个仓库处理速度很快，通常在24小时内就能处理完入库。推荐！',
      created_at: '2024-01-15T10:30:00Z',
      like_count: 5,
      is_liked: false,
      replies: []
    },
    {
      id: 2,
      user: {
        id: 2,
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah@example.com'
      },
      content: '位置很方便，离高速公路很近。不过有时候排队时间比较长。',
      created_at: '2024-01-10T14:20:00Z',
      like_count: 3,
      is_liked: false,
      replies: [
        {
          id: 3,
          user: {
            id: 3,
            first_name: 'Mike',
            last_name: 'Wilson',
            email: 'mike@example.com'
          },
          content: '建议避开周一和周五，这两天最忙。',
          created_at: '2024-01-11T09:15:00Z',
          like_count: 2,
          is_liked: false
        }
      ]
    }
  ]
};

console.log('FBA位置数据初始化完成');
console.log(`共初始化 ${fbaLocations.length} 个FBA位置`);
console.log('评论数据演示已准备就绪');

module.exports = { fbaLocations, mockComments };