"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface DownloadPosterButtonProps {
  movieCount: number;
}

export function DownloadPosterButton({ movieCount }: DownloadPosterButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-poster", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate poster");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "have-you.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading || movieCount === 0}
      title={movieCount === 0 ? "Watch some movies first" : "Download poster PNG"}
    >
      <Download className="h-4 w-4 mr-2" />
      {loading ? "Generating…" : "Download Poster"}
    </Button>
  );
}
