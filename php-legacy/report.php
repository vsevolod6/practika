<?php
require_once 'config.php';

// Определяем тип отчета
$report_type = $_GET['type'] ?? 'overdue';

// Проверяем, нужен ли чистый XML или HTML
$xml_only = isset($_GET['xml']) && $_GET['xml'] == '1';

// Подключаемся к БД
$pdo = getDatabaseConnection();

// Функция для генерации XML
function generateReportXML($pdo, $type) {
    $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><library_report></library_report>');
    $xml->addChild('generated_at', date('Y-m-d H:i:s'));
    $xml->addChild('report_type', $type);
    
    switch ($type) {
        case 'overdue':
            // Книги, которые не возвращены более 14 дней
            $stmt = $pdo->query("
                SELECT pb.*, pl.reader_card, pl.date_taken,
                       julianday('now') - julianday(pl.date_taken) as days_overdue
                FROM physical_books pb
                JOIN physical_loans pl ON pb.id = pl.book_id
                WHERE pl.date_returned IS NULL
                AND julianday('now') - julianday(pl.date_taken) > 14
                ORDER BY days_overdue DESC
            ");
            $books = $stmt->fetchAll();
            
            $overdue_section = $xml->addChild('overdue_books');
            $overdue_section->addChild('count', count($books));
            
            foreach ($books as $book) {
                $book_node = $overdue_section->addChild('book');
                $book_node->addChild('inventory_number', $book['inventory_number']);
                $book_node->addChild('title', htmlspecialchars($book['title']));
                $book_node->addChild('author', htmlspecialchars($book['author']));
                $book_node->addChild('reader_card', $book['reader_card']);
                $book_node->addChild('date_taken', $book['date_taken']);
                $book_node->addChild('days_overdue', (int)$book['days_overdue']);
            }
            break;
            
        case 'popular':
            // Самые популярные книги
            $stmt = $pdo->query("
                SELECT pb.*, COUNT(pl.id) as loan_count
                FROM physical_books pb
                LEFT JOIN physical_loans pl ON pb.id = pl.book_id
                GROUP BY pb.id
                ORDER BY loan_count DESC
                LIMIT 10
            ");
            $books = $stmt->fetchAll();
            
            $popular_section = $xml->addChild('popular_books');
            
            foreach ($books as $book) {
                $book_node = $popular_section->addChild('book');
                $book_node->addChild('inventory_number', $book['inventory_number']);
                $book_node->addChild('title', htmlspecialchars($book['title']));
                $book_node->addChild('author', htmlspecialchars($book['author']));
                $book_node->addChild('loan_count', $book['loan_count']);
            }
            break;
            
        case 'status':
            // Статусы всех книг
            $stmt = $pdo->query("
                SELECT status, COUNT(*) as count 
                FROM physical_books 
                GROUP BY status
            ");
            $statuses = $stmt->fetchAll();
            
            $status_section = $xml->addChild('books_by_status');
            
            foreach ($statuses as $status) {
                $status_node = $status_section->addChild('status');
                $status_node->addChild('name', $status['status']);
                $status_node->addChild('count', $status['count']);
            }
            break;
    }
    
    return $xml->asXML();
}

// Генерируем XML
$xml_content = generateReportXML($pdo, $report_type);

// Если нужен чистый XML (для Node.js)
if ($xml_only) {
    header('Content-Type: text/xml; charset=utf-8');
    echo $xml_content;
    exit;
}

// Если нужен HTML через XSLT
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчет библиотеки - <?php echo $report_type; ?></title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .nav { margin: 20px 0; }
        .nav a { margin-right: 15px; padding: 5px 10px; text-decoration: none; color: #0066cc; }
        .nav a:hover { text-decoration: underline; }
        .xml-link { background: #f0f0f0; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="nav">
        <h1>📊 Отчеты библиотеки</h1>
        <a href="?type=overdue">Просроченные книги</a>
        <a href="?type=popular">Популярные книги</a>
        <a href="?type=status">По статусам</a>
        <a href="?type=overdue&xml=1">XML версия</a>
    </div>
    
    <div class="xml-link">
        <strong>Ссылка для Node.js:</strong> 
        <a href="?type=<?php echo $report_type; ?>&xml=1" target="_blank">
            report.php?type=<?php echo $report_type; ?>&xml=1
        </a>
    </div>
    
    <?php
    // Создаем DOM документ из XML
    $xml = new DOMDocument();
    $xml->loadXML($xml_content);
    
    // Создаем XSLT процессор
    $xsl = new DOMDocument();
    
    // В зависимости от типа отчета используем разные XSLT
    $xsl_file = __DIR__ . "/report_{$report_type}.xsl";
    
    if (file_exists($xsl_file)) {
        $xsl->load($xsl_file);
    } else {
        // Используем дефолтный XSLT
        $xsl->loadXML('<?xml version="1.0" encoding="UTF-8"?>
        <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
            <xsl:template match="/">
                <html>
                <body>
                    <h2>Отчет: <xsl:value-of select="library_report/report_type"/></h2>
                    <p>Сгенерировано: <xsl:value-of select="library_report/generated_at"/></p>
                    <xsl:apply-templates select="library_report/*"/>
                </body>
                </html>
            </xsl:template>
            
            <xsl:template match="overdue_books">
                <h3>Просроченные книги: <xsl:value-of select="count"/></h3>
                <table>
                    <tr>
                        <th>Инв. номер</th>
                        <th>Название</th>
                        <th>Автор</th>
                        <th>Читатель</th>
                        <th>Дата выдачи</th>
                        <th>Дней просрочки</th>
                    </tr>
                    <xsl:for-each select="book">
                    <tr>
                        <td><xsl:value-of select="inventory_number"/></td>
                        <td><xsl:value-of select="title"/></td>
                        <td><xsl:value-of select="author"/></td>
                        <td><xsl:value-of select="reader_card"/></td>
                        <td><xsl:value-of select="date_taken"/></td>
                        <td><xsl:value-of select="days_overdue"/></td>
                    </tr>
                    </xsl:for-each>
                </table>
            </xsl:template>
            
            <xsl:template match="popular_books">
                <h3>Самые популярные книги</h3>
                <table>
                    <tr>
                        <th>Инв. номер</th>
                        <th>Название</th>
                        <th>Автор</th>
                        <th>Кол-во выдач</th>
                    </tr>
                    <xsl:for-each select="book">
                    <tr>
                        <td><xsl:value-of select="inventory_number"/></td>
                        <td><xsl:value-of select="title"/></td>
                        <td><xsl:value-of select="author"/></td>
                        <td><xsl:value-of select="loan_count"/></td>
                    </tr>
                    </xsl:for-each>
                </table>
            </xsl:template>
            
            <xsl:template match="books_by_status">
                <h3>Книги по статусам</h3>
                <table>
                    <tr>
                        <th>Статус</th>
                        <th>Количество</th>
                    </tr>
                    <xsl:for-each select="status">
                    <tr>
                        <td><xsl:value-of select="name"/></td>
                        <td><xsl:value-of select="count"/></td>
                    </tr>
                    </xsl:for-each>
                </table>
            </xsl:template>
        </xsl:stylesheet>');
    }
    
    // Применяем XSLT преобразование
    $proc = new XSLTProcessor();
    $proc->importStyleSheet($xsl);
    
    echo $proc->transformToXML($xml);
    ?>
    
    <hr>
    <div style="margin-top: 30px; padding: 15px; background: #f9f9f9;">
        <h3>Исходный XML:</h3>
        <pre><?php echo htmlspecialchars($xml_content); ?></pre>
    </div>
</body>
</html>
