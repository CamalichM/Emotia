from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from scraper import scrape_url
from analyzer import analyze_emotion

app = FastAPI(title="Emotia API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    url: Optional[str] = None

# In-memory storage
items_db = []

@app.get("/")
def read_root():
    return {"message": "Emotia Backend is running"}

@app.post("/scrape")
def scrape_endpoint(request: ScrapeRequest):
    global items_db
    url = request.url
    if not url:
        # Default URL if none provided
        url = "https://news.ycombinator.com/"
        
    print(f"Scraping {url}...")
    snippets = scrape_url(url)
    
    if not snippets:
        raise HTTPException(status_code=400, detail="Could not scrape content from URL")
        
    analyzed_items = []
    for snippet in snippets:
        item = analyze_emotion(snippet)
        analyzed_items.append(item)
        
    # Update DB (replace or append? Let's replace for now to keep it clean per session)
    items_db = analyzed_items
    
    return {"message": "Scraping successful", "count": len(items_db), "items": items_db}

@app.get("/items")
def get_items():
    return {"items": items_db}
