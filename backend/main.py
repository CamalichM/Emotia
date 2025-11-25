from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

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

@app.get("/")
def read_root():
    return {"message": "Emotia Backend is running"}

@app.post("/scrape")
def scrape_endpoint(request: ScrapeRequest):
    return {"message": "Scrape endpoint not implemented yet", "url": request.url}

@app.get("/items")
def get_items():
    return {"items": []}
