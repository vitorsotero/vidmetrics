import Dashboard from "@/components/Dashboard";
import { MOCK_VIDEOS } from "@/lib/mock-data";

export default function Home() {
  return (
    <main>
      <Dashboard initialVideos={MOCK_VIDEOS} />
    </main>
  );
}
