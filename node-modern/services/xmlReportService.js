const axios = require('axios');
const xml2js = require('xml2js');
const config = require('../config');

class XmlReportService {
    constructor() {
        this.parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            normalize: true,
            trim: true
        });
    }
    
    // Получить XML отчет
    async getReport(reportType = 'overdue') {
        try {
            let url;
            
            switch (reportType) {
                case 'overdue':
                    url = config.xmlReport.overdue;
                    break;
                case 'popular':
                    url = config.xmlReport.popular;
                    break;
                case 'status':
                    url = config.xmlReport.status;
                    break;
                default:
                    url = config.xmlReport.overdue;
            }
            
            console.log(`📊 Запрос XML отчета: ${reportType} (${url})`);
            
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'Accept': 'application/xml, text/xml'
                }
            });
            
            // Парсим XML
            const parsed = await this.parser.parseStringPromise(response.data);
            
            return {
                success: true,
                type: reportType,
                data: parsed,
                rawXml: response.data,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Ошибка получения XML отчета ${reportType}:`, error.message);
            
            return {
                success: false,
                type: reportType,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // Преобразовать XML отчет в JSON для фронтенда
    async getReportAsJSON(reportType = 'overdue') {
        const report = await this.getReport(reportType);
        
        if (!report.success) {
            return report;
        }
        
        // Преобразуем XML структуру в удобный JSON
        const xmlData = report.data;
        const libraryReport = xmlData.library_report;
        
        let formattedData = {
            generated_at: libraryReport.generated_at,
            report_type: libraryReport.report_type
        };
        
        // Обрабатываем разные типы отчетов
        if (reportType === 'overdue' && libraryReport.overdue_books) {
            formattedData.overdue_books = this.formatOverdueBooks(libraryReport.overdue_books);
        }
        
        if (reportType === 'popular' && libraryReport.popular_books) {
            formattedData.popular_books = this.formatPopularBooks(libraryReport.popular_books);
        }
        
        if (reportType === 'status' && libraryReport.books_by_status) {
            formattedData.books_by_status = this.formatBooksByStatus(libraryReport.books_by_status);
        }
        
        return {
            success: true,
            type: reportType,
            data: formattedData,
            timestamp: report.timestamp
        };
    }
    
    // Форматирование просроченных книг
    formatOverdueBooks(overdueData) {
        if (!overdueData.book) {
            return {
                count: parseInt(overdueData.count) || 0,
                books: []
            };
        }
        
        const books = Array.isArray(overdueData.book) ? overdueData.book : [overdueData.book];
        
        return {
            count: parseInt(overdueData.count) || books.length,
            books: books.map(book => ({
                inventory_number: book.inventory_number,
                title: book.title,
                author: book.author,
                reader_card: book.reader_card,
                date_taken: book.date_taken,
                days_overdue: parseInt(book.days_overdue) || 0,
                is_critical: (parseInt(book.days_overdue) || 0) > 30
            }))
        };
    }
    
    // Форматирование популярных книг
    formatPopularBooks(popularData) {
        if (!popularData.book) {
            return [];
        }
        
        const books = Array.isArray(popularData.book) ? popularData.book : [popularData.book];
        
        return books.map((book, index) => ({
            rank: index + 1,
            inventory_number: book.inventory_number,
            title: book.title,
            author: book.author,
            loan_count: parseInt(book.loan_count) || 0
        }));
    }
    
    // Форматирование книг по статусам
    formatBooksByStatus(statusData) {
        if (!statusData.status) {
            return [];
        }
        
        const statuses = Array.isArray(statusData.status) ? statusData.status : [statusData.status];
        
        return statuses.map(status => ({
            name: status.name,
            count: parseInt(status.count) || 0,
            percentage: 0 // Рассчитается на фронтенде
        }));
    }
}

module.exports = new XmlReportService();
