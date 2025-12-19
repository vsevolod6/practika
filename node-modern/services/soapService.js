const axios = require('axios');
const xml2js = require('xml2js');
const config = require('../config');

class SoapService {
    constructor() {
        this.parser = new xml2js.Parser({
            explicitArray: false,
            trim: true,
            normalize: true
        });
        
        this.builder = new xml2js.Builder({
            xmldec: { version: '1.0', encoding: 'UTF-8' }
        });
    }
    
    // Универсальный метод для SOAP запросов
    async callSoapMethod(methodName, params) {
        try {
            const soapRequest = this.buildSoapRequest(methodName, params);
            
            console.log(`📤 SOAP запрос к ${methodName}:`, JSON.stringify(params));
            
            const response = await axios.post(config.phpSoap.url, soapRequest, {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': methodName
                },
                timeout: config.phpSoap.timeout
            });
            
            console.log(`📥 SOAP ответ от ${methodName}:`, response.status);
            
            const result = await this.parseSoapResponse(response.data, methodName);
            return {
                success: true,
                data: result,
                raw: response.data
            };
            
        } catch (error) {
            console.error(`❌ Ошибка SOAP запроса ${methodName}:`, error.message);
            
            return {
                success: false,
                error: error.message,
                details: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : null
            };
        }
    }
    
    // Сборка SOAP запроса
    buildSoapRequest(methodName, params) {
        let soapBody = '';
        
        switch (methodName) {
            case 'getBookByInventory':
                soapBody = `
                    <ns1:getBookByInventory>
                        <inventory_number>${params.inventory_number}</inventory_number>
                    </ns1:getBookByInventory>
                `;
                break;
                
            case 'searchBooksByAuthor':
                soapBody = `
                    <ns1:searchBooksByAuthor>
                        <author_name>${params.author_name}</author_name>
                    </ns1:searchBooksByAuthor>
                `;
                break;
                
            case 'registerLoan':
                soapBody = `
                    <ns1:registerLoan>
                        <inventory_number>${params.inventory_number}</inventory_number>
                        <reader_card>${params.reader_card}</reader_card>
                    </ns1:registerLoan>
                `;
                break;
                
            case 'returnBook':
                soapBody = `
                    <ns1:returnBook>
                        <inventory_number>${params.inventory_number}</inventory_number>
                    </ns1:returnBook>
                `;
                break;
        }
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope 
    xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:ns1="http://localhost/php-legacy/library.wsdl">
    <SOAP-ENV:Body>
        ${soapBody}
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;
    }
    
    // Парсинг SOAP ответа
    async parseSoapResponse(xmlResponse, methodName) {
        try {
            const result = await this.parser.parseStringPromise(xmlResponse);
            
            // Извлекаем данные из сложной структуры SOAP
            const envelope = result['SOAP-ENV:Envelope'];
            const body = envelope['SOAP-ENV:Body'];
            
            let responseData;
            
            switch (methodName) {
                case 'getBookByInventory':
                    responseData = body['ns1:getBookByInventoryResponse'];
                    break;
                case 'searchBooksByAuthor':
                    responseData = body['ns1:searchBooksByAuthorResponse'];
                    break;
                case 'registerLoan':
                    responseData = body['ns1:registerLoanResponse'];
                    break;
                case 'returnBook':
                    responseData = body['ns1:returnBookResponse'];
                    break;
                default:
                    responseData = body;
            }
            
            // Пробуем парсить JSON если он в ответе
            const returnValue = responseData?.return?._ || responseData?.return || responseData;
            
            try {
                // Если это JSON строка
                if (typeof returnValue === 'string' && (returnValue.startsWith('{') || returnValue.startsWith('['))) {
                    return JSON.parse(returnValue);
                }
                // Если это XML строка
                else if (typeof returnValue === 'string' && returnValue.includes('<')) {
                    const parsedXml = await this.parser.parseStringPromise(returnValue);
                    return parsedXml;
                }
                // Просто строка
                else {
                    return returnValue;
                }
            } catch (parseError) {
                // Если не удалось распарсить, возвращаем как есть
                return returnValue;
            }
            
        } catch (error) {
            console.error('Ошибка парсинга SOAP ответа:', error);
            
            // Возвращаем сырой XML если не удалось распарсить
            try {
                const simpleParse = await this.parser.parseStringPromise(xmlResponse);
                return simpleParse;
            } catch {
                return { raw: xmlResponse.substring(0, 500) + '...' };
            }
        }
    }
    
    // Методы-обертки для удобства
    
    async getBookByInventory(inventoryNumber) {
        return this.callSoapMethod('getBookByInventory', {
            inventory_number: inventoryNumber
        });
    }
    
    async searchBooksByAuthor(authorName) {
        return this.callSoapMethod('searchBooksByAuthor', {
            author_name: authorName
        });
    }
    
    async registerLoan(inventoryNumber, readerCard) {
        return this.callSoapMethod('registerLoan', {
            inventory_number: inventoryNumber,
            reader_card: readerCard
        });
    }
    
    async returnBook(inventoryNumber) {
        return this.callSoapMethod('returnBook', {
            inventory_number: inventoryNumber
        });
    }
    
    // Проверка доступности SOAP сервера
    async healthCheck() {
        try {
            const response = await this.getBookByInventory('LIB-2024-001');
            return {
                available: response.success,
                message: response.success ? 'SOAP сервер доступен' : 'SOAP сервер недоступен',
                details: response
            };
        } catch (error) {
            return {
                available: false,
                message: 'Ошибка проверки SOAP сервера',
                error: error.message
            };
        }
    }
}

module.exports = new SoapService();
