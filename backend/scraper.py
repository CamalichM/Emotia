import requests
from bs4 import BeautifulSoup
import re

def scrape_url(url: str):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
            
        text_elements = []
        
        # Extract text from paragraphs and headings
        for tag in soup.find_all(['p', 'h1', 'h2', 'h3', 'blockquote', 'li']):
            text = tag.get_text(strip=True)
            if len(text) > 20:  # Filter out very short snippets
                text_elements.append(text)
                
        # Limit to top 50 snippets to avoid overwhelming the visualizer
        return text_elements[:50]
        
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return []
