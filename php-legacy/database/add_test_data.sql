-- Добавляем тестовые данные для отчетов

-- Добавляем несколько просроченных выдач
INSERT INTO physical_loans (book_id, reader_card, date_taken) VALUES
(1, 'R-10001', date('now', '-30 days')),
(2, 'R-10002', date('now', '-20 days')),
(4, 'R-10003', date('now', '-15 days'));

-- Обновляем статусы книг
UPDATE physical_books SET status = 'borrowed' WHERE id IN (1, 2, 4);

-- Добавляем еще книг для статистики
INSERT INTO physical_books (inventory_number, title, author, year, location, status) VALUES
('LIB-2024-006', 'Анна Каренина', 'Лев Толстой', 1877, 'Секция А, стеллаж 6', 'available'),
('LIB-2024-007', 'Маленький принц', 'Антуан де Сент-Экзюпери', 1943, 'Секция Б, стеллаж 1', 'available'),
('LIB-2024-008', 'Улисс', 'Джеймс Джойс', 1922, 'Секция В, стеллаж 3', 'borrowed');

-- Добавляем историю выдач для статистики популярности
INSERT INTO physical_loans (book_id, reader_card, date_taken, date_returned) VALUES
(1, 'R-20001', date('now', '-60 days'), date('now', '-50 days')),
(1, 'R-20002', date('now', '-45 days'), date('now', '-35 days')),
(3, 'R-20003', date('now', '-40 days'), date('now', '-30 days')),
(3, 'R-20004', date('now', '-25 days'), date('now', '-15 days')),
(3, 'R-20005', date('now', '-10 days'), NULL);
