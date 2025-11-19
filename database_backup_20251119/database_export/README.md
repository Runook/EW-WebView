# EW Logistics 数据库导出摘要

## 📅 导出信息
- **导出日期**: 2025-11-19
- **数据库**: ewlogistics
- **PostgreSQL 版本**: 17.4
- **导出方式**: CSV + SQL

## 📊 数据库统计

### 总体信息
- **总表数**: 26 个表
- **数据文件**: 26 个 CSV 文件
- **最大单表数据**: ~1.6MB (rentals, sales)

### 表清单

| # | 表名 | 文件大小 | 说明 |
|---|------|---------|------|
| 1 | companies | 510B | 公司信息 |
| 2 | customers | 229B | 客户信息 |
| 3 | employee_order_comments | 85B | 订单评论 |
| 4 | employee_order_logs | 32KB | 订单日志 |
| 5 | employee_orders | 8.1KB | 员工订单 |
| 6 | employee_permissions | 2.3KB | 员工权限 |
| 7 | employee_role_permissions | 2.7KB | 角色权限 |
| 8 | employee_statistics | 110B | 员工统计 |
| 9 | fba_comment_likes | 33B | 评论点赞 |
| 10 | fba_comments | 78B | FBA评论 |
| 11 | fba_exchanges | 12KB | FBA交换 |
| 12 | fba_locations | 98B | FBA位置 |
| 13 | fba_media_files | 64B | 媒体文件 |
| 14 | jobs | 1.4KB | 招聘信息 |
| 15 | knex_migrations | 1.2KB | 数据库迁移 |
| 16 | knex_migrations_lock | 20B | 迁移锁 |
| 17 | land_loads | 2.3KB | 陆运货物 |
| 18 | land_trucks | 1.5KB | 陆运卡车 |
| 19 | premium_posts | 2.4KB | 高级帖子 |
| 20 | rentals | 1.6MB | 租赁信息 ⭐ |
| 21 | resumes | 747B | 简历 |
| 22 | sales | 1.6MB | 销售信息 ⭐ |
| 23 | system_config | 1.8KB | 系统配置 |
| 24 | user_credits_log | 8.0KB | 积分日志 |
| 25 | users | 4.0KB | 用户信息 |
| 26 | users_backup_20251003 | 883B | 用户备份 |

⭐ = 大数据表

## 📁 导出文件说明

### 结构文件
1. **complete_database_dump.sql** (23KB)
   - 完整的 CREATE TABLE 语句
   - 包含所有列定义、类型、约束
   - 可直接用于创建数据库结构

2. **full_database_schema.sql** (2.8KB)
   - 详细的表结构信息
   - 包含索引、外键、触发器等
   - 使用 `\d` 命令生成

3. **[table_name]_structure.txt**
   - 每个表的详细结构描述
   - 包含列信息、索引、约束等

### 数据文件
- **[table_name]_data.csv**
  - 表的所有数据
  - CSV 格式，带 HEADER
  - 可直接使用 `\COPY` 命令导入

### 脚本文件
1. **quick_setup.sh**
   - 一键设置脚本
   - 自动创建数据库、导入结构和数据
   - 适合快速部署

2. **import_all_data.sh**
   - 数据导入脚本
   - 按依赖顺序导入所有表
   - 自动重置序列

3. **test_connection.js**
   - 数据库连接测试
   - 验证数据完整性
   - 显示统计信息

### 配置文件
1. **.env.local.example**
   - 环境变量配置示例
   - 包含所有必要的配置项

2. **database.config.example.js**
   - 数据库配置文件示例
   - 适用于 backend 和 employee-service

### 文档
1. **LOCAL_SETUP_GUIDE.md**
   - 详细的设置指南
   - 包含常见问题解答
   - 步骤说明和故障排除

## 🚀 快速开始

### 最简单的方法
```bash
cd database_export
./quick_setup.sh
```

### 手动方法
```bash
# 1. 创建数据库
createdb ewlogistics

# 2. 导入结构
psql -d ewlogistics -f complete_database_dump.sql

# 3. 导入数据
./import_all_data.sh

# 4. 测试连接
node test_connection.js
```

## 📋 数据库依赖关系

```
users (独立)
  ├── companies (依赖 users)
  ├── customers (独立)
  ├── employee_orders (依赖 users)
  │   ├── employee_order_comments
  │   └── employee_order_logs
  ├── sales (依赖 users)
  ├── rentals (依赖 users)
  └── jobs (依赖 users)

system_config (独立)
employee_permissions (独立)
  └── employee_role_permissions

fba_locations (独立)
  ├── fba_exchanges
  ├── fba_comments
  │   └── fba_comment_likes
  └── fba_media_files

land_trucks (独立)
  └── land_loads

knex_migrations (独立)
knex_migrations_lock (独立)
```

## ⚠️ 注意事项

1. **数据敏感性**
   - 包含生产环境的真实数据
   - 请妥善保管，不要上传到公共仓库
   - 用户密码已加密

2. **版本兼容性**
   - 导出自 PostgreSQL 17.4
   - CSV 格式兼容所有版本
   - 建议使用 PostgreSQL 12+ 

3. **大数据表**
   - `rentals` 和 `sales` 表数据量大 (1.6MB 各)
   - 导入可能需要几秒钟
   - 确保有足够的磁盘空间

4. **序列重置**
   - 导入后必须重置序列
   - `import_all_data.sh` 会自动处理
   - 手动导入需要运行序列重置 SQL

## 🔗 相关文件位置

### 生产环境
```
Host: ew-logistics-db.ccju8uyckbbt.us-east-1.rds.amazonaws.com
Database: ewlogistics
User: ewjosh
Port: 5432
```

### 本地环境
```
Host: localhost
Database: ewlogistics
Port: 5432
User: [your_username]
```

## 📞 需要帮助？

1. 查看 `LOCAL_SETUP_GUIDE.md` 获取详细说明
2. 运行 `test_connection.js` 诊断问题
3. 检查各个 `*_structure.txt` 文件了解表结构
4. 确保 PostgreSQL 服务运行: `pg_isready`

## ✅ 验证清单

- [ ] PostgreSQL 已安装并运行
- [ ] 数据库已创建
- [ ] 表结构已导入（26个表）
- [ ] 数据已导入
- [ ] 序列已重置
- [ ] 测试连接成功
- [ ] Backend 配置已更新
- [ ] Employee Service 配置已更新
- [ ] 前端配置已更新

---

**生成时间**: 2025-11-19
**工具**: PostgreSQL 17.4, psql, pg_dump
**格式**: CSV + SQL

