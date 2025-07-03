"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ProjectData } from "./[projectId]/types";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/src/components/ui/accordion";

interface ProjectDialogProps {
  editMode: boolean;
  project: ProjectData;
  onProjectChange: (project: ProjectData) => void;
  onCancel: () => void;
  onDelete: () => void;
  onSubmit: () => void;
}

export const ProjectDialog = ({
  editMode,
  project,
  onProjectChange,
  onCancel,
  onDelete,
  onSubmit
}: ProjectDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!project.name) {
      setError("Project name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const url = editMode
        ? `${apiUrl}/project/config?project_id=${project.id}`
        : `${apiUrl}/project/config`;
      const method = editMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project)
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${editMode ? "update" : "create"} project. Status: ${
            response.status
          }`
        );
      }

      await response.json();
      onSubmit();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error saving project:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const url = `${apiUrl}/project?project_id=${project.id}`;
      const method = "DELETE";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete project. Status: ${response.status}`);
      }

      await response.json();
      onDelete();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error saving project:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("ProjectDialog mounted with project:", project);
  }, [project]);

  const handleInputChange = (field: keyof ProjectData, value: any) => {
    onProjectChange({ ...project, [field]: value });
  };

  const handleConfigChange = (
    field: keyof ProjectData["config"],
    value: any
  ) => {
    onProjectChange({
      ...project,
      config: { ...project.config, [field]: value }
    });
  };

  const getDefaultOtherConfig = (): Required<ProjectData>["other_config"] => ({
    use_docker: false,
    use_authentication: false
    // Add other default values here
  });

  const handleOtherConfigChange = (
    field: keyof Required<ProjectData>["other_config"],
    value: any
  ) => {
    onProjectChange({
      ...project,
      other_config: {
        ...getDefaultOtherConfig(),
        ...project.other_config,
        [field]: value
      }
    });
  };

  return (
    <DialogContent
      className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto"
      aria-describedby="dialog-description"
    >
      <DialogHeader>
        <DialogTitle>
          {editMode ? "Edit Project" : "Create New Project"}
        </DialogTitle>
      </DialogHeader>

      {error && (
        <div className="text-red-500 text-sm mb-4 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-1"
      >
        {/* Project Information Section */}
        <AccordionItem value="item-1">
          <AccordionTrigger>Project Information</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-sm font-medium">
                  Project Name*
                </Label>
                <Input
                  id="projectName"
                  value={project.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g. User Dashboard"
                  className={!project.name && error ? "border-red-500" : ""}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* MySQL Information Section */}
        <AccordionItem value="item-2">
          <AccordionTrigger>MySQL Information</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <Label htmlFor="mysqlUser" className="text-sm font-medium">
                  MySQL User
                </Label>
                <Input
                  id="mysqlUser"
                  value={project.config?.mysql_user || ""}
                  onChange={(e) =>
                    handleConfigChange("mysql_user", e.target.value)
                  }
                  placeholder="MySQL User"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="mysqlUserPassword"
                  className="text-sm font-medium"
                >
                  MySQL Password
                </Label>
                <Input
                  id="mysqlUserPassword"
                  type="password"
                  value={project.config?.mysql_password || ""}
                  onChange={(e) =>
                    handleConfigChange("mysql_password", e.target.value)
                  }
                  placeholder="MySQL Password"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mysqlDatabase" className="text-sm font-medium">
                  MySQL Database
                </Label>
                <Input
                  id="mysqlDatabase"
                  value={project.config?.mysql_database || ""}
                  onChange={(e) =>
                    handleConfigChange("mysql_database", e.target.value)
                  }
                  placeholder="MySQL Database"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mysqlHost" className="text-sm font-medium">
                  MySQL Host
                </Label>
                <Input
                  id="mysqlHost"
                  value={project.config?.mysql_host || ""}
                  onChange={(e) =>
                    handleConfigChange("mysql_host", e.target.value)
                  }
                  placeholder="MySQL Host"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mysqlPort" className="text-sm font-medium">
                  MySQL Port
                </Label>
                <Input
                  id="mysqlPort"
                  type="number"
                  value={project.config?.mysql_port || ""}
                  onChange={(e) =>
                    handleConfigChange("mysql_port", +e.target.value)
                  }
                  placeholder="MySQL Port"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Other Information Section */}
        <AccordionItem value="item-3">
          <AccordionTrigger>Other Configuration</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useDocker"
                  checked={project.other_config?.use_docker || false}
                  onCheckedChange={(checked) =>
                    handleOtherConfigChange("use_docker", checked)
                  }
                />
                <Label htmlFor="useDocker" className="text-sm font-normal">
                  Use Docker
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useAuthentication"
                  checked={project.other_config?.use_authentication || false}
                  onCheckedChange={(checked) =>
                    handleOtherConfigChange("use_authentication", checked)
                  }
                />
                <Label
                  htmlFor="useAuthentication"
                  className="text-sm font-normal"
                >
                  Use Authentication
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useSocket"
                  checked={project.other_config?.use_socket || false}
                  onCheckedChange={(checked) =>
                    handleOtherConfigChange("use_socket", checked)
                  }
                />
                <Label htmlFor="useSocket" className="text-sm font-normal">
                  Use Socket
                </Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="secretKey" className="text-sm font-medium">
                  Secret Key
                </Label>
                <Input
                  id="secretKey"
                  value={project.config?.secret_key || ""}
                  onChange={(e) =>
                    handleConfigChange("secretKey", e.target.value)
                  }
                  placeholder="Secret Key"
                />
              </div>

              {project.other_config?.use_authentication && (
                <>
                  <div className="space-y-1">
                    <Label
                      htmlFor="firstSuperuser"
                      className="text-sm font-medium"
                    >
                      First Superuser
                    </Label>
                    <Input
                      id="firstSuperuser"
                      value={project.config?.first_superuser || ""}
                      onChange={(e) =>
                        handleConfigChange("first_superuser", e.target.value)
                      }
                      placeholder="First Superuser"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="firstSuperuserPassword"
                      className="text-sm font-medium"
                    >
                      Superuser Password
                    </Label>
                    <Input
                      id="firstSuperuserPassword"
                      type="password"
                      value={project.config?.first_superuser_password || ""}
                      onChange={(e) =>
                        handleConfigChange(
                          "first_superuser_password",
                          e.target.value
                        )
                      }
                      placeholder="Superuser Password"
                    />
                  </div>
                </>
              )}

              {project.other_config?.use_docker && (
                <div className="space-y-1">
                  <Label
                    htmlFor="dockerImageBackend"
                    className="text-sm font-medium"
                  >
                    Docker Image Name
                  </Label>
                  <Input
                    id="dockerImageBackend"
                    value={project.config?.docker_image_backend || ""}
                    onChange={(e) =>
                      handleConfigChange("docker_image_backend", e.target.value)
                    }
                    placeholder="Docker Image Name"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>

        {editMode && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </Button>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!project.name || isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {editMode ? "Updating..." : "Creating..."}
            </span>
          ) : editMode ? (
            "Update Project"
          ) : (
            "Create Project"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
