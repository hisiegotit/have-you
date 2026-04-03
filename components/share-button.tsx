"use client";

import { useEffect, useState } from "react";
import { Copy, Link, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShareState {
  token: string;
  url: string;
  isActive: boolean;
}

export function ShareButton() {
  const [share, setShare] = useState<ShareState | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  useEffect(() => {
    fetch("/api/share/token")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setShare(data))
      .catch(() => null);
  }, []);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/share/token", { method: "POST" });
      const data = await res.json();
      setShare(data);
      toast.success("Share link generated");
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(isActive: boolean) {
    try {
      const res = await fetch("/api/share/token", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      setShare(data);
      toast.success(isActive ? "Sharing enabled" : "Sharing disabled");
    } catch {
      toast.error("Failed to update");
    }
  }

  async function copyUrl() {
    if (!share?.url) return;
    try {
      await navigator.clipboard.writeText(share.url);
      toast.success("Link copied!");
    } catch {
      toast.error("Copy failed — please copy manually");
    }
  }

  async function confirmRegenerate() {
    setRegenerateOpen(false);
    await generate();
  }

  if (!share) {
    return (
      <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
        <Link className="h-4 w-4 mr-2" />
        {loading ? "Generating…" : "Generate Share Link"}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 bg-muted max-w-xs truncate">
        <span className="truncate text-muted-foreground">{share.url}</span>
        <button onClick={copyUrl} className="shrink-0 hover:text-foreground cursor-pointer" aria-label="Copy link">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <Switch id="share-active" checked={share.isActive} onCheckedChange={toggleActive} />
        <Label htmlFor="share-active" className="text-sm">Active</Label>
      </div>

      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        {/* base-ui uses render prop instead of asChild */}
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate share link?</DialogTitle>
            <DialogDescription>
              The old link will stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={confirmRegenerate}>Regenerate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
