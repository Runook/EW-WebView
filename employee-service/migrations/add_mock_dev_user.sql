-- 添加本地开发用的Mock用户
-- 此脚本仅在本地开发环境执行，不影响生产环境

-- 检查并插入Mock开发用户
INSERT INTO users (
  email, 
  cognito_sub, 
  first_name, 
  last_name, 
  phone, 
  is_employee, 
  employee_role, 
  employee_id,
  created_at,
  updated_at
) 
SELECT 
  'dev@ewltl.com',
  'mock-user-sub-123',
  '开发',
  '者',
  '+1234567890',
  true,
  'admin',
  'EW240001',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'dev@ewltl.com'
);

-- 验证Mock用户是否存在
SELECT 
  id,
  email,
  first_name,
  last_name,
  employee_role,
  employee_id,
  is_employee
FROM users 
WHERE email = 'dev@ewltl.com';

