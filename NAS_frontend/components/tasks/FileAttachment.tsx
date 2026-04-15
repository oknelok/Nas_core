// components/tasks/FileAttachment.tsx
import useSWR from 'swr'
import { drupalGet } from '@/lib/drupal-client'
import type { FileEntityResponse } from '@/types/maestro'

interface Props {
  fileId: string  // integer fid as string from submission data
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileAttachment({ fileId }: Props) {
  const { data, error } = useSWR<FileEntityResponse>(
    fileId ? `jsonapi/file/file?filter[drupal_internal__fid]=${fileId}` : null,
    drupalGet,
    { revalidateOnFocus: false }
  )

  if (error) return <span>File unavailable</span>
  if (!data) return <span>Loading…</span>

  const file = data.data?.[0]?.attributes
  if (!file) return <span>File not found</span>

  const downloadUrl = `/api/drupal${file.uri.url}`

  return (
    <span>
      <a href={downloadUrl} target="_blank" rel="noreferrer" download={file.filename}>
        {file.filename}
      </a>
      {' — '}
      {formatSize(file.filesize)}, {file.filemime}
    </span>
  )
}
