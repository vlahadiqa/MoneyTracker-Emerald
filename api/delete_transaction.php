<?php
header('Content-Type: application/json');

// Include DB connection
require_once __DIR__ . '/../db.php';

// Support both URL query parameters, POST data and JSON payloads
$id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

if ($id === null || $id === false) {
    // Check if passed via POST
    $data = $_POST;
    if (empty($data)) {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true) ?? [];
    }
    $id = isset($data['id']) ? filter_var($data['id'], FILTER_VALIDATE_INT) : null;
}

if ($id === null || $id === false || $id <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID transaksi tidak valid.'
    ]);
    exit;
}

try {
    // Check if transaction exists first
    $checkStmt = $pdo->prepare("SELECT id FROM transactions WHERE id = :id");
    $checkStmt->execute([':id' => $id]);
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Transaksi tidak ditemukan.'
        ]);
        exit;
    }

    // Delete
    $deleteStmt = $pdo->prepare("DELETE FROM transactions WHERE id = :id");
    $deleteStmt->execute([':id' => $id]);

    echo json_encode([
        'success' => true,
        'message' => 'Transaksi berhasil dihapus.'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal menghapus transaksi.',
        'error' => $e->getMessage()
    ]);
}
