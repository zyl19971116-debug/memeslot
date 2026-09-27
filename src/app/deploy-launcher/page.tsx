import DeployLauncherPanel from "@/components/launch/DeployLauncherPanel";
import { redirect } from "next/navigation";

export default function DeployLauncherPage() {
  if (process.env.NEXT_PUBLIC_MEME_TOKEN_LAUNCHER_ADDRESS) redirect("/");
  return <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
    <DeployLauncherPanel />
  </main>;
}
