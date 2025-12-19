<?php
require_once 'config.php';

echo '<!DOCTYPE html>
<html>
<head>
    <title>Админ панель</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        table { border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ccc; padding: 8px; }
        th { background: #f0f0f0; }
        .success { color: green; }
        .error { color: red; }
        .test-box { border: 1px solid #ccc; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Административная панель библиотеки</h1>';

try {
    // Прямой доступ к БД
    $pdo = getDatabaseConnection();
    
    // Показываем книги
    echo '<h2>📚 Книги в библиотеке:</h2>';
    $stmt = $pdo->query("SELECT * FROM physical_books");
    $books = $stmt->fetchAll();
    
    if ($books) {
        echo '<table>';
        echo '<tr><th>ID</th><th>Инв.номер</th><th>Название</th><th>Автор</th><th>Статус</th></tr>';
        foreach ($books as $book) {
            echo '<tr>';
            echo '<td>' . $book['id'] . '</td>';
            echo '<td>' . htmlspecialchars($book['inventory_number']) . '</td>';
            echo '<td>' . htmlspecialchars($book['title']) . '</td>';
            echo '<td>' . htmlspecialchars($book['author']) . '</td>';
            echo '<td>' . $book['status'] . '</td>';
            echo '</tr>';
        }
        echo '</table>';
    } else {
        echo '<p>Нет книг в базе данных</p>';
    }
    
    // Показываем выдачи
    echo '<h2>📋 Активные выдачи:</h2>';
    $stmt = $pdo->query("SELECT * FROM physical_loans WHERE date_returned IS NULL");
    $loans = $stmt->fetchAll();
    
    if ($loans) {
        echo '<table>';
        echo '<tr><th>ID</th><th>ID книги</th><th>Читатель</th><th>Дата выдачи</th></tr>';
        foreach ($loans as $loan) {
            echo '<tr>';
            echo '<td>' . $loan['id'] . '</td>';
            echo '<td>' . $loan['book_id'] . '</td>';
            echo '<td>' . htmlspecialchars($loan['reader_card']) . '</td>';
            echo '<td>' . $loan['date_taken'] . '</td>';
            echo '</tr>';
        }
        echo '</table>';
    } else {
        echo '<p>Нет активных выдач</p>';
    }
    
    // Простой тест SOAP
    echo '<div class="test-box">';
    echo '<h2>🧪 Тест SOAP соединения:</h2>';
    
    $wsdl_url = 'http://localhost:8000/php-legacy/soap-server.php?wsdl';
    
    echo '<p>Проверяем доступность WSDL: ' . htmlspecialchars($wsdl_url) . '</p>';
    
    // Проверяем доступность файла
    if (file_exists(__DIR__ . '/library.wsdl')) {
        echo '<p class="success">✓ WSDL файл существует локально</p>';
    } else {
        echo '<p class="error">✗ WSDL файл не найден</p>';
    }
    
    // Простая проверка через file_get_contents
    $context = stream_context_create([
        'http' => ['timeout' => 5]
    ]);
    
    $wsdl_content = @file_get_contents($wsdl_url, false, $context);
    
    if ($wsdl_content !== false) {
        echo '<p class="success">✓ WSDL доступен по URL</p>';
        
        // Пробуем создать SOAP клиент
        try {
            ini_set('default_socket_timeout', 10);
            $client = @new SoapClient($wsdl_url, [
                'cache_wsdl' => WSDL_CACHE_NONE,
                'exceptions' => true,
                'connection_timeout' => 5
            ]);
            
            echo '<p class="success">✓ SOAP клиент создан успешно</p>';
            
            // Тест простого метода
            try {
                $result = $client->getBookByInventory('LIB-2024-001');
                echo '<p class="success">✓ Метод getBookByInventory работает</p>';
                echo '<pre>' . htmlspecialchars($result) . '</pre>';
            } catch (Exception $e) {
                echo '<p class="error">✗ Метод не работает: ' . htmlspecialchars($e->getMessage()) . '</p>';
            }
            
        } catch (SoapFault $e) {
            echo '<p class="error">✗ Ошибка SOAP: ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
    } else {
        echo '<p class="error">✗ WSDL недоступен по URL</p>';
        echo '<p>Попробуйте открыть в браузере: <a href="' . $wsdl_url . '" target="_blank">' . $wsdl_url . '</a></p>';
    }
    
    echo '</div>';
    
} catch (Exception $e) {
    echo '<div class="error"><h3>Ошибка:</h3><p>' . htmlspecialchars($e->getMessage()) . '</p></div>';
}

// Информация о сервере
echo '<div class="test-box">';
echo '<h2>ℹ️ Информация о сервере:</h2>';
echo '<ul>';
echo '<li>PHP Version: ' . phpversion() . '</li>';
echo '<li>SOAP Extension: ' . (extension_loaded('soap') ? '✓ Загружена' : '✗ Не загружена') . '</li>';
echo '<li>PDO SQLite: ' . (extension_loaded('pdo_sqlite') ? '✓ Загружена' : '✗ Не загружена') . '</li>';
echo '<li>Текущая директория: ' . __DIR__ . '</li>';
echo '</ul>';
echo '</div>';

echo '</body></html>';
?>
