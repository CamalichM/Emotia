from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os
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
        
    print(f"Processing: {url}")
    
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

@app.get("/items")
def get_items():
    """Retrieve the currently stored analyzed items."""
    return {"items": items_db}
