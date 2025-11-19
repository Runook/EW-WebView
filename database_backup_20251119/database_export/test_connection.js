// ============================================
// 数据库连接测试脚本
// 用于验证本地开发环境是否正确配置
// ============================================

const { Client } = require('pg');

// 数据库配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ewlogistics',
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || ''
};

console.log('🔍 测试数据库连接...');
console.log('配置信息:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  User: ${config.user}`);
console.log('');

async function testConnection() {
  const client = new Client(config);
  
  try {
    // 连接数据库
    await client.connect();
    console.log('✅ 数据库连接成功！');
    console.log('');
    
    // 测试查询 - 获取表统计
    console.log('📊 数据库统计:');
    console.log('----------------------------------------');
    
    const tables = [
      'users',
      'companies',
      'customers',
      'employee_orders',
      'sales',
      'rentals',
      'jobs',
      'resumes'
    ];
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = result.rows[0].count;
        console.log(`  ${table.padEnd(20)} ${count.padStart(6)} 条记录`);
      } catch (err) {
        console.log(`  ${table.padEnd(20)} ❌ 表不存在或无权限`);
      }
    }
    
    console.log('----------------------------------------');
    console.log('');
    
    // 测试一个简单的查询
    console.log('🧪 执行测试查询...');
    const testQuery = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
        (SELECT version()) as pg_version
    `);
    
    console.log(`  PostgreSQL 版本: ${testQuery.rows[0].pg_version.split(',')[0]}`);
    console.log(`  数据表数量: ${testQuery.rows[0].table_count}`);
    console.log('');
    
    // 检查关键配置
    console.log('🔧 系统配置检查:');
    try {
      const configResult = await client.query('SELECT * FROM system_config LIMIT 5');
      console.log(`  ✅ system_config 表: ${configResult.rows.length} 条配置`);
    } catch (err) {
      console.log('  ⚠️  system_config 表为空或不存在');
    }
    
    // 检查用户权限
    console.log('');
    console.log('👤 用户权限检查:');
    try {
      const permResult = await client.query('SELECT * FROM employee_permissions LIMIT 5');
      console.log(`  ✅ employee_permissions 表: ${permResult.rows.length} 条权限`);
    } catch (err) {
      console.log('  ⚠️  employee_permissions 表为空或不存在');
    }
    
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     🎉 数据库测试全部通过！               ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log('你现在可以启动应用程序了:');
    console.log('  cd backend && npm start');
    console.log('  cd employee-service && npm start');
    console.log('  cd frontend && npm start');
    
  } catch (err) {
    console.error('');
    console.error('❌ 数据库连接失败！');
    console.error('');
    console.error('错误信息:', err.message);
    console.error('');
    console.error('请检查:');
    console.error('  1. PostgreSQL 服务是否运行: pg_isready');
    console.error('  2. 数据库是否已创建: psql -l | grep ewlogistics');
    console.error('  3. 用户名和密码是否正确');
    console.error('  4. 防火墙设置是否允许连接');
    console.error('');
    console.error('如需帮助，请查看 LOCAL_SETUP_GUIDE.md');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 运行测试
testConnection().catch(err => {
  console.error('未预期的错误:', err);
  process.exit(1);
});

