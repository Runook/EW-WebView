#!/bin/bash

# ============================================
# 数据库导出打包脚本
# 将所有必要文件打包，方便传输到另一台电脑
# ============================================

echo "📦 开始打包数据库导出文件..."
echo ""

# 设置打包文件名
ARCHIVE_NAME="ewlogistics_db_export_$(date +%Y%m%d_%H%M%S).tar.gz"

# 检查必要文件
echo "🔍 检查必要文件..."

required_files=(
    "README.md"
    "LOCAL_SETUP_GUIDE.md"
    "complete_database_dump.sql"
    "quick_setup.sh"
    "import_all_data.sh"
    "test_connection.js"
    "database.config.example.js"
    "env.example.txt"
)

missing_files=0
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
        ((missing_files++))
    fi
done

# 检查数据文件
data_files=$(ls *_data.csv 2>/dev/null | wc -l)
echo "  ✅ ${data_files} 个数据文件 (*_data.csv)"

structure_files=$(ls *_structure.txt 2>/dev/null | wc -l)
echo "  ✅ ${structure_files} 个结构文件 (*_structure.txt)"

echo ""

if [ $missing_files -gt 0 ]; then
    echo "⚠️  警告: 有 $missing_files 个必要文件缺失"
    read -p "是否继续打包? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 打包已取消"
        exit 1
    fi
fi

# 创建打包列表
echo "📋 创建文件清单..."
cat > PACKAGE_CONTENTS.txt << EOF
EW Logistics 数据库导出包
==========================

打包时间: $(date)
包含文件: $(ls -1 | wc -l) 个

文档文件:
---------
$(ls -lh README.md LOCAL_SETUP_GUIDE.md 2>/dev/null)

脚本文件:
---------
$(ls -lh *.sh *.js 2>/dev/null | grep -v node_modules)

SQL文件:
--------
$(ls -lh *.sql 2>/dev/null)

配置文件:
---------
$(ls -lh *.example.* *.txt 2>/dev/null | grep -v PACKAGE_CONTENTS.txt)

数据文件:
---------
共 ${data_files} 个表的数据文件
总大小: $(du -sh *_data.csv 2>/dev/null | tail -1 | awk '{print $1}')

结构文件:
---------
共 ${structure_files} 个表的结构文件

使用说明:
---------
1. 解压文件: tar -xzf $ARCHIVE_NAME
2. 进入目录: cd database_export
3. 运行设置: ./quick_setup.sh
4. 查看文档: cat README.md

详细说明请查看 LOCAL_SETUP_GUIDE.md
EOF

echo "✅ 文件清单已创建"
echo ""

# 开始打包
echo "📦 开始压缩..."
tar -czf "../$ARCHIVE_NAME" \
    --exclude="*.sh~" \
    --exclude="*.swp" \
    --exclude=".DS_Store" \
    --exclude="package_export.sh" \
    . 2>/dev/null

if [ $? -eq 0 ]; then
    # 获取文件大小
    size=$(ls -lh "../$ARCHIVE_NAME" | awk '{print $5}')
    
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║           ✅ 打包完成！                    ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    echo "📦 文件名: $ARCHIVE_NAME"
    echo "📊 文件大小: $size"
    echo "📍 位置: $(cd .. && pwd)/$ARCHIVE_NAME"
    echo ""
    echo "📤 传输到另一台电脑的方法:"
    echo ""
    echo "1️⃣  使用 SCP:"
    echo "   scp $ARCHIVE_NAME user@remote-host:/path/to/destination/"
    echo ""
    echo "2️⃣  使用云存储:"
    echo "   - Google Drive"
    echo "   - Dropbox"
    echo "   - 百度网盘"
    echo ""
    echo "3️⃣  使用 USB 驱动器:"
    echo "   cp ../$ARCHIVE_NAME /Volumes/YOUR_USB/"
    echo ""
    echo "4️⃣  使用 AirDrop (macOS):"
    echo "   直接拖放到 AirDrop"
    echo ""
    echo "📝 在另一台电脑上解压:"
    echo "   tar -xzf $ARCHIVE_NAME"
    echo "   cd database_export"
    echo "   ./quick_setup.sh"
    echo ""
    
    # 生成 MD5 校验码
    if command -v md5 &> /dev/null; then
        md5_hash=$(md5 -q "../$ARCHIVE_NAME")
        echo "🔐 MD5 校验码: $md5_hash"
        echo "$md5_hash  $ARCHIVE_NAME" > "../${ARCHIVE_NAME}.md5"
        echo "   (校验文件已保存: ${ARCHIVE_NAME}.md5)"
    elif command -v md5sum &> /dev/null; then
        md5sum "../$ARCHIVE_NAME" > "../${ARCHIVE_NAME}.md5"
        echo "🔐 MD5 校验码已保存: ${ARCHIVE_NAME}.md5"
    fi
    
else
    echo ""
    echo "❌ 打包失败！"
    echo "请检查磁盘空间和权限"
    exit 1
fi

# 清理临时文件
rm -f PACKAGE_CONTENTS.txt

echo ""

