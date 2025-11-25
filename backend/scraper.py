import re
import requests
from bs4 import BeautifulSoup

def _split_into_sentences(text: str):
    """Break long text into bite-sized sentences for better visualization."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [sentence.strip() for sentence in sentences if len(sentence.strip()) > 20]


def scrape_url(url: str):
    """
    Fetches the URL and extracts meaningful text snippets.
    Returns a list of strings.
    """
    try:
        # Mimic a real browser to avoid basic bot detection
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Clean up the DOM - remove non-content elements
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()
            
        text_elements = []
        seen = set()
        
        # Target likely content containers
        # We want meaningful chunks of text, not just menu items
        targets = ['p', 'h1', 'h2', 'h3', 'blockquote', 'li', 'article']
        
        for tag in soup.find_all(targets):
            text = tag.get_text(" ", strip=True)

            # Filter out noise: very short strings are usually navigation or UI labels
            if len(text) <= 15:
                continue

            # Split very long paragraphs into sentences to create more data points
            if len(text) > 180:
                sentences = _split_into_sentences(text)
                for sentence in sentences:
                    if sentence not in seen:
                        text_elements.append(sentence)
                        seen.add(sentence)
            else:
                if text not in seen:
                    text_elements.append(text)
                    seen.add(text)
                
        # Return a manageable subset to keep the visualization performant
        return text_elements[:80]
        
    except Exception as e:
        print(f"Scraping failed for {url}: {e}")
        return []
