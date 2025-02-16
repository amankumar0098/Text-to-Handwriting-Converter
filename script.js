// Utility functions for text processing
function chunkText(text, chunkSize = 5000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

async function processLargeText(element, maxHeight = 3300) {
    const style = window.getComputedStyle(element);
    const lineHeight = parseInt(style.lineHeight);
    const fontSize = parseInt(style.fontSize);
    
    const charsPerLine = Math.floor(element.offsetWidth / (fontSize * 0.6));
    const linesPerPage = Math.floor(maxHeight / lineHeight);
    const charsPerPage = charsPerLine * linesPerPage;
    
    return chunkText(element.innerText, charsPerPage);
}

// DOM Elements
const textarea = document.getElementById('input-text');
const preview = document.getElementById('preview');
const fontButtons = document.querySelectorAll('.font-button');
const textColor = document.getElementById('text-color');
const fontSize = document.getElementById('font-size');
const fontSizeValue = document.getElementById('font-size-value');
const lineSpacing = document.getElementById('line-spacing');
const lineSpacingValue = document.getElementById('line-spacing-value');
const wordSpacing = document.getElementById('word-spacing');
const wordSpacingValue = document.getElementById('word-spacing-value');
const backgroundOptions = document.querySelectorAll('.background-option');
const backgroundColorPicker = document.getElementById('background-color-picker');
const downloadPdfButton = document.getElementById('download-pdf');
const downloadImageButton = document.getElementById('download-image');
const formatButtons = document.querySelectorAll('.format-button');
const fontUpload = document.getElementById('font-upload');
const templateSelector = document.getElementById('template-selector');

// Templates data
const templates = {
    thankYouNote: "Dear [Name],\n\nThank you so much for your kindness and generosity. I am truly grateful.\n\nSincerely,\n[Your Name]",
    businessLetter: "[Your Address]\n\n[Date]\n\n[Recipient's Name]\n[Recipient's Address]\n\nDear [Recipient's Name],\n\nI am writing to inquire about...\n\nBest regards,\n[Your Name]",
    invitation: "You are cordially invited to celebrate [Event] with us.\n\nDate: [Date]\nTime: [Time]\nLocation: [Place]\n\nPlease RSVP by [Date]."
};

// Initial Setup
preview.style.fontFamily = "'Caveat', cursive";

// Event Listeners
textarea.addEventListener('input', function() {
    const text = this.value || 'Your handwritten text will appear here';
    if (text.length > 5000) {
        preview.innerHTML = '';
        const chunks = chunkText(text);
        chunks.forEach((chunk, index) => {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'preview-page';
            pageDiv.innerText = chunk;
            if (index > 0) {
                pageDiv.style.pageBreakBefore = 'always';
            }
            preview.appendChild(pageDiv);
        });
    } else {
        preview.innerText = text;
    }
});

// Font Selection Handler
fontButtons.forEach(button => {
    button.addEventListener('click', function() {
        fontButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        preview.style.fontFamily = this.dataset.font;
    });
});

// Custom Font Upload Handler
fontUpload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fontData = e.target.result;
            const font = new FontFace('CustomFont', fontData);
            font.load().then(function(loadedFont) {
                document.fonts.add(loadedFont);
                preview.style.fontFamily = 'CustomFont';
            }).catch(function(error) {
                console.error('Font loading error:', error);
                alert('Failed to load font.');
            });
        };
        reader.readAsArrayBuffer(file);
    }
});

// Text Color Handler
textColor.addEventListener('input', function() {
    preview.style.color = this.value;
});

// Font Size Handler
fontSize.addEventListener('input', function() {
    preview.style.fontSize = `${this.value}px`;
    fontSizeValue.textContent = `${this.value}px`;
});

// Line Spacing Handler
lineSpacing.addEventListener('input', function() {
    preview.style.lineHeight = this.value;
    lineSpacingValue.textContent = this.value;
});

// Word Spacing Handler
wordSpacing.addEventListener('input', function() {
    preview.style.wordSpacing = `${this.value}px`;
    wordSpacingValue.textContent = `${this.value}px`;
});

// Background Options Handler
backgroundOptions.forEach(option => {
    option.addEventListener('click', function() {
        backgroundOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        backgroundColorPicker.value = '#ffffff';
        const bgType = this.dataset.background;
        switch(bgType) {
            case 'white':
                preview.style.backgroundColor = '#ffffff';
                preview.style.backgroundImage = 'none';
                break;
            case 'lined':
                preview.style.backgroundColor = '#ffffff';
                preview.style.backgroundImage = "url('lined.png')";
                break;
            case 'grid':
                preview.style.backgroundColor = '#ffffff';
                preview.style.backgroundImage = "url('grid.png')";
                break;
        }
    });
});

// Background Color Picker Handler
backgroundColorPicker.addEventListener('input', function() {
    backgroundOptions.forEach(opt => opt.classList.remove('active'));
    preview.style.backgroundImage = 'none';
    preview.style.backgroundColor = this.value;
});

// Formatting Buttons Handler
formatButtons.forEach(button => {
    button.addEventListener('click', function() {
        const command = this.dataset.command;
        let value = this.dataset.value || null;
        if (command === 'hiliteColor' && !value) {
            value = prompt('Enter a color name or hex code:', 'yellow');
        }
        document.execCommand(command, false, value);
    });
});

// Template Selector Handler
templateSelector.addEventListener('change', function() {
    const template = templates[this.value];
    if (template) {
        textarea.value = template;
        preview.innerText = template;
    }
});

// PDF Download Handler
downloadPdfButton.addEventListener('click', async () => {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pages = await processLargeText(preview);
        
        for (let i = 0; i < pages.length; i++) {
            if (i > 0) {
                doc.addPage();
            }
            
            const pageElement = document.createElement('div');
            pageElement.style.cssText = preview.style.cssText;
            pageElement.style.width = preview.offsetWidth + 'px';
            pageElement.innerText = pages[i];
            
            document.body.appendChild(pageElement);
            
            const canvas = await html2canvas(pageElement, {
                backgroundColor: null,
                scale: 2,
                logging: false,
                height: Math.min(pageElement.scrollHeight, 3300)
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            document.body.removeChild(pageElement);
        }
        
        doc.save('handwriting.pdf');
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try with a smaller text or fewer pages.');
    }
});

// Image Download Handler
downloadImageButton.addEventListener('click', async () => {
    try {
        const pages = await processLargeText(preview);
        
        if (pages.length > 1) {
            alert('For long texts, please use the PDF download option instead.');
            return;
        }
        
        const canvas = await html2canvas(preview, {
            backgroundColor: null,
            scale: 2,
            logging: false,
            height: Math.min(preview.scrollHeight, 3300)
        });

        const link = document.createElement('a');
        link.download = 'handwriting.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Image generation error:', error);
        alert('Error generating image. Please try with a smaller text.');
    }
});
