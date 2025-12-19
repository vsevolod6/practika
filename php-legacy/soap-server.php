<?php
require_once 'config.php';

// Включаем отображение ошибок
ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('soap.wsdl_cache_enabled', 0);

// Если запрос на WSDL
if (isset($_GET['wsdl'])) {
    header('Content-Type: text/xml; charset=utf-8');
    readfile(__DIR__ . '/library.wsdl');
    exit;
}

class LibraryService {
    
    private $pdo;
    
    public function __construct() {
        $this->pdo = getDatabaseConnection();
    }
    
    public function getBookByInventory($inventory_number) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM physical_books WHERE inventory_number = ?");
            $stmt->execute([$inventory_number]);
            $book = $stmt->fetch();
            
            if ($book) {
                return json_encode($book, JSON_UNESCAPED_UNICODE);
            } else {
                return "Книга не найдена: $inventory_number";
            }
        } catch (Exception $e) {
            return "Ошибка: " . $e->getMessage();
        }
    }
    
    public function searchBooksByAuthor($author_name) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM physical_books WHERE author LIKE ?");
            $stmt->execute(["%$author_name%"]);
            $books = $stmt->fetchAll();
            return json_encode($books, JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            return "Ошибка: " . $e->getMessage();
        }
    }
    
    public function registerLoan($inventory_number, $reader_card) {
        try {
            $this->pdo->beginTransaction();
            
            // Находим книгу
            $stmt = $this->pdo->prepare("SELECT id FROM physical_books WHERE inventory_number = ? AND status = 'available'");
            $stmt->execute([$inventory_number]);
            $book = $stmt->fetch();
            
            if (!$book) {
                throw new Exception("Книга $inventory_number не найдена или уже выдана");
            }
            
            // Создаем запись о выдаче
            $stmt = $this->pdo->prepare("INSERT INTO physical_loans (book_id, reader_card, date_taken) VALUES (?, ?, DATE('now'))");
            $stmt->execute([$book['id'], $reader_card]);
            
            // Обновляем статус
            $stmt = $this->pdo->prepare("UPDATE physical_books SET status = 'borrowed' WHERE id = ?");
            $stmt->execute([$book['id']]);
            
            $this->pdo->commit();
            return "Книга выдана успешно. ID выдачи: " . $this->pdo->lastInsertId();
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            return "Ошибка: " . $e->getMessage();
        }
    }
}

// Создаем SOAP сервер
try {
    // Указываем WSDL файл напрямую
    $server = new SoapServer(__DIR__ . '/library.wsdl', [
        'uri' => 'http://localhost/php-legacy/library.wsdl'
    ]);
    
    $server->setClass('LibraryService');
    $server->handle();
    
} catch (Exception $e) {
    // Простой вывод ошибки
    header('Content-Type: text/plain; charset=utf-8');
    echo "SOAP Server Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}
?>
