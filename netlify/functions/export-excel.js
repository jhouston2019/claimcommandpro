/**
 * Excel Export Function
 * Generates Excel spreadsheets from structured data
 */

const ExcelJS = require('exceljs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { data, columns, filename, sheetName, title } = JSON.parse(event.body);

    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing or invalid data parameter' })
      };
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Claim Command Pro';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName || 'Sheet1');

    // Add title if provided
    if (title) {
      worksheet.mergeCells('A1', `${String.fromCharCode(65 + (columns?.length || Object.keys(data[0]).length) - 1)}1`);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = title;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF1e3c72' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFe3f2fd' }
      };
      worksheet.getRow(1).height = 30;
    }

    const headerRow = title ? 2 : 1;

    // Set up columns
    if (columns && Array.isArray(columns)) {
      worksheet.columns = columns.map(col => ({
        header: col.header || col.key,
        key: col.key,
        width: col.width || 15
      }));
    } else {
      const keys = Object.keys(data[0]);
      worksheet.columns = keys.map(key => ({
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        key: key,
        width: 15
      }));
    }

    // Style header row
    const headerRowObj = worksheet.getRow(headerRow);
    headerRowObj.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRowObj.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2a5298' }
    };
    headerRowObj.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRowObj.height = 25;

    // Add data rows
    data.forEach(row => {
      worksheet.addRow(row);
    });

    // Format currency columns
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > headerRow) {
        row.eachCell((cell, colNumber) => {
          const value = cell.value;
          if (typeof value === 'number' && columns?.[colNumber - 1]?.format === 'currency') {
            cell.numFmt = '$#,##0.00';
          } else if (typeof value === 'number' && columns?.[colNumber - 1]?.format === 'percentage') {
            cell.numFmt = '0.00%';
          }
          
          // Align numbers to right
          if (typeof value === 'number') {
            cell.alignment = { horizontal: 'right' };
          }
        });
      }
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFcccccc' } },
          left: { style: 'thin', color: { argb: 'FFcccccc' } },
          bottom: { style: 'thin', color: { argb: 'FFcccccc' } },
          right: { style: 'thin', color: { argb: 'FFcccccc' } }
        };
      });
    });

    // Auto-filter on header row
    worksheet.autoFilter = {
      from: { row: headerRow, column: 1 },
      to: { row: headerRow, column: worksheet.columns.length }
    };

    // Freeze header row
    worksheet.views = [
      { state: 'frozen', ySplit: headerRow }
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename || 'export.xlsx'}"`
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Excel generation error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: { message: error.message || 'Excel generation failed' }
      })
    };
  }
};
