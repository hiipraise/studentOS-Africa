"use client";

import { useEffect } from "react";
import { resolveReview } from "../actions";

export function ReviewActions({ id }: { id: string }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const active = document.activeElement?.closest("[data-review-id]");
      if (active?.getAttribute("data-review-id") !== id) return;
      if (event.key.toLowerCase() === "a") void resolveReview(id, "approve");
      if (event.key.toLowerCase() === "r") { const reason = window.prompt("Reason for rejection?"); if (reason !== null) void resolveReview(id, "reject", reason); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [id]);
  return <div className="flex gap-2"><button type="button" onClick={() => void resolveReview(id, "approve")} className="rounded bg-emerald-700 px-3 py-1 text-white">Approve (A)</button><button type="button" onClick={() => { const reason = window.prompt("Reason for rejection?"); if (reason !== null) void resolveReview(id, "reject", reason); }} className="rounded border px-3 py-1">Reject (R)</button></div>;
}
