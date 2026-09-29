// Turns any photo the user picks into a small square JPEG (256x256, centered crop).
// Doing it in the browser keeps uploads tiny and strips EXIF/location data.

const MAX_INPUT_BYTES = 20 * 1024 * 1024;

export async function squareAvatarBlob(file, size = 256) {
  if (!file || file.size > MAX_INPUT_BYTES) throw new Error('too_big');

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('unreadable');
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f2233'; // background for transparent PNGs
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('unreadable'))),
      'image/jpeg',
      0.9
    );
  });
}

export function avatarErrorMessage(err) {
  if (err?.message === 'too_big' || err?.code === 'avatar_too_large' || err?.status === 413) {
    return 'That photo is too large. Try a smaller one.';
  }
  if (err?.message === 'unreadable' || err?.code === 'avatar_bad_type') {
    return "Couldn't read that image. Try a JPG, PNG or WebP.";
  }
  return "Couldn't save your photo. Please try again.";
}
