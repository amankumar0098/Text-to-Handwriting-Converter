// Add these page format constants
const PAGE_FORMATS = {
    A4: { width: 210, height: 297, margins: 15 }, // sizes in mm
    LETTER: { width: 215.9, height: 279.4, margins: 15 },
    LEGAL: { width: 215.9, height: 355.6, margins: 15 }
};

// Add this utility function for page calculations
function calculatePageDimensions(format = 'A4') {
    const pageFormat = PAGE_FORMATS[format.toUpperCase()] || PAGE_FORMATS.A4;
    return {
        ...pageFormat,
        contentWidth: pageFormat.width - (2 * pageFormat.margins),
        contentHeight: pageFormat.height - (2 * pageFormat.margins)
    };
}

// Replace the existing preview update logic
function updatePreview(text) {
    if (!text) {
        preview.innerHTML = '<div class="preview-page">Your handwritten text will appear here</div>';
        return;
    }

    const format = document.getElementById('page-format').value || 'A4';
    const dimensions = calculatePageDimensions(format);
    
    // Calculate approximate characters per page (based on font size and page dimensions)
    const style = window.getComputedStyle(preview);
    const fontSize = parseInt(style.fontSize);
    const lineHeight = parseInt(style.lineHeight);
    
    const charsPerLine = Math.floor((dimensions.contentWidth * 3.7794) / (fontSize * 0.6)); // Convert mm to px
    const linesPerPage = Math.floor((dimensions.contentHeight * 3.7794) / lineHeight);
    const charsPerPage = charsPerLine * linesPerPage;

    // Split text into pages
    const pages = [];
    let remaining = text;
    while (remaining.length > 0) {
        const pageText = remaining.slice(0, charsPerPage);
        pages.push(pageText);
        remaining = remaining.slice(charsPerPage);
    }

    // Update preview with pages
    preview.innerHTML = '';
    pages.forEach((pageText, index) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'preview-page';
        pageDiv.style.width = `${dimensions.width * 3.7794}px`; // Convert mm to px
        pageDiv.style.height = `${dimensions.height * 3.7794}px`;
        pageDiv.style.padding = `${dimensions.margins * 3.7794}px`;
        pageDiv.style.marginBottom = '20px';
        pageDiv.style.border = '1px solid #ddd';
        pageDiv.style.boxSizing = 'border-box';
        pageDiv.style.backgroundColor = 'white';
        pageDiv.style.position = 'relative';
        pageDiv.innerText = pageText;
        
        // Add page number
        const pageNumber = document.createElement('div');
        pageNumber.style.position = 'absolute';
        pageNumber.style.bottom = '10px';
        pageNumber.style.right = '10px';
        pageNumber.style.fontSize = '12px';
        pageNumber.style.color = '#666';
        pageNumber.innerText = `Page ${index + 1}`;
        pageDiv.appendChild(pageNumber);
        
        preview.appendChild(pageDiv);
    });
}

// Add this to your HTML
`<div class="control-group">
    <label for="page-format">Page Format:</label>
    <select id="page-format">
        <option value="A4">A4</option>
        <option value="LETTER">Letter</option>
        <option value="LEGAL">Legal</option>
    </select>
</div>`

// Modified PDF generation code
async function generatePDF() {
    try {
        const { jsPDF } = window.jspdf;
        const format = document.getElementById('page-format').value || 'A4';
        const dimensions = calculatePageDimensions(format);
        
        // Create PDF with proper format
        const doc = new jsPDF({
            format: format.toLowerCase(),
            unit: 'mm'
        });

        // Get all preview pages
        const pages = document.querySelectorAll('.preview-page');
        
        for (let i = 0; i < pages.length; i++) {
            if (i > 0) {
                doc.addPage();
            }

            const page = pages[i];
            
            // Create a temporary container for the current page
            const container = document.createElement('div');
            container.style.width = `${dimensions.width}mm`;
            container.style.height = `${dimensions.height}mm`;
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.backgroundColor = 'white';
            container.appendChild(page.cloneNode(true));
            document.body.appendChild(container);

            // Generate canvas for the page
            const canvas = await html2canvas(container, {
                scale: 2,
                logging: false,
                backgroundColor: null,
                useCORS: true,
                allowTaint: true
            });

            // Add image to PDF with proper margins
            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            doc.addImage(
                imgData,
                'JPEG',
                dimensions.margins,
                dimensions.margins,
                dimensions.contentWidth,
                dimensions.contentHeight
            );

            // Clean up
            document.body.removeChild(container);
        }

        // Optimize PDF file size
        const pdfBlob = doc.output('blob');
        const compressedPdf = await compressPDF(pdfBlob);
        
        // Save the compressed PDF
        const url = URL.createObjectURL(compressedPdf);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'handwriting.pdf';
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
    }
}

// PDF compression utility
async function compressPDF(pdfBlob) {
    const options = {
        maxSize: 1000000, // 1MB target size
        quality: 0.9
    };
    
    if (pdfBlob.size <= options.maxSize) {
        return pdfBlob;
    }

    const compressionRatio = options.maxSize / pdfBlob.size;
    const newQuality = Math.min(options.quality, compressionRatio);
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Re-compress the PDF with lower quality
    return doc.output('blob', { quality: newQuality });
}

// Update event listeners
document.getElementById('page-format').addEventListener('change', function() {
    updatePreview(textarea.value);
});

textarea.addEventListener('input', function() {
    updatePreview(this.value);
});

downloadPdfButton.addEventListener('click', generatePDF);
