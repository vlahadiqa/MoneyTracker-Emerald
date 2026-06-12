<?php
header('Content-Type: application/json');

// Include DB connection
require_once __DIR__ . '/../db.php';

// Support both URL encoded forms and JSON payloads
$data = $_POST;
if (empty($data)) {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true) ?? [];
}

// Extract fields
$amount = isset($data['amount']) ? filter_var($data['amount'], FILTER_VALIDATE_FLOAT) : null;
$type = $data['type'] ?? '';
$category = trim($data['category'] ?? '');
$date = $data['date'] ?? '';
$description = trim($data['description'] ?? '');

// Validation
$errors = [];

if ($amount === false || $amount === null || $amount <= 0) {
    $errors['amount'] = 'Nominal harus berupa angka positif.';
}

if (!in_array($type, ['income', 'expense'])) {
    $errors['type'] = 'Tipe transaksi harus berupa pemasukan (income) atau pengeluaran (expense).';
}

if (empty($category)) {
    $errors['category'] = 'Kategori wajib diisi.';
}

if (empty($date)) {
    $errors['date'] = 'Tanggal & waktu wajib diisi.';
} else {
    // Replace T with space to parse datetime-local strings
    $normalizedDate = str_replace('T', ' ', $date);
    try {
        $d = new DateTime($normalizedDate);
        $date = $d->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        $errors['date'] = 'Format tanggal & waktu tidak valid.';
    }
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Validasi gagal.',
        'errors' => $errors
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO transactions (amount, type, category, date, description) VALUES (:amount, :type, :category, :date, :description)");
    $stmt->execute([
        ':amount' => $amount,
        ':type' => $type,
        ':category' => $category,
        ':date' => $date,
        ':description' => $description ?: null
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Transaksi berhasil ditambahkan!',
        'data' => [
            'id' => $pdo->lastInsertId(),
            'amount' => $amount,
            'type' => $type,
            'category' => $category,
            'date' => $date,
            'description' => $description
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal menyimpan transaksi ke database.',
        'error' => $e->getMessage()
    ]);
}
