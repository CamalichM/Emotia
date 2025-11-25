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

# Simple in-memory storage for the current session
items_db = []

@app.get("/")
async def read_index():
    """Serve the main frontend application."""
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.post("/scrape")
def scrape_endpoint(request: ScrapeRequest):
    global items_db
    url = request.url
    if not url:
        url = "https://news.ycombinator.com/"
        
    print(f"Processing URL: {url}")
    
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
    global items_db
    text = request.text
    if not text:
        raise HTTPException(status_code=400, detail="No text provided.")
        
    print(f"Processing Text Input (length: {len(text)})")
    
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
            
        snippets = [s.strip() for s in text.replace('.', '\n').split('\n') if len(s.strip()) > 20]
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
    return {"items": items_db}

@app.post("/download_report")
async def download_report_endpoint(request: ReportRequest):
    try:
        # Convert Pydantic models to dicts
        items_data = [item.dict() for item in request.items]
        
        # Generate PDF
        filename = "emotia_report.pdf"
        generate_report_pdf(items_data, filename)
        
        # Read file into memory
        with open(filename, "rb") as f:
            pdf_content = f.read()
            
        # Cleanup
        if os.path.exists(filename):
            os.remove(filename)
            
        # Return as stream
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=emotia_report.pdf"}
        )
    except Exception as e:
        print(f"Report Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
