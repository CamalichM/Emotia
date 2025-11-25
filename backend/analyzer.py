from textblob import TextBlob

def analyze_emotion(text: str):
    """
    Analyzes the sentiment of the text and maps it to a primary emotion.
    Returns a dictionary with emotion label and intensity score.
    """
    blob = TextBlob(text)
    
    # TextBlob gives us polarity (-1 to 1) and subjectivity (0 to 1)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    # Map these metrics to our emotion palette
    # This is a heuristic approach; a transformer model would be more accurate 
    # but much heavier to run locally.
    emotion = "neutral"
    score = 0.5
    
    if polarity > 0.3:
        emotion = "joy"
        score = polarity
    elif polarity < -0.3:
        emotion = "sadness"
        score = abs(polarity)
    elif subjectivity > 0.5 and polarity < 0:
        # High subjectivity + negative often implies anger or frustration
        emotion = "anger"
        score = subjectivity
    elif subjectivity > 0.6 and polarity > 0:
        # High subjectivity + positive often implies excitement/energy
        emotion = "energy"
        score = subjectivity
    else:
        emotion = "neutral"
        score = 0.2
        
    return {
        "text": text,
        "emotion": emotion,
        "score": score,
        # Keep raw metrics for debugging if needed
        "polarity": polarity,
        "subjectivity": subjectivity
    }
