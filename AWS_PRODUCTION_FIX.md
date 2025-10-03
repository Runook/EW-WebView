# 🔧 AWS生产环境问题诊断与修复

## 📊 问题总结

### 当前状态
- **本地开发**: ✅ PostgreSQL本地数据库 + Mock认证（已修复）
- **AWS生产**: ❌ RDS PostgreSQL + Cognito认证（加载慢，一直显示"加载中"）

### 报告的问题
1. ❌ 没有积分，无法进行高级发布
2. ❌ 点充值积分提示需要登录
3. ❌ 积分管理页面加载特别慢
4. ❌ 发布货源、车源、FBA预约等一直显示"加载中"
5. ❌ 刷新后偶尔出现表单，再刷新又是加载中

## 🔍 可能的原因

### 1. 数据库性能问题
**症状**: 加载时间长
**可能原因**:
- RDS实例规格太小
- 缺少必要的数据库索引
- `premium_posts` 表在生产环境中也可能缺失
- 数据库连接池配置不当

### 2. 认证问题
**症状**: 提示需要登录
**可能原因**:
- Cognito token过期
- 前端没有正确存储token
- 后端token验证失败

### 3. API超时问题
**症状**: 一直加载中
**可能原因**:
- 后端ALB健康检查失败
- ECS任务内存不足
- 数据库查询超时
- Nginx代理超时设置

### 4. CORS问题
**症状**: API调用失败
**可能原因**:
- CORS配置不正确
- OPTIONS预检请求失败

## 🛠️ 修复步骤

### 步骤1: 检查AWS RDS数据库

```bash
# 连接到AWS RDS检查数据库状态
# 需要先配置AWS CLI和安全组

# 1. 检查RDS是否有premium_posts表
# 2. 检查表的索引
# 3. 检查数据量
```

**需要确认的表**:
- ✅ `premium_posts` - 高级功能表
- ✅ `user_credits_log` - 积分日志表
- ✅ `users` - 确保用户表有credits字段

**SQL检查脚本**:
```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('premium_posts', 'user_credits_log');

-- 检查索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'premium_posts';

-- 检查用户表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('credits', 'total_credits_earned', 'total_credits_spent');
```

### 步骤2: 运行数据库迁移（AWS RDS）

如果表缺失，需要在AWS RDS上运行迁移：

```bash
# 方法1: 通过ECS任务运行迁移
aws ecs run-task \
  --cluster ew-logistics-cluster \
  --task-definition db-migration-task \
  --launch-type FARGATE

# 方法2: 通过堡垒机连接RDS运行迁移
# 1. SSH到堡垒机
# 2. 连接RDS
# 3. 运行迁移SQL

# 方法3: 本地通过安全隧道连接
# 1. 配置SSH隧道或VPN
# 2. 运行迁移命令
NODE_ENV=production npm run db:migrate
```

### 步骤3: 优化数据库连接池

**更新knexfile.js中的生产环境配置**:
```javascript
production: {
  client: 'pg',
  connection: {
    host: process.env.RDS_ENDPOINT,
    port: process.env.RDS_PORT || 5432,
    database: process.env.RDS_DB_NAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 20,  // 增加最大连接数
    createTimeoutMillis: 5000,
    acquireTimeoutMillis: 90000,  // 增加超时时间
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    propagateCreateError: false
  },
  acquireConnectionTimeout: 90000
}
```

### 步骤4: 增加API超时时间

**更新frontend/nginx.conf**:
```nginx
location /api/ {
    proxy_pass http://ew-logistics-alb-1527520693.us-east-1.elb.amazonaws.com/api/;
    proxy_set_header Host "ew-logistics-alb-1527520693.us-east-1.elb.amazonaws.com";
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 增加超时时间
    proxy_connect_timeout 120s;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
    
    # 添加缓冲设置
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;
}
```

### 步骤5: 添加数据库查询优化

**创建missing索引**:
```sql
-- land_loads表索引
CREATE INDEX IF NOT EXISTS idx_land_loads_active_created 
ON land_loads(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_land_loads_status 
ON land_loads(status) WHERE is_active = true;

-- land_trucks表索引
CREATE INDEX IF NOT EXISTS idx_land_trucks_active_created 
ON land_trucks(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_land_trucks_status 
ON land_trucks(status) WHERE is_active = true;

-- premium_posts表索引
CREATE INDEX IF NOT EXISTS idx_premium_posts_active_type 
ON premium_posts(is_active, premium_type, end_time) 
WHERE is_active = true;

-- fba_exchanges表索引
CREATE INDEX IF NOT EXISTS idx_fba_exchanges_active_created 
ON fba_exchanges(is_active, created_at DESC);

-- companies表索引
CREATE INDEX IF NOT EXISTS idx_companies_active_created 
ON companies(is_active, created_at DESC);
```

### 步骤6: 前端添加加载超时处理

**更新apiClient.js**:
```javascript
const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    method: 'GET',
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };
  
  // 添加超时控制
  const timeoutMs = options.timeout || 30000; // 默认30秒
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('请求超时:', url);
      throw new Error('请求超时，请检查网络连接');
    }
    
    console.error(`API Request Error [${config.method} ${url}]:`, error);
    throw error;
  }
};
```

### 步骤7: 检查AWS资源配置

**ECS任务定义检查清单**:
- [ ] CPU: 至少512 (0.5 vCPU)
- [ ] 内存: 至少1024 MB
- [ ] 环境变量正确配置
- [ ] RDS安全组允许ECS访问
- [ ] 健康检查路径: `/health`
- [ ] 健康检查间隔: 30秒

**RDS配置检查清单**:
- [ ] 实例类型: 至少db.t3.micro
- [ ] 存储: 至少20GB
- [ ] 连接数限制: 检查max_connections
- [ ] 安全组: 允许ECS安全组访问5432端口
- [ ] 参数组: shared_buffers, work_mem配置

**ALB配置检查清单**:
- [ ] 健康检查: `/health`
- [ ] 超时设置: 60秒
- [ ] 取消注册延迟: 30秒
- [ ] 目标组健康: 至少1个健康目标

## 📋 快速诊断命令

### 检查ECS服务状态
```bash
aws ecs describe-services \
  --cluster ew-logistics-cluster \
  --services ew-logistics-backend-service \
  --region us-east-1
```

### 检查ECS任务日志
```bash
aws logs tail /ecs/ew-logistics-backend \
  --follow \
  --region us-east-1
```

### 检查ALB目标健康
```bash
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --region us-east-1
```

### 测试后端API
```bash
# 直接测试ALB
curl -v http://ew-logistics-alb-1527520693.us-east-1.elb.amazonaws.com/health

# 测试数据库查询API
curl -H "Authorization: Bearer <cognito-token>" \
  http://ew-logistics-alb-1527520693.us-east-1.elb.amazonaws.com/api/landfreight/loads
```

## 🚨 紧急修复方案

如果问题严重影响生产，可以采取以下紧急措施：

### 临时方案1: 增加ECS实例数量
```bash
aws ecs update-service \
  --cluster ew-logistics-cluster \
  --service ew-logistics-backend-service \
  --desired-count 2 \
  --region us-east-1
```

### 临时方案2: 扩大RDS实例
```bash
aws rds modify-db-instance \
  --db-instance-identifier ew-logistics-db \
  --db-instance-class db.t3.small \
  --apply-immediately \
  --region us-east-1
```

### 临时方案3: 禁用复杂查询的Premium功能
在查询中临时移除premium_posts的JOIN：

```javascript
// 临时简化查询
static async getAllCompanies(filters = {}) {
  let query = knex('companies')
    .select('companies.*')
    .where('companies.is_active', true)
    .orderBy('companies.created_at', 'desc');
  
  return await query;
}
```

## 📝 推荐的修复顺序

### 第一优先级（立即执行）
1. ✅ 检查AWS ECS日志，找出具体错误
2. ✅ 检查RDS连接是否正常
3. ✅ 确认premium_posts表存在
4. ✅ 运行数据库迁移（如果表缺失）

### 第二优先级（今天完成）
5. ✅ 添加数据库索引
6. ✅ 优化数据库连接池
7. ✅ 增加API超时时间
8. ✅ 添加前端错误处理

### 第三优先级（本周完成）
9. ✅ 优化查询SQL
10. ✅ 添加Redis缓存
11. ✅ 实现查询结果分页
12. ✅ 添加监控和告警

## 🔬 调试步骤

### 1. 获取AWS后端日志
```bash
# 查看最近的错误
aws logs filter-log-events \
  --log-group-name /ecs/ew-logistics-backend \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --region us-east-1
```

### 2. 查看RDS慢查询
```sql
-- 连接到RDS
psql -h <rds-endpoint> -U <username> -d ew_logistics

-- 检查慢查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 3. 监控RDS连接数
```sql
SELECT count(*) as connections,
       state,
       wait_event_type,
       wait_event
FROM pg_stat_activity
WHERE datname = 'ew_logistics'
GROUP BY state, wait_event_type, wait_event;
```

## 💬 需要您提供的信息

为了更精确地定位问题，请提供：

1. **AWS ECS日志**: 
   ```bash
   aws logs tail /ecs/ew-logistics-backend --follow
   ```

2. **浏览器控制台错误**: 
   - 打开 https://www.ewltl.com
   - 按F12打开开发者工具
   - 查看Console和Network标签的错误

3. **RDS连接信息**:
   - RDS endpoint
   - 实例类型
   - 连接数限制

4. **ECS配置**:
   - CPU/内存配置
   - 运行的任务数量
   - 环境变量（不包含密码）

## 🎯 下一步行动

请执行以下命令并提供输出：

```bash
# 1. 检查ECS服务状态
aws ecs describe-services \
  --cluster ew-logistics-cluster \
  --services ew-logistics-backend-service \
  --region us-east-1 \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount,events:events[0:3]}'

# 2. 检查最近的后端日志
aws logs tail /ecs/ew-logistics-backend \
  --since 1h \
  --region us-east-1 \
  | grep -E "(ERROR|Error|failed|Failed)"

# 3. 测试后端健康
curl -v http://ew-logistics-alb-1527520693.us-east-1.elb.amazonaws.com/health
```

---

**创建日期**: 2025-10-03
**状态**: 待诊断
**优先级**: 🔴 高

