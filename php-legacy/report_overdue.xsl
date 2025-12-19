<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/">
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">
                ⚠️ Просроченные книги: <xsl:value-of select="library_report/overdue_books/count"/>
            </h3>
            <xsl:if test="library_report/overdue_books/count > 0">
                <table style="width: 100%;">
                    <thead>
                        <tr style="background: #ffeaa7;">
                            <th>Инв. номер</th>
                            <th>Название</th>
                            <th>Автор</th>
                            <th>Читатель</th>
                            <th>Дата выдачи</th>
                            <th>Дней просрочки</th>
                        </tr>
                    </thead>
                    <tbody>
                        <xsl:for-each select="library_report/overdue_books/book">
                        <tr>
                            <td><strong><xsl:value-of select="inventory_number"/></strong></td>
                            <td><xsl:value-of select="title"/></td>
                            <td><xsl:value-of select="author"/></td>
                            <td><code><xsl:value-of select="reader_card"/></code></td>
                            <td><xsl:value-of select="date_taken"/></td>
                            <td style="color: #dc3545; font-weight: bold;">
                                <xsl:value-of select="days_overdue"/>
                            </td>
                        </tr>
                        </xsl:for-each>
                    </tbody>
                </table>
            </xsl:if>
            <xsl:if test="library_report/overdue_books/count = 0">
                <p style="color: #28a745;">✅ Нет просроченных книг. Отлично!</p>
            </xsl:if>
        </div>
    </xsl:template>
</xsl:stylesheet>
