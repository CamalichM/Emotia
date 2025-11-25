import { initCanvas, addDataPoint, clearCanvas, spawnDemoParticles } from './canvas.js';

/**
 * Main Application Logic
 * Handles UI interactions, API calls, and state management.
 */
window.addEventListener('load', () => {
    const scrapeBtn = document.getElementById('scrapeBtn');
    const uiLayer = document.querySelector('.ui-layer');

    // Initialize Canvas and Demo
    initCanvas();
    spawnDemoParticles();

    // --- Input Switching Logic ---
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
                hideTooltip();
            }
        });
    }

    // --- File Input Handling ---
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

    // --- Tooltip Logic ---
    function hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip && !tooltip.classList.contains('hidden')) {
            tooltip.classList.add('hidden');
        }
    }

    // Auto-hide tooltip on input interaction
    if (inputs.url) inputs.url.addEventListener('focus', hideTooltip);
    if (inputs.url) inputs.url.addEventListener('input', hideTooltip);
    if (inputs.text) inputs.text.addEventListener('focus', hideTooltip);
    if (inputs.text) inputs.text.addEventListener('input', hideTooltip);

    // --- Toast Notification System ---
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = '';
        if (type === 'error') icon = '⚠️';
        else if (type === 'success') icon = '✅';
        else icon = 'ℹ️';

        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        container.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 4000);
    }

    // --- Report Logic ---
    const viewReportBtn = document.getElementById('viewReportBtn');
    const reportModal = document.getElementById('reportModal');
    const closeReportBtn = document.getElementById('closeReportBtn');
    const reportStats = document.getElementById('reportStats');
    const reportText = document.getElementById('reportText');
    let currentAnalysisItems = [];

    // Close Modal Logic
    if (closeReportBtn && reportModal) {
        closeReportBtn.addEventListener('click', () => {
            reportModal.classList.add('hidden');
        });
        // Close on click outside
        reportModal.addEventListener('click', (e) => {
            if (e.target === reportModal) {
                reportModal.classList.add('hidden');
            }
        });
    }

    if (viewReportBtn) {
        viewReportBtn.addEventListener('click', () => {
            if (currentAnalysisItems.length === 0) {
                showToast("Run an analysis first.", "info");
                return;
            }

            // 1. Calculate Statistics
            const total = currentAnalysisItems.length;
            const counts = {};
            currentAnalysisItems.forEach(item => {
                const emotion = item.emotion || 'neutral';
                counts[emotion] = (counts[emotion] || 0) + 1;
            });

            // 2. Render Stats
            reportStats.innerHTML = '';
            // Sort by count descending
            Object.entries(counts)
                .sort(([, a], [, b]) => b - a)
                .forEach(([emotion, count]) => {
                    const percentage = ((count / total) * 100).toFixed(1);
                    const card = document.createElement('div');
                    card.className = 'stat-card';
                    card.innerHTML = `
                        <div class="stat-value" style="color: var(--glow-${emotion}, #fff)">${count}</div>
                        <div class="stat-label">${emotion} (${percentage}%)</div>
                    `;
                    // Add custom style for color if not using CSS vars for text
                    const colors = {
                        joy: '#ffd700', sadness: '#1e90ff', anger: '#ff4500',
                        fear: '#9d00ff', energy: '#00ff00', neutral: '#808080'
                    };
                    card.querySelector('.stat-value').style.color = colors[emotion] || '#fff';
                    reportStats.appendChild(card);
                });

            // 3. Render Colored Text
            reportText.innerHTML = '';
            const colors = {
                joy: '#ffd700', sadness: '#1e90ff', anger: '#ff4500',
                fear: '#9d00ff', energy: '#00ff00', neutral: '#808080'
            };

            currentAnalysisItems.forEach(item => {
                const span = document.createElement('span');
                span.textContent = item.text + ' ';
                span.className = 'colored-text-span';
                span.style.color = colors[item.emotion] || '#808080';
                span.title = `${item.emotion} (${(item.score * 100).toFixed(0)}%)`;
                reportText.appendChild(span);
            });

            // 4. Show Modal
            reportModal.classList.remove('hidden');
        });
    }

    // --- Analysis Logic ---
    if (scrapeBtn) {
        scrapeBtn.addEventListener('click', async () => {
            // UI Feedback
            scrapeBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
            scrapeBtn.disabled = true;
            if (viewReportBtn) viewReportBtn.classList.add('hidden');
            hideTooltip();

            // Transition UI to analyzed state
            if (!uiLayer.classList.contains('analyzed')) {
                uiLayer.classList.add('analyzed');
            }

            try {
                let response;

                // Handle different input types
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
                currentAnalysisItems = data.items; // Store for report

                // Reset and populate the canvas
                clearCanvas();

                if (data.items.length === 0) {
                    showToast("No analyzable content found.", "info");
                    if (viewReportBtn) viewReportBtn.classList.add('hidden');
                } else {
                    showToast(`Analysis complete! Found ${data.items.length} emotional points.`, "success");
                    if (viewReportBtn) viewReportBtn.classList.remove('hidden');
                }

                data.items.forEach(item => {
                    addDataPoint(item);
                });

            } catch (error) {
                console.error("Analysis error:", error);
                showToast(error.message, "error");
                currentAnalysisItems = [];
                if (viewReportBtn) viewReportBtn.classList.add('hidden');
            } finally {
                // Restore button state
                scrapeBtn.innerHTML = '<span class="btn-text">ANALYZE</span><div class="btn-glow"></div>';
                scrapeBtn.disabled = false;
            }
        });
    }
});
