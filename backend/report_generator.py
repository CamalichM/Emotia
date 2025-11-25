from fpdf import FPDF
from collections import Counter

class PDFReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Emotia - Emotional Analysis Report', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.set_fill_color(200, 220, 255)
        self.cell(0, 6, title, 0, 1, 'L', 1)
        self.ln(4)

    def chapter_body(self, body):
        self.set_font('Arial', '', 12)
        self.multi_cell(0, 10, body)
        self.ln()

    def add_statistics(self, items):
        emotions = [item['emotion'] for item in items]
        counts = Counter(emotions)
        total = len(items)

        self.chapter_title('Analysis Statistics')
        self.set_font('Arial', '', 11)
        
        self.cell(0, 8, f"Total Sentences Analyzed: {total}", 0, 1)
        self.ln(2)

        # Table Header
        self.set_font('Arial', 'B', 11)
        self.cell(60, 8, "Emotion", 1)
        self.cell(40, 8, "Count", 1)
        self.cell(40, 8, "Percentage", 1)
        self.ln()

        # Table Rows
        self.set_font('Arial', '', 11)
        for emotion, count in counts.most_common():
            percentage = (count / total) * 100
            self.cell(60, 8, emotion.capitalize(), 1)
            self.cell(40, 8, str(count), 1)
            self.cell(40, 8, f"{percentage:.1f}%", 1)
            self.ln()
        
        self.ln(10)

    def add_colored_text(self, items):
        self.chapter_title('Detailed Analysis')
        self.set_font('Arial', '', 11)

        # Define colors (RGB)
        colors = {
            'joy': (255, 215, 0),       # Gold
            'sadness': (30, 144, 255),  # DodgerBlue
            'anger': (255, 69, 0),      # RedOrange
            'fear': (157, 0, 255),      # Purple
            'energy': (0, 255, 0),      # Lime
            'neutral': (128, 128, 128)  # Gray
        }

        for item in items:
            emotion = item.get('emotion', 'neutral')
            text = item.get('text', '')
            
            # Sanitize text for FPDF (Latin-1 only)
            # Replace unsupported characters (like emojis) with '?'
            try:
                text = text.encode('latin-1', 'replace').decode('latin-1')
            except Exception:
                text = "[Complex text removed]"

            # Set color
            r, g, b = colors.get(emotion, (0, 0, 0))
            self.set_text_color(r, g, b)
            
            # Write text
            try:
                self.write(6, text + " ")
            except Exception as e:
                print(f"PDF Write Error: {e}")
        
        # Reset color
        self.set_text_color(0, 0, 0)

def generate_report_pdf(items, filename="report.pdf"):
    pdf = PDFReport()
    pdf.add_page()
    
    # 1. Statistics Section
    pdf.add_statistics(items)
    
    # 2. Colored Text Section
    pdf.add_colored_text(items)
    
    pdf.output(filename)
    return filename
