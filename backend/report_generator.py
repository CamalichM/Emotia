from fpdf import FPDF
from collections import Counter

class PDFReport(FPDF):
    """
    Custom PDF class inheriting from FPDF to handle header, footer, and custom layouts.
    """
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Emotia - Emotional Analysis Report', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        """Adds a styled chapter title."""
        self.set_font('Arial', 'B', 12)
        self.set_fill_color(200, 220, 255)
        self.cell(0, 6, title, 0, 1, 'L', 1)
        self.ln(4)

    def clean_text(self, text):
        """
        Aggressively cleans text to ensure compatibility with FPDF (Latin-1).
        Removes emojis and unsupported characters.
        """
        if not isinstance(text, str):
            return str(text)
        try:
            # Encode to latin-1, ignoring characters that can't be represented (like emojis)
            # This effectively "erases" them as requested.
            return text.encode('latin-1', 'ignore').decode('latin-1')
        except Exception:
            return ""

    def add_statistics(self, items):
        """
        Generates a statistics table showing the count and percentage of each emotion.
        """
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
            safe_emotion = self.clean_text(emotion)
            percentage = (count / total) * 100
            self.cell(60, 8, safe_emotion.capitalize(), 1)
            self.cell(40, 8, str(count), 1)
            self.cell(40, 8, f"{percentage:.1f}%", 1)
            self.ln()
        
        self.ln(10)

    def add_colored_text(self, items):
        """
        Writes the full analyzed text, coloring each sentence according to its emotion.
        """
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
            raw_text = item.get('text', '')
            
            # Clean the text
            text = self.clean_text(raw_text)
            if not text.strip():
                continue

            # Set color
            r, g, b = colors.get(emotion, (0, 0, 0))
            self.set_text_color(r, g, b)
            
            # Write text
            try:
                self.write(6, text + " ")
            except Exception:
                pass 
        
        # Reset color
        self.set_text_color(0, 0, 0)

def generate_report_pdf(items):
    """
    Orchestrates the PDF generation process.
    Returns the PDF content as bytes.
    """
    pdf = PDFReport()
    pdf.add_page()

    # 1. Statistics Section
    pdf.add_statistics(items)

    # 2. Colored Text Section
    pdf.add_colored_text(items)

    # Return the PDF as raw bytes
    # We use 'latin-1' encoding for the output string to get the raw bytes
    return pdf.output(dest="S").encode("latin-1", errors='ignore')
