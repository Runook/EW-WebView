/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // 1. 创建FBA位置表
    .createTable('fba_locations', function(table) {
      table.increments('id').primary();
      table.string('code', 20).notNullable().unique().comment('FBA仓库代码');
      table.string('name', 255).comment('仓库名称');
      table.string('type', 50).comment('仓库类型，如FC, DC, SC等');
      table.string('address', 500).comment('详细地址');
      table.string('city', 100).comment('城市');
      table.string('state', 50).comment('州');
      table.string('zip_code', 20).comment('邮政编码');
      table.string('country', 50).notNullable().defaultTo('US').comment('国家');
      table.decimal('latitude', 10, 8).comment('纬度');
      table.decimal('longitude', 11, 8).comment('经度');
      table.text('description').comment('仓库描述');
      table.boolean('is_active').notNullable().defaultTo(true).comment('是否激活');
      table.timestamps(true, true);
      
      // 索引
      table.index(['code']);
      table.index(['state']);
      table.index(['city']);
      table.index(['type']);
      table.index(['is_active']);
    })
    
    // 2. 创建评论表
    .createTable('fba_comments', function(table) {
      table.increments('id').primary();
      table.integer('fba_location_id').unsigned().notNullable().comment('关联的FBA位置ID');
      table.integer('user_id').unsigned().notNullable().comment('评论用户ID');
      table.integer('parent_id').unsigned().nullable().comment('父评论ID，用于回复');
      table.text('content').notNullable().comment('评论内容');
      table.json('media_files').nullable().comment('媒体文件信息，包括图片和视频');
      table.boolean('is_deleted').notNullable().defaultTo(false).comment('是否已删除');
      table.timestamp('deleted_at').nullable().comment('删除时间');
      table.timestamps(true, true);
      
      // 外键约束
      table.foreign('fba_location_id').references('fba_locations.id').onDelete('CASCADE');
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.foreign('parent_id').references('fba_comments.id').onDelete('CASCADE');
      
      // 索引
      table.index(['fba_location_id']);
      table.index(['user_id']);
      table.index(['parent_id']);
      table.index(['created_at']);
      table.index(['is_deleted']);
    })
    
    // 3. 创建评论点赞表
    .createTable('fba_comment_likes', function(table) {
      table.increments('id').primary();
      table.integer('comment_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.timestamps(true, true);
      
      // 外键约束
      table.foreign('comment_id').references('fba_comments.id').onDelete('CASCADE');
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      
      // 唯一约束，防止重复点赞
      table.unique(['comment_id', 'user_id']);
    })
    
    // 4. 创建媒体文件表
    .createTable('fba_media_files', function(table) {
      table.increments('id').primary();
      table.integer('comment_id').unsigned().notNullable();
      table.string('file_type', 20).notNullable().comment('文件类型：image, video');
      table.string('file_name', 255).notNullable().comment('原始文件名');
      table.string('file_path', 500).notNullable().comment('文件存储路径');
      table.string('file_url', 500).notNullable().comment('文件访问URL');
      table.integer('file_size').comment('文件大小（字节）');
      table.string('mime_type', 100).comment('MIME类型');
      table.integer('width').nullable().comment('图片/视频宽度');
      table.integer('height').nullable().comment('图片/视频高度');
      table.integer('duration').nullable().comment('视频时长（秒）');
      table.timestamps(true, true);
      
      // 外键约束
      table.foreign('comment_id').references('fba_comments.id').onDelete('CASCADE');
      
      // 索引
      table.index(['comment_id']);
      table.index(['file_type']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('fba_media_files')
    .dropTableIfExists('fba_comment_likes')
    .dropTableIfExists('fba_comments')
    .dropTableIfExists('fba_locations');
};