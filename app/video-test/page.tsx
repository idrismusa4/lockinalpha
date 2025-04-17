// In your page.tsx or any other page component
import ScriptToVideoConverter from "../components/ScriptToVideoConverter";
import TestFetchMedia from "./test-fetchMedia";

export default function MyPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Media Fetch Testing</h1>
      
      <div className="mb-12">
        <TestFetchMedia />
      </div>
      
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Full Video Generator</h2>
        <ScriptToVideoConverter />
      </div>
    </main>
  );
}