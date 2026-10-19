"use client";
import { useState } from "react";
export function OutdatedReportButton({ slug }: { slug: string }) {
  const [message, setMessage] = useState("");
  async function report() {
    const response = await fetch("/api/outdated-reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) });
    setMessage(response.ok ? "Thanks, this listing was flagged for review." : "Could not send report. Please try again later.");
  }
  return <span><button type="button" className="underline" onClick={report}>Report outdated</button>{message && <span role="status" className="ml-1">{message}</span>}</span>;
}
