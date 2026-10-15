"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";

type SignatureMethod = "TYPED" | "DRAWN" | "UPLOADED";

export function SignatureInput({ defaultName, nameField = "signatureText", nameLabel = "Full legal name" }: {
  defaultName: string;
  nameField?: string;
  nameLabel?: string;
}) {
  const id = useId();
  const [method, setMethod] = useState<SignatureMethod>("DRAWN");
  const [drawn, setDrawn] = useState("");
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const form = canvas?.closest("form");
    function validate(event: SubmitEvent) {
      if (method === "DRAWN" && !drawn) {
        event.preventDefault();
        setError("Draw your signature below, or choose Type name or Upload PNG.");
        canvas?.focus();
      }
    }
    form?.addEventListener("submit", validate);
    return () => form?.removeEventListener("submit", validate);
  }, [method, drawn]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || event.button !== 0 || pointer.current !== null) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = event.pointerId;
    const p = point(event);
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setError("");
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== event.pointerId) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function finish(event: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    setDrawn(event.currentTarget.toDataURL("image/png"));
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function clear() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    pointer.current = null;
    setDrawn("");
    setError("");
  }
  return <div className="mt-4 min-w-0 space-y-4">
    <input type="hidden" name="signatureMethod" value={method} />
    <input type="hidden" name="signatureData" value={method === "DRAWN" ? drawn : ""} />
    <label className="block space-y-2 text-sm"><span>{nameLabel}</span><input name={nameField} defaultValue={defaultName} required maxLength={160} autoComplete="name" className="w-full rounded-xl border border-input bg-background p-3" /></label>
    <fieldset><legend className="mb-2 text-sm font-semibold">How would you like to sign?</legend><div className="flex flex-wrap gap-2">
      {([['DRAWN', 'Draw signature'], ['TYPED', 'Type name'], ['UPLOADED', 'Upload PNG']] as const).map(([value, label]) => <label key={value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${method === value ? 'border-primary bg-primary/10' : 'border-border'}`}><input type="radio" name={`${id}-method`} value={value} checked={method === value} onChange={() => { setMethod(value); setError(""); }} />{label}</label>)}
    </div></fieldset>
    <div hidden={method !== "DRAWN"}>
      <p id={`${id}-help`} className="mb-2 text-sm text-muted-foreground">Sign inside the box using your mouse, finger, or stylus.</p>
      <canvas ref={canvasRef} width={900} height={300} tabIndex={0} aria-label="Draw your signature" aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} aria-invalid={!!error} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish} className="block w-full touch-none rounded-xl border-2 border-dashed border-neutral-400 bg-white focus-visible:outline-2 focus-visible:outline-primary" style={{ aspectRatio: '3 / 1' }} />
      <div className="mt-2 flex items-center justify-between gap-3"><p role="status" className="text-xs text-muted-foreground">{drawn ? 'Signature ready to submit.' : 'Your signature will appear here.'}</p><button type="button" onClick={clear} className="min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold">Clear signature</button></div>
    </div>
    {method === "TYPED" ? <p className="rounded-xl border bg-muted/30 p-4 text-sm">Your full legal name above will be used as your electronic signature.</p> : null}
    {method === "UPLOADED" ? <label className="block space-y-2 text-sm"><span>Upload your signature (PNG, up to 256 KB)</span><input type="file" name="signatureFile" accept="image/png" required className="block w-full min-w-0 text-sm" /></label> : null}
    {error ? <p id={`${id}-error`} role="alert" className="text-sm text-red-600">{error}</p> : null}
  </div>;
}
