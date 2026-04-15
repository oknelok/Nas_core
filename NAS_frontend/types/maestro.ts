// types/maestro.ts

export interface QueueProcess {
  drupal_internal__process_id: number
  process_name: string
}

export interface QueueItemTaskData {
  webform_machine_name: string
  show_edit_form: boolean
}

export interface QueueItem {
  id: string // JSON:API token (non-guessable)
  type: string
  attributes: {
    drupal_internal__id: number
    task_label: string
    task_class_name: string
    started_date: number // Unix timestamp (seconds)
    task_data: QueueItemTaskData
    entity_identifier_id: string | null
  }
  relationships: {
    process_id: {
      data: { id: string; type: string } | null
    }
  }
}

export interface IncludedProcess {
  id: string
  type: string
  attributes: QueueProcess
}

export interface QueueListResponse {
  data: QueueItem[]
  included?: IncludedProcess[]
}

export interface QueueItemResponse {
  data: QueueItem
  included?: IncludedProcess[]
}

export interface WebformFieldDef {
  '#type': string
  '#title': string
  '#required'?: boolean
  '#disabled'?: boolean
  '#access'?: boolean
  '#options'?: Record<string, string>
  '#default_value'?: unknown
  '#webform_key': string
}

export type WebformFieldsResponse = Record<string, WebformFieldDef>

export interface TaskConsoleRow {
  id: string           // integer queue ID as string — used for maestro[queue_id]
  task_label: string
  process_name: string
  created: string      // unix timestamp as string
  active_handler: string  // e.g. http://drupal/maestro/execute/task/{token}/notmodal
}

export type TaskConsoleResponse = TaskConsoleRow[]

export interface FileEntityAttributes {
  drupal_internal__fid: number
  filename: string
  uri: { value: string; url: string }
  filemime: string
  filesize: number
}

export interface FileEntityResponse {
  data: Array<{ attributes: FileEntityAttributes }>
}

export interface WebformSubmissionResponse {
  data: Record<string, string>
}
