from textblob import TextBlob
import re

# Keyword Dictionaries
KEYWORDS = {
    "joy": [
        "happy", "delight", "awesome", "great", "love", "wonderful", "fantastic", 
        "good", "smile", "laugh", "fun", "excellent", "beautiful", "glad", "joy"
    ],
    "sadness": [
        "sad", "cry", "grief", "sorrow", "unhappy", "depressed", "heartbroken", 
        "tear", "bad", "loss", "miss", "pain", "hurt", "lonely", "down"
    ],
    "anger": [
        "mad", "furious", "hate", "angry", "rage", "annoyed", "irritated", 
        "stupid", "idiot", "terrible", "horrible", "awful", "worst", "sucks"
    ],
    "fear": [
        "scared", "afraid", "fear", "panic", "nervous", "anxious", "terrified", 
        "worry", "worried", "horror", "frightened", "danger", "threat"
    ],
    "energy": [
        "wow", "amazing", "excited", "energy", "fast", "go", "win", "victory", 
        "pumped", "hype", "crazy", "wild", "boom", "power", "strong"
    ]
}

def get_keyword_emotion(text: str):
    """
    Checks for the presence of emotion keywords.
    Returns the emotion with the highest match count, or None.
    """
    text_lower = text.lower()
    scores = {emotion: 0 for emotion in KEYWORDS}
    
    for emotion, words in KEYWORDS.items():
        for word in words:
            # Simple word boundary check to avoid partial matches (e.g. 'mad' in 'made')
            if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                scores[emotion] += 1
                
    # Find the emotion with the max score
    best_emotion = max(scores, key=scores.get)
    
    if scores[best_emotion] > 0:
        return best_emotion, 0.8 + (0.1 * min(scores[best_emotion], 2)) # Base score 0.8, max 1.0
    return None, 0

def analyze_emotion(text: str):
    """
    Analyzes the sentiment of the text and maps it to a primary emotion.
    Returns a dictionary with emotion label and intensity score.
    """
    # 1. Try Keyword Matching First
    keyword_emotion, keyword_score = get_keyword_emotion(text)
    if keyword_emotion:
        return {
            "text": text,
            "emotion": keyword_emotion,
            "score": keyword_score,
            "method": "keyword"
        }

    # 2. Fallback to TextBlob Sentiment Analysis
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    emotion = "neutral"
    score = 0.5
    
    if polarity > 0.3:
        emotion = "joy"
        score = polarity
    elif polarity < -0.3:
        emotion = "sadness"
        score = abs(polarity)
    elif subjectivity > 0.6 and polarity < 0:
        # High subjectivity + negative often implies anger
        emotion = "anger"
        score = subjectivity
    elif subjectivity > 0.6 and polarity > 0:
        # High subjectivity + positive often implies excitement/energy
        emotion = "energy"
        score = subjectivity
    else:
        emotion = "neutral"
        score = 0.3
        
    return {
        "text": text,
        "emotion": emotion,
        "score": score,
        "polarity": polarity,
        "subjectivity": subjectivity,
        "method": "sentiment"
    }
