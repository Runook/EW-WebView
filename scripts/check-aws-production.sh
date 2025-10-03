#!/bin/bash
# AWS生产环境诊断脚本

set -e

echo "🔍 AWS生产环境诊断工具"
echo "================================"
echo ""

# 配置
AWS_REGION="us-east-1"
CLUSTER_NAME="ew-logistics-cluster"
SERVICE_NAME="ew-logistics-backend-service"
LOG_GROUP="/ecs/ew-logistics-backend"
ALB_DNS="ew-logistics-alb-1527520693.us-east-1.elb.amazonaws.com"

# 检查AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI未安装，请先安装"
    exit 1
fi

echo "1️⃣ 检查ECS服务状态..."
echo "-----------------------------------"
aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $AWS_REGION \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Health:healthCheckGracePeriodSeconds}' \
  --output table

echo ""
echo "2️⃣ 检查ECS任务配置..."
echo "-----------------------------------"
TASK_ARN=$(aws ecs list-tasks \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --region $AWS_REGION \
  --query 'taskArns[0]' \
  --output text)

if [ "$TASK_ARN" != "None" ]; then
    aws ecs describe-tasks \
      --cluster $CLUSTER_NAME \
      --tasks $TASK_ARN \
      --region $AWS_REGION \
      --query 'tasks[0].{LastStatus:lastStatus,Health:healthStatus,CPU:cpu,Memory:memory,Started:startedAt}' \
      --output table
else
    echo "⚠️  没有运行中的任务"
fi

echo ""
echo "3️⃣ 检查最近的错误日志..."
echo "-----------------------------------"
echo "最近1小时的ERROR日志:"
aws logs filter-log-events \
  --log-group-name $LOG_GROUP \
  --filter-pattern "ERROR" \
  --start-time $(($(date +%s) - 3600))000 \
  --region $AWS_REGION \
  --query 'events[0:10].message' \
  --output text | head -20

echo ""
echo "4️⃣ 测试后端健康检查..."
echo "-----------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$ALB_DNS/health)
echo "健康检查状态码: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 后端健康检查正常"
    curl -s http://$ALB_DNS/health | python3 -m json.tool || echo ""
else
    echo "❌ 后端健康检查失败"
fi

echo ""
echo "5️⃣ 测试API端点响应时间..."
echo "-----------------------------------"
echo "测试 /api/landfreight/loads ..."
TIME=$( { time curl -s -H "Authorization: Bearer test" \
  http://$ALB_DNS/api/landfreight/loads > /dev/null; } 2>&1 | grep real | awk '{print $2}')
echo "响应时间: $TIME"

echo ""
echo "6️⃣ 检查RDS连接（需要bastion或VPN）..."
echo "-----------------------------------"
echo "⚠️  需要通过堡垒机或VPN连接RDS"
echo "RDS Endpoint: $RDS_ENDPOINT"
echo ""
echo "连接命令:"
echo "psql -h \$RDS_ENDPOINT -U \$RDS_USERNAME -d \$RDS_DB_NAME"

echo ""
echo "================================"
echo "✅ 诊断完成"
echo ""
echo "📊 建议的下一步:"
echo "1. 如果健康检查失败，查看ECS任务日志"
echo "2. 如果API响应慢，检查数据库索引"
echo "3. 如果有大量ERROR日志，分析具体错误内容"
echo "4. 如果连接数过多，考虑增加RDS连接池"

