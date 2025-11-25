import { initCanvas, addDataPoint, clearCanvas } from './canvas.js';

const scrapeBtn = document.getElementById('scrapeBtn');
const urlInput = document.getElementById('urlInput');

// Start the animation loop
initCanvas();

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

    try {
        // Call our backend API
        // Note: '/scrape' works because we're serving frontend from the same backend instance
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
    } finally {
        // Reset UI
        scrapeBtn.textContent = "Analyze";
        scrapeBtn.disabled = false;
    }
});
