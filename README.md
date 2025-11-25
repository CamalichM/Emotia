# Emotia 🪐

**The emotional gravity of the web.**

Emotia isn't just a sentiment analyzer. It's a physics simulation for text.

We take articles, PDFs, or random thoughts and break them down into emotional particles. Then we throw them into a gravity well.

*   **Joy** clumps together like gold dust.
*   **Anger** is agitated and red.
*   **Fear** tries to run away from your mouse.
*   **Sadness** is heavy and sinks to the bottom.
*   **Energy** orbits frantically.

## What can it do?

*   **Visualize URLs**: Paste a link (like a news article) and see the emotional footprint.
*   **Analyze PDFs**: Upload a document and get a visual breakdown.
*   **Physics Interaction**: The particles react to your mouse. Play with them.
*   **Generate Reports**: Need hard data? Download a PDF report with stats and color-coded text.

## How to run it

It's a Python backend with a vanilla JS frontend. No complex build steps.

### 1. Backend
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend
Open `http://localhost:8000` in your browser. That's it.

## Tech Stack
*   **FastAPI**: For the heavy lifting and scraping.
*   **HTML5 Canvas**: For the pretty particles.
*   **FPDF**: For generating the reports.

---
*Built with 💜 by [Your Name/Handle]*
