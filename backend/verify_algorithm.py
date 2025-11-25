from analyzer import analyze_emotion

test_cases = [
    "I am so scared of the dark.",       # Should be Fear
    "This makes me so mad!",             # Should be Anger
    "I am heartbroken.",                 # Should be Sadness
    "This is absolutely amazing!",       # Should be Joy/Energy
    "I am feeling okay.",                # Should be Neutral
    "I hate this stupid thing.",         # Should be Anger
    "I love this wonderful day."         # Should be Joy
]

print("--- Verifying Emotion Algorithm ---")
for text in test_cases:
    result = analyze_emotion(text)
    print(f"Text: '{text}' -> Emotion: {result['emotion']} (Method: {result.get('method', 'unknown')})")
