import { initCanvas, addDataPoint, clearCanvas, spawnDemoParticles } from './canvas.js';

const scrapeBtn = document.getElementById('scrapeBtn');
const uiLayer = document.querySelector('.ui-layer');

// Start the animation loop
initCanvas();
spawnDemoParticles();

// Input Switching Logic
const inputTabsContainer = document.querySelector('.input-tabs');
const inputs = {
    url: document.getElementById('urlInput'),
    text: document.getElementById('textInput'),
    file: document.getElementById('fileInputContainer')
};
let activeType = 'url';

if (inputTabsContainer) {
    inputTabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-btn');
        if (!tab) return;

        e.preventDefault();

        // Update Tabs
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update Inputs
        const newType = tab.dataset.type;
        if (inputs[newType]) {
            activeType = newType;
            Object.values(inputs).forEach(el => {
                if (el) el.classList.add('hidden');
            });
            inputs[activeType].classList.remove('hidden');

            // Clear any existing tooltip when switching modes
            hideTooltip();
        }
    });
}

// File Input Name Update
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileName.textContent = e.target.files[0].name;
            fileName.style.color = '#fff';
        }
        hideTooltip();
    });
}

// Tooltip Clearing Logic
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip && !tooltip.classList.contains('hidden')) {
        tooltip.classList.add('hidden');
    }
}

if (inputs.url) inputs.url.addEventListener('focus', hideTooltip);
if (inputs.url) inputs.url.addEventListener('input', hideTooltip);
if (inputs.text) inputs.text.addEventListener('focus', hideTooltip);
if (inputs.text) inputs.text.addEventListener('input', hideTooltip);

scrapeBtn.addEventListener('click', async () => {
    // UI Feedback
    scrapeBtn.textContent = "Analyzing...";
    scrapeBtn.disabled = true;
    hideTooltip();

    // Ensure the UI stays in the analyzed state
    if (!uiLayer.classList.contains('analyzed')) {
        uiLayer.classList.add('analyzed');
    }

    try {
        let response;

        if (activeType === 'url') {
            const url = inputs.url.value;
            if (!url) throw new Error("Please enter a URL.");

            response = await fetch('/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
        } else if (activeType === 'text') {
            const text = inputs.text.value;
            if (!text) throw new Error("Please enter some text.");

            response = await fetch('/analyze_text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
        } else if (activeType === 'file') {
            const file = fileInput.files[0];
            if (!file) throw new Error("Please select a PDF file.");

            const formData = new FormData();
            formData.append('file', file);

            response = await fetch('/upload_pdf', {
                method: 'POST',
                body: formData
            });
        }

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Analysis failed");
        }

        const data = await response.json();

        // Reset and populate the canvas
        clearCanvas();

        if (data.items.length === 0) {
            showNoContentMessage();
        }

        data.items.forEach(item => {
            addDataPoint(item);
        });

    } catch (error) {
        console.error("Analysis error:", error);
        scrapeBtn.textContent = "Error";
        scrapeBtn.style.background = "#ff4500"; // Red for error

        // Show error in tooltip or a toast instead of alert
        const tooltip = document.getElementById('tooltip');
        tooltip.textContent = error.message;
        tooltip.classList.remove('hidden');
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';

        setTimeout(() => {
            tooltip.classList.add('hidden');
            scrapeBtn.textContent = "ANALYZE";
            scrapeBtn.style.background = "";
            scrapeBtn.disabled = false;
        }, 3000);

        uiLayer.classList.remove('analyzed');
    } finally {
        if (scrapeBtn.textContent === "Analyzing...") {
            scrapeBtn.textContent = "ANALYZE";
            scrapeBtn.disabled = false;
        }
    }
});

function showNoContentMessage() {
    const tooltip = document.getElementById('tooltip');
    tooltip.textContent = "No analyzable content found.";
    tooltip.classList.remove('hidden');
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';

    setTimeout(() => {
        tooltip.classList.add('hidden');
    }, 3000);
}
