# 📦 数据库备份文件夹

**创建时间**: 2025-11-19 14:03  
**用途**: 存放数据库导出文件，用于在新电脑上设置本地开发环境

## 📋 文件说明

### 🎯 核心文件（传输到新电脑）
- **ewlogistics_db_export_20251119_140309.tar.gz** (2.5MB)
  - 完整的数据库导出压缩包
  - 包含所有表结构、数据、脚本和文档
  
- **ewlogistics_db_export_20251119_140309.tar.gz.md5**
  - MD5校验文件: `192b2b713b260079a40ca0d7c39719dc`

### 📖 说明文档
- **数据库导出使用说明.md** - 详细的使用指南（中文）
- **📋导出完成清单.txt** - 导出清单和快速参考

### 📂 database_export/ 文件夹
- 原始导出文件
- 包含所有CSV数据、SQL结构、脚本等

### 🔧 脚本文件
- **export_database.sh** - 导出脚本（已完成）
- **database_tables_list.txt** - 表列表

## 🚀 快速开始

在新电脑上：
```bash
# 1. 解压
tar -xzf ewlogistics_db_export_20251119_140309.tar.gz

# 2. 进入目录
cd database_export

# 3. 一键设置
./quick_setup.sh
```

## 📊 数据统计
- 总表数: 26个
- 数据量: ~3.2MB
- PostgreSQL 版本: 17.4

---

⚠️ **注意**: 此文件夹包含生产环境数据，请妥善保管，不要提交到Git仓库。

