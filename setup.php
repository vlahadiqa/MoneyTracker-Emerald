<?php
header('Content-Type: text/plain');

// Load custom config or fallback to env/local defaults
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

if (!defined('DB_HOST')) {
    define('DB_HOST', getenv('MYSQLHOST') ?: (getenv('DB_HOST') ?: 'localhost'));
}
if (!defined('DB_USER')) {
    define('DB_USER', getenv('MYSQLUSER') ?: (getenv('DB_USER') ?: 'root'));
}
if (!defined('DB_PASS')) {
    $envPass = getenv('MYSQLPASSWORD') !== false ? getenv('MYSQLPASSWORD') : getenv('DB_PASS');
    define('DB_PASS', $envPass !== false ? $envPass : '');
}
if (!defined('DB_NAME')) {
    define('DB_NAME', getenv('MYSQLDATABASE') ?: (getenv('DB_NAME') ?: 'money_tracker'));
}
if (!defined('DB_PORT')) {
    define('DB_PORT', getenv('MYSQLPORT') ?: (getenv('DB_PORT') ?: '3306'));
}
if (!defined('ALLOW_REMOTE_RESET')) {
    $envReset = getenv('ALLOW_REMOTE_RESET');
    define('ALLOW_REMOTE_RESET', $envReset !== false ? (filter_var($envReset, FILTER_VALIDATE_BOOLEAN)) : false);
}

// Security: Prevent remote execution of setup.php in production unless explicitly allowed
$isLocal = !isset($_SERVER['REMOTE_ADDR']) || in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1']) || PHP_SAPI === 'cli';
if (!$isLocal && !ALLOW_REMOTE_RESET) {
    http_response_code(403);
    echo "Akses ditolak: Skrip setup hanya dapat dijalankan di lingkungan lokal (localhost) atau jika ALLOW_REMOTE_RESET diaktifkan.";
    exit;
}

$host = DB_HOST;
$user = DB_USER;
$pass = DB_PASS;
$dbName = DB_NAME;
$port = DB_PORT;

try {
    // 1. Connect to MySQL server
    try {
        echo "Connecting to MySQL server at $host:$port...\n";
        $pdo = new PDO("mysql:host=$host;port=$port", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // 2. Create database
        echo "Creating database '$dbName' if it doesn't exist...\n";
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `$dbName`");
    } catch (PDOException $e) {
        // Fallback for hosting platforms where DB is pre-created and CREATE DATABASE is blocked
        echo "Connecting directly to database '$dbName' as fallback...\n";
        $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbName", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    echo "Selected database '$dbName'.\n";

    // 4. Create table
    echo "Creating 'transactions' table if it doesn't exist...\n";
    $tableSql = "
    CREATE TABLE IF NOT EXISTS `transactions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `amount` DECIMAL(10, 2) NOT NULL,
        `type` ENUM('income', 'expense') NOT NULL,
        `category` VARCHAR(50) NOT NULL,
        `date` DATETIME NOT NULL,
        `description` TEXT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $pdo->exec($tableSql);
    echo "Table 'transactions' verified/created successfully.\n";

    // 5. Seed with realistic mock data if table is empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM `transactions`");
    $count = $stmt->fetchColumn();

    if ($count == 0) {
        echo "Table is empty. Seeding mock data for portfolio presentation...\n";
        
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $threeDaysAgo = date('Y-m-d', strtotime('-3 days'));
        $fiveDaysAgo = date('Y-m-d', strtotime('-5 days'));
        $tenDaysAgo = date('Y-m-d', strtotime('-10 days'));

        $mockTransactions = [
            [
                'amount' => 15000000.00,
                'type' => 'income',
                'category' => 'Gaji',
                'date' => "$tenDaysAgo 09:00:00",
                'description' => 'Gaji bulanan dari Acme Corp'
            ],
            [
                'amount' => 3500000.00,
                'type' => 'expense',
                'category' => 'Tagihan',
                'date' => "$tenDaysAgo 10:30:00",
                'description' => 'Biaya sewa apartemen bulanan'
            ],
            [
                'amount' => 120000.00,
                'type' => 'expense',
                'category' => 'Makanan & Minuman',
                'date' => "$fiveDaysAgo 13:15:00",
                'description' => 'Makan siang di Restoran Sushi'
            ],
            [
                'amount' => 2500000.00,
                'type' => 'income',
                'category' => 'Pekerjaan Sampingan',
                'date' => "$threeDaysAgo 15:45:00",
                'description' => 'Proyek desain UI sampingan'
            ],
            [
                'amount' => 450000.00,
                'type' => 'expense',
                'category' => 'Belanja',
                'date' => "$threeDaysAgo 18:20:00",
                'description' => 'Pembelian mouse ergonomis & mousepad'
            ],
            [
                'amount' => 186000.00,
                'type' => 'expense',
                'category' => 'Hiburan',
                'date' => "$yesterday 20:00:00",
                'description' => 'Langganan Netflix Premium'
            ],
            [
                'amount' => 350000.00,
                'type' => 'expense',
                'category' => 'Makanan & Minuman',
                'date' => "$today 11:30:00",
                'description' => 'Belanja bahan makanan mingguan di supermarket'
            ],
            [
                'amount' => 45000.00,
                'type' => 'expense',
                'category' => 'Makanan & Minuman',
                'date' => "$today 08:45:00",
                'description' => 'Kopi susu es vanila di kafe'
            ],
            [
                'amount' => 85000.00,
                'type' => 'expense',
                'category' => 'Transportasi',
                'date' => "$today 08:15:00",
                'description' => 'Ongkos perjalanan ojek/taksi online ke co-working space'
            ],
        ];

        $insertSql = "INSERT INTO `transactions` (`amount`, `type`, `category`, `date`, `description`) VALUES (:amount, :type, :category, :date, :description)";
        $insertStmt = $pdo->prepare($insertSql);

        foreach ($mockTransactions as $tx) {
            $insertStmt->execute([
                ':amount' => $tx['amount'],
                ':type' => $tx['type'],
                ':category' => $tx['category'],
                ':date' => $tx['date'],
                ':description' => $tx['description']
            ]);
        }
        echo "Mock data seeded successfully (9 transactions added in IDR).\n";
    } else {
        echo "Table already has $count transactions. Skipping seeding.\n";
    }

    echo "\nSetup completed successfully! You can now use the Money Tracker application.";

} catch (PDOException $e) {
    echo "\nError during database setup: " . $e->getMessage() . "\n";
    exit(1);
}
