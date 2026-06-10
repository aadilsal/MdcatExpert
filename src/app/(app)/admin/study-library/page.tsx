import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { notFound } from "next/navigation";
import StudyLibraryClient from "./study-library-client";

export default async function AdminStudyLibraryPage() {
  const token = await convexAuthNextjsToken();
  if (!token) notFound();

  const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
  if (!me || me.role !== "admin") notFound();

  const sources = await fetchQuery(api.studySources.listAllForAdmin, {}, { token });

  return <StudyLibraryClient initialSources={sources} />;
}
