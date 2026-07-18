"use client";
import { toast } from "sonner";
import { Card, MonoLabel } from "@/components/dashboard/ui";
import { CaptureBox } from "@/components/dashboard/brain/CaptureBox";

/** Frictionless capture → Brain inbox (shares Brain's addCapture via the provider). */
export function QuickCapture({ onCapture }: { onCapture: (text: string) => void }) {
  return (
    <Card className="h-full p-5">
      <MonoLabel>Quick capture</MonoLabel>
      <div className="mt-3">
        <CaptureBox
          compact
          placeholder="Capture a thought to Brain…"
          onCapture={(t) => {
            onCapture(t);
            toast.success("Captured to Brain");
          }}
        />
      </div>
    </Card>
  );
}
