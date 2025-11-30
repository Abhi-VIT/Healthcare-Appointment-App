/* ========================================
   PRESCRIPTION SCANNER - JAVASCRIPT
   OCR-powered medicine extraction
   ======================================== */

// State
let uploadedImage = null;
let worker = null;

// Initialize Tesseract Worker
async function initializeOCR() {
    worker = await Tesseract.createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializeOCR();
});

// ========================================
//EVENT LISTENERS
// ========================================
function initializeEventListeners() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('prescription-upload');
    const scanBtn = document.getElementById('scan-btn');
    const scanAnotherBtn = document.getElementById('scan-another');

    // Click to upload
    uploadArea.addEventListener('click', () => fileInput.click());

    // File selection
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Scan button
    scanBtn.addEventListener('click', scanPrescription);

    // Scan another
    scanAnotherBtn.addEventListener('click', resetScanner);
}

// ========================================
// FILE HANDLING
// ========================================
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    }
}

function processFile(file) {
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }

    // Read and display preview
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = e.target.result;
        showPreview(uploadedImage);
    };
    reader.readAsDataURL(file);
}

function showPreview(imageSrc) {
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('preview-image');

    previewImage.src = imageSrc;
    previewContainer.classList.add('active');

    // Hide upload area
    document.getElementById('upload-area').style.display = 'none';
}

// ========================================
// OCR PROCESSING
// ========================================
async function scanPrescription() {
    if (!uploadedImage) return;

    // Show progress
    document.getElementById('preview-container').style.display = 'none';
    const progressDiv = document.getElementById('scan-progress');
    const progressText = document.getElementById('progress-text');
    progressDiv.classList.add('active');

    try {
        // Perform OCR
        progressText.textContent = 'Reading prescription...';
        const { data: { text } } = await worker.recognize(uploadedImage);

        // Extract medicine names
        progressText.textContent = 'Extracting medicine names...';
        const medicines = extractMedicineNames(text);

        // Display results
        progressDiv.classList.remove('active');
        displayResults(medicines);

    } catch (error) {
        console.error('OCR Error:', error);
        progressText.textContent = 'Error processing image. Please try again.';
        setTimeout(() => {
            progressDiv.classList.remove('active');
            document.getElementById('preview-container').style.display = 'block';
        }, 2000);
    }
}

function extractMedicineNames(text) {
    const medicines = [];
    const lines = text.split('\n');

    // Common medicine patterns
    const medicinePatterns = [
        /\b[A-Z][a-z]+(?:zole|cillin|mycin|floxacin|pril|olol|azole|pine|stat|tin|fen|dine)\b/g,  // Common suffixes
        /\b(?:Tab|Tablet|Cap|Capsule|Syrup|Inj|Injection)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,     // Preceded by dosage form
        /\b[A-Z]{2,}(?:\s+[A-Z]+)?(?:\s+\d+(?:mg|mcg|ml|g))?/g                                      // All caps (brand names)
    ];

    lines.forEach(line => {
        medicinePatterns.forEach(pattern => {
            const matches = line.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Clean up the match
                    let medicine = match.replace(/^(Tab|Tablet|Cap|Capsule|Syrup|Inj|Injection)\s+/i, '').trim();

                    // Filter out common non-medicine words
                    const excludeWords = ['PATIENT', 'NAME', 'AGE', 'DATE', 'DOCTOR', 'SIGNATURE', 'ADDRESS', 'PHONE'];
                    if (!excludeWords.includes(medicine.toUpperCase()) && medicine.length > 2 && medicine.length < 30) {
                        if (!medicines.includes(medicine)) {
                            medicines.push(medicine);
                        }
                    }
                });
            }
        });
    });

    return medicines.slice(0, 20); // Limit to 20 results
}

// ========================================
// RESULTS DISPLAY
// ========================================
function displayResults(medicines) {
    const resultsContainer = document.getElementById('results-container');
    const medicineGrid = document.getElementById('medicine-grid');

    // Clear previous results
    medicineGrid.innerHTML = '';

    if (medicines.length === 0) {
        medicineGrid.innerHTML = `
            <div class="no-results">
                <p>No medicines detected. Please ensure the prescription is clear and try again.</p>
            </div>
        `;
    } else {
        medicines.forEach(medicine => {
            const card = createMedicineCard(medicine);
            medicineGrid.appendChild(card);
        });
    }

    resultsContainer.classList.add('active');
}

function createMedicineCard(medicineName) {
    const card = document.createElement('a');
    card.className = 'medicine-card';
    card.href = `https://pharmeasy.in/search/all?name=${encodeURIComponent(medicineName)}`;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    card.innerHTML = `
        <svg class="medicine-icon" viewBox="0 0 24 24">
            <path d="M20.54 3.46a5 5 0 0 0-7.07 0L3.46 13.46a5 5 0 0 0 0 7.07 5 5 0 0 0 7.07 0L20.54 10.54a5 5 0 0 0 0-7.08zM6.24 19.88a3 3 0 0 1-4.24-4.24l6.53-6.53 4.24 4.24-6.53 6.53zm13.66-9.34L13.24 17.2 9 12.95l6.66-6.66a3 3 0 0 1 4.24 4.24z"/>
        </svg>
        <div class="medicine-name">${medicineName}</div>
        <div class="medicine-link-text">Click to buy on PharmEasy →</div>
    `;

    return card;
}

// ========================================
// RESET
// ========================================
function resetScanner() {
    uploadedImage = null;

    // Hide results and preview
    document.getElementById('results-container').classList.remove('active');
    document.getElementById('preview-container').classList.remove('active');
    document.getElementById('scan-progress').classList.remove('active');

    // Show upload area
    document.getElementById('upload-area').style.display = 'block';

    // Clear file input
    document.getElementById('prescription-upload').value = '';
}

// Cleanup on page unload
window.addEventListener('beforeunload', async () => {
    if (worker) {
        await worker.terminate();
    }
});
