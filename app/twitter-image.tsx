// The same card for X/Twitter, which asks for its own image. Route settings
// are declared here, not re-exported — Next.js only reads them literally.
import Image from './opengraph-image';

export const dynamic = 'force-static';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Halkhata — take daily orders ahead by QR and bill the counter crowd fast';
export default Image;
