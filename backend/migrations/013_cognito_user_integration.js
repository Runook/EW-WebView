/**
 * 支持Cognito用户集成
 * - 让password字段可为空（Cognito用户不需要数据库密码）
 * - 移除user_type的限制，统一使用shipper
 * - 添加cognito相关字段的索引
 */

exports.up = async function(knex) {
  console.log('🔄 开始Cognito用户集成迁移...');
  
  // 1. 修改password字段为可空
  await knex.schema.alterTable('users', table => {
    table.string('password', 255).nullable().alter();
  });
  console.log('✅ password字段已设为可空');
  
  // 2. 移除user_type的check约束
  await knex.raw(`
    ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS users_user_type_check
  `);
  console.log('✅ 移除了user_type的约束');
  
  // 3. 更新所有用户的user_type为shipper（统一用户类型）
  await knex('users').update({ user_type: 'shipper' });
  console.log('✅ 统一所有用户类型为shipper');
  
  // 4. 确保cognito_sub有唯一索引
  const hasIndex = await knex.raw(`
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' 
    AND indexname = 'users_cognito_sub_unique'
  `);
  
  if (hasIndex.rows.length === 0) {
    await knex.schema.alterTable('users', table => {
      table.unique('cognito_sub');
    });
    console.log('✅ 添加了cognito_sub唯一索引');
  }
  
  console.log('✅ Cognito用户集成迁移完成');
};

exports.down = async function(knex) {
  // 1. 恢复password为非空
  await knex.raw(`
    UPDATE users SET password = 'temp_password' WHERE password IS NULL
  `);
  await knex.schema.alterTable('users', table => {
    table.string('password', 255).notNullable().alter();
  });
  
  // 2. 恢复user_type的check约束
  await knex.raw(`
    ALTER TABLE users 
    ADD CONSTRAINT users_user_type_check 
    CHECK (user_type = ANY (ARRAY['shipper'::text, 'carrier'::text, 'broker'::text, 'admin'::text]))
  `);
  
  // 3. 移除cognito_sub的唯一索引
  await knex.schema.alterTable('users', table => {
    table.dropUnique('cognito_sub');
  });
};
