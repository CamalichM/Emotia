import { initCanvas, addDataPoint, clearCanvas, spawnDemoParticles } from './canvas.js';

const scrapeBtn = document.getElementById('scrapeBtn');
const urlInput = document.getElementById('urlInput');
const uiLayer = document.querySelector('.ui-layer');

// Start the animation loop
initCanvas();
spawnDemoParticles();

scrapeBtn.addEventListener('click', async () => {
    const url = urlInput.value;

    // Basic validation
    if (!url) {
        alert("Please enter a URL to analyze.");
        return;
    }

    // UI Feedback
    scrapeBtn.textContent = "Analyzing...";
    scrapeBtn.disabled = true;
    uiLayer.classList.add('analyzed');

    try {
        // Call our backend API
        const response = await fetch('/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) throw new Error("Analysis failed");

        const data = await response.json();

        // Reset and populate the canvas
        clearCanvas();

        if (data.items.length === 0) {
            alert("No text content found on that page.");
        }

        data.items.forEach(item => {
            addDataPoint(item);
        });

    } catch (error) {
        console.error("Analysis error:", error);
        alert("Something went wrong. Please check if the backend is running.");
        uiLayer.classList.remove('analyzed'); // Revert UI on error
    } finally {
        // Reset UI
        scrapeBtn.textContent = "Analyze";
        scrapeBtn.disabled = false;
    }
});
