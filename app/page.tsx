// app/projects/page.tsx
import { ProjectData } from "./project/[projectId]/types";
import ProjectsDashboard from "./project/projectDashboard";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

async function getProjects(): Promise<ProjectData[]> {
  try {
    const response = await fetch(`${apiUrl}/project/?skip=0&limit=10`);
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Failed to fetch projects: ${response.status} ${response.statusText} - ${errorData}`
      );
    }
    const data: ProjectData[] = await response.json();
    console.log("Fetched projects:", data);

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsDashboard initialProjects={projects} />;
}
