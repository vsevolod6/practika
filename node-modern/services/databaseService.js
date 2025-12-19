const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../..', config.database.path);
        this.data = null;
        this.initDatabase();
    }
    
    // Инициализация базы данных
    async initDatabase() {
        try {
            // Читаем существующие данные или создаем новые
            await this.loadDatabase();
            
            // Если база пустая, заполняем тестовыми данными
            if (!this.data.DigitalResource || this.data.DigitalResource.length === 0) {
                await this.seedDigitalResources();
            }
            
            console.log('✅ База данных инициализирована');
        } catch (error) {
            console.error('❌ Ошибка инициализации базы данных:', error);
        }
    }
    
    // Загрузка базы данных из файла
    async loadDatabase() {
        try {
            const fileContent = await fs.readFile(this.dbPath, 'utf8');
            this.data = JSON.parse(fileContent);
        } catch (error) {
            // Если файла нет, создаем новую структуру
            this.data = {
                DigitalResource: [],
                DownloadLog: []
            };
            await this.saveDatabase();
        }
    }
    
    // Сохранение базы данных в файл
    async saveDatabase() {
        try {
            await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (error) {
            console.error('❌ Ошибка сохранения базы данных:', error);
        }
    }
    
    // Наполнение тестовыми данными
    async seedDigitalResources() {
    const resources = [
        {
            id: 1,
            title: "Clean Code: A Handbook of Agile Software Craftsmanship",
            author: "Robert C. Martin",
            format: "pdf",
            fileSize: "2.4 MB",
            downloadCount: 15,
            tags: ["programming", "best practices", "software engineering"],
            description: "Книга о написании чистого, поддерживаемого кода",
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
            tags: ["javascript", "programming", "web development"],
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
            tags: ["programming", "career", "best practices"],
            description: "Путь от мастера-ремесленника к истинному прагматику",
            fileUrl: "/files/pragmatic-programmer.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 4,
            title: "Design Patterns: Elements of Reusable Object-Oriented Software",
            author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
            format: "pdf",
            fileSize: "4.2 MB",
            downloadCount: 28,
            tags: ["design patterns", "object-oriented", "software architecture"],
            description: "Классическая книга о шаблонах проектирования",
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
            tags: ["algorithms", "computer science", "mathematics"],
            description: "Введение в алгоритмы и анализ их сложности",
            fileUrl: "/files/intro-algorithms.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 6,
            title: "Structure and Interpretation of Computer Programs",
            author: "Harold Abelson, Gerald Jay Sussman",
            format: "pdf",
            fileSize: "3.8 MB",
            downloadCount: 12,
            tags: ["programming", "computer science", "scheme"],
            description: "Классический учебник по компьютерным наукам",
            fileUrl: "/files/sicp.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 7,
            title: "The Art of Computer Programming",
            author: "Donald Knuth",
            format: "pdf",
            fileSize: "8.1 MB",
            downloadCount: 8,
            tags: ["algorithms", "mathematics", "computer science"],
            description: "Монументальный труд Дональда Кнута",
            fileUrl: "/files/taocp.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 8,
            title: "Code Complete",
            author: "Steve McConnell",
            format: "epub",
            fileSize: "4.5 MB",
            downloadCount: 17,
            tags: ["programming", "software construction", "best practices"],
            description: "Практическое руководство по построению программного обеспечения",
            fileUrl: "/files/code-complete.epub",
            createdAt: new Date().toISOString()
        },
        {
            id: 9,
            title: "Refactoring: Improving the Design of Existing Code",
            author: "Martin Fowler",
            format: "pdf",
            fileSize: "3.2 MB",
            downloadCount: 21,
            tags: ["refactoring", "programming", "software design"],
            description: "Руководство по рефакторингу кода",
            fileUrl: "/files/refactoring.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 10,
            title: "Head First Design Patterns",
            author: "Eric Freeman, Elisabeth Robson",
            format: "pdf",
            fileSize: "6.3 MB",
            downloadCount: 25,
            tags: ["design patterns", "object-oriented", "learning"],
            description: "Изучение шаблонов проектирования в увлекательной форме",
            fileUrl: "/files/head-first-patterns.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 11,
            title: "You Don't Know JS",
            author: "Kyle Simpson",
            format: "epub",
            fileSize: "2.1 MB",
            downloadCount: 32,
            tags: ["javascript", "programming", "web development"],
            description: "Серия книг о глубоком понимании JavaScript",
            fileUrl: "/files/ydkjs.epub",
            createdAt: new Date().toISOString()
        },
        {
            id: 12,
            title: "Eloquent JavaScript",
            author: "Marijn Haverbeke",
            format: "pdf",
            fileSize: "3.4 MB",
            downloadCount: 27,
            tags: ["javascript", "programming", "beginner"],
            description: "Современное введение в программирование на JavaScript",
            fileUrl: "/files/eloquent-js.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 13,
            title: "The Linux Command Line",
            author: "William Shotts",
            format: "pdf",
            fileSize: "2.9 MB",
            downloadCount: 14,
            tags: ["linux", "command line", "system administration"],
            description: "Полное руководство по командной строке Linux",
            fileUrl: "/files/linux-cli.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 14,
            title: "Deep Learning",
            author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
            format: "pdf",
            fileSize: "7.2 MB",
            downloadCount: 9,
            tags: ["machine learning", "deep learning", "ai"],
            description: "Учебник по глубокому обучению",
            fileUrl: "/files/deep-learning.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 15,
            title: "The Mythical Man-Month",
            author: "Frederick Brooks",
            format: "epub",
            fileSize: "1.5 MB",
            downloadCount: 11,
            tags: ["software engineering", "project management", "classic"],
            description: "Эссе о программной инженерии и управлении проектами",
            fileUrl: "/files/mythical-man-month.epub",
            createdAt: new Date().toISOString()
        },
        {
            id: 16,
            title: "Domain-Driven Design",
            author: "Eric Evans",
            format: "pdf",
            fileSize: "4.8 MB",
            downloadCount: 13,
            tags: ["software design", "architecture", "ddd"],
            description: "Тактика проектирования программного обеспечения",
            fileUrl: "/files/ddd.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 17,
            title: "Continuous Delivery",
            author: "Jez Humble, David Farley",
            format: "pdf",
            fileSize: "5.2 MB",
            downloadCount: 16,
            tags: ["devops", "continuous integration", "deployment"],
            description: "Надежный выпуск программного обеспечения",
            fileUrl: "/files/continuous-delivery.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 18,
            title: "Site Reliability Engineering",
            author: "Betsy Beyer, Chris Jones, Jennifer Petoff",
            format: "pdf",
            fileSize: "4.6 MB",
            downloadCount: 7,
            tags: ["sre", "devops", "reliability"],
            description: "Как Google запускает производственные системы",
            fileUrl: "/files/sre.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 19,
            title: "The Phoenix Project",
            author: "Gene Kim, Kevin Behr, George Spafford",
            format: "epub",
            fileSize: "2.3 MB",
            downloadCount: 18,
            tags: ["devops", "novel", "business"],
            description: "Роман об IT, DevOps и помощи бизнесу побеждать",
            fileUrl: "/files/phoenix-project.epub",
            createdAt: new Date().toISOString()
        },
        {
            id: 20,
            title: "The Clean Coder",
            author: "Robert C. Martin",
            format: "pdf",
            fileSize: "2.7 MB",
            downloadCount: 22,
            tags: ["programming", "professionalism", "career"],
            description: "Кодекс поведения для профессионалов-программистов",
            fileUrl: "/files/clean-coder.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 21,
            title: "Working Effectively with Legacy Code",
            author: "Michael Feathers",
            format: "pdf",
            fileSize: "3.9 MB",
            downloadCount: 20,
            tags: ["legacy code", "refactoring", "testing"],
            description: "Работа с унаследованным кодом",
            fileUrl: "/files/legacy-code.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 22,
            title: "Python Crash Course",
            author: "Eric Matthes",
            format: "pdf",
            fileSize: "3.5 MB",
            downloadCount: 29,
            tags: ["python", "programming", "beginner"],
            description: "Практическое введение в программирование на Python",
            fileUrl: "/files/python-crash-course.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 23,
            title: "Fluent Python",
            author: "Luciano Ramalho",
            format: "epub",
            fileSize: "4.1 MB",
            downloadCount: 24,
            tags: ["python", "programming", "advanced"],
            description: "Ясный, лаконичный и эффективный программирование на Python",
            fileUrl: "/files/fluent-python.epub",
            createdAt: new Date().toISOString()
        },
        {
            id: 24,
            title: "The Rust Programming Language",
            author: "Steve Klabnik, Carol Nichols",
            format: "pdf",
            fileSize: "3.6 MB",
            downloadCount: 10,
            tags: ["rust", "programming", "systems"],
            description: "Официальная книга по языку Rust",
            fileUrl: "/files/rust-book.pdf",
            createdAt: new Date().toISOString()
        },
        {
            id: 25,
            title: "Effective Java",
            author: "Joshua Bloch",
            format: "pdf",
            fileSize: "3.3 MB",
            downloadCount: 26,
            tags: ["java", "programming", "best practices"],
            description: "Лучшие практики программирования на Java",
            fileUrl: "/files/effective-java.pdf",
            createdAt: new Date().toISOString()
        }
    ];
    
    this.data.DigitalResource = resources;
    await this.saveDatabase();
    console.log(`✅ Загружено ${resources.length} цифровых ресурсов`);
}
    
    // Получить все цифровые ресурсы
    async getAllDigitalResources() {
        await this.loadDatabase();
        return this.data.DigitalResource || [];
    }
    
    // Поиск ресурсов
    async searchDigitalResources(query) {
        const resources = await this.getAllDigitalResources();
        
        return resources.filter(resource => 
            resource.title.toLowerCase().includes(query.toLowerCase()) ||
            resource.author.toLowerCase().includes(query.toLowerCase()) ||
            (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
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
            const resource = await this.getResourceById(resourceId);
            if (resource) {
                resource.downloadCount = (resource.downloadCount || 0) + 1;
                
                // Обновляем ресурс в базе
                const resources = await this.getAllDigitalResources();
                const index = resources.findIndex(r => r.id === parseInt(resourceId));
                if (index !== -1) {
                    resources[index] = resource;
                    this.data.DigitalResource = resources;
                }
            }
            
            await this.saveDatabase();
            return { success: true, logId: logEntry.id };
            
        } catch (error) {
            console.error('Ошибка логирования скачивания:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Получить статистику скачиваний
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
