<?php
// Конфигурация базы данных
define('DB_PATH', __DIR__ . '/../databases/library.db');
define('DB_TYPE', 'sqlite'); // Можно поменять на 'mysql'

// Конфигурация SOAP сервера
define('SOAP_SERVER_URI', 'http://localhost:8000/php-legacy/soap-server.php');
define('SOAP_SERVER_WSDL', 'http://localhost:8000/php-legacy/library.wsdl');

// Функция для подключения к БД
function getDatabaseConnection() {
    try {
        $pdo = new PDO('sqlite:' . DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        die('Ошибка подключения к БД: ' . $e->getMessage());
    }
}
?>
