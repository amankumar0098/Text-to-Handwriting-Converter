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
        
        // Initial Setup
        preview.style.fontFamily = "'Caveat', cursive";

        // Update Preview Text
        textarea.addEventListener('input', function() {
            preview.innerText = this.value || 'Your handwritten text will appear here';
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
                        // Set custom font
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
                backgroundColorPicker.value = '#ffffff'; // Reset background color picker
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
                    // Add more cases for additional backgrounds
                }
            });
        });

        // Background Color Picker Handler
        backgroundColorPicker.addEventListener('input', function() {
            backgroundOptions.forEach(opt => opt.classList.remove('active'));
            preview.style.backgroundImage = 'none';
            preview.style.backgroundColor = this.value;
        });

        // Formatting Toolbar Handler
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
        const templates = {
            thankYouNote: "Dear [Name],\n\nThank you so much for your kindness and generosity. I am truly grateful.\n\nSincerely,\n[Your Name]",
            businessLetter: "[Your Address]\n\n[Date]\n\n[Recipient's Name]\n[Recipient's Address]\n\nDear [Recipient's Name],\n\nI am writing to inquire about...\n\nBest regards,\n[Your Name]",
            invitation: "You are cordially invited to celebrate [Event] with us.\n\nDate: [Date]\nTime: [Time]\nLocation: [Place]\n\nPlease RSVP by [Date]."
        };

        templateSelector.addEventListener('change', function() {
            const template = templates[this.value];
            if (template) {
                textarea.value = template;
                preview.innerText = template;
            }
        });

        // Download PDF Handler
        downloadPdfButton.addEventListener('click', async () => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // Clone the preview element
                const clone = preview.cloneNode(true);
                clone.style.margin = '0';

                // Create a temporary container
                const tempContainer = document.createElement('div');
                tempContainer.style.position = 'absolute';
                tempContainer.style.left = '-9999px';
                tempContainer.appendChild(clone);
                document.body.appendChild(tempContainer);

                // Render the cloned element
                const canvas = await html2canvas(clone, {
                    backgroundColor: null, // To ensure transparent backgrounds are preserved
                    scale: 2 // To improve resolution
                });

                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                doc.save('handwriting.pdf');

                // Clean up
                document.body.removeChild(tempContainer);
            } catch (error) {
                alert('Error generating PDF: ' + error.message);
            }
        });

        // Download Image Handler
        downloadImageButton.addEventListener('click', async () => {
            try {
                // Clone the preview element
                const clone = preview.cloneNode(true);
                clone.style.margin = '0';

                // Create a temporary container
                const tempContainer = document.createElement('div');
                tempContainer.style.position = 'absolute';
                tempContainer.style.left = '-9999px';
                tempContainer.appendChild(clone);
                document.body.appendChild(tempContainer);

                // Render the cloned element
                const canvas = await html2canvas(clone, {
                    backgroundColor: null,
                    scale: 2
                });

                const link = document.createElement('a');
                link.download = 'handwriting.png';
                link.href = canvas.toDataURL('image/png');
                link.click();

                // Clean up
                document.body.removeChild(tempContainer);
            } catch (error) {
                alert('Error generating image: ' + error.message);
            }
        });