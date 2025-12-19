const config = {
    // Настройки сервера
    server: {
        port: 3000,
        host: 'localhost'
    },
    
    // Настройки PHP SOAP сервера (Legacy система)
    phpSoap: {
        url: 'http://localhost:8000/php-legacy/soap-server.php',
        wsdl: 'http://localhost:8000/php-legacy/soap-server.php?wsdl',
        timeout: 5000
    },
    
    // Настройки XML отчетов
    xmlReport: {
        overdue: 'http://localhost:8000/php-legacy/report.php?type=overdue&xml=1',
        popular: 'http://localhost:8000/php-legacy/report.php?type=popular&xml=1',
        status: 'http://localhost:8000/php-legacy/report.php?type=status&xml=1'
    },
    
    // Настройки базы данных
    database: {
        path: 'databases/tinydb.json'
    }
};

module.exports = config;
