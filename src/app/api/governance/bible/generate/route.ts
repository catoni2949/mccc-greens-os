import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assembleBibleFromData } from "@/lib/governance/generate-bible";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fullMarkdown, sections } = await assembleBibleFromData(supabase);
  return NextResponse.json({ fullMarkdown, sections });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    sections?: { slug: string; title: string; markdown: string }[];
    updateSections?: boolean;
  };

  const assembled = body.sections?.length
    ? { sections: body.sections, fullMarkdown: "" }
    : await assembleBibleFromData(supabase);

  const saved: string[] = [];
  for (const section of assembled.sections) {
    await supabase.from("governance_section_snapshots").insert({
      section_slug: section.slug,
      title: section.title,
      body_markdown: section.markdown,
      generated_from: "assemble_bible",
    });
    saved.push(section.slug);

    if (body.updateSections) {
      await supabase
        .from("governance_sections")
        .update({ body: section.markdown })
        .eq("slug", section.slug);
    }
  }

  return NextResponse.json({
    ok: true,
    snapshotCount: saved.length,
    slugs: saved,
  });
}
