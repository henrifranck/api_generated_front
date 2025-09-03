export interface Attribute {
  name: string;
  type: string;
  length?: number | null;
  is_unique: boolean;
  is_foreign: boolean;
  is_indexed: boolean;
  is_primary: boolean;
  foreign_key: string | null;
  is_required: boolean;
  foreign_key_class?: string;
  relation_name?: string;
  is_auto_increment: boolean;
  enum_name?: string;
}

export interface ClassModel {
  name: string;
  attributes: Attribute[];
}

export interface Config {
  docker_image_backend: string;
  host_port: string;
  container_port: string;
  backend_cors_origins: string[];
  project_name: string;

  secret_key: string;
  first_superuser: string;
  first_name_superuser: string;
  last_name_superuser: string;
  first_superuser_password: string;

  mysql_host: string;
  mysql_port: number;
  mysql_user: string;
  mysql_password: string;
  mysql_database: string;
}

export interface OtherConfig {
  use_docker: boolean;
  use_authentication: boolean;
  use_socket: boolean;
}

export interface ProjectModel {
  name: string;
  config: Config;
  class_model: ClassModel[];
  id?: number; // Made optional to match your ProjectData interface
}

// Your existing ProjectData interface (kept for compatibility)
export interface ClassData {
  name: string;
  attributes: Attribute[]; // Using Attribute instead of Column to match your model
}

export interface ProjectData {
  id?: string;
  name: string;
  config: Config | any;
  other_config: OtherConfig | any;
  class_model: ClassData[] | any;
  nodes?: any;
  enums?: EnumType[] | any;
}

export interface ClassNodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: ClassData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface EnumType {
  name: string;
  values: EnumValue[];
}

export interface EnumValue {
  key: string;
  value: string;
}
