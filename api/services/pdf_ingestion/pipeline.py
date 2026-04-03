import uuid
from typing import List, Dict, Tuple, Optional

from .pdf_to_images import pdf_to_images
from .preprocess import preprocess_image
from .ocr_engine import ocr_image
from .parser import parse_questions_from_text
from .answer_key_parser import parse_answer_key
from .subject_inference import infer_subject_from_text


def process_pdf_to_questions(pdf_bytes: bytes, year: Optional[int] = None) -> Tuple[List[Dict], List[int], str]:
    try:
        pages = pdf_to_images(pdf_bytes, dpi=300)
    except Exception as e:
        return [], [], str(e)

    if not pages:
        return [], [], "No pages extracted from PDF"

    all_questions = []
    parsed_answer_key = {}
    raw_text_pages = []

    for page in pages:
        processed = preprocess_image(page)
        text = ocr_image(processed)
        raw_text_pages.append(text)

        # Extract potential MCQs from the page
        parsed = parse_questions_from_text(text)
        if parsed:
            all_questions.extend(parsed)

    # Try answer key detection in full text
    combined_text = "\n".join(raw_text_pages)
    if combined_text:
        parsed_answer_key = parse_answer_key(combined_text)

    batch_id = str(uuid.uuid4())
    final_questions = []
    skipped = []

    for entry in all_questions:
        qnum = entry.get('number')
        question_text = entry.get('question_text', '').strip()
        option_a = entry.get('option_a', '').strip()
        option_b = entry.get('option_b', '').strip()
        option_c = entry.get('option_c', '').strip()
        option_d = entry.get('option_d', '').strip()

        if not question_text or not option_a or not option_b or not option_c or not option_d:
            skipped.append(qnum if qnum is not None else -1)
            continue

        correct = ''
        if entry.get('correct_option') and entry['correct_option'].upper() in ['A', 'B', 'C', 'D']:
            correct = entry['correct_option'].upper()
        elif qnum and qnum in parsed_answer_key:
            correct = parsed_answer_key[qnum]

        subject = infer_subject_from_text(' '.join([question_text, option_a, option_b, option_c, option_d]))

        final_questions.append({
            'batch_id': batch_id,
            'question_text': question_text,
            'option_a': option_a,
            'option_b': option_b,
            'option_c': option_c,
            'option_d': option_d,
            'correct_option': correct if correct in ['A', 'B', 'C', 'D'] else None,
            'subject': subject,
            'explanation': None,
            'year': year,
            'image_url': None,
            'status': 'pending'
        })

    if not final_questions:
        return [], skipped, "No valid MCQs detected in PDF. Please verify source quality and try again." 

    return final_questions, skipped, ""
