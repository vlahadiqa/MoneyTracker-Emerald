<?php
header('Content-Type: application/json');

// Include DB connection
require_once __DIR__ . '/../db.php';

try {
    // 1. Calculate Today's Spending
    $stmtToday = $pdo->query("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'expense' AND DATE(date) = CURDATE()");
    $spendingToday = (float) $stmtToday->fetchColumn();

    // 2. Calculate This Week's Spending (Week starting Monday)
    $stmtWeek = $pdo->query("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'expense' AND YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)");
    $spendingWeek = (float) $stmtWeek->fetchColumn();

    // 3. Calculate This Month's Spending
    $stmtMonth = $pdo->query("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'expense' AND YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())");
    $spendingMonth = (float) $stmtMonth->fetchColumn();

    // 4. Retrieve Recent Transactions (last 15)
    $stmtTx = $pdo->query("SELECT id, amount, type, category, date, description FROM transactions ORDER BY date DESC, id DESC LIMIT 15");
    $transactions = $stmtTx->fetchAll();

    // Send successful JSON response
    echo json_encode([
        'success' => true,
        'data' => [
            'spending_today' => $spendingToday,
            'spending_week' => $spendingWeek,
            'spending_month' => $spendingMonth,
            'transactions' => $transactions
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch dashboard data.',
        'error' => $e->getMessage()
    ]);
}
