"use client";

import { Button } from "@/src/components/ui/button";
import {
  Edit,
  Trash,
  Settings,
  FolderOpen,
  Plus,
  Search,
  Folder
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogTrigger } from "@/src/components/ui/dialog";
import { ProjectData } from "./[projectId]/types";
import { ProjectDialog } from "./projectDialog";

const DEFAULT_PROJECT: ProjectData = {
  name: "",
  class_model: [],
  config: {},
  other_config: {}
};

export default function ProjectsDashboard({
  initialProjects
}: {
  initialProjects: ProjectData[];
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(
    null
  );
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const [newProject, setNewProject] = useState<ProjectData>(DEFAULT_PROJECT);
  const [searchQuery, setSearchQuery] = useState("");

  const editMode = !!currentProject;
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProject = () => {
    if (!newProject.name) return;

    const projectToAdd = {
      ...newProject,
      id: Date.now().toString()
    };

    setProjects([...projects, projectToAdd]);
    resetForm();
  };

  const handleEditProject = (project: ProjectData) => {
    setNewProject({ ...project });
    setCurrentProject(project);
    setIsDialogOpen(true);
  };

  const handleDeleteProject = () => {
    if (!currentProject) return;

    setProjects(projects.filter((p) => p.id !== currentProject.id));
    resetForm();
  };

  const handleUpdateProject = () => {
    if (!newProject.name) return;
    setProjects(
      projects.map((p) =>
        p.id === currentProject?.id ? { ...p, name: newProject.name } : p
      )
    );
    resetForm();
  };

  const resetForm = () => {
    setNewProject(DEFAULT_PROJECT);
    setCurrentProject(null);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="min-h-screen p-4 pb-12 sm:p-6 md:p-8 font-sans flex flex-col gap-8 bg-gray-50">
        <header className="w-full sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <Folder className="size-8" />
              <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">
                My Projects
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg border-gray-300 focus-visible:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DialogTrigger asChild>
                <Button
                  className="w-full sm:w-auto gap-2 whitespace-nowrap"
                  onClick={() => {
                    setCurrentProject(null);
                    setNewProject(DEFAULT_PROJECT);
                  }}
                >
                  <Plus className="size-4" />
                  Add Project
                </Button>
              </DialogTrigger>
            </div>
          </div>
        </header>

        <main className="w-full">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProjects.map((item) => (
                <Card
                  key={item.id}
                  className="h-full flex flex-col hover:shadow-md transition-all border border-gray-200 hover:border-gray-300"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold line-clamp-1">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      Last updated: {new Date().toDateString()}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="aspect-video overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt={`Project ${item.id} thumbnail`}
                        width={400}
                        height={225}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between gap-2 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:bg-gray-100"
                      onClick={() => handleEditProject(item)}
                    >
                      <Settings className="size-4" />
                    </Button>
                    <div className="flex gap-2">
                      <Link href={`/project/${item.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:bg-gray-100"
                        >
                          <Edit className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setCurrentProject(item);
                          handleDeleteProject();
                        }}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <FolderOpen className="size-12 text-gray-400" />
              <h2 className="text-xl font-medium text-gray-600">
                {searchQuery ? "No matching projects" : "No projects yet"}
              </h2>
              <p className="text-gray-500 max-w-md">
                {searchQuery
                  ? "Try a different search term"
                  : "Get started by creating your first project"}
              </p>
              <DialogTrigger asChild>
                <Button className="gap-2 mt-4">
                  <Plus className="size-4" />
                  Create Project
                </Button>
              </DialogTrigger>
            </div>
          )}
        </main>

        <ProjectDialog
          editMode={editMode}
          project={newProject}
          onProjectChange={setNewProject}
          onCancel={resetForm}
          onDelete={handleDeleteProject}
          onSubmit={editMode ? handleUpdateProject : handleAddProject}
        />
      </div>
    </Dialog>
  );
}
