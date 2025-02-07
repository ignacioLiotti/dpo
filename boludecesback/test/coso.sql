SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS price_history;
DROP TABLE IF EXISTS labor_rates;
DROP TABLE IF EXISTS element_tags;
DROP TABLE IF EXISTS prices;
DROP TABLE IF EXISTS elements;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE categories (
    id INT NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE elements (
    id INT NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    category_id INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY (code),
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prices (
    id INT NOT NULL AUTO_INCREMENT,
    element_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    PRIMARY KEY (id),
    FOREIGN KEY (element_id) REFERENCES elements(id),
    UNIQUE KEY (element_id, valid_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tags (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE element_tags (
    id INT NOT NULL AUTO_INCREMENT,
    element_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (element_id) REFERENCES elements(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    INDEX (element_id),
    INDEX (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE labor_rates (
    id INT NOT NULL AUTO_INCREMENT,
    worker_type VARCHAR(100) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    daily_rate DECIMAL(10,2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    PRIMARY KEY (id),
    UNIQUE KEY (worker_type, valid_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;