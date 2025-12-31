-- update time 2025-12-31 17:35:00

-- 1. 用户表
CREATE TABLE `system_user` (
  `user_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  user_name VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(100) NOT NULL COMMENT '加密密码',
  `real_name` VARCHAR(50) COMMENT '真实姓名',
  `phone` VARCHAR(20) COMMENT '联系电话',
  `role` VARCHAR(20) DEFAULT 'user' COMMENT '角色 user admin',
  `status` TINYINT(1) DEFAULT 1 COMMENT '状态',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_userName` (user_name)
) ENGINE=InnoDB COMMENT='系统用户表';

-- 2. 农田表
CREATE TABLE `farmland` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `area_size` DECIMAL(10,2),
  `location` VARCHAR(255),
  `soil_type` VARCHAR(50),
  `description` TEXT,
  `polygon_path` JSON COMMENT '地块多边形路径点坐标[(lng,lat),...]',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_farmland_user` FOREIGN KEY (`user_id`) REFERENCES `system_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='农田信息表';

-- 3. 作物表
CREATE TABLE `crop` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `farmland_id` BIGINT NOT NULL,
  `crop_name` VARCHAR(50) NOT NULL,
  `variety` VARCHAR(50),
  `plant_date` DATE,
  `status` TINYINT(4) DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_farmland_id` (`farmland_id`),
  CONSTRAINT `fk_crop_farmland` FOREIGN KEY (`farmland_id`) REFERENCES `farmland` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='作物种植信息表';

-- 4. 设备表
CREATE TABLE `device` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `serial_no` VARCHAR(64) NOT NULL,
  `farmland_id` BIGINT,
  `type` VARCHAR(50),
  `status` TINYINT(4) DEFAULT 1,
  `last_heartbeat` DATETIME,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_serial_no` (`serial_no`),
  KEY `idx_farmland_device` (`farmland_id`),
  CONSTRAINT `fk_device_farmland` FOREIGN KEY (`farmland_id`) REFERENCES `farmland` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='物联网设备表';

-- 5. 环境数据表
CREATE TABLE `env_data` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `device_id` BIGINT NOT NULL,
  `farmland_id` BIGINT NOT NULL,
  `air_temp` DECIMAL(5,2),
  `air_humidity` DECIMAL(5,2),
  `soil_moisture` DECIMAL(5,2),
  `light_lux` DECIMAL(10,2),
  `co2_ppm` DECIMAL(10,2),
  `collect_time` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_device_time` (`device_id`, `collect_time`),
  KEY `idx_farmland_time` (`farmland_id`, `collect_time`),
  CONSTRAINT `fk_env_device` FOREIGN KEY (`device_id`) REFERENCES `device` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_env_farmland` FOREIGN KEY (`farmland_id`) REFERENCES `farmland` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='环境监测数据表';

-- 6. 农事日志表
CREATE TABLE `farming_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `farmland_id` BIGINT NOT NULL,
  `crop_id` BIGINT,
  `user_id` BIGINT,
  `operate_type` VARCHAR(50) NOT NULL,
  `content` TEXT,
  `cost` DECIMAL(10,2) DEFAULT 0.00,
  `images` VARCHAR(1000),
  `operate_time` DATETIME NOT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_farmland_op` (`farmland_id`, `operate_time`),
  CONSTRAINT `fk_log_farmland` FOREIGN KEY (`farmland_id`) REFERENCES `farmland` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_crop` FOREIGN KEY (`crop_id`) REFERENCES `crop` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_log_operator` FOREIGN KEY (`user_id`) REFERENCES `system_user` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='农事操作日志表';

-- 7. AI建议表
CREATE TABLE `ai_suggestion` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `farmland_id` BIGINT NOT NULL,
  `trigger_reason` VARCHAR(255),
  `suggestion` TEXT NOT NULL,
  `ai_model` VARCHAR(50),
  `is_adopted` TINYINT(4) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_farmland_suggestion` (`farmland_id`),
  CONSTRAINT `fk_suggestion_farmland` FOREIGN KEY (`farmland_id`) REFERENCES `farmland` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='智能决策建议表';

-- 8. AI对话表
CREATE TABLE `ai_chat` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `session_id` VARCHAR(64),
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `context_data` JSON,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_session` (`user_id`, `session_id`),
  CONSTRAINT `fk_chat_user` FOREIGN KEY (`user_id`) REFERENCES `system_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='AI问答记录表';

-- 9. 告警规则表
CREATE TABLE `alert_rule` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `rule_name` VARCHAR(50) NOT NULL COMMENT '规则名称',
  `farmland_id` BIGINT COMMENT '关联农田(空则为全局)',
  `metric_type` VARCHAR(50) NOT NULL COMMENT '监测指标(如: air_temp, soil_moisture)',
  `condition_operator` VARCHAR(10) NOT NULL COMMENT '条件操作符(>, <, =, >=, <=)',
  `threshold_value` DECIMAL(10,2) NOT NULL COMMENT '阈值',
  `severity` VARCHAR(20) DEFAULT 'warning' COMMENT '告警级别(info, warning, danger)',
  `is_enabled` TINYINT(1) DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rule_farmland` (`farmland_id`),
  CONSTRAINT `fk_rule_farmland` FOREIGN KEY (`farmland_id`) REFERENCES `farmland` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='环境监测告警规则表';

-- 10. 告警记录表
CREATE TABLE `alert_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `rule_id` BIGINT,
  `farmland_id` BIGINT NOT NULL,
  `device_id` BIGINT,
  `alert_content` VARCHAR(255) NOT NULL,
  `metric_value` DECIMAL(10,2),
  `status` TINYINT(4) DEFAULT 0 COMMENT '处理状态: 0-未读, 1-已处理',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_log_farmland` (`farmland_id`),
  KEY `idx_log_status` (`status`),
  CONSTRAINT `fk_alert_rule` FOREIGN KEY (`rule_id`) REFERENCES `alert_rule` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_alert_farmland` FOREIGN KEY (`farmland_id`) REFERENCES `farmland` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_alert_device` FOREIGN KEY (`device_id`) REFERENCES `device` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='告警推送日志表';
