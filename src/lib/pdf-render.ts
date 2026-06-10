import { encode as encodeJpeg } from "jpeg-js";
import { getDocument, OPS, type PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_OCR_WIDTH = 1400;

type BitmapImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  kind?: number;
};

async function extractLargestEmbeddedImage(page: PDFPageProxy): Promise<BitmapImage | null> {
  const ops = await page.getOperatorList();
  let best: BitmapImage | null = null;
  let bestPixels = 0;

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    if (fn !== OPS.paintImageXObject && fn !== OPS.paintXObject) continue;

    const name = ops.argsArray[i][0];
    const img = (await page.objs.get(name)) as {
      width?: number;
      height?: number;
      data?: Uint8ClampedArray;
      kind?: number;
    } | null;

    if (!img?.data || !img.width || !img.height) continue;
    const pixels = img.width * img.height;
    if (pixels > bestPixels) {
      bestPixels = pixels;
      best = { width: img.width, height: img.height, data: img.data, kind: img.kind };
    }
  }

  return best;
}

const RGB_24BPP = 2;

function toRgba(image: BitmapImage): Uint8Array {
  const { width, height, data, kind } = image;
  const rgba = new Uint8Array(width * height * 4);
  const bytesPerPixel = kind === RGB_24BPP ? 3 : 4;

  for (let i = 0, j = 0; j < rgba.length; i += bytesPerPixel, j += 4) {
    rgba[j] = data[i];
    rgba[j + 1] = data[i + 1];
    rgba[j + 2] = data[i + 2];
    rgba[j + 3] = bytesPerPixel === 4 ? data[i + 3] : 255;
  }

  return rgba;
}

function downscaleRgba(image: BitmapImage, maxWidth: number): BitmapImage {
  const rgba = toRgba(image);
  if (image.width <= maxWidth) {
    return { width: image.width, height: image.height, data: new Uint8ClampedArray(rgba) };
  }

  const scale = maxWidth / image.width;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    const srcY = Math.min(image.height - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x++) {
      const srcX = Math.min(image.width - 1, Math.floor(x / scale));
      const srcIdx = (srcY * image.width + srcX) * 4;
      const dstIdx = (y * width + x) * 4;
      data[dstIdx] = rgba[srcIdx];
      data[dstIdx + 1] = rgba[srcIdx + 1];
      data[dstIdx + 2] = rgba[srcIdx + 2];
      data[dstIdx + 3] = 255;
    }
  }

  return { width, height, data };
}

function bitmapToJpeg(image: BitmapImage): Buffer {
  const resized = downscaleRgba(image, MAX_OCR_WIDTH);
  const rgba = new Uint8Array(resized.data);

  const encoded = encodeJpeg(
    { data: rgba, width: resized.width, height: resized.height },
    80,
  );
  return Buffer.from(encoded.data);
}

export async function renderPdfPageToJpeg(pdfBuffer: Buffer, pageNumber: number): Promise<Buffer> {
  const doc = await getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
  }).promise;
  const page = await doc.getPage(pageNumber);
  const embedded = await extractLargestEmbeddedImage(page);
  if (!embedded) {
    throw new Error(`Page ${pageNumber} has no embedded image to OCR`);
  }
  return bitmapToJpeg(embedded);
}
