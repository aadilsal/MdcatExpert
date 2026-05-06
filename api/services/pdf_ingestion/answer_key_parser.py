import re
from typing import Dict


def parse_answer_key(text: str) -> Dict[int, str]:
    # Find simple answer key formats: 1 A 2 B 3 C / 1: A, 2: B / A-1 etc.
    cleaned = text.replace('\r', ' ').replace('\n', ' ')
    answers: Dict[int, str] = {}

    for m in re.finditer(r'(\d+)\s*[:\-\.]?\s*([A-D])', cleaned, flags=re.IGNORECASE):
        num = int(m.group(1))
        choice = m.group(2).upper()
        answers[num] = choice

    # Alternate key style: A1, B2 etc (less common)
    for m in re.finditer(r'([A-D])\s*(\d+)', cleaned, flags=re.IGNORECASE):
        num = int(m.group(2))
        answer = m.group(1).upper()
        if num not in answers:
            answers[num] = answer

    return answers
