import QRCode from "qrcode";

export async function createDocumentVerificationQrDataUrl(verificationUrl: string) {
  return QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 200,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}