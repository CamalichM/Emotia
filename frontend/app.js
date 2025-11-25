import { initCanvas, addDataPoint, resetParticles } from './canvas.js';

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;

const scrapeBtn = document.getElementById('scrapeBtn');
const urlInput = document.getElementById('urlInput');
const statusMessage = document.getElementById('statusMessage');
const itemCount = document.getElementById('itemCount');
const itemsList = document.getElementById('itemsList');

initCanvas();

scrapeBtn.addEventListener('click', handleScrape);
urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleScrape();
    }
});

function setStatus(message, tone = 'info') {
    statusMessage.textContent = message;
    statusMessage.dataset.tone = tone;
}

function setLoading(isLoading) {
    scrapeBtn.disabled = isLoading;
    scrapeBtn.textContent = isLoading ? 'Analyzing…' : 'Analyze';
}

function renderItems(items) {
    itemCount.textContent = `${items.length} items`;
    itemsList.innerHTML = '';

    items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'item-card';

        const badge = document.createElement('span');
        badge.className = `badge badge-${item.emotion}`;
        badge.textContent = item.emotion;

        const title = document.createElement('p');
        title.className = 'item-text';
        title.textContent = item.text;

        const score = document.createElement('span');
        score.className = 'score';
        score.textContent = `${Math.round(item.score * 100)}% intensity`;

        card.appendChild(badge);
        card.appendChild(title);
        card.appendChild(score);
        itemsList.appendChild(card);
    });
}

async function handleScrape() {
    const url = urlInput.value.trim();
    setLoading(true);
    setStatus('Analyzing emotions…', 'info');
    resetParticles();
    renderItems([]);

    try {
        const response = await fetch(`${API_BASE}/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(url ? { url } : {}),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const message = errorBody.detail || 'Unable to analyze that URL. Please try another link.';
            throw new Error(message);
        }

        const data = await response.json();
        const items = data.items || [];

        if (!items.length) {
            throw new Error('No readable content was found for that URL.');
        }

        items.forEach((item) => addDataPoint(item));
        renderItems(items);
        setStatus(`Analyzed ${items.length} snippets from ${url || 'a curated source'}.`, 'success');
    } catch (error) {
        console.error(error);
        setStatus(error.message || 'Something went wrong. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}
