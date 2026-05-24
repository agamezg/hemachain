"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QRVerifyCodeProps {
  /** Absolute URL the QR resolves to (printed on the blood unit / certificate). */
  url: string;
  size?: number;
}

/**
 * Renders a scannable QR pointing at a public verification URL. Kept generic so
 * Phase 6's `/verify/[id]` reuses it for blood units. White padding ensures the
 * code stays scannable in dark mode.
 */
export function QRVerifyCode({ url, size = 168 }: QRVerifyCodeProps) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(url, {
      type: "svg",
      margin: 1,
      width: size,
      errorCorrectionLevel: "M",
    })
      .then((s) => {
        if (!cancelled) setSvg(s);
      })
      .catch(() => {
        if (!cancelled) setSvg("");
      });
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  return (
    <div
      className="rounded-xl bg-white p-2 shadow-sm [&>svg]:h-full [&>svg]:w-full"
      style={{ width: size, height: size }}
      // SVG generated locally from a same-origin URL we control.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
