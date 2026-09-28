// The same card for X/Twitter, which asks for its own image. Route settings
// are declared here, not re-exported — Next.js only reads them literally.
import Image, { generateStaticParams } from './opengraph-image';

export const dynamic = 'force-static';
export const dynamicParams = false;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Halkhata — QR orders, khata and billing for local shops';
export { generateStaticParams };
export default Image;
