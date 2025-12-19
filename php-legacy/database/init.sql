-- Таблица физических книг
CREATE TABLE physical_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    year INTEGER,
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available'
);

-- Таблица выдач
CREATE TABLE physical_loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    reader_card VARCHAR(50) NOT NULL,
    date_taken DATE NOT NULL,
    date_returned DATE,
    FOREIGN KEY (book_id) REFERENCES physical_books(id)
);

-- Тестовые данные
INSERT INTO physical_books (inventory_number, title, author, year, location, status) VALUES
('LIB-2024-001', 'Мастер и Маргарита', 'Михаил Булгаков', 1966, 'Секция А, стеллаж 5', 'available'),
('LIB-2024-002', 'Преступление и наказание', 'Фёдор Достоевский', 1866, 'Секция Б, стеллаж 2', 'available'),
('LIB-2024-003', 'Война и мир', 'Лев Толстой', 1869, 'Секция В, стеллаж 1', 'borrowed'),
('LIB-2024-004', '1984', 'Джордж Оруэлл', 1949, 'Секция Г, стеллаж 3', 'available'),
('LIB-2024-005', 'Гарри Поттер и философский камень', 'Джоан Роулинг', 1997, 'Секция Д, стеллаж 4', 'available');

INSERT INTO physical_loans (book_id, reader_card, date_taken, date_returned) VALUES
(3, 'R-12345', '2024-03-01', NULL),  -- Книга выдана
(1, 'R-67890', '2024-02-15', '2024-03-10');  -- Книга возвращена
