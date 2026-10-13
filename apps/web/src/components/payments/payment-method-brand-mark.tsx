import Image from "next/image";

const BRAND_IMAGE_BY_METHOD: Record<string, string> = {
  "mpesa-stk": "/images/payment-brands/mpesa.svg",
  "manual-mpesa": "/images/payment-brands/mpesa.svg",
  mpesa: "/images/payment-brands/mpesa.svg",
  "airtel-money": "/images/payment-brands/airtel-money.ico",
  kcb: "/images/payment-brands/kcb.png",
  equity: "/images/payment-brands/equity.png",
  coop: "/images/payment-brands/coop.jpg",
  absa: "/images/payment-brands/absa.png",
  stanbic: "/images/payment-brands/stanbic.png",
  ncba: "/images/payment-brands/ncba.svg",
  family: "/images/payment-brands/family.png",
  "i-and-m": "/images/payment-brands/i-and-m.png",
  dtb: "/images/payment-brands/dtb.png",
  "standard-chartered": "/images/payment-brands/standard-chartered.png",
  prime: "/images/payment-brands/prime.png",
  sidian: "/images/payment-brands/sidian.png",
  kingdom: "/images/payment-brands/kingdom.png",
  "gulf-african": "/images/payment-brands/gulf-african.png",
  ecobank: "/images/payment-brands/ecobank.jpg",
  "credit-bank": "/images/payment-brands/credit-bank.png",
  uba: "/images/payment-brands/uba.png",
  spire: "/images/payment-brands/spire.png",
};

const BRAND_FALLBACK_BY_METHOD: Record<string, string> = {
  "manual-bank": "BANK",
};

type PaymentMethodBrandMarkProps = {
  methodId: string;
  className?: string;
};

/** Locally bundled provider branding; names beside each mark provide the accessible label. */
export function PaymentMethodBrandMark({
  methodId,
  className = "",
}: PaymentMethodBrandMarkProps) {
  const imageSrc = BRAND_IMAGE_BY_METHOD[methodId];
  const fallback = BRAND_FALLBACK_BY_METHOD[methodId];

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-slate-200/80 bg-white shadow-sm dark:border-white/10 ${className}`}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          width={128}
          height={128}
          unoptimized
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <span className="px-1 text-center text-[10px] font-bold leading-tight tracking-wide text-slate-700">
          {fallback ?? "BANK"}
        </span>
      )}
    </span>
  );
}
