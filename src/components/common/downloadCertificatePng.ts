import { toBlob } from 'html-to-image';

export const downloadCertificatePng = async (
  element: HTMLElement,
  certificateId: string,
): Promise<void> => {
  await document.fonts.ready;

  const imageBlob = await toBlob(element, {
    backgroundColor: '#0f172a',
    cacheBust: true,
    pixelRatio: 2,
  });
  if (!imageBlob) throw new Error('Certificate PNG could not be generated.');

  const safeCertificateId = certificateId.replace(/[^a-zA-Z0-9._-]+/g, '_') || 'certificate';
  const imageUrl = URL.createObjectURL(imageBlob);
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `${safeCertificateId}.png`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(imageUrl);
  }, 1000);
};