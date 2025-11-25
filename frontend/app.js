import { initCanvas, addDataPoint } from './canvas.js';

const scrapeBtn = document.getElementById('scrapeBtn');
const urlInput = document.getElementById('urlInput');

initCanvas();

scrapeBtn.addEventListener('click', async () => {
    const url = urlInput.value;
    if (!url) return;

    console.log(`Scraping ${url}...`);
    // Placeholder for API call
    // const response = await fetch('http://localhost:8000/scrape', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ url })
    // });
    // const data = await response.json();

    // Mock data for now
    addDataPoint({ text: "This is a joyful test!", emotion: "joy", score: 0.9 });
    addDataPoint({ text: "I am feeling a bit sad.", emotion: "sadness", score: 0.8 });
    addDataPoint({ text: "This makes me angry!", emotion: "anger", score: 0.95 });
});
