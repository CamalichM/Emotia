from analyzer import analyze_emotion
import time

test_cases = [
    "I don't know what to do anymore.",  # AI should detect Sadness (keywords might miss)
    "Get out of my sight!",              # AI should detect Anger
    "I am actually terrified.",          # AI should detect Fear
    "This is absolutely wonderful!",     # AI should detect Joy
    "I am just sitting here."            # AI should detect Neutral
]

print("--- Verifying AI Emotion Model ---")
start_time = time.time()

for text in test_cases:
    print(f"\nAnalyzing: '{text}'")
    try:
        result = analyze_emotion(text)
        print(f" -> Emotion: {result['emotion']} (Score: {result['score']:.2f})")
        print(f" -> Method: {result.get('method', 'unknown')}")
    except Exception as e:
        print(f" -> ERROR: {e}")

print(f"\nTotal time: {time.time() - start_time:.2f}s")
