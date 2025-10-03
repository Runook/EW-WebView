-- 修复Cognito用户的email字段问题
-- 问题：email字段被错误地存储为cognito_sub (UUID格式)
-- 解决：由于Cognito没有存储真实email，我们需要生成一个临时email或从其他地方获取

-- 步骤1: 检查当前问题
SELECT 
  id,
  email,
  cognito_sub,
  CASE 
    WHEN email ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN '需要修复'
    ELSE '正常'
  END as status
FROM users
WHERE cognito_sub IS NOT NULL;

-- 步骤2: 为UUID格式的email生成临时邮箱
-- 注意：这只是临时方案，真实email需要从Cognito获取或用户自己更新

UPDATE users
SET email = CONCAT('user_', SUBSTRING(cognito_sub, 1, 8), '@ewltl.com')
WHERE email ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND cognito_sub IS NOT NULL;

-- 步骤3: 验证修复结果
SELECT 
  id,
  email,
  cognito_sub,
  first_name,
  last_name,
  credits
FROM users
WHERE cognito_sub IS NOT NULL
ORDER BY last_login_at DESC;

-- 步骤4: 为没有注册奖励的用户添加初始积分（如果需要）
-- 检查credits为600或更少的用户（只充值过一次100+500=600）
UPDATE users
SET 
  credits = GREATEST(credits, 500),
  total_credits_earned = GREATEST(total_credits_earned, 500)
WHERE cognito_sub IS NOT NULL 
  AND total_credits_earned < 500;

-- 最终检查
SELECT 
  COUNT(*) as total_cognito_users,
  AVG(credits) as avg_credits,
  SUM(CASE WHEN email LIKE '%@ewltl.com' THEN 1 ELSE 0 END) as temporary_emails
FROM users
WHERE cognito_sub IS NOT NULL;

