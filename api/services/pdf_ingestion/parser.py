import re
from typing import List, Dict


def parse_questions_from_text(text: str) -> List[Dict[str, str]]:
    cleaned = text.replace('\r', '\n')
    lines = [line.strip() for line in cleaned.split('\n') if line.strip()]

    questions = []
    current = None

    def flush_current():
        nonlocal current
        if current is not None:
            if current.get('option_a') and current.get('option_b') and current.get('option_c') and current.get('option_d'):
                questions.append(current)
            current = None

    for line in lines:
        q_match = re.match(r'^(\d+)\.\s*(.+)$', line)
        if q_match:
            flush_current()
            current = {
                'number': int(q_match.group(1)),
                'question_text': q_match.group(2).strip(),
                'option_a': '',
                'option_b': '',
                'option_c': '',
                'option_d': '',
                'correct_option': ''
            }
            continue

        if current is None:
            continue

        opt_match = re.match(r'^[A-D](?:\.|\)|\s)\s*(.+)$', line, re.IGNORECASE)
        if opt_match:
            opt_label = line[0].upper()
            opt_text = opt_match.group(1).strip()
            current[f'option_{opt_label.lower()}'] = opt_text
            continue

        # Multi-line support: append to last filled field
        for opt in ['option_d', 'option_c', 'option_b', 'option_a']:
            if current.get(opt) and current[opt].endswith("...") is False:
                continue

        if current['question_text'] and not any(current[f'option_{o}'] == '' for o in ['a', 'b', 'c', 'd']):
            # nothing to do
            continue

        # If a question has long text split lines after the question and before options
        if current['question_text'] and not current['option_a']:
            current['question_text'] += ' ' + line

    flush_current()

    return questions
