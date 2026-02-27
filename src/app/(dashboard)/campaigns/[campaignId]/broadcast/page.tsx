"use client";

import { useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export default function BroadcastPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    sentCount: number;
    errorCount: number;
    total: number;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleSend() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    setConfirming(false);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send broadcast");
      }

      const data = await res.json();
      setResult(data);
      toast.success(`Sent to ${data.sentCount} participants`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send broadcast"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/campaigns/${campaignId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Send Broadcast</h1>
          <p className="text-muted-foreground">
            Email all participants of this campaign
          </p>
        </div>
      </div>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Broadcast Sent</CardTitle>
            <CardDescription>
              Successfully sent to {result.sentCount} of {result.total}{" "}
              participants
              {result.errorCount > 0 &&
                ` (${result.errorCount} failed)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setSubject("");
                setBody("");
              }}
            >
              Send Another
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              This email will be sent to every participant who played this
              campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g. New prizes available!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Message (HTML supported)</Label>
                <Textarea
                  id="body"
                  placeholder="Write your message here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSend}
                  disabled={loading || !subject.trim() || !body.trim()}
                  variant={confirming ? "destructive" : "default"}
                >
                  {loading ? (
                    "Sending..."
                  ) : confirming ? (
                    "Click again to confirm"
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Broadcast
                    </>
                  )}
                </Button>
                {confirming && (
                  <Button variant="outline" onClick={() => setConfirming(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
