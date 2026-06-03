<?php
$host = getenv('DB_HOST') ?: 'db';
$dbname = getenv('DB_NAME') ?: 'taskflow_db';
$username = getenv('DB_USER') ?: 'dbuser';
$password = getenv('DB_PASS') ?: 'dbpassword';

$max_attempts = 15;
$attempt = 0;
$pdo = null;

while ($attempt < $max_attempts) {
    try {
        $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        break;
    } catch (PDOException $e) {
        $attempt++;
        if ($attempt >= $max_attempts) {
            die("Неуспешно свързване с базата данни след $max_attempts опита: " . $e->getMessage());
        }
        sleep(2);
    }
}

try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");
} catch (PDOException $e) {
    die("Грешка при създаването/избора на база данни: " . $e->getMessage());
}

try {
    $table_sql = "
    CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $pdo->exec($table_sql);
} catch (PDOException $e) {
    die("Грешка при създаването на таблицата: " . $e->getMessage());
}

try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM tasks");
    $count = $stmt->fetchColumn();
    if ($count == 0) {
        $seed_sql = "
        INSERT INTO tasks (title, description, priority, status) VALUES
        ('Проучване на Docker', 'Прочетете документацията за Docker и Docker Compose за уеб приложения.', 'high', 'todo'),
        ('Контейнеризация на PHP проект', 'Създаване на Dockerfile и compose.yml за PHP/MySQL проекта.', 'high', 'in_progress'),
        ('Добавяне на стилове', 'Направете изключително красив дизайн с Glassmorphism за уеб интерфейса.', 'medium', 'in_progress'),
        ('Качване на образите', 'Изградете Docker образите и ги качете в Docker Hub.', 'medium', 'todo'),
        ('Инсталиране на Docker Desktop', 'Инсталирайте Docker Desktop на локалната си машина.', 'low', 'done')
        ";
        $pdo->exec($seed_sql);
    }
} catch (PDOException $e) {
}
