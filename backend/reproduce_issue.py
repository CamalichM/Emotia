import requests
import json

url = "http://localhost:8000/analyze_text"
payload = {
    "text": "I am happy today.\nEstoy muy triste.\nJe suis en colère.\nDas ist fantastisch!"
}

try:
    response = requests.post(url, json=payload)
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print("Items:")
    for item in data.get("items", []):
        print(f"- Text: '{item['text']}'")
        print(f"  Emotion: {item['emotion']}")
        print(f"  Language: {item.get('language', 'N/A')}")
        print(f"  Translated: {item.get('translated_text', 'N/A')}")
        print("---")
        
except Exception as e:
    print(f"Error: {e}")
