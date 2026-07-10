"use client";

import { useRef, useState } from "react";

export function SignatureInput({ defaultName }: { defaultName: string }) {
  const [method, setMethod] = useState<"TYPED" | "DRAWN" | "UPLOADED">("TYPED");
  const [drawn, setDrawn] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!; const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  }
  function start(event: React.PointerEvent<HTMLCanvasElement>) { drawing.current = true; const ctx = canvasRef.current!.getContext("2d")!; const p = point(event); ctx.beginPath(); ctx.moveTo(p.x,p.y); }
  function move(event: React.PointerEvent<HTMLCanvasElement>) { if(!drawing.current)return; const ctx=canvasRef.current!.getContext("2d")!; const p=point(event); ctx.lineWidth=3;ctx.lineCap="round";ctx.strokeStyle="#111827";ctx.lineTo(p.x,p.y);ctx.stroke();setDrawn(canvasRef.current!.toDataURL("image/png")); }
  function clear(){const canvas=canvasRef.current!;canvas.getContext("2d")!.clearRect(0,0,canvas.width,canvas.height);setDrawn("");}
  return <div className="mt-4 space-y-3"><input type="hidden" name="signatureMethod" value={method}/><input type="hidden" name="signatureData" value={drawn}/><div className="flex flex-wrap gap-4 text-sm">{(["TYPED","DRAWN","UPLOADED"] as const).map(value=><label key={value}><input type="radio" checked={method===value} onChange={()=>setMethod(value)} className="mr-2"/>{value.toLowerCase()}</label>)}</div><label className="block text-sm">Full legal name<input name="signatureText" defaultValue={defaultName} required className="mt-1 w-full rounded-lg border px-3 py-2"/></label>{method==="DRAWN"?<div><canvas ref={canvasRef} width={700} height={180} onPointerDown={start} onPointerMove={move} onPointerUp={()=>drawing.current=false} onPointerLeave={()=>drawing.current=false} className="h-36 w-full touch-none rounded-lg border bg-white"/><button type="button" onClick={clear} className="mt-1 text-xs font-bold">Clear drawing</button></div>:null}{method==="UPLOADED"?<label className="block text-sm">Upload PNG signature<input type="file" name="signatureFile" accept="image/png" required className="mt-1 block w-full text-sm"/></label>:null}</div>;
}
