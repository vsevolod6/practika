const express = require('express');
const cors = require('cors');
const config = require('./config');
const dbService = require('./services/databaseService');
const soapService = require('./services/soapService');
const xmlReportService = require('./services/xmlReportService');

// Инициализация Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// ====================
// REST API ЭНДПОИНТЫ
// ====================

// 1. Проверка здоровья системы
app.get('/api/health', async (req, res) => {
    try {
        // Проверка SOAP сервера
        const soapHealth = await soapService.healthCheck();
        
        // Проверка базы данных
        const dbResources = await dbService.getAllDigitalResources();
        const dbHealth = { 
            available: true,
            resourceCount: dbResources.length 
        };
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                soap_server: soapHealth,
                database: dbHealth
            },
            node_version: process.version
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// 2. API для физических книг (через SOAP прокси)
app.get('/api/physical/books/:inventoryNumber', async (req, res) => {
    try {
        const { inventoryNumber } = req.params;
        
        if (!inventoryNumber) {
            return res.status(400).json({ error: 'Требуется инвентарный номер' });
        }
        
        const result = await soapService.getBookByInventory(inventoryNumber);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Книга найдена',
                data: result.data
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Книга не найдена',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Ошибка получения книги:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

app.get('/api/physical/books', async (req, res) => {
    try {
        const { author } = req.query;
        
        if (!author) {
            return res.status(400).json({ error: 'Требуется параметр author' });
        }
        
        const result = await soapService.searchBooksByAuthor(author);
        
        if (result.success) {
            res.json({
                success: true,
                count: Array.isArray(result.data) ? result.data.length : 1,
                data: result.data
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Книги не найдены',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Ошибка поиска книг:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

app.post('/api/physical/loan', async (req, res) => {
    try {
        const { inventory_number, reader_card } = req.body;
        
        if (!inventory_number || !reader_card) {
            return res.status(400).json({ 
                error: 'Требуются параметры: inventory_number и reader_card' 
            });
        }
        
        const result = await soapService.registerLoan(inventory_number, reader_card);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Книга успешно выдана',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Не удалось выдать книгу',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Ошибка выдачи книги:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

// 3. API для цифровых ресурсов
app.get('/api/digital/resources', async (req, res) => {
    try {
        const resources = await dbService.getAllDigitalResources();
        
        res.json({
            success: true,
            count: resources.length,
            data: resources
        });
    } catch (error) {
        console.error('Ошибка получения ресурсов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения ресурсов'
        });
    }
});

app.get('/api/digital/resources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await dbService.getResourceById(id);
        
        if (resource) {
            res.json({
                success: true,
                data: resource
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Ресурс не найден'
            });
        }
    } catch (error) {
        console.error('Ошибка получения ресурса:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения ресурса'
        });
    }
});

app.get('/api/digital/resources/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Требуется параметр q' });
        }
        
        const results = await dbService.searchDigitalResources(q);
        
        res.json({
            success: true,
            count: results.length,
            query: q,
            data: results
        });
    } catch (error) {
        console.error('Ошибка поиска ресурсов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка поиска ресурсов'
        });
    }
});

app.post('/api/digital/download', async (req, res) => {
    try {
        const { resourceId, userId } = req.body;
        
        if (!resourceId) {
            return res.status(400).json({ error: 'Требуется resourceId' });
        }
        
        const result = await dbService.logDownload(resourceId, userId || 'anonymous');
        
        if (result.success) {
            const resource = await dbService.getResourceById(resourceId);
            
            res.json({
                success: true,
                message: 'Скачивание залогировано',
                downloadId: result.logId,
                resource: resource ? {
                    id: resource.id,
                    title: resource.title,
                    format: resource.format,
                    fileUrl: resource.fileUrl || `/api/digital/download/file/${resource.id}`
                } : null
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Ошибка логирования скачивания'
            });
        }
    } catch (error) {
        console.error('Ошибка скачивания:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

app.get('/api/digital/download/file/:id', async (req, res) => {
    const { id } = req.params;
    const resource = await dbService.getResourceById(id);
    
    if (!resource) {
        return res.status(404).json({ error: 'Ресурс не найден' });
    }
    
    res.json({
        message: 'Это заглушка для скачивания файла',
        note: 'В реальном приложении здесь бы отдавался файл',
        resource: {
            id: resource.id,
            title: resource.title,
            format: resource.format
        }
    });
});

app.get('/api/digital/stats', async (req, res) => {
    try {
        const stats = await dbService.getDownloadStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения статистики'
        });
    }
});

// 4. API для XML отчетов
app.get('/api/internal/overdue-report', async (req, res) => {
    try {
        const report = await xmlReportService.getReportAsJSON('overdue');
        
        if (report.success) {
            res.json({
                success: true,
                message: 'Отчет получен',
                report: report
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Ошибка получения отчета',
                details: report.error
            });
        }
    } catch (error) {
        console.error('Ошибка получения отчета:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

// 5. Главная страница
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Library Hybrid System - Node.js API</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
                .endpoint { 
                    background: #f9f9f9; 
                    padding: 15px; 
                    margin: 15px 0; 
                    border-left: 5px solid #4CAF50;
                    border-radius: 5px;
                }
                .method { 
                    display: inline-block; 
                    padding: 4px 12px; 
                    border-radius: 4px; 
                    color: white; 
                    font-weight: bold;
                    font-size: 14px;
                    margin-right: 10px;
                }
                .get { background: #4CAF50; }
                .post { background: #2196F3; }
                .status { 
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                    margin-left: 10px;
                }
                .status-ok { background: #d4edda; color: #155724; }
                .status-test { background: #fff3cd; color: #856404; }
                code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
                .test-link { 
                    display: inline-block; 
                    margin-left: 15px; 
                    color: #2196F3; 
                    text-decoration: none;
                    font-size: 14px;
                }
                .test-link:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <h1>📚 Library Hybrid System - Node.js API</h1>
            <p>Современный бэкенд для гибридной библиотечной системы</p>
            <p><strong>Порт:</strong> ${config.server.port}</p>
            
            <h2>Доступные эндпоинты:</h2>
            
            <div class="endpoint">
                <span class="method get">GET</span> <strong>/api/health</strong>
                <a href="/api/health" class="test-link" target="_blank">Тест</a>
                <p>Проверка здоровья системы</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span> <strong>/api/physical/books?author=Булгаков</strong>
                <a href="/api/physical/books?author=Булгаков" class="test-link" target="_blank">Тест</a>
                <p>Поиск физических книг через SOAP</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span> <strong>/api/digital/resources</strong>
                <a href="/api/digital/resources" class="test-link" target="_blank">Тест</a>
                <p>Все цифровые ресурсы</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span> <strong>/api/internal/overdue-report</strong>
                <a href="/api/internal/overdue-report" class="test-link" target="_blank">Тест</a>
                <p>XML отчет из PHP системы</p>
            </div>
        </body>
        </html>
    `);
});

// Обработка 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Эндпоинт не найден',
        path: req.path,
        method: req.method
    });
});

// Запуск сервера
const startServer = async () => {
    try {
        // Инициализируем базу данных
        await dbService.initDatabase();
        
        app.listen(config.server.port, config.server.host, () => {
            console.log(`🚀 Node.js сервер запущен на http://${config.server.host}:${config.server.port}`);
            console.log(`📚 Главная страница: http://${config.server.host}:${config.server.port}`);
            console.log(`🔗 PHP SOAP: ${config.phpSoap.url}`);
        });
        
    } catch (error) {
        console.error('❌ Не удалось запустить сервер:', error);
        process.exit(1);
    }
};

startServer();
