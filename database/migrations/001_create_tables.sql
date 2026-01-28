-- AI工具需求愿望收集平台 - 数据库表结构
-- 创建时间: 2026-01-28
-- 数据库: MySQL 8.0+

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL COMMENT '用户ID（UUID）',
  `name` VARCHAR(100) NOT NULL COMMENT '用户姓名',
  `email` VARCHAR(255) NOT NULL COMMENT '用户邮箱',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT '用户角色：admin-管理员，user-普通用户',
  `job` ENUM('开发', '设计', '产品', '运营', '行政', '测试', '人事', '财务') NULL COMMENT '用户岗位',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_job` (`job`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 愿望表 (wishes)
-- ============================================
DROP TABLE IF EXISTS `wishes`;
CREATE TABLE `wishes` (
  `id` VARCHAR(36) NOT NULL COMMENT '愿望ID（UUID）',
  `title` VARCHAR(200) NOT NULL COMMENT '愿望名称',
  `description` TEXT NOT NULL COMMENT '需求描述',
  `job` ENUM('开发', '设计', '产品', '运营', '行政', '测试', '人事', '财务') NOT NULL COMMENT '提交者岗位',
  `submitter` VARCHAR(100) NOT NULL COMMENT '提交者姓名',
  `submitter_id` VARCHAR(36) NULL COMMENT '提交者ID（外键关联users表）',
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft' COMMENT '愿望状态：draft-草稿，published-已发布，archived-已归档',
  `likes` INT NOT NULL DEFAULT 0 COMMENT '点赞数（冗余字段，提高查询性能）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_submitter_id` (`submitter_id`),
  KEY `idx_job` (`job`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_likes` (`likes`),
  CONSTRAINT `fk_wishes_submitter` FOREIGN KEY (`submitter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='愿望表';

-- ============================================
-- 3. 评论表 (comments)
-- ============================================
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` VARCHAR(36) NOT NULL COMMENT '评论ID（UUID）',
  `wish_id` VARCHAR(36) NOT NULL COMMENT '愿望ID（外键关联wishes表）',
  `author` VARCHAR(100) NOT NULL COMMENT '评论作者',
  `author_id` VARCHAR(36) NULL COMMENT '评论作者ID（外键关联users表）',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_wish_id` (`wish_id`),
  KEY `idx_author_id` (`author_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_comments_wish` FOREIGN KEY (`wish_id`) REFERENCES `wishes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ============================================
-- 4. 点赞表 (likes) - 多对多关系表
-- ============================================
DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `id` VARCHAR(36) NOT NULL COMMENT '点赞记录ID（UUID）',
  `wish_id` VARCHAR(36) NOT NULL COMMENT '愿望ID（外键关联wishes表）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID（外键关联users表）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wish_user` (`wish_id`, `user_id`),
  KEY `idx_wish_id` (`wish_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_likes_wish` FOREIGN KEY (`wish_id`) REFERENCES `wishes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- ============================================
-- 5. 收藏表 (favorites) - 多对多关系表
-- ============================================
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` VARCHAR(36) NOT NULL COMMENT '收藏记录ID（UUID）',
  `wish_id` VARCHAR(36) NOT NULL COMMENT '愿望ID（外键关联wishes表）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID（外键关联users表）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wish_user` (`wish_id`, `user_id`),
  KEY `idx_wish_id` (`wish_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_favorites_wish` FOREIGN KEY (`wish_id`) REFERENCES `wishes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- ============================================
-- 6. 初始化默认管理员账户
-- ============================================
-- 密码: admin123 (使用bcrypt加密，实际使用时需要替换为真实加密后的密码)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `job`, `created_at`, `updated_at`)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '管理员', 'admin@example.com', '$2b$10$YourHashedPasswordHere', 'admin', '开发', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- ============================================
-- 7. 创建触发器：自动更新wishes表的likes字段
-- ============================================
DELIMITER $$

-- 当插入点赞记录时，增加愿望的点赞数
DROP TRIGGER IF EXISTS `trg_likes_insert`$$
CREATE TRIGGER `trg_likes_insert`
AFTER INSERT ON `likes`
FOR EACH ROW
BEGIN
  UPDATE `wishes` SET `likes` = `likes` + 1 WHERE `id` = NEW.`wish_id`;
END$$

-- 当删除点赞记录时，减少愿望的点赞数
DROP TRIGGER IF EXISTS `trg_likes_delete`$$
CREATE TRIGGER `trg_likes_delete`
AFTER DELETE ON `likes`
FOR EACH ROW
BEGIN
  UPDATE `wishes` SET `likes` = GREATEST(`likes` - 1, 0) WHERE `id` = OLD.`wish_id`;
END$$

DELIMITER ;

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 表结构说明
-- ============================================
-- 1. users表：存储用户基本信息，包括管理员和普通用户
-- 2. wishes表：存储愿望信息，包含状态管理（草稿、已发布、已归档）
-- 3. comments表：存储评论信息，支持评论的创建和更新
-- 4. likes表：存储点赞关系，确保每个用户对每个愿望只能点赞一次
-- 5. favorites表：存储收藏关系，确保每个用户对每个愿望只能收藏一次
-- 
-- 索引优化：
-- - 所有外键字段都创建了索引
-- - 常用查询字段（job、status、created_at、likes）都创建了索引
-- - 唯一约束确保数据完整性
--
-- 触发器：
-- - 自动维护wishes表的likes字段，确保数据一致性
-- ============================================
