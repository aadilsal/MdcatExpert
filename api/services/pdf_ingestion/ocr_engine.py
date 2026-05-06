import pytesseract
import numpy as np


def ocr_image(image_array: np.ndarray) -> str:
    if not hasattr(pytesseract, 'image_to_string'):
        raise RuntimeError("pytesseract is required for OCR. Install via pip install pytesseract")

    config = "--oem 3 --psm 6 -l eng"

    try:
        text = pytesseract.image_to_string(image_array, config=config)
        return text
    except Exception as e:
        raise RuntimeError(f"OCR extraction failed: {e}")
