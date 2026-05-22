import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { MeetingsListClient } from "@/components/meetings/meetings-list-client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Meeting } from "@/lib/database.types";

export default async function MeetingsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .order("meeting_date", { ascending: false, nullsFirst: false });

  if (error) {
    return (
      <div>
        <PageHeader
          title="Meetings"
          action={{ label: "New Meeting", href: "/meetings/new" }}
        />
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  const meetings = (data ?? []) as Meeting[];

  return (
    <div>
      <PageHeader
        title="Meetings"
        action={{ label: "New Meeting", href: "/meetings/new" }}
      />
      <div className="mb-4">
        <Link
          href="/meetings/transcript"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Transcript intake
        </Link>
      </div>
      <MeetingsListClient meetings={meetings} />
    </div>
  );
}
