#!/bin/bash

# 🚀 EW Logistics SEO 立即修复脚本
# 一键解决Google搜索不到网站的问题

echo "🔍 开始修复SEO问题..."

# 1. 立即提交到Google
echo "📤 提交网站到Google..."
curl -X POST "https://www.google.com/ping?sitemap=https://www.ewltl.com/sitemap.xml"

# 2. 提交到Bing  
echo "📤 提交网站到Bing..."
curl -X POST "https://www.bing.com/ping?sitemap=https://www.ewltl.com/sitemap.xml"

# 3. 检查网站是否已被索引
echo "🔍 检查当前索引状态..."
curl -s "https://www.google.com/search?q=site:ewltl.com" | grep -o "找到约.*个结果" || echo "尚未被索引"

# 4. 生成Google Search Console验证文件
echo "📝 创建Google Search Console验证指导..."
cat > google-verification-guide.txt << EOF
🚀 Google Search Console 验证步骤：

1. 访问：https://search.google.com/search-console
2. 点击"添加资产" -> "网址前缀"
3. 输入：https://www.ewltl.com
4. 选择"HTML标签"验证方法
5. 复制meta标签中的content值
6. 替换 frontend/public/index.html 中的 YOUR_GOOGLE_VERIFICATION_CODE
7. 重新部署网站
8. 返回Google Search Console点击"验证"

成功验证后：
- 提交sitemap：https://www.ewltl.com/sitemap.xml
- 使用"网址检查"工具检查首页
- 点击"请求编入索引"
EOF

echo "✅ 验证指导已保存到 google-verification-guide.txt"

# 5. 生成关键词检查脚本
cat > check-rankings.sh << EOF
#!/bin/bash
# 检查关键词排名脚本

echo "🔍 检查关键词排名..."

keywords=("ewltl" "ewltl.com" "www.ewltl.com" "EW Logistics" "EW物流")

for keyword in "\${keywords[@]}"; do
    echo "检查关键词: \$keyword"
    result=\$(curl -s "https://www.google.com/search?q=\$keyword" | grep -o "ewltl.com" | head -1)
    if [ "\$result" ]; then
        echo "✅ 找到: \$keyword"
    else
        echo "❌ 未找到: \$keyword"
    fi
    sleep 2
done
EOF

chmod +x check-rankings.sh
echo "✅ 排名检查脚本已创建：./check-rankings.sh"

echo ""
echo "🎉 SEO紧急修复完成！"
echo ""
echo "📋 接下来请执行："
echo "1. 阅读 google-verification-guide.txt"
echo "2. 按照指导完成Google Search Console验证"
echo "3. 24小时后运行 ./check-rankings.sh 检查结果"
echo ""
echo "⏰ 预期结果时间："
echo "- 24-48小时：开始被索引"
echo "- 1-2周：搜索 ewltl.com 能找到"
echo "- 2-4周：搜索 ewltl 能找到"


