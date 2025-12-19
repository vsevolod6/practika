const fs = require('fs');
const path = require('path');
const config = require('../config');

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../..', config.database.path);
        console.log(`📁 Путь к БД: ${this.dbPath}`);
        this.data = null;
        this.initDatabase();
    }
    
    // Инициализация базы данных
    async initDatabase() {
        try {
            await this.loadDatabase();
            
            // Если база пустая или нет DigitalResource, заполняем
            if (!this.data.DigitalResource || this.data.DigitalResource.length === 0) {
                console.log('📦 База пустая, заполняю тестовыми данными...');
                await this.seedDigitalResources();
            } else {
                console.log(`✅ База загружена: ${this.data.DigitalResource.length} ресурсов`);
            }
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            // Создаем новую структуру
            this.data = {
                DigitalResource: [],
                DownloadLog: []
            };
            await this.seedDigitalResources();
        }
    }
    
    // Загрузка базы
    async loadDatabase() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const content = fs.readFileSync(this.dbPath, 'utf8');
                this.data = JSON.parse(content);
            } else {
                console.log('📁 Файл БД не найден, создаю новый...');
                this.data = {
                    DigitalResource: [],
                    DownloadLog: []
                };
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки БД:', error);
            throw error;
        }
    }
    
    // Сохранение базы
    async saveDatabase() {
        try {
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
        }
    }
    
    // Наполнение тестовыми данными (УПРОЩЕННАЯ ВЕРСИЯ)
    async seedDigitalResources() {
        console.log('🌱 Заполняю тестовыми данными...');
        
        const resources = [
            {
                id: 1,
                title: "Clean Code: A Handbook of Agile Software Craftsmanship",
                author: "Robert C. Martin",
                format: "pdf",
                fileSize: "2.4 MB",
                downloadCount: 15,
                tags: ["programming", "best practices"],
                description: "Книга о написании чистого кода",
                fileUrl: "/files/clean-code.pdf",
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: "JavaScript: The Good Parts",
                author: "Douglas Crockford",
                format: "epub",
                fileSize: "1.8 MB",
                downloadCount: 23,
                tags: ["javascript", "programming"],
                description: "Изучение хороших частей JavaScript",
                fileUrl: "/files/javascript-good-parts.epub",
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                title: "The Pragmatic Programmer",
                author: "Andrew Hunt, David Thomas",
                format: "pdf",
                fileSize: "3.1 MB",
                downloadCount: 31,
                tags: ["programming", "career"],
                description: "Путь от мастера к прагматику",
                fileUrl: "/files/pragmatic-programmer.pdf",
                createdAt: new Date().toISOString()
            },
            {
                id: 4,
                title: "Design Patterns",
                author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
                format: "pdf",
                fileSize: "4.2 MB",
                downloadCount: 28,
                tags: ["design patterns", "architecture"],
                description: "Книга о шаблонах проектирования",
                fileUrl: "/files/design-patterns.pdf",
                createdAt: new Date().toISOString()
            },
            {
                id: 5,
                title: "Introduction to Algorithms",
                author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
                format: "pdf",
                fileSize: "5.7 MB",
                downloadCount: 19,
                tags: ["algorithms", "computer science"],
                description: "Введение в алгоритмы",
                fileUrl: "/files/intro-algorithms.pdf",
                createdAt: new Date().toISOString()
            }
        ];
        
        this.data.DigitalResource = resources;
        await this.saveDatabase();
        console.log(`✅ Загружено ${resources.length} ресурсов`);
    }
    
    // Получить все ресурсы
    async getAllDigitalResources() {
        await this.loadDatabase();
        return this.data.DigitalResource || [];
    }
    
    // Поиск ресурсов
    async searchDigitalResources(query) {
        const resources = await this.getAllDigitalResources();
        
        if (!query) return resources;
        
        return resources.filter(resource => 
            resource.title.toLowerCase().includes(query.toLowerCase()) ||
            resource.author.toLowerCase().includes(query.toLowerCase()) ||
            (resource.tags && resource.tags.some(tag => 
                tag.toLowerCase().includes(query.toLowerCase())
            ))
        );
    }
    
    // Получить ресурс по ID
    async getResourceById(id) {
        const resources = await this.getAllDigitalResources();
        return resources.find(r => r.id === parseInt(id));
    }
    
    // Логирование скачивания
    async logDownload(resourceId, userId = 'anonymous') {
        try {
            await this.loadDatabase();
            
            const logEntry = {
                id: Date.now(),
                resourceId: parseInt(resourceId),
                userId: userId,
                timestamp: new Date().toISOString(),
                ip: '127.0.0.1'
            };
            
            // Добавляем лог
            if (!this.data.DownloadLog) {
                this.data.DownloadLog = [];
            }
            this.data.DownloadLog.push(logEntry);
            
            // Увеличиваем счетчик скачиваний
            const resources = await this.getAllDigitalResources();
            const index = resources.findIndex(r => r.id === parseInt(resourceId));
            if (index !== -1) {
                resources[index].downloadCount = (resources[index].downloadCount || 0) + 1;
                this.data.DigitalResource = resources;
            }
            
            await this.saveDatabase();
            return { success: true, logId: logEntry.id };
            
        } catch (error) {
            console.error('Ошибка логирования:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Статистика
    async getDownloadStats() {
        await this.loadDatabase();
        const logs = this.data.DownloadLog || [];
        const resources = await this.getAllDigitalResources();
        
        return {
            totalDownloads: logs.length,
            uniqueUsers: [...new Set(logs.map(log => log.userId))].length,
            popularResources: resources
                .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
                .slice(0, 5)
        };
    }
}

module.exports = new DatabaseService();
