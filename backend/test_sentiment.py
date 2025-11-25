from analyzer import analyze_emotion

texts = [
    "This is okay.",
    "I like this.",
    "This is bad.",
    "I am somewhat annoyed.",
    "I feel nothing.",
    "This is absolutely amazing!",
    "I hate this so much.",
    "It is what it is.",
    "I am slightly happy.",
    "This is a bit sad."
]

print(f"{'Text':<30} | {'Emotion':<10} | {'Score':<5} | {'Polarity':<5} | {'Subjectivity':<5}")
print("-" * 80)

for text in texts:
    result = analyze_emotion(text)
    print(f"{result['text']:<30} | {result['emotion']:<10} | {result['score']:.2f} | {result['polarity']:.2f} | {result['subjectivity']:.2f}")
