from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os
import io
from pypdf import PdfReader
from scraper import scrape_url
from analyzer import analyze_emotion

# Initialize the API
app = FastAPI(title="Emotia API", description="Backend for the Emotional Gravity Map")

# CORS configuration - allow all for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static file serving for the frontend
# This allows the backend to serve the entire app as a single unit
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(current_dir, "../frontend")

app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

class ScrapeRequest(BaseModel):
    url: Optional[str] = None

class TextRequest(BaseModel):
    text: str

# Simple in-memory storage for the current session
# In a production app, we'd use Redis or a proper DB
items_db = []

@app.get("/")
async def read_index():
    """Serve the main frontend application."""
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.post("/scrape")
def scrape_endpoint(request: ScrapeRequest):
    """
    Scrapes the given URL, analyzes emotions, and updates the session data.
    If no URL is provided, defaults to Hacker News for a quick demo.
    """
    global items_db
    url = request.url
    if not url:
        url = "https://news.ycombinator.com/"
        
    print(f"Processing URL: {url}")
    
    snippets = scrape_url(url)
    if not snippets:
        raise HTTPException(status_code=400, detail="Could not retrieve content. The site might be blocking scrapers.")
        
    # Analyze each snippet
    analyzed_items = [analyze_emotion(snippet) for snippet in snippets]
        
    # Refresh the session data
    items_db = analyzed_items
    
    return {
        "message": "Analysis complete", 
        "count": len(items_db), 
        "items": items_db
    }

@app.post("/analyze_text")
def analyze_text_endpoint(request: TextRequest):
    """
    Analyzes raw text input.
    Splits text into sentences/chunks and analyzes emotions.
    """
    global items_db
    text = request.text
    if not text:
        raise HTTPException(status_code=400, detail="No text provided.")
        
    print(f"Processing Text Input (length: {len(text)})")
    
    # Simple splitting by newlines or periods for now
    # In a real app, use a proper sentence tokenizer (nltk/spacy)
    snippets = [s.strip() for s in text.replace('.', '\n').split('\n') if len(s.strip()) > 2]
    
    if not snippets:
        # If splitting didn't work well, just use the whole text if it's short enough
        if len(text) > 2:
            snippets = [text]
        else:
            raise HTTPException(status_code=400, detail="Text too short to analyze.")

    analyzed_items = [analyze_emotion(snippet) for snippet in snippets]
    items_db = analyzed_items
    
    return {
        "message": "Analysis complete", 
        "count": len(items_db), 
        "items": items_db
    }

@app.post("/upload_pdf")
async def upload_pdf_endpoint(file: UploadFile = File(...)):
    """
    Parses a PDF file, extracts text, and analyzes emotions.
    """
    global items_db
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    print(f"Processing PDF: {file.filename}")
    
    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        reader = PdfReader(pdf_file)
        
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        # Split into snippets
        snippets = [s.strip() for s in text.replace('.', '\n').split('\n') if len(s.strip()) > 20]
        
        # Limit to first 50 snippets to avoid overwhelming the demo
        snippets = snippets[:50]
        
        if not snippets:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        analyzed_items = [analyze_emotion(snippet) for snippet in snippets]
        items_db = analyzed_items
        
        return {
            "message": "Analysis complete", 
            "count": len(items_db), 
            "items": items_db
        }
        
    except Exception as e:
        print(f"PDF Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.get("/items")
def get_items():
    """Retrieve the currently stored analyzed items."""
    return {"items": items_db}
