// pages/tasks/[token].tsx
import { useState, useRef, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import WebformField from '@/components/tasks/WebformField'
import { drupalGet, drupalPost, drupalPatch, drupalFileUpload, DrupalClientError } from '@/lib/drupal-client'
import type { QueueItemResponse, WebformFieldsResponse, WebformSubmissionResponse } from '@/types/maestro'

export default function TaskPage() {
  const router = useRouter()
  const { token } = router.query as { token?: string }

  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [fileInputs, setFileInputs] = useState<Record<string, File | File[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: queueDataRaw, error: queueError } = useSWR<QueueItemResponse>(
    token ? `jsonapi/maestro_queue/maestro_queue/${token}?include=process_id` : null,
    drupalGet,
    { revalidateOnFocus: false }
  )

  // Cache data in refs so re-renders triggered by submit state changes
  // don't lose the fetched values when the SWR mock returns undefined.
  const queueDataRef = useRef<QueueItemResponse | undefined>(undefined)
  if (queueDataRaw !== undefined) queueDataRef.current = queueDataRaw
  const queueData = queueDataRef.current

  const queueItem = queueData?.data
  const webformId = queueItem?.attributes.task_data.webform_machine_name
  const entityIdentifierUuid = queueItem?.attributes.entity_identifier_id ?? null

  const { data: fieldsDataRaw, error: fieldsError } = useSWR<WebformFieldsResponse>(
    webformId ? `webform_rest/${webformId}/fields` : null,
    drupalGet,
    { revalidateOnFocus: false }
  )

  const fieldsDataRef = useRef<WebformFieldsResponse | undefined>(undefined)
  if (fieldsDataRaw !== undefined) fieldsDataRef.current = fieldsDataRaw
  const fieldsData = fieldsDataRef.current

  const { data: submissionData, error: submissionError } = useSWR<WebformSubmissionResponse>(
    entityIdentifierUuid && webformId
      ? `webform_rest/${webformId}/submission/${entityIdentifierUuid}`
      : null,
    drupalGet,
    { revalidateOnFocus: false }
  )

  // Pre-populate form when existing submission data arrives.
  // No guard ref needed — revalidateOnFocus:false means submissionData only arrives once.
  useEffect(() => {
    if (submissionData?.data) setFormData(submissionData.data as Record<string, unknown>)
  }, [submissionData])

  function handleFieldChange(key: string, value: unknown) {
    if (Array.isArray(value) && value.every(v => v instanceof File)) {
      setFileInputs(prev => ({ ...prev, [key]: value as File[] }))
    } else if (value instanceof File) {
      setFileInputs(prev => ({ ...prev, [key]: value }))
    } else if (value === null) {
      setFileInputs(prev => { const next = { ...prev }; delete next[key]; return next })
    } else {
      setFormData(prev => ({ ...prev, [key]: value }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!queueItem || !webformId) return
    setSubmitting(true)
    setSubmitError(null)

    const resolvedFiles: Record<string, number | number[]> = {}
    for (const [key, fileOrFiles] of Object.entries(fileInputs)) {
      try {
        if (Array.isArray(fileOrFiles)) {
          resolvedFiles[key] = await Promise.all(
            fileOrFiles.map(f => drupalFileUpload('webform_submission', webformId, key, f))
          )
        } else {
          resolvedFiles[key] = await drupalFileUpload('webform_submission', webformId, key, fileOrFiles)
        }
      } catch {
        setSubmitError('File upload failed. Please try again.')
        setSubmitting(false)
        return
      }
    }

    const processId = queueData?.included?.find(
      i => i.id === queueItem.relationships.process_id.data?.id
    )?.attributes.drupal_internal__process_id ?? 0

    const body: Record<string, unknown> = {
      webform_id: webformId,
      ...formData,
      ...resolvedFiles,
      // Always last — must not be overwritten by pre-populated submission data
      maestro: { type: webformId, queue_id: token, process_id: processId },
    }

    try {
      if (entityIdentifierUuid) {
        await drupalPatch(
          `webform_rest/${webformId}/submission/${entityIdentifierUuid}`,
          body
        )
      } else {
        await drupalPost('webform_rest/submit', body)
      }
      router.push('/tasks?completed=1')
    } catch (err) {
      if (err instanceof DrupalClientError) {
        if (err.status === 502) {
          setSubmitError('Service unavailable — please try again.')
        } else {
          const body = err.body as { message?: string; error?: Record<string, string> } | undefined
          if (body?.error && typeof body.error === 'object') {
            const messages = Object.values(body.error)
              .map(msg => msg.replace(/<[^>]+>/g, ''))
              .join(' ')
            setSubmitError(messages || body.message || 'Submission failed. Please check your input and try again.')
          } else if (body?.message) {
            setSubmitError(body.message)
          } else {
            setSubmitError('Submission failed. Please check your input and try again.')
          }
        }
      } else {
        setSubmitError('Submission failed. Please check your input and try again.')
      }
      setSubmitting(false)
    }
  }

  if (queueError) {
    return (
      <main>
        <p role="alert">Task not found.</p>
        <Link href="/tasks">Back to console</Link>
      </main>
    )
  }

  if (fieldsError) {
    return (
      <main>
        <p role="alert">Unable to load form.</p>
        <Link href="/tasks">Back to console</Link>
      </main>
    )
  }

  // Wait for submission data if this task has an existing submission to pre-populate.
  // If the submission fetch errors, continue without pre-population rather than blocking.
  const submissionPending = entityIdentifierUuid && !submissionData && !submissionError
  if (!queueData?.data || !fieldsData || submissionPending) {
    return <main><p>Loading…</p></main>
  }

  const item = queueData.data

  return (
    <main>
      <Link href="/tasks">← Back to Task Console</Link>
      <h1>{item.attributes.task_label}</h1>
      <form onSubmit={handleSubmit} noValidate>
        <input type="hidden" name="maestro_token" value={token ?? ''} readOnly />
        {Object.entries(fieldsData).map(([key, fieldDef]) => (
          <WebformField
            key={key}
            fieldKey={key}
            field={fieldDef}
            value={formData[key] ?? ''}
            onChange={handleFieldChange}
          />
        ))}
        {submitError && <p role="alert">{submitError}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </main>
  )
}
