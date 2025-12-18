// Конфигурация
const API_BASE_URL = 'http://localhost:3000/api';

// Утилиты
function showLoading(elementId) {
    document.getElementById(elementId).style.display = 'block';
}

function hideLoading(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

function showMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.innerHTML = `
        <div class="message ${type}">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        </div>
    `;
    element.style.display = 'block';
    
    if (type !== 'error') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
}

// Управление вкладками
document.addEventListener('DOMContentLoaded', function() {
    // Переключение вкладок
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Обновляем активные кнопки
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Обновляем активный контент
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Скрываем iframe отчет если переключили вкладку
            if (tabId !== 'admin-report') {
                document.getElementById('direct-report').style.display = 'none';
                document.getElementById('report-results').style.display = 'block';
            }
            
            // Автоматически загружаем данные для вкладки
            switch(tabId) {
                case 'digital-resources':
                    loadDigitalResources();
                    break;
                case 'system-info':
                    checkSystemStatus();
                    break;
            }
        });
    });
    
    // ====================
    // ВКЛАДКА 1: ФИЗИЧЕСКИЕ КНИГИ
    // ====================
    
    // Поиск по автору
    document.getElementById('search-author-btn').addEventListener('click', searchByAuthor);
    document.getElementById('author-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchByAuthor();
    });
    
    // Поиск по инвентарному номеру
    document.getElementById('search-inventory-btn').addEventListener('click', searchByInventory);
    document.getElementById('inventory-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchByInventory();
    });
    
    // Выдать книгу
    document.getElementById('loan-btn').addEventListener('click', registerLoan);
    
    // ====================
    // ВКЛАДКА 2: ЦИФРОВЫЕ РЕСУРСЫ
    // ====================
    
    // Загрузка ресурсов
    document.getElementById('load-digital-btn').addEventListener('click', loadDigitalResources);
    
    // Поиск ресурсов
    document.getElementById('search-digital-btn').addEventListener('click', searchDigitalResources);
    document.getElementById('digital-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchDigitalResources();
    });
    
    // ====================
    // ВКЛАДКА 3: ОТЧЕТЫ
    // ====================
    
    // Кнопки отчетов
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const reportType = this.getAttribute('data-report');
            
            // Обновляем активную кнопку
            document.querySelectorAll('.report-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Прямой доступ через iframe
            if (reportType === 'direct') {
                document.getElementById('direct-report').style.display = 'block';
                document.getElementById('report-results').style.display = 'none';
                return;
            }
            
            // Загрузка отчета через API
            document.getElementById('direct-report').style.display = 'none';
            document.getElementById('report-results').style.display = 'block';
            loadReport(reportType);
        });
    });
    
    // ====================
    // ВКЛАДКА 4: ИНФОРМАЦИЯ О СИСТЕМЕ
    // ====================
    
    document.getElementById('system-check-btn').addEventListener('click', checkSystemStatus);
    
    // Автоматическая загрузка при открытии
    checkSystemStatus();
    loadDigitalResources();
});

// ====================
// API ФУНКЦИИ
// ====================

// Поиск книг по автору
async function searchByAuthor() {
    const author = document.getElementById('author-search').value.trim();
    if (!author) {
        showMessage('physical-results', 'Введите имя автора для поиска', 'error');
        return;
    }
    
    showLoading('physical-loading');
    
    try {
        const response = await fetch(`${API_BASE_URL}/physical/books?author=${encodeURIComponent(author)}`);
        const data = await response.json();
        
        hideLoading('physical-loading');
        
        if (data.success && data.data) {
            displayPhysicalBooks(data.data, `Найдено книг: ${data.count || 0}`);
        } else {
            showMessage('physical-results', data.error || 'Книги не найдены', 'error');
        }
    } catch (error) {
        hideLoading('physical-loading');
        showMessage('physical-results', `Ошибка соединения: ${error.message}`, 'error');
    }
}

// Поиск книги по инвентарному номеру
async function searchByInventory() {
    const inventory = document.getElementById('inventory-search').value.trim();
    if (!inventory) {
        showMessage('physical-results', 'Введите инвентарный номер', 'error');
        return;
    }
    
    showLoading('physical-loading');
    
    try {
        const response = await fetch(`${API_BASE_URL}/physical/books/${encodeURIComponent(inventory)}`);
        const data = await response.json();
        
        hideLoading('physical-loading');
        
        if (data.success && data.data) {
            // Преобразуем одиночную книгу в массив для унификации отображения
            const books = Array.isArray(data.data) ? data.data : [data.data];
            displayPhysicalBooks(books, `Найдена книга: ${inventory}`);
        } else {
            showMessage('physical-results', data.error || 'Книга не найдена', 'error');
        }
    } catch (error) {
        hideLoading('physical-loading');
        showMessage('physical-results', `Ошибка соединения: ${error.message}`, 'error');
    }
}

// Отображение физических книг
function displayPhysicalBooks(books, title) {
    const resultsDiv = document.getElementById('physical-results');
    
    if (!books || books.length === 0) {
        resultsDiv.innerHTML = '<p class="empty-state">Книги не найдены</p>';
        return;
    }
    
    // Преобразуем книги в массив если это не массив
    const booksArray = Array.isArray(books) ? books : [books];
    
    let html = `<h3>${title}</h3>`;
    html += `<table class="book-table">
        <thead>
            <tr>
                <th>Инв. номер</th>
                <th>Название</th>
                <th>Автор</th>
                <th>Статус</th>
                <th>Год</th>
            </tr>
        </thead>
        <tbody>`;
    
    booksArray.forEach(book => {
        // Проверяем структуру объекта
        const invNumber = book.inventory_number || book.inventoryNumber || 'N/A';
        const title = book.title || 'Без названия';
        const author = book.author || 'Неизвестен';
        const status = book.status || 'unknown';
        const year = book.year || '—';
        
        let statusClass = 'status-unknown';
        let statusText = status;
        
        if (status.toLowerCase().includes('available') || status === 'available') {
            statusClass = 'status-available';
            statusText = 'Доступна';
        } else if (status.toLowerCase().includes('borrowed') || status === 'borrowed') {
            statusClass = 'status-borrowed';
            statusText = 'Выдана';
        }
        
        html += `
            <tr>
                <td><strong>${invNumber}</strong></td>
                <td>${title}</td>
                <td>${author}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${year}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    
    // Информация о технологии
    html += `
        <div class="tech-note" style="margin-top: 20px;">
            <i class="fas fa-info-circle"></i>
            Данные получены через SOAP запрос из PHP системы через Node.js прокси
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

// Выдать книгу
async function registerLoan() {
    const inventory = document.getElementById('loan-inventory').value.trim();
    const reader = document.getElementById('loan-reader').value.trim();
    
    if (!inventory || !reader) {
        showMessage('loan-result', 'Заполните все поля', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/physical/loan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inventory_number: inventory,
                reader_card: reader
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('loan-result', `✅ ${data.message}`, 'success');
            // Обновляем поиск
            searchByInventory();
        } else {
            showMessage('loan-result', `❌ ${data.error || 'Ошибка выдачи книги'}`, 'error');
        }
    } catch (error) {
        showMessage('loan-result', `❌ Ошибка соединения: ${error.message}`, 'error');
    }
}

// Загрузка цифровых ресурсов
async function loadDigitalResources() {
    showLoading('digital-loading');
    
    try {
        const response = await fetch(`${API_BASE_URL}/digital/resources`);
        const data = await response.json();
        
        hideLoading('digital-loading');
        
        if (data.success) {
            displayDigitalResources(data.data);
            updateDigitalStats(data.data);
        } else {
            document.querySelector('.resource-grid').innerHTML = 
                '<p class="empty-state">Не удалось загрузить ресурсы</p>';
        }
    } catch (error) {
        hideLoading('digital-loading');
        document.querySelector('.resource-grid').innerHTML = 
            `<p class="empty-state">Ошибка загрузки: ${error.message}</p>`;
    }
}

// Поиск цифровых ресурсов
async function searchDigitalResources() {
    const query = document.getElementById('digital-search').value.trim();
    if (!query) {
        loadDigitalResources();
        return;
    }
    
    showLoading('digital-loading');
    
    try {
        const response = await fetch(`${API_BASE_URL}/digital/resources/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        hideLoading('digital-loading');
        
        if (data.success) {
            displayDigitalResources(data.data);
            document.getElementById('resource-count').textContent = data.count;
        } else {
            document.querySelector('.resource-grid').innerHTML = 
                '<p class="empty-state">Ресурсы не найдены</p>';
        }
    } catch (error) {
        hideLoading('digital-loading');
        document.querySelector('.resource-grid').innerHTML = 
            `<p class="empty-state">Ошибка поиска: ${error.message}</p>`;
    }
}

// Отображение цифровых ресурсов
function displayDigitalResources(resources) {
    const grid = document.querySelector('.resource-grid');
    
    if (!resources || resources.length === 0) {
        grid.innerHTML = '<p class="empty-state">Ресурсы не найдены</p>';
        return;
    }
    
    let html = '';
    
    resources.forEach(resource => {
        const formatClass = resource.format === 'pdf' ? 'format-pdf' : 'format-epub';
        
        html += `
            <div class="resource-card">
                <div class="resource-header">
                    <h4>${resource.title}</h4>
                    <p><i class="fas fa-user"></i> ${resource.author}</p>
                </div>
                <div class="resource-body">
                    <p>${resource.description || 'Описание отсутствует'}</p>
                    
                    <div class="tags">
                        ${(resource.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    
                    <p style="margin-top: 10px;">
                        <i class="fas fa-hdd"></i> ${resource.fileSize || 'N/A'} 
                        <span class="format-badge ${formatClass}" style="margin-left: 10px;">
                            ${resource.format || 'file'}
                        </span>
                    </p>
                </div>
                <div class="resource-footer">
                    <div>
                        <i class="fas fa-download"></i> 
                        ${resource.downloadCount || 0} скачиваний
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="downloadResource(${resource.id})">
                        <i class="fas fa-download"></i> Скачать
                    </button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Обновление статистики цифровых ресурсов
function updateDigitalStats(resources) {
    document.getElementById('resource-count').textContent = resources.length;
    
    // Подсчет скачиваний
    const totalDownloads = resources.reduce((sum, resource) => sum + (resource.downloadCount || 0), 0);
    document.getElementById('download-count').textContent = totalDownloads;
    
    // В реальном приложении здесь был бы запрос к API для статистики
    document.getElementById('user-count').textContent = Math.floor(totalDownloads / 3);
}

// Скачивание ресурса
async function downloadResource(resourceId) {
    try {
        const response = await fetch(`${API_BASE_URL}/digital/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resourceId: resourceId,
                userId: 'user_' + Date.now()
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Скачивание залогировано!\nID: ${data.downloadId}\n\nВ реальном приложении началась бы загрузка файла.`);
            // Обновляем список ресурсов
            loadDigitalResources();
        } else {
            alert(`❌ Ошибка: ${data.error}`);
        }
    } catch (error) {
        alert(`❌ Ошибка соединения: ${error.message}`);
    }
}

// Загрузка отчета
async function loadReport(reportType) {
    showLoading('report-loading');
    
    try {
        const response = await fetch(`${API_BASE_URL}/internal/reports/${reportType}`);
        const data = await response.json();
        
        hideLoading('report-loading');
        
        if (data.success && data.report && data.report.data) {
            displayReport(data.report);
        } else {
            document.getElementById('report-results').innerHTML = `
                <div class="message error">
                    <i class="fas fa-exclamation-circle"></i>
                    ${data.error || 'Не удалось загрузить отчет'}
                </div>
            `;
        }
    } catch (error) {
        hideLoading('report-loading');
        document.getElementById('report-results').innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-circle"></i>
                Ошибка соединения: ${error.message}
            </div>
        `;
    }
}

// Отображение отчета
function displayReport(report) {
    const resultsDiv = document.getElementById('report-results');
    let html = '';
    
    if (report.note) {
        html += `<div class="tech-note">${report.note}</div>`;
    }
    
    if (report.type === 'overdue' && report.data.books) {
        html += `<h3>📋 Просроченные книги: ${report.data.books.length}</h3>`;
        
        if (report.data.books.length > 0) {
            html += `<table class="book-table">
                <thead>
                    <tr>
                        <th>Инв. номер</th>
                        <th>Название</th>
                        <th>Автор</th>
                        <th>Читатель</th>
                        <th>Выдана</th>
                        <th>Дней просрочки</th>
                    </tr>
                </thead>
                <tbody>`;
            
            report.data.books.forEach(book => {
                const days = parseInt(book.days_overdue) || 0;
                const isCritical = days > 30;
                
                html += `
                    <tr>
                        <td><strong>${book.inventory_number}</strong></td>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td><code>${book.reader_card}</code></td>
                        <td>${book.date_taken}</td>
                        <td style="color: ${isCritical ? '#dc3545' : '#ffc107'}; font-weight: bold;">
                            ${days} ${isCritical ? '⚠️' : ''}
                        </td>
                    </tr>
                `;
            });
            
            html += `</tbody></table>`;
        } else {
            html += `<p class="empty-state">✅ Нет просроченных книг</p>`;
        }
    } 
    else if (report.type === 'popular' && Array.isArray(report.data)) {
        html += `<h3>🏆 Популярные книги</h3>`;
        html += `<table class="book-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Инв. номер</th>
                    <th>Название</th>
                    <th>Автор</th>
                    <th>Выдач</th>
                </tr>
            </thead>
            <tbody>`;
        
        report.data.forEach((book, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
            
            html += `
                <tr>
                    <td>${medal}</td>
                    <td><code>${book.inventory_number}</code></td>
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td style="text-align: center;">
                        <span style="background: #17a2b8; color: white; padding: 2px 8px; border-radius: 10px;">
                            ${book.loan_count}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
    }
    else {
        html += `<pre>${JSON.stringify(report.data, null, 2)}</pre>`;
    }
    
    // Информация о технологии
    html += `
        <div class="tech-note" style="margin-top: 20px;">
            <i class="fas fa-info-circle"></i>
            Данные получены из PHP XML отчета через Node.js парсинг
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

// Проверка состояния системы
async function checkSystemStatus() {
    const statusDiv = document.getElementById('system-status');
    statusDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Проверка системы...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        let html = '<h3>Состояние системы:</h3>';
        html += `<p>Время: ${data.timestamp}</p>`;
        
        if (data.status === 'ok') {
            html += `<div class="message success">
                <i class="fas fa-check-circle"></i>
                Все системы работают
            </div>`;
            
            // SOAP сервер
            const soap = data.services.soap_server;
            html += `<div class="arch-layer">
                <h4><i class="fab fa-php"></i> PHP SOAP сервер</h4>
                <p>${soap.message}</p>
                <p><strong>Доступность:</strong> ${soap.available ? '✅' : '❌'}</p>
            </div>`;
            
            // База данных
            const db = data.services.database;
            html += `<div class="arch-layer">
                <h4><i class="fas fa-database"></i> База данных (LowDB)</h4>
                <p><strong>Ресурсов:</strong> ${db.resourceCount}</p>
                <p><strong>Статус:</strong> ${db.available ? '✅' : '❌'}</p>
            </div>`;
            
            // Node.js
            html += `<div class="arch-layer">
                <h4><i class="fab fa-node-js"></i> Node.js сервер</h4>
                <p><strong>Версия:</strong> ${data.node_version}</p>
                <p><strong>Порт:</strong> 3000</p>
            </div>`;
            
        } else {
            html += `<div class="message error">
                <i class="fas fa-exclamation-circle"></i>
                Проблемы в системе: ${data.error}
            </div>`;
        }
        
        statusDiv.innerHTML = html;
        
    } catch (error) {
        statusDiv.innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-circle"></i>
                Не удалось проверить состояние системы: ${error.message}
            </div>
        `;
    }
}
