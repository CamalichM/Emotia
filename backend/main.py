from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import io
from pypdf import PdfReader
from scraper import scrape_url
from analyzer import analyze_emotion
from report_generator import generate_report_pdf

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
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(current_dir, "../frontend")

app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

# --- Pydantic Models ---

class ScrapeRequest(BaseModel):
    url: Optional[str] = None

class TextRequest(BaseModel):
    text: str

class ReportItem(BaseModel):
    text: str
    emotion: str
    score: float
    method: Optional[str] = None
    polarity: Optional[float] = None
    subjectivity: Optional[float] = None

class ReportRequest(BaseModel):
    items: List[ReportItem]

# --- In-Memory Storage ---
# Simple storage for the current session. 
# In a production environment, replace this with Redis or a database.
items_db = []

# --- Endpoints ---

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
        
    snippets = scrape_url(url)
    if not snippets:
        raise HTTPException(status_code=400, detail="Could not retrieve content. The site might be blocking scrapers.")
        
    analyzed_items = [analyze_emotion(snippet) for snippet in snippets]
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
        
    # Simple splitting by newlines or periods.
    # For production, consider using a robust tokenizer like NLTK or SpaCy.
    snippets = [s.strip() for s in text.replace('.', '\n').split('\n') if len(s.strip()) > 2]
    
    if not snippets:
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
        
    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        reader = PdfReader(pdf_file)
        
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        # Split into snippets
        snippets = [s.strip() for s in text.replace('.', '\n').split('\n') if len(s.strip()) > 20]
        snippets = snippets[:50] # Limit to first 50 snippets for performance
        
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
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.get("/items")
def get_items():
    """Retrieve the currently stored analyzed items."""
    return {"items": items_db}

@app.post("/download_report")
async def download_report_endpoint(request: ReportRequest):
    """
    Generates a PDF report based on the provided analysis items.
    Returns the PDF as a streaming response.
    """
    try:
        if not request.items:
            raise HTTPException(status_code=400, detail="No analysis data provided for the report.")

        items_data = [item.dict() for item in request.items]
        
        # Generate PDF in-memory to avoid file permission issues
        pdf_content = generate_report_pdf(items_data)
        
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=emotia_report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
