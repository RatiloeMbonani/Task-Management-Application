CREATE DATABASE task_app;

USE task_app;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    progress INT DEFAULT 0,
    due_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);