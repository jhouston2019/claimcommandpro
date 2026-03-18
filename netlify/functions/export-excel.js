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
    const { data, columns, filename, sheetName, title, metadata = {} } = JSON.parse(event.body);

    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing or invalid data parameter' })
      };
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Claim Command Pro';
    workbook.company = 'Claim Command Pro';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName || 'Sheet1');

    let currentRow = 1;

    // Add claim information header if provided
    if (metadata.claim_number || metadata.policyholder_name || metadata.policy_number) {
      const headerParts = [];
      if (metadata.claim_number) headerParts.push(`Claim #: ${metadata.claim_number}`);
      if (metadata.policyholder_name) headerParts.push(`Policyholder: ${metadata.policyholder_name}`);
      if (metadata.policy_number) headerParts.push(`Policy #: ${metadata.policy_number}`);
      if (metadata.date_of_loss) headerParts.push(`Date of Loss: ${metadata.date_of_loss}`);
      headerParts.push(`Generated: ${new Date().toLocaleDateString()}`);

      worksheet.mergeCells(`A${currentRow}`, `${String.fromCharCode(65 + (columns?.length || Object.keys(data[0]).length) - 1)}${currentRow}`);
      const infoCell = worksheet.getCell(`A${currentRow}`);
      infoCell.value = headerParts.join(' | ');
      infoCell.font = { size: 10, bold: true, color: { argb: 'FF333333' } };
      infoCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;
    }

    // Add title if provided
    if (title) {
      worksheet.mergeCells(`A${currentRow}`, `${String.fromCharCode(65 + (columns?.length || Object.keys(data[0]).length) - 1)}${currentRow}`);
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = title;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF1e3c72' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFe3f2fd' }
      };
      worksheet.getRow(currentRow).height = 30;
      currentRow++;
    }

    const headerRow = currentRow;

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

    // Add footer rows
    const lastDataRow = worksheet.rowCount;
    const footerRow1 = lastDataRow + 2;
    const footerRow2 = lastDataRow + 3;

    worksheet.mergeCells(`A${footerRow1}`, `${String.fromCharCode(65 + worksheet.columns.length - 1)}${footerRow1}`);
    const footer1Cell = worksheet.getCell(`A${footerRow1}`);
    footer1Cell.value = 'Generated by Claim Command Pro • Professional Insurance Claim Management';
    footer1Cell.font = { size: 9, color: { argb: 'FF999999' }, italic: true };
    footer1Cell.alignment = { horizontal: 'center' };

    worksheet.mergeCells(`A${footerRow2}`, `${String.fromCharCode(65 + worksheet.columns.length - 1)}${footerRow2}`);
    const footer2Cell = worksheet.getCell(`A${footerRow2}`);
    footer2Cell.value = 'Not for redistribution • Confidential claim documentation';
    footer2Cell.font = { size: 8, color: { argb: 'FFAAAAAA' }, italic: true };
    footer2Cell.alignment = { horizontal: 'center' };

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
