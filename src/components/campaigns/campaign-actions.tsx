"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Power, PowerOff, Trash2 } from "lucide-react";
import { toggleCampaignActive, deleteCampaign } from "@/app/(dashboard)/campaigns/actions";
import { toast } from "sonner";

export function CampaignActions({
  campaignId,
  isActive,
}: {
  campaignId: string;
  isActive: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleCampaignActive(campaignId, !isActive);
      toast.success(isActive ? "Campaign deactivated" : "Campaign activated");
      router.refresh();
    } catch {
      toast.error("Failed to update campaign");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this campaign? This will also delete all collected emails.")) {
      return;
    }
    setLoading(true);
    try {
      await deleteCampaign(campaignId);
      toast.success("Campaign deleted");
      router.push("/campaigns");
    } catch {
      toast.error("Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={loading}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleToggle}>
          {isActive ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              Deactivate
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              Activate
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Campaign
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
