
CREATE DATABASE IF NOT EXISTS `youngpapi-live-db`;
USE `youngpapi-live-db`;

-- User Table (Entities)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY, -- Using BIGINT for 12-digit IDs
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL UNIQUE,
    date_of_birth DATE,
    country VARCHAR(100) DEFAULT 'ID',
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    bio TEXT,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) DEFAULT 'https://picsum.photos/200',
    diamonds INT DEFAULT 0,
    beans INT DEFAULT 0,
    salary DECIMAL(10, 2) DEFAULT 0.00,
    total_spending INT DEFAULT 0,
    level INT DEFAULT 1,
    followers INT DEFAULT 0,
    following INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    role ENUM('user', 'admin', 'reseller') DEFAULT 'user',
    status ENUM('active', 'banned') DEFAULT 'active',
    is_google_bound BOOLEAN DEFAULT FALSE,
    is_phone_bound BOOLEAN DEFAULT FALSE,
    is_public_profile BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Real-time Stream Registry
CREATE TABLE IF NOT EXISTS streams (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Chat',
    viewer_count INT DEFAULT 0,
    status ENUM('live', 'ended') DEFAULT 'live',
    thumbnail_url VARCHAR(255),
    country VARCHAR(100),
    is_ai_companion BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Scheduled Streams
CREATE TABLE IF NOT EXISTS scheduled_streams (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Chat',
    start_time BIGINT NOT NULL,
    thumbnail_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Messages / Inbox
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    text TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- System Gifts
CREATE TABLE IF NOT EXISTS gifts (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('Standard', 'Beautiful', 'VIP', 'SVIP', 'Event') NOT NULL,
    price INT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    audio_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type ENUM('topup', 'gift_sent', 'gift_received', 'withdrawal', 'salary', 'rebate') NOT NULL,
    amount INT NOT NULL,
    currency ENUM('diamond', 'bean', 'usd') DEFAULT 'diamond',
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Admin Audit Logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    action VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Master System Config
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed Data
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('owner_commission', '35', 'App owner cut per gift (%)'),
('streamer_commission', '60', 'Streamer earnings per gift (%)'),
('min_withdrawal', '2100', 'Minimum beans for withdrawal');

INSERT IGNORE INTO gifts (id, name, category, price, icon) VALUES 
('rose', 'Rose', 'Standard', 1, '🌹'),
('love', 'Love', 'Standard', 25, '❤️'),
('diamond', 'Diamond', 'Standard', 50, '💎'),
('car', 'Sports Car', 'VIP', 5000, '🏎️'),
('jet', 'Private Jet', 'VIP', 20000, '✈️'),
('rocket', 'Rocket', 'SVIP', 100000, '🚀');

-- Default Admin User (Password: Hustler2026!)
INSERT IGNORE INTO users (id, name, nickname, date_of_birth, country, email, password_hash, role) VALUES 
(1, 'System Admin', 'admin', '1990-01-01', 'US', 'admin@youngpapi.com', 'Hustler2026!', 'admin');

-- Linda Fake User
INSERT IGNORE INTO users (id, name, nickname, email, password_hash, avatar_url, level, diamonds, beans, followers, country, bio) VALUES 
(999999999999, 'Linda', 'Linda', 'linda@live.com', 'linda123', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200', 10, 5000, 10000, 1200, 'US', 'Love streaming and meeting new people!');

CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_trans_type ON transactions(type);
