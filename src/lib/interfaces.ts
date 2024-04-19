import type * as vscode from 'vscode'

export interface Column {
  name: string
  type: string
  mode: string
  description: string
}

export interface PlantUmlResponse {
  plantUml: string
  links: string
}

export type PlantUmlData = Record<string, {
  partition_cols?: string[]
  clustering_cols?: string[]
}>

export interface Resource {
  name: string
  type: string
  strpos: number
  subtype?: string
  templatefile?: string
  variables?: Record<string, { eval: string }> // >> les variables passées à une vue ...
  uri?: vscode.Uri
  schemaPath?: string
  disabledFlag: boolean
  table_id?: string
  table_partition?: string
  table_clusters?: string[]
}

// We use the 'resourceType.resourceName' concat as record id (string)
export type ResourceArray = Record<string, Resource>

export interface Local {
  base: string
  eval: string
  path: vscode.Uri | undefined
  level: number
  type: string
  evalcomplete: boolean
}

export type LocalArray = Record<string, Local>

export interface UsefulPaths {
  activeEditorPath: vscode.Uri
  terraformRootPath: string
  filename: string
}

export interface CommonQuickPicks {
  projectId: string
  datasetId: string
}

export interface TableQuickPicks {
  partitionField: string | undefined
  clusterField: string[] | undefined
}
