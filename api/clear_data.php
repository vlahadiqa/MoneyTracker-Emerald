<?php
header('Content-Type: application/json');

// Include DB connection
require_once __DIR__ . '/../db.php';

// Security: Prevent remote execution of clear_data.php in production unless explicitly allowed
$isLocal = !isset($_SERVER['REMOTE_ADDR']) || in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1']) || PHP_SAPI === 'cli';
if (!$isLocal && !ALLOW_REMOTE_RESET) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Akses ditolak: Skrip pengosongan data hanya dapat dijalankan di lingkungan lokal (localhost) atau jika ALLOW_REMOTE_RESET diaktifkan.'
    ]);
    exit;
}

try {
    // Truncate table to reset Auto Increment IDs and clear all data
    $pdo->exec("TRUNCATE TABLE transactions");
    
    echo json_encode([
        'success' => true,
        'message' => 'Semua data transaksi berhasil dikosongkan.'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengosongkan data transaksi.',
        'error' => $e->getMessage()
    ]);
}
