# EW Logistics 本地开发环境设置指南

## 📋 概述

这个文件夹包含了从生产数据库导出的所有数据，可以用来在另一台电脑上设置本地开发环境。

## 📁 文件说明

### 结构文件
- `complete_database_dump.sql` - 完整的数据库结构定义（26个表）
- `full_database_schema.sql` - 详细的表结构信息（带索引、约束等）
- `*_structure.txt` - 每个表的详细结构说明

### 数据文件
- `*_data.csv` - 每个表的数据（CSV格式）

### 主要表列表
1. `companies` - 公司信息
2. `customers` - 客户信息
3. `employee_orders` - 员工订单
4. `employee_order_comments` - 订单评论
5. `employee_order_logs` - 订单日志
6. `employee_permissions` - 员工权限
7. `employee_role_permissions` - 角色权限
8. `employee_statistics` - 员工统计
9. `fba_comments` - FBA评论
10. `fba_comment_likes` - 评论点赞
11. `fba_exchanges` - FBA交换信息
12. `fba_locations` - FBA位置
13. `fba_media_files` - FBA媒体文件
14. `jobs` - 招聘信息
15. `land_loads` - 陆运货物
16. `land_trucks` - 陆运卡车
17. `premium_posts` - 高级帖子
18. `rentals` - 租赁信息（大数据：1.6MB）
19. `resumes` - 简历
20. `sales` - 销售信息（大数据：1.6MB）
21. `system_config` - 系统配置
22. `user_credits_log` - 用户积分日志
23. `users` - 用户信息
24. `knex_migrations` - 数据库迁移记录

## 🚀 在新电脑上设置步骤

### 第一步：安装 PostgreSQL

**macOS:**
```bash
brew install postgresql@17
brew services start postgresql@17
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-17
sudo systemctl start postgresql
```

**Windows:**
- 下载并安装 PostgreSQL 17 from [官方网站](https://www.postgresql.org/download/)

### 第二步：创建本地数据库

```bash
# 创建数据库
createdb ewlogistics

# 或者使用 psql
psql postgres
CREATE DATABASE ewlogistics;
\q
```

### 第三步：导入数据库结构

```bash
cd /path/to/database_export

# 方法1：使用完整的SQL文件
psql -d ewlogistics -f complete_database_dump.sql

# 方法2：或使用 full_database_schema.sql
psql -d ewlogistics -f full_database_schema.sql
```

### 第四步：导入数据

创建导入脚本：

```bash
cat > import_data.sh << 'EOF'
#!/bin/bash

DB="ewlogistics"

# 导入所有CSV数据
for file in *_data.csv; do
    table=$(echo $file | sed 's/_data.csv//')
    echo "导入表: $table"
    psql -d $DB -c "\COPY $table FROM '$file' WITH CSV HEADER;" 2>&1 | grep -v "COPY 0" || true
done

echo "数据导入完成！"
EOF

chmod +x import_data.sh
./import_data.sh
```

### 第五步：验证导入

```bash
psql -d ewlogistics

-- 检查所有表
\dt

-- 检查各表的数据量
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- 退出
\q
```

## 🔧 更新项目配置

### Backend 配置

编辑 `backend/src/config/database.js`:

```javascript
module.exports = {
  client: 'pg',
  connection: {
    host: 'localhost',  // 改为 localhost
    port: 5432,
    database: 'ewlogistics',
    user: 'your_local_username',  // 你的本地用户名
    password: 'your_local_password'  // 你的本地密码（如果有）
  }
};
```

或使用环境变量，编辑 `.env` 文件:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ewlogistics
DB_USER=your_username
DB_PASSWORD=your_password
```

### Employee Service 配置

编辑 `employee-service/src/config/database.js`:

```javascript
module.exports = {
  host: 'localhost',
  port: 5432,
  database: 'ewlogistics',
  user: 'your_local_username',
  password: 'your_local_password'
};
```

## 📊 数据统计

根据导出的文件大小：
- **rentals**: ~1.6MB (大量租赁数据)
- **sales**: ~1.6MB (大量销售数据)
- **employee_order_logs**: ~32KB (订单日志)
- **employee_orders**: ~8KB (员工订单)
- 其他表: 小于5KB

## 🔐 生产数据库连接信息（仅供参考）

```
Host: ew-logistics-db.ccju8uyckbbt.us-east-1.rds.amazonaws.com
User: ewjosh
Database: ewlogistics
Port: 5432
```

⚠️ **注意**: 请妥善保管数据库密码，不要提交到 Git 仓库。

## 🧪 测试连接

创建测试脚本 `test_connection.js`:

```javascript
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'ewlogistics',
  user: 'your_username',
  password: 'your_password'
});

async function testConnection() {
  try {
    await client.connect();
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log('✅ 数据库连接成功！');
    console.log(`用户数量: ${result.rows[0].count}`);
    await client.end();
  } catch (err) {
    console.error('❌ 数据库连接失败:', err);
  }
}

testConnection();
```

运行测试：
```bash
node test_connection.js
```

## 📝 常见问题

### Q1: pg_dump 版本不匹配
**A**: 这就是为什么我们使用 CSV 导出而不是 pg_dump。CSV 格式兼容所有版本。

### Q2: 导入时出现权限错误
**A**: 确保你的 PostgreSQL 用户有创建表和导入数据的权限：
```sql
GRANT ALL PRIVILEGES ON DATABASE ewlogistics TO your_username;
```

### Q3: 某些表导入失败
**A**: 检查表的依赖关系。可能需要按顺序导入：
1. 先导入独立表（users, system_config）
2. 再导入依赖表（companies, customers）
3. 最后导入关联表（orders, comments）

### Q4: 序列值不正确
**A**: 导入数据后，重置序列：
```sql
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));
-- 为其他表重复此操作
```

## 🎯 快速开始脚本

创建一键设置脚本 `quick_setup.sh`:

```bash
#!/bin/bash

echo "🚀 开始设置 EW Logistics 本地开发环境..."

# 创建数据库
echo "📦 创建数据库..."
createdb ewlogistics 2>/dev/null || echo "数据库已存在"

# 导入结构
echo "🏗️  导入数据库结构..."
psql -d ewlogistics -f complete_database_dump.sql

# 导入数据
echo "📊 导入数据..."
for file in *_data.csv; do
    table=$(echo $file | sed 's/_data.csv//')
    echo "  导入 $table..."
    psql -d ewlogistics -c "\COPY $table FROM '$file' WITH CSV HEADER;" 2>&1 | grep -v "COPY 0" || true
done

# 重置序列
echo "🔄 重置序列..."
psql -d ewlogistics << 'EOF'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'SELECT setval(''' || r.tablename || '_id_seq'', COALESCE((SELECT MAX(id) FROM ' || r.tablename || '), 1))';
    END LOOP;
END $$;
EOF

echo "✅ 设置完成！"
echo ""
echo "下一步："
echo "1. 更新 backend/src/config/database.js"
echo "2. 更新 employee-service/src/config/database.js"
echo "3. 运行 'npm install' 在各个服务目录"
echo "4. 运行 'npm start' 启动服务"
```

## 📞 支持

如果遇到问题，请检查：
1. PostgreSQL 服务是否运行
2. 数据库用户权限是否正确
3. 所有 CSV 文件是否完整
4. 查看各个 `*_structure.txt` 文件了解表结构

---

**导出日期**: $(date)
**数据库版本**: PostgreSQL 17.4
**总表数**: 26
**总数据文件**: 26 个 CSV 文件

