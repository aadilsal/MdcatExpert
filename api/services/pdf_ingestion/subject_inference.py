from typing import Dict

KEYWORDS = {
    'bio': 'Biology',
    'biology': 'Biology',
    'biological': 'Biology',
    'chem': 'Chemistry',
    'chemistry': 'Chemistry',
    'physics': 'Physics',
    'phys': 'Physics',
    'english': 'English',
    'grammar': 'English',
    'comprehension': 'English'
}


def infer_subject_from_text(text: str) -> str:
    lowercase = text.lower()
    for key, subject in KEYWORDS.items():
        if key in lowercase:
            return subject
    return 'General'
