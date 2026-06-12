<?php
// CORS Headers to allow frontend hosting (like Vercel) to call this API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include custom database configuration if it exists
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

// Fallback definitions using Environment Variables (e.g. Railway, Heroku) or default local values
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

$host = DB_HOST;
$user = DB_USER;
$pass = DB_PASS;
$dbName = DB_NAME;
$port = DB_PORT;

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$dbName;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    // Return JSON error response for API requests
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Please ensure MySQL is running and setup has been executed.',
        'error' => $e->getMessage()
    ]);
    exit;
}
