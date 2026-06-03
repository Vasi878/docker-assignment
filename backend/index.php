<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Origin, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

function sendJSON($response) {
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM tasks ORDER BY id DESC");
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendJSON(['success' => true, 'tasks' => $tasks]);
    } catch (PDOException $e) {
        sendJSON(['success' => false, 'message' => 'Грешка при извличане на данните: ' . $e->getMessage()]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if (empty($action)) {
        $json_data = json_decode(file_get_contents('php://input'), true);
        if ($json_data) {
            $action = $json_data['action'] ?? '';
            $_POST = $json_data;
        }
    }

    if ($action === 'create') {
        $title = trim($_POST['title'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $priority = $_POST['priority'] ?? 'medium';

        if (empty($title)) {
            sendJSON(['success' => false, 'message' => 'Заглавието е задължително!']);
        }

        if (!in_array($priority, ['low', 'medium', 'high'])) {
            $priority = 'medium';
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO tasks (title, description, priority, status) VALUES (?, ?, ?, 'todo')");
            $stmt->execute([$title, $description, $priority]);
            $newId = $pdo->lastInsertId();
            sendJSON(['success' => true, 'id' => $newId]);
        } catch (PDOException $e) {
            sendJSON(['success' => false, 'message' => 'Грешка при запис: ' . $e->getMessage()]);
        }
    }

    if ($action === 'update_status') {
        $id = intval($_POST['id'] ?? 0);
        $status = $_POST['status'] ?? '';

        if (!$id || !in_array($status, ['todo', 'in_progress', 'done'])) {
            sendJSON(['success' => false, 'message' => 'Невалидни данни за промяна на статус.']);
        }

        try {
            $stmt = $pdo->prepare("UPDATE tasks SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            sendJSON(['success' => true]);
        } catch (PDOException $e) {
            sendJSON(['success' => false, 'message' => 'Грешка при обновяване: ' . $e->getMessage()]);
        }
    }

    if ($action === 'delete') {
        $id = intval($_POST['id'] ?? 0);

        if (!$id) {
            sendJSON(['success' => false, 'message' => 'Невалидно ID на задача.']);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            sendJSON(['success' => true]);
        } catch (PDOException $e) {
            sendJSON(['success' => false, 'message' => 'Грешка при изтриване: ' . $e->getMessage()]);
        }
    }

    sendJSON(['success' => false, 'message' => 'Невалидна акция.']);
}

sendJSON(['success' => false, 'message' => 'Невалиден метод на заявка.']);
