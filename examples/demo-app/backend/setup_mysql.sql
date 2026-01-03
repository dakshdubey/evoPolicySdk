-- Database setup for EvoPolicy Demo
CREATE DATABASE IF NOT EXISTS evopolicy_db;
USE evopolicy_db;

CREATE TABLE IF NOT EXISTS policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    effect ENUM('allow', 'deny') NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    conditions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Truncate to avoid duplicates for demo
TRUNCATE TABLE policies;

-- Seed policies
INSERT INTO policies (effect, role, action, resource, conditions) VALUES 
('allow', 'manager', 'approve', 'invoice', '{"amount": "<=1000"}'),
('allow', 'admin', '*', '*', NULL),
('allow', 'user', 'update', 'profile', '{"email": "~= ^[\\\\w-\\\\.]+@company\\\\.com$"}'),
('allow', 'editor', 'publish', 'article', '{"publishDate": "> 2025-01-01T00:00:00Z"}');
