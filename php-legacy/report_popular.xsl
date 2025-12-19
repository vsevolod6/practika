<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/">
        <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; margin: 20px 0;">
            <h3 style="color: #0c5460; margin-top: 0;">
                📈 Самые популярные книги
            </h3>
            <table style="width: 100%;">
                <thead>
                    <tr style="background: #bee5eb;">
                        <th>#</th>
                        <th>Инв. номер</th>
                        <th>Название</th>
                        <th>Автор</th>
                        <th>Кол-во выдач</th>
                    </tr>
                </thead>
                <tbody>
                    <xsl:for-each select="library_report/popular_books/book">
                    <xsl:variable name="position" select="position()"/>
                    <tr>
                        <td>
                            <xsl:choose>
                                <xsl:when test="$position = 1">🥇</xsl:when>
                                <xsl:when test="$position = 2">🥈</xsl:when>
                                <xsl:when test="$position = 3">🥉</xsl:when>
                                <xsl:otherwise><xsl:value-of select="$position"/></xsl:otherwise>
                            </xsl:choose>
                        </td>
                        <td><code><xsl:value-of select="inventory_number"/></code></td>
                        <td><xsl:value-of select="title"/></td>
                        <td><xsl:value-of select="author"/></td>
                        <td style="text-align: center;">
                            <span style="background: #17a2b8; color: white; padding: 2px 8px; border-radius: 10px;">
                                <xsl:value-of select="loan_count"/>
                            </span>
                        </td>
                    </tr>
                    </xsl:for-each>
                </tbody>
            </table>
        </div>
    </xsl:template>
</xsl:stylesheet>
