"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  Node,
  Edge,
  Connection,
  ReactFlowInstance,
  NodeProps
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Plus,
  Edit,
  Trash2,
  Key,
  Link as LinkIcon,
  Download,
  Save,
  Search,
  Settings,
  Pencil
} from "lucide-react";
import { toast } from "sonner";
import ClassNode from "./classNode";
import { Attribute, ClassData, EnumType, ProjectData } from "./types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/src/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/src/components/ui/table";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/src/components/ui/tooltip";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/src/components/ui/dialog";

// Constants
const MYSQL_DATA_TYPES = [
  "INT",
  "VARCHAR(255)",
  "TEXT",
  "DATE",
  "DATETIME",
  "TIMESTAMP",
  "DECIMAL(10,2)",
  "BOOLEAN",
  "BLOB",
  "JSON",
  "ENUM"
] as const;

const DEFAULT_COLUMN: Attribute = {
  name: "",
  type: "VARCHAR(255)",
  is_primary: false,
  is_foreign: false,
  foreign_key_class: "",
  foreign_key: "",
  is_unique: false,
  is_required: false,
  is_indexed: false,
  is_auto_increment: false,
  relation_name: "",
  enum_name: ""
};

const DEFAULT_CLASS: ClassData = {
  name: "",
  attributes: []
};

interface DiagramEditorProps {
  selectedProject: ProjectData;
  onSave?: (data: {
    nodes: Node<ClassData>[];
    edges: Edge[];
    enums: EnumType[];
  }) => void;
}

export function DiagramEditor({ selectedProject, onSave }: DiagramEditorProps) {
  // State
  const [nodes, setNodes, onNodesChange] = useNodesState<ClassData>(
    selectedProject.nodes.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [enumName, setEnumName] = useState("");
  const [enumValues, setEnumValues] = useState<
    { key: string; value: string }[]
  >([{ key: "", value: "" }]);

  const [enums, setEnums] = useState<EnumType[]>(selectedProject.nodes.enums || []);
  const [isEnumOpen, setIsEnumOpen] = useState(false);
  const [isEnumEdited, setIsEnumEdited] = useState(false);

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [currentNode, setCurrentNode] = useState<Node<ClassData> | null>(null);
  const [currentColumnIndex, setCurrentColumnIndex] = useState<number | null>(
    null
  );
  const [newClass, setNewClass] = useState<ClassData>(DEFAULT_CLASS);
  const [newColumn, setNewColumn] = useState<Attribute>(DEFAULT_COLUMN);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedClasses, setUpdatedClasses] = useState<string[]>([]);

  const [migrationmessage, setMigrationMessage] = useState<string>("");
  const [isLoadingMigration, setIsLoadingMigration] = useState(false);

  const [isEnumSelected, setIsEnumSelected] = useState(false);
  const [selectedEnum, setSelectedEnum] = useState<string>("");
  const [classSearch, setClassSearch] = useState("");
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(
    null
  );
  const nodeTypes = useMemo(
    () => ({
      classNode: (props: NodeProps<ClassData>) => (
        <ClassNode
          {...props}
          isHighlighted={props.id === highlightedNodeId}
        />
      )
    }),
    [highlightedNodeId]
  );

  // Derived state
  const editMode = useMemo(() => !!currentNode, [currentNode]);
  const editColumnMode = useMemo(
    () => currentColumnIndex !== null,
    [currentColumnIndex]
  );
  const classSummaries = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        name: node.data?.name || "Untitled",
        attributeCount: node.data?.attributes?.length ?? 0,
        position: node.position,
        width: node.width,
        height: node.height
      })),
    [nodes]
  );
  const filteredClasses = useMemo(() => {
    const query = classSearch.trim().toLowerCase();
    const sorted = [...classSummaries].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    if (!query) return sorted;
    return sorted.filter((cls) => cls.name.toLowerCase().includes(query));
  }, [classSearch, classSummaries]);

  useEffect(() => {
    if (
      highlightedNodeId &&
      !nodes.some((node) => node.id === highlightedNodeId)
    ) {
      setHighlightedNodeId(null);
    }
  }, [highlightedNodeId, nodes]);

  const onSelectChange = (type: string) => {
    if (type === "ENUM") {
      setIsEnumSelected(true);
    } else {
      setIsEnumSelected(false);
    }
  };

  const onEnumSelectChange = (type: string) => {
    console.log(`Selected enum type: ${type}`);
    setSelectedEnum(type);
  };

  // Callbacks
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      setNewClass({
        ...DEFAULT_CLASS,
        name: `Class_${nodes.length + 1}`
      });
      setCurrentNode(null);
      setIsDialogOpen(true);
    },
    [reactFlowInstance, nodes.length]
  );

  const handleFocusNode = useCallback(
    (nodeId: string) => {
      if (!reactFlowInstance) return;
      const target = classSummaries.find((cls) => cls.id === nodeId);
      if (!target) return;

      const baseX = target.position?.x ?? 0;
      const baseY = target.position?.y ?? 0;
      const width =
        typeof target.width === "number" ? target.width : 200;
      const height =
        typeof target.height === "number" ? target.height : 120;

      const centerX = baseX + width / 2;
      const centerY = baseY + height / 2;

      reactFlowInstance.setCenter(centerX, centerY, {
        zoom: 1.2,
        duration: 600
      });
    },
    [classSummaries, reactFlowInstance]
  );

  // Helper functions
  const findNodeByClassName = useCallback(
    (className: string) => nodes.find((node) => node.data.name === className),
    [nodes]
  );

  const validateForeignKeyRef = useCallback(
    (ref?: string) => {
      if (!ref) return false;
      const [className, columnName] = ref.split(".");
      if (!className || !columnName) return false;

      const targetNode = findNodeByClassName(className);
      return !!targetNode?.data.attributes.some(
        (col) => col.name === columnName
      );
    },
    [findNodeByClassName]
  );

  const createRelationship = useCallback(
    (sourceNode: Node<ClassData>, column: Attribute) => {
      if (
        !column.is_foreign ||
        !column.foreign_key_class ||
        !column.foreign_key
      )
        return;

      const targetNode = findNodeByClassName(column.foreign_key_class);
      if (!targetNode) {
        toast.error(`Target class "${column.foreign_key_class}" not found`);
        return;
      }

      const targetColumnExists = targetNode.data.attributes.some(
        (col) => col.name === column.foreign_key
      );

      if (!targetColumnExists) {
        toast.error(
          `Attribute "${column.foreign_key}" not found in "${column.foreign_key_class}"`
        );
        return;
      }

      const edgeId = `edge-${sourceNode.id}-${targetNode.id}-${column.name}`;

      setEdges((eds) => {
        const alreadyExists = eds.some(
          (e) =>
            e.id === edgeId ||
            (e.source === sourceNode.id &&
              e.target === targetNode.id &&
              e.sourceHandle === `fk-${column.name}`)
        );

        if (alreadyExists) return eds;

        return [
          ...eds,
          {
            id: edgeId,
            source: sourceNode.id,
            target: targetNode.id,
            sourceHandle: `fk-${column.name}`,
            label: `${sourceNode.data.name}.${column.name} → ${column.foreign_key_class}.${column.foreign_key}`
          }
        ];
      });
    },
    [findNodeByClassName, setEdges]
  );

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    selectedProject.nodes = { nodes, edges, enums };
    selectedProject.class_model = nodes.map((node) => node.data);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const url = `${apiUrl}/project/diagram?project_id=${selectedProject.id}`;
      const method = "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedProject)
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${editMode ? "update" : "create"} project. Status: ${response.status
          }`
        );
      }

      await response.json();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error saving project:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClass = async () => {
    setIsLoadingMigration(true);

    const body = {
      project_in: {
        class_model: nodes.map((node) => node.data),
        migration_message: migrationmessage
      },
      updated_class: updatedClasses
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const url = `${apiUrl}/project?project_id=${selectedProject.id}`;
      const method = "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${editMode ? "update" : "create"} project. Status: ${response.status
          }`
        );
      }

      await response.json();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error saving project:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMigration(false);
      setIsMessageOpen(false);
    }
  };

  // Effects
  useEffect(() => {
    nodes.forEach((node) => {
      node.data.attributes
        .filter((col) => col.is_foreign && col.foreign_key_class)
        .forEach((col) => createRelationship(node, col));
    });
  }, [nodes, createRelationship]);

  // Handlers
  const handleAddClass = useCallback(() => {
    if (!newClass.name || !reactFlowInstance) {
      toast.error("Class name is required");
      return;
    }

    if (newClass.attributes.length === 0) {
      toast.error("At least one column is required");
      return;
    }

    const newNode = {
      id: `${Date.now()}`,
      type: "classNode" as const,
      position: reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      }),
      data: { ...newClass }
    };

    setNodes((nds) => nds.concat(newNode));
    setNewClass(DEFAULT_CLASS);
    setIsDialogOpen(false);
    toast.success("Class added successfully");
  }, [newClass, reactFlowInstance, setNodes]);

  const handleEditClass = useCallback((node: Node<ClassData>) => {
    setHighlightedNodeId(node.id);
    setNewClass({ ...node.data });
    setCurrentNode(node);
    setIsDialogOpen(true);
  }, []);
  const handleSelectClassFromList = useCallback(
    (nodeId: string) => {
      const target = nodes.find((node) => node.id === nodeId);
      if (!target) return;
      setHighlightedNodeId(nodeId);
      setCurrentNode(null);
      setIsDialogOpen(false);
      handleFocusNode(nodeId);
    },
    [handleFocusNode, nodes]
  );

  const handleDeleteClass = useCallback(() => {
    if (!currentNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== currentNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== currentNode.id && edge.target !== currentNode.id
      )
    );
    if (highlightedNodeId === currentNode.id) {
      setHighlightedNodeId(null);
    }

    setCurrentNode(null);
    setIsDialogOpen(false);
    toast.success("Class deleted successfully");
  }, [currentNode, highlightedNodeId, setEdges, setNodes]);

  const resetForm = useCallback(() => {
    setNewClass(DEFAULT_CLASS);
    setNewColumn(DEFAULT_COLUMN);
    setCurrentNode(null);
    setCurrentColumnIndex(null);
    setIsDialogOpen(false);
  }, []);

  const handleUpdateClass = useCallback(() => {
    if (!newClass.name || !currentNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === currentNode.id ? { ...node, data: { ...newClass } } : node
      )
    );

    newClass.attributes.forEach(
      (col) =>
        col.is_foreign &&
        col.foreign_key_class &&
        createRelationship(currentNode, col)
    );

    // ✅ Add to updated list BEFORE reset
    setUpdatedClasses((prev) =>
      prev.includes(newClass.name) ? prev : [...prev, newClass.name]
    );

    resetForm();
    toast.success("Class updated successfully");
  }, [currentNode, newClass, createRelationship, resetForm, setNodes]);

  const handleAddColumn = useCallback(() => {
    if (!newColumn.name) {
      toast.error("Attribute name is required");
      return;
    }

    if (newColumn.is_foreign && !newColumn.foreign_key_class) {
      toast.error("Foreign key reference is required");
      return;
    }

    if (newColumn.type === "ENUM") {
      newColumn.enum_name = selectedEnum
    }

    setNewClass((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { ...newColumn }]
    }));

    setNewColumn(DEFAULT_COLUMN);
  }, [newColumn]);

  const handleEditColumn = useCallback((column: Attribute, index: number) => {
    setNewColumn({ ...column });
    if (column.type === "ENUM" && column.enum_name) {
      console.log(column)
      setIsEnumSelected(true);
      setSelectedEnum(column.enum_name)
    }
    setCurrentColumnIndex(index);
  }, []);

  const handleUpdateColumn = useCallback(() => {
    if (!newColumn.name || currentColumnIndex === null) return;

    if (newColumn.type === "ENUM") {
      newColumn.enum_name = selectedEnum
    }
    console.log(newColumn);
    const updated = [...newClass.attributes];
    updated[currentColumnIndex] = { ...newColumn };
    setNewClass((prev) => ({ ...prev, attributes: updated }));
    setNewColumn(DEFAULT_COLUMN);
    setCurrentColumnIndex(null);
  }, [currentColumnIndex, newClass.attributes, newColumn]);

  const handleDeleteColumn = useCallback(
    (index: number) => {
      const columnToDelete = newClass.attributes[index];
      const updated = [...newClass.attributes];
      updated.splice(index, 1);
      setNewClass((prev) => ({ ...prev, attributes: updated }));

      if (columnToDelete.is_foreign && currentNode) {
        setEdges((eds) =>
          eds.filter((e) => e.sourceHandle !== `fk-${columnToDelete.name}`)
        );
      }

      toast.success("Attribute deleted successfully");
    },
    [currentNode, newClass.attributes, setEdges]
  );

  const exportToJSON = useCallback((data: any, fileName: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${fileName} has been downloaded`);
  }, []);

  const handleSaveDiagram = useCallback(() => {
    if (onSave) {
      onSave({ nodes, edges, enums });
    } else {
      exportToJSON({ nodes, edges }, "diagram-interface.json");
    }
  }, [edges, exportToJSON, nodes, onSave]);

  return (
    <div className="w-full h-[80vh] flex">
      <div className="flex-1 h-full">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            onNodeClick={(e, node) => handleEditClass(node)}
            fitView
          >
            <Controls />
            <Background />
            <Panel
              position="top-left"
              className="w-64 bg-white/90 backdrop-blur-sm border rounded-lg shadow-sm p-3 space-y-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">Classes</div>
                <span className="text-xs text-muted-foreground">
                  {nodes.length}
                </span>
              </div>
              <Input
                placeholder="Search class"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls) => (
                    <button
                      key={cls.id}
                      className="w-full text-left px-2 py-1.5 rounded-md border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      onClick={() => handleSelectClassFromList(cls.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {cls.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {cls.attributeCount} attrs
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No classes found
                  </p>
                )}
              </div>
            </Panel>
            <Panel position="top-right" className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewClass(DEFAULT_CLASS);
                      setCurrentNode(null);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Class
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto"
                  aria-describedby="class-dialog"
                >
                  <DialogHeader>
                    <DialogTitle>
                      {editMode ? "Edit Class" : "Create New Class"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Class Name Section */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="className"
                        className="text-sm font-medium"
                      >
                        Class Name
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="className"
                          value={newClass.name}
                          onChange={(e) =>
                            setNewClass({ ...newClass, name: e.target.value })
                          }
                          placeholder="e.g. User, Product, Order"
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setNewClass({
                              ...newClass,
                              name: `Class_${nodes.length + 1}`
                            })
                          }
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Add Attribute Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Add Attribute</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Attribute Name */}
                        <div className="space-y-2">
                          <Label htmlFor="columnName" className="text-sm">
                            Attribute Name
                          </Label>
                          <Input
                            id="columnName"
                            value={newColumn.name}
                            onChange={(e) =>
                              setNewColumn({
                                ...newColumn,
                                name: e.target.value
                              })
                            }
                            placeholder="e.g. id, name, created_at"
                          />
                        </div>

                        {/* Attribute Type */}
                        <div className="space-y-2">
                          <Label htmlFor="columnType" className="text-sm">
                            Data Type
                          </Label>
                          <Select
                            value={newColumn.type}
                            onValueChange={(value) => {
                              setNewColumn({ ...newColumn, type: value });
                              onSelectChange(value);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {MYSQL_DATA_TYPES.map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  className="text-sm"
                                >
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {isEnumSelected && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Attribute Type */}
                          <div className="flex gap-2">
                            <Select
                              value={selectedEnum}
                              onValueChange={(value) => {
                                onEnumSelectChange(value);
                              }}
                              disabled={!enums.length}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {enums.map((type) => (
                                  <SelectItem
                                    key={type.name}
                                    value={type.name}
                                    className="text-sm"
                                  >
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {selectedEnum && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const enumToEdit = enums.find(
                                      (e) => e.name === selectedEnum
                                    );
                                    if (enumToEdit) {
                                      setEnumName(enumToEdit.name);
                                      setEnumValues(
                                        enumToEdit.values.length > 0
                                          ? enumToEdit.values
                                          : [{ key: "", value: "" }]
                                      );
                                      setIsEnumEdited(true);
                                      setIsEnumOpen(true);
                                    }
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newEnums = enums.filter(
                                      (e) => e.name !== selectedEnum
                                    );

                                    onEnumSelectChange(""); // Clear selection
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>

                          <Dialog
                            open={isEnumOpen}
                            onOpenChange={setIsEnumOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsEnumOpen(true);
                                  setEnumName("");
                                  setEnumValues([{ key: "", value: "" }]);
                                  setIsEnumEdited(false);
                                }}
                              >
                                New Enum
                              </Button>
                            </DialogTrigger>
                            <DialogContent
                              className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto"
                              aria-describedby="enum-dialog"
                            >
                              <DialogHeader>
                                <DialogTitle>
                                  {isEnumEdited
                                    ? "Edit Enum"
                                    : "Create New Enum"}
                                </DialogTitle>
                                <DialogDescription>
                                  Define your enum properties below.
                                </DialogDescription>
                              </DialogHeader>

                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label
                                    htmlFor="enumName"
                                    className="text-right"
                                  >
                                    Enum Name
                                  </Label>
                                  <Input
                                    id="enumName"
                                    placeholder="EnumName"
                                    className="col-span-3"
                                    value={enumName}
                                    onChange={(e) =>
                                      setEnumName(e.target.value)
                                    }
                                  />
                                </div>

                                <div className="space-y-4">
                                  <Label className="block">Enum Values</Label>
                                  {enumValues.map((item, index) => (
                                    <div
                                      key={index}
                                      className="grid grid-cols-5 items-center gap-2"
                                    >
                                      <Input
                                        placeholder="Key"
                                        value={item.key}
                                        onChange={(e) => {
                                          const newValues = [...enumValues];
                                          newValues[index].key = e.target.value;
                                          setEnumValues(newValues);
                                        }}
                                        className="col-span-2"
                                      />
                                      <Input
                                        placeholder="Value"
                                        value={item.value}
                                        onChange={(e) => {
                                          const newValues = [...enumValues];
                                          newValues[index].value =
                                            e.target.value;
                                          setEnumValues(newValues);
                                        }}
                                        className="col-span-2"
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newValues = [...enumValues];
                                          newValues.splice(index, 1);
                                          setEnumValues(newValues);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setEnumValues([
                                        ...enumValues,
                                        { key: "", value: "" }
                                      ])
                                    }
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Value
                                  </Button>
                                </div>
                              </div>

                              <DialogFooter>
                                {isEnumEdited && (
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      const newEnums = enums.filter(
                                        (e) => e.name !== enumName
                                      );
                                      // Update your enums state here
                                      // setEnums(newEnums);
                                      setEnumValues([{ key: "", value: "" }]);
                                      setEnumName("");
                                      setIsEnumOpen(false);
                                      onEnumSelectChange("");
                                    }}
                                  >
                                    Delete Enum
                                  </Button>
                                )}
                                <Button
                                  type="submit"
                                  onClick={() => {
                                    const updatedEnum = {
                                      name: enumName,
                                      values: enumValues.filter(
                                        (v) =>
                                          v.key.length > 0 && v.value.length > 0
                                      )
                                    };

                                    if (isEnumEdited) {
                                      // Update existing enum
                                      const newEnums = enums.map((e) =>
                                        e.name === enumName ? updatedEnum : e
                                      );
                                      setEnums(newEnums);
                                      setIsEnumEdited(false);
                                    } else {
                                      // Add new enum
                                      setEnums([...enums, updatedEnum]);
                                    }

                                    setEnumValues([{ key: "", value: "" }]);
                                    setEnumName("");
                                    setIsEnumOpen(false);
                                  }}
                                >
                                  {isEnumEdited
                                    ? "Save Changes"
                                    : "Create Enum"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {/* Key Options */}
                      <div className="flex flex-wrap gap-4 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="primaryKey"
                            checked={newColumn.is_primary}
                            onCheckedChange={(checked) => {
                              const updated = {
                                ...newColumn,
                                is_primary: !!checked,
                                ...(checked && {
                                  is_foreign: false,
                                  foreign_key_class: ""
                                })
                              };
                              setNewColumn(updated);
                            }}
                          />
                          <Label
                            htmlFor="primaryKey"
                            className="text-sm font-normal"
                          >
                            Primary Key
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="foreignKey"
                            checked={newColumn.is_foreign}
                            onCheckedChange={(checked) => {
                              const updated = {
                                ...newColumn,
                                is_foreign: !!checked,
                                ...(checked && { is_primary: false })
                              };
                              setNewColumn(updated);
                            }}
                          />
                          <Label
                            htmlFor="foreignKey"
                            className="text-sm font-normal"
                          >
                            Foreign Key
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="unique"
                            checked={newColumn.is_unique}
                            onCheckedChange={(checked) => {
                              const updated = {
                                ...newColumn,
                                is_unique: !!checked
                              };
                              setNewColumn(updated);
                            }}
                          />
                          <Label
                            htmlFor="unique"
                            className="text-sm font-normal"
                          >
                            Unique
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="indexed"
                            checked={newColumn.is_indexed}
                            onCheckedChange={(checked) => {
                              const updated = {
                                ...newColumn,
                                is_indexed: !!checked
                              };
                              setNewColumn(updated);
                            }}
                          />
                          <Label
                            htmlFor="indexed"
                            className="text-sm font-normal"
                          >
                            Indexed
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="required"
                            checked={newColumn.is_required}
                            onCheckedChange={(checked) => {
                              const updated = {
                                ...newColumn,
                                is_required: !!checked
                              };
                              setNewColumn(updated);
                            }}
                          />
                          <Label
                            htmlFor="required"
                            className="text-sm font-normal"
                          >
                            Required
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="autoIncrement"
                            checked={newColumn.is_auto_increment}
                            onCheckedChange={(checked) => {
                              const updated = {
                                ...newColumn,
                                is_auto_increment: !!checked
                              };
                              setNewColumn(updated);
                            }}
                          />
                          <Label
                            htmlFor="autoIncrement"
                            className="text-sm font-normal"
                          >
                            A.I
                          </Label>
                        </div>
                      </div>

                      {/* Foreign Key Reference */}
                      {newColumn.is_foreign && (
                        <div className="space-y-2">
                          <Label htmlFor="foreignKeyRef" className="text-sm">
                            References
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="foreignKeyRef"
                              value={`${newColumn.foreign_key_class ?? ""}.${newColumn.foreign_key ?? ""
                                }`}
                              onChange={(e) => {
                                const value = e.target.value;
                                const [foreign_key_class, foreign_key] =
                                  value.split(".");

                                setNewColumn({
                                  ...newColumn,
                                  foreign_key_class: foreign_key_class ?? "",
                                  foreign_key: foreign_key ?? ""
                                });
                              }}
                              placeholder="ClassName.columnName"
                              className="flex-1"
                            />
                          </div>
                          {!validateForeignKeyRef(
                            `${newColumn.foreign_key_class}.${newColumn.foreign_key}`
                          ) && (
                              <p className="text-xs text-destructive mt-1">
                                Format: ClassName.columnName (e.g. User.id)
                              </p>
                            )}
                          <Label htmlFor="RelationName" className="text-sm">
                            Relation name
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="relationName"
                              value={`${newColumn.relation_name ?? ""}`}
                              onChange={(e) => {
                                setNewColumn({
                                  ...newColumn,
                                  relation_name: e.target.value
                                });
                              }}
                              placeholder="Relation name"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      )}
                      {/* Add/Update Attribute Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={
                            editColumnMode
                              ? handleUpdateColumn
                              : handleAddColumn
                          }
                          className="flex-1"
                          disabled={!newColumn.name}
                        >
                          {editColumnMode ? (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Update Attribute
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Attribute
                            </>
                          )}
                        </Button>
                        {editColumnMode && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setNewColumn(DEFAULT_COLUMN);
                              setCurrentColumnIndex(null);
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Columns List */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">
                          Attributes ({newClass.attributes.length})
                        </h4>
                        {newClass.attributes.length > 0 && (
                          <Button variant="ghost" size="sm">
                            <Settings className="mr-2 h-4 w-4" />
                            Manage
                          </Button>
                        )}
                      </div>

                      {newClass.attributes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed">
                          <Table className="h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            No attributes added yet
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add your first attribute above
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[180px]">
                                  Name
                                </TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="w-[60px] text-center">
                                  PK
                                </TableHead>
                                <TableHead className="w-[60px] text-center">
                                  FK
                                </TableHead>
                                <TableHead className="w-[100px]">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {newClass.attributes.map((col, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      {col.name}
                                      {col.is_primary && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Key className="h-4 w-4 text-yellow-500" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Primary Key
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <code className="text-sm bg-muted px-2 py-1 rounded">
                                      {col.type}
                                    </code>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {col.is_primary ? "✓" : ""}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {col.is_foreign ? (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <LinkIcon className="h-4 w-4 text-green-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          References: {col.foreign_key_class}
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      ""
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditColumn(col, i)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteColumn(i)}
                                      >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    {editMode && (
                      <Button variant="destructive" onClick={handleDeleteClass}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Class
                      </Button>
                    )}
                    <Button
                      onClick={editMode ? handleUpdateClass : handleAddClass}
                      disabled={
                        !newClass.name || newClass.attributes.length === 0
                      }
                    >
                      {editMode ? "Update Class" : "Create Class"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
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
                  </span>
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}{" "}
                Save Diagram
              </Button>

              <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() =>
                      console.log("Updated classes:", updatedClasses)
                    }
                  >
                    <Download className="mr-2 h-4 w-4" /> Export Entities
                  </Button>
                </DialogTrigger>

                <DialogContent
                  className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto"
                  aria-describedby="class-dialog"
                >
                  <DialogHeader>
                    <DialogTitle>{"Create Migration"}</DialogTitle>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Input
                      id="className"
                      value={migrationmessage}
                      onChange={(e) => setMigrationMessage(e.target.value)}
                      placeholder="Migration Message"
                      className="flex-1"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMessageOpen(false)}
                    >
                      Cancel
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveClass()}
                    >
                      {isLoadingMigration ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
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
                        </span>
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}{" "}
                      Generate
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default DiagramEditor;
