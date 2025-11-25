from textblob import TextBlob
import re
import logging
from langdetect import detect, LangDetectException
from deep_translator import GoogleTranslator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable for the model pipeline
emotion_classifier = None

try:
    from transformers import pipeline
    # Load the model. This will download it on the first run.
    # We use a smaller, faster model: j-hartmann/emotion-english-distilroberta-base
    logger.info("Loading AI Emotion Model...")
    emotion_classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", return_all_scores=True)
    logger.info("AI Emotion Model Loaded Successfully!")
except ImportError:
    logger.warning("Transformers library not found. Falling back to keyword/sentiment analysis.")
except Exception as e:
    logger.error(f"Failed to load AI model: {e}. Falling back to keyword/sentiment analysis.")

# Keyword Dictionaries (Fallback)
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
            if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                scores[emotion] += 1
                
    best_emotion = max(scores, key=scores.get)
    
    if scores[best_emotion] > 0:
        return best_emotion, 0.8 + (0.1 * min(scores[best_emotion], 2))
    return None, 0

def analyze_emotion(text: str):
    """
    Analyzes the sentiment of the text and maps it to a primary emotion.
    Automatically translates non-English text to English for analysis.
    Returns a dictionary with emotion label and intensity score.
    """
    original_text = text
    processing_text = text
    is_translated = False

    # 1. Auto-Translation
    try:
        if len(text.strip()) > 2:
            # GoogleTranslator with source='auto' handles detection better than langdetect
            translator = GoogleTranslator(source='auto', target='en')
            translated = translator.translate(text)
            
            if translated and translated.lower() != text.lower():
                processing_text = translated
                is_translated = True
                logger.info(f"Translated: '{text}' -> '{processing_text}'")
    except Exception as e:
        logger.warning(f"Translation failed: {e}")

    # 2. Try AI Model if available
    if emotion_classifier:
        try:
            # Model returns a list of lists of dicts
            results = emotion_classifier(processing_text)[0]
            # Sort by score descending
            results.sort(key=lambda x: x['score'], reverse=True)
            top_result = results[0]
            
            ai_emotion = top_result['label']
            ai_score = top_result['score']
            
            # Map model labels to our palette
            mapped_emotion = "neutral"
            if ai_emotion == "joy": mapped_emotion = "joy"
            elif ai_emotion == "sadness": mapped_emotion = "sadness"
            elif ai_emotion == "anger": mapped_emotion = "anger"
            elif ai_emotion == "fear": mapped_emotion = "fear"
            elif ai_emotion == "disgust": mapped_emotion = "anger"
            elif ai_emotion == "surprise": mapped_emotion = "energy"
            elif ai_emotion == "neutral": mapped_emotion = "neutral"
            
            return {
                "text": original_text,
                "emotion": mapped_emotion,
                "score": ai_score,
                "method": "ai_transformer",
                "is_translated": is_translated,
                "translated_text": processing_text if is_translated else None
            }
        except Exception as e:
            logger.error(f"AI Inference failed: {e}")
            # Fall through to fallback

    # 3. Fallback: Keyword Matching (on translated text)
    keyword_emotion, keyword_score = get_keyword_emotion(processing_text)
    if keyword_emotion:
        return {
            "text": original_text,
            "emotion": keyword_emotion,
            "score": keyword_score,
            "method": "keyword_fallback",
            "language": detected_lang
        }

    # 4. Fallback: TextBlob Sentiment (on translated text)
    blob = TextBlob(processing_text)
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
        emotion = "anger"
        score = subjectivity
    elif subjectivity > 0.6 and polarity > 0:
        emotion = "energy"
        score = subjectivity
    else:
        emotion = "neutral"
        score = 0.3
        
    return {
        "text": original_text,
        "emotion": emotion,
        "score": score,
        "polarity": polarity,
        "subjectivity": subjectivity,
        "method": "sentiment_fallback",
        "language": detected_lang
    }
