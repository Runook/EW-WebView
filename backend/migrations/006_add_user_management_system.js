/**
 * Migration: 添加用户管理系统
 * 包括积分系统、置顶功能等
 */

exports.up = function(knex) {
  return knex.schema
    // 1. 为用户表添加积分字段
    .table('users', function(table) {
      table.integer('credits').defaultTo(100).comment('用户积分余额');
      table.integer('total_credits_earned').defaultTo(100).comment('累计获得积分');
      table.integer('total_credits_spent').defaultTo(0).comment('累计消费积分');
    })
    
    // 2. 创建积分变动记录表
    .createTable('user_credits_log', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.enum('type', ['earn', 'spend', 'refund', 'admin_adjust']).notNullable().comment('积分变动类型');
      table.integer('amount').notNullable().comment('变动金额（正数增加，负数减少）');
      table.integer('balance_after').notNullable().comment('变动后余额');
      table.string('description', 500).comment('变动描述');
      table.string('reference_type', 50).comment('关联类型：load, truck, recharge等');
      table.integer('reference_id').comment('关联ID');
      table.timestamps(true, true);
      
      // 外键和索引
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.index(['user_id', 'created_at']);
      table.index(['type']);
      table.index(['reference_type', 'reference_id']);
    })
    
    // 3. 创建置顶记录表
    .createTable('premium_posts', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.enum('post_type', ['load', 'truck', 'company', 'job', 'resume']).notNullable().comment('帖子类型');
      table.integer('post_id').notNullable().comment('帖子ID');
      table.enum('premium_type', ['top', 'highlight', 'urgent']).notNullable().comment('高级类型');
      table.integer('credits_cost').notNullable().comment('消费积分');
      table.datetime('start_time').notNullable().comment('开始时间');
      table.datetime('end_time').notNullable().comment('结束时间');
      table.boolean('is_active').defaultTo(true).comment('是否有效');
      table.timestamps(true, true);
      
      // 外键和索引
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.index(['post_type', 'post_id']);
      table.index(['premium_type', 'is_active']);
      table.index(['end_time']);
      table.unique(['post_type', 'post_id', 'premium_type', 'start_time'], 'unique_premium_post');
    })
    
    // 4. 为货源表添加管理字段
    .table('land_loads', function(table) {
      table.enum('status', ['active', 'inactive', 'completed', 'cancelled']).defaultTo('active').comment('状态');
      table.boolean('is_premium').defaultTo(false).comment('是否为高级帖子');
      table.integer('views_count').defaultTo(0).comment('浏览次数');
      table.datetime('last_refreshed').comment('最后刷新时间');
      table.index(['status', 'is_active']);
      table.index(['is_premium', 'created_at']);
    })
    
    // 5. 为车源表添加管理字段  
    .table('land_trucks', function(table) {
      table.enum('status', ['active', 'inactive', 'completed', 'cancelled']).defaultTo('active').comment('状态');
      table.boolean('is_premium').defaultTo(false).comment('是否为高级帖子');
      table.integer('views_count').defaultTo(0).comment('浏览次数');
      table.datetime('last_refreshed').comment('最后刷新时间');
      table.index(['status', 'is_active']);
      table.index(['is_premium', 'created_at']);
    })
    
    // 6. 为企业表添加管理字段
    .table('companies', function(table) {
      table.enum('status', ['active', 'inactive', 'pending']).defaultTo('active').comment('状态');
      table.boolean('is_premium').defaultTo(false).comment('是否为高级帖子');
      table.integer('views_count').defaultTo(0).comment('浏览次数');
      table.datetime('last_refreshed').comment('最后刷新时间');
      table.index(['status', 'is_active']);
      table.index(['is_premium', 'created_at']);
    })
    
    // 7. 为职位表添加管理字段
    .table('jobs', function(table) {
      table.enum('status', ['active', 'inactive', 'filled', 'cancelled']).defaultTo('active').comment('状态');
      table.boolean('is_premium').defaultTo(false).comment('是否为高级帖子');
      table.integer('views_count').defaultTo(0).comment('浏览次数');
      table.datetime('last_refreshed').comment('最后刷新时间');
      table.index(['status', 'is_active']);
      table.index(['is_premium', 'created_at']);
    })
    
    // 8. 为简历表添加管理字段
    .table('resumes', function(table) {
      table.enum('status', ['active', 'inactive', 'hired']).defaultTo('active').comment('状态');
      table.boolean('is_premium').defaultTo(false).comment('是否为高级帖子');
      table.integer('views_count').defaultTo(0).comment('浏览次数');
      table.datetime('last_refreshed').comment('最后刷新时间');
      table.index(['status', 'is_active']);
      table.index(['is_premium', 'created_at']);
    })
    
    // 9. 创建系统配置表
    .createTable('system_config', function(table) {
      table.increments('id').primary();
      table.string('config_key', 100).notNullable().unique();
      table.text('config_value').notNullable();
      table.string('description', 500);
      table.enum('data_type', ['string', 'number', 'boolean', 'json']).defaultTo('string');
      table.timestamps(true, true);
      
      table.index(['config_key']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('system_config')
    .table('resumes', function(table) {
      table.dropColumn('status');
      table.dropColumn('is_premium');
      table.dropColumn('views_count');
      table.dropColumn('last_refreshed');
    })
    .table('jobs', function(table) {
      table.dropColumn('status');
      table.dropColumn('is_premium');
      table.dropColumn('views_count');
      table.dropColumn('last_refreshed');
    })
    .table('companies', function(table) {
      table.dropColumn('status');
      table.dropColumn('is_premium');
      table.dropColumn('views_count');
      table.dropColumn('last_refreshed');
    })
    .table('land_trucks', function(table) {
      table.dropColumn('status');
      table.dropColumn('is_premium');
      table.dropColumn('views_count');
      table.dropColumn('last_refreshed');
    })
    .table('land_loads', function(table) {
      table.dropColumn('status');
      table.dropColumn('is_premium');
      table.dropColumn('views_count');
      table.dropColumn('last_refreshed');
    })
    .dropTableIfExists('premium_posts')
    .dropTableIfExists('user_credits_log')
    .table('users', function(table) {
      table.dropColumn('credits');
      table.dropColumn('total_credits_earned');
      table.dropColumn('total_credits_spent');
    });
};
