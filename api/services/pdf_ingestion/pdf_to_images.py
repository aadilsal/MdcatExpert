import io
from typing import List
from PIL import Image

try:
    from pdf2image import convert_from_bytes
except ImportError:
    convert_from_bytes = None


def pdf_to_images(pdf_bytes: bytes, dpi: int = 300) -> List[Image.Image]:
    if convert_from_bytes is None:
        raise RuntimeError("pdf2image is required for PDF -> image conversion. Install via pip install pdf2image")

    try:
        images = convert_from_bytes(pdf_bytes, dpi=dpi, fmt="jpeg")
        return images
    except Exception as e:
        raise RuntimeError(f"Failed to convert PDF to images: {e}")
