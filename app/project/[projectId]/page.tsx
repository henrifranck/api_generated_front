import { Button } from "@/src/components/ui/button";
import { HomeIcon } from "lucide-react";
import DiagramEditor from "./DiagramEditor";
import Link from "next/link";
import { ProjectData } from "./types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

async function getProjectsById(projectId: number): Promise<ProjectData> {
  try {
    const response = await fetch(
      `${apiUrl}/project/by_id?project_id=${projectId}`
    );
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Failed to fetch projects: ${response.status} ${response.statusText} - ${errorData}`
      );
    }
    const data: ProjectData = await response.json();
    console.log("Fetched projects:", data);

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

export default async function Home(props: {
  params: Promise<{ projectId: string }>;
}) {
  const params = await props.params; // Get the dynamic parameter `id`
  const id = params.projectId;
  console.log("Rendering project page with params:", id);
  if (!id || isNaN(+id)) {
    return <div className="text-red-500">Invalid project ID</div>;
  }
  const projects = await getProjectsById(+id);

  return (
    <div className="min-h-screen p-4 pb-12 sm:p-6 md:p-8 font-sans flex flex-col items-center gap-8 bg-gray-50">
      <header className="w-full sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">
              Diagram Editor
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link href="/" className="text-sm">
              <Button className="w-full sm:w-auto gap-2 whitespace-nowrap">
                <HomeIcon className="size-4" />
                Project
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full ">
        <DiagramEditor selectedProject={projects} />
      </main>
    </div>
  );
}
