CREATE DATABASE IF NOT EXISTS diamond_inventory;
USE diamond_inventory;

CREATE TABLE IF NOT EXISTS diamonds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id VARCHAR(50),
    country VARCHAR(100),
    shape VARCHAR(100),
    qty INT DEFAULT 0,
    weight DECIMAL(10,3),
    color VARCHAR(20),
    clarity VARCHAR(50),
    marketing VARCHAR(255),
    cut_grade VARCHAR(50),
    polish VARCHAR(50),
    symmetry VARCHAR(50),
    lab VARCHAR(50),
    fluorescence VARCHAR(50),
    certificate VARCHAR(50),
    length DECIMAL(10,3),
    width DECIMAL(10,3),
    height DECIMAL(10,3),
    is_matched_pair VARCHAR(50),
    list_price DECIMAL(15,2),
    price_per_carat DECIMAL(15,2),
    total_price DECIMAL(15,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shape (shape),
    INDEX idx_color (color),
    INDEX idx_clarity (clarity)
);
