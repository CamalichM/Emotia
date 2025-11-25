from report_generator import generate_report_pdf
import sys

items = [
    {"text": "Hello World", "emotion": "joy"},
    {"text": "I am sad 😢", "emotion": "sadness"},
    {"text": "Complex unicode: ñ, á, é, í, ó, ú, ü", "emotion": "neutral"},
    {"text": "More complex: — “ ” ‘ ’", "emotion": "anger"},
    {"text": "Even the emotion has unicode", "emotion": "joy 🌟"}
]

try:
    print("Attempting to generate PDF in-memory...")
    pdf_content = generate_report_pdf(items)
    print(f"PDF generated successfully. Size: {len(pdf_content)} bytes")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
