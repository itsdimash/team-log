import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogFeed from "./LogFeed";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <LogFeed
      currentUser={{
        id: session.user.id,
        name: session.user.name || "",
        role: session.user.role,
      }}
    />
  );
}
