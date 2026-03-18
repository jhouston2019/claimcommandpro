/**
 * PDF Generation Function
 * Generates PDFs from document content
 */

const { PDFDocument, rgb } = require('pdf-lib');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/pdf'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { ...headers, 'Content-Type': 'text/plain' }, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Parse request
    const body = JSON.parse(event.body || '{}');
    const { document_content, metadata = {} } = body;

    if (!document_content) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'document_content required' })
      };
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    const { width, height } = page.getSize();
    
    let yPosition = height - 50;

    // Add claim information header if provided
    if (metadata.claim_number || metadata.policyholder_name || metadata.policy_number || metadata.date_of_loss) {
      if (metadata.claim_number) {
        page.drawText(`Claim #: ${metadata.claim_number}`, {
          x: 50,
          y: yPosition,
          size: 10,
          color: rgb(0.2, 0.2, 0.2)
        });
        yPosition -= 14;
      }
      if (metadata.policyholder_name) {
        page.drawText(`Policyholder: ${metadata.policyholder_name}`, {
          x: 50,
          y: yPosition,
          size: 10,
          color: rgb(0.2, 0.2, 0.2)
        });
        yPosition -= 14;
      }
      if (metadata.policy_number) {
        page.drawText(`Policy #: ${metadata.policy_number}`, {
          x: 50,
          y: yPosition,
          size: 10,
          color: rgb(0.2, 0.2, 0.2)
        });
        yPosition -= 14;
      }
      if (metadata.date_of_loss) {
        page.drawText(`Date of Loss: ${metadata.date_of_loss}`, {
          x: 50,
          y: yPosition,
          size: 10,
          color: rgb(0.2, 0.2, 0.2)
        });
        yPosition -= 14;
      }

      // Add generated date
      page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: yPosition,
        size: 9,
        color: rgb(0.4, 0.4, 0.4)
      });
      yPosition -= 25;

      // Add separator line
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });
      yPosition -= 20;
    }
    
    // Add title if provided
    if (metadata.title) {
      page.drawText(metadata.title, {
        x: 50,
        y: yPosition,
        size: 16,
        color: rgb(0, 0, 0)
      });
      yPosition -= 30;
    }

    // Add subject if provided
    if (metadata.subject) {
      page.drawText(`Subject: ${metadata.subject}`, {
        x: 50,
        y: yPosition,
        size: 12,
        color: rgb(0.2, 0.2, 0.2)
      });
      yPosition -= 20;
    }

    // Add content (simple text wrapping)
    const lines = wrapText(document_content, width - 100, 10);
    let currentY = yPosition;
    let currentPage = page;
    
    for (const line of lines) {
      if (currentY < 80) {
        // Add footer to current page before creating new one
        addFooter(currentPage, width, height);
        
        // New page
        currentPage = pdfDoc.addPage([612, 792]);
        currentY = height - 50;
      }
      
      currentPage.drawText(line, {
        x: 50,
        y: currentY,
        size: 10,
        color: rgb(0, 0, 0)
      });
      
      currentY -= 12;
    }

    // Add footer to last page
    addFooter(currentPage, width, height);

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Optionally save to storage
    if (metadata.save_to_storage) {
      const fileName = `${user.id}/${Date.now()}-${metadata.title || 'document'}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: pdfBytes.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Simple text wrapping
 */
function wrapText(text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    // Approximate width (rough estimate)
    const testWidth = testLine.length * (fontSize * 0.6);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Add footer to page
 */
function addFooter(page, width, height) {
  const footerY = 40;
  
  // Add separator line
  page.drawLine({
    start: { x: 50, y: footerY + 15 },
    end: { x: width - 50, y: footerY + 15 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8)
  });
  
  // Add footer text
  page.drawText('Generated by Claim Command Pro • Professional Insurance Claim Management', {
    x: 50,
    y: footerY,
    size: 8,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  page.drawText('Not for redistribution • Confidential claim documentation', {
    x: 50,
    y: footerY - 10,
    size: 7,
    color: rgb(0.6, 0.6, 0.6)
  });
}



