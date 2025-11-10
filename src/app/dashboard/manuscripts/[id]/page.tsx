import { db, manuscripts, sections } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import SimplifiedManuscriptEditor from "@/components/SimplifiedManuscriptEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManuscriptPage({ params }: Props) {
  const resolvedParams = await params;
  const manuscriptId = parseInt(resolvedParams.id);

  const [manuscript] = await db.select().from(manuscripts).where(eq(manuscripts.id, manuscriptId));
  
  if (!manuscript) {
    notFound();
  }

  const manuscriptSections = await db.select().from(sections)
    .where(eq(sections.manuscriptId, manuscriptId))
    .orderBy(asc(sections.sortOrder), asc(sections.createdAt));

  return (
    <SimplifiedManuscriptEditor 
      manuscript={manuscript}
    />
  );
}