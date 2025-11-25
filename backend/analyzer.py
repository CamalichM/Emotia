from textblob import TextBlob
import random

def analyze_emotion(text: str):
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    # Simple heuristic mapping
    emotion = "neutral"
    score = 0.5
    
    if polarity > 0.3:
        emotion = "joy"
        score = polarity
    elif polarity < -0.3:
        emotion = "sadness"
        score = abs(polarity)
    elif subjectivity > 0.5 and polarity < 0:
        emotion = "anger"
        score = subjectivity
    elif subjectivity > 0.6 and polarity > 0:
        emotion = "energy"
        score = subjectivity
    else:
        emotion = "neutral"
        score = 0.1
        
    return {
        "text": text,
        "emotion": emotion,
        "score": score,
        "polarity": polarity,
        "subjectivity": subjectivity
    }
