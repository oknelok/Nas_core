// components/tasks/WebformField.tsx
import FileAttachment from '@/components/tasks/FileAttachment'
import type { WebformFieldDef } from '@/types/maestro'

interface Props {
  fieldKey: string
  field: WebformFieldDef
  value: unknown
  onChange: (key: string, value: unknown) => void
}

export default function WebformField({ fieldKey, field, value, onChange }: Props) {
  const options = field['#options'] ?? {}
  const disabled = field['#disabled'] === true

  // Fields with #access: false are hidden from the user entirely.
  if (field['#access'] === false) return null

  function renderInput() {
    switch (field['#type']) {
      case 'textfield':
        return (
          <input
            id={fieldKey}
            type="text"
            value={(value as string) ?? ''}
            required={field['#required']}
            disabled={disabled}
            onChange={e => onChange(fieldKey, e.target.value)}
          />
        )
      case 'textarea':
        return (
          <textarea
            id={fieldKey}
            value={(value as string) ?? ''}
            required={field['#required']}
            disabled={disabled}
            onChange={e => onChange(fieldKey, e.target.value)}
          />
        )
      case 'date':
        return (
          <input
            id={fieldKey}
            type="date"
            value={(value as string) ?? ''}
            required={field['#required']}
            disabled={disabled}
            onChange={e => onChange(fieldKey, e.target.value)}
          />
        )
      case 'select':
        return (
          <select
            id={fieldKey}
            value={(value as string) ?? ''}
            required={field['#required']}
            disabled={disabled}
            onChange={e => onChange(fieldKey, e.target.value)}
          >
            <option value="">— Select —</option>
            {Object.entries(options).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        )
      case 'radios':
        return (
          <div id={fieldKey}>
            {Object.entries(options).map(([key, label]) => (
              <label key={key}>
                <input
                  type="radio"
                  name={fieldKey}
                  value={key}
                  checked={value === key}
                  disabled={disabled}
                  onChange={e => onChange(fieldKey, e.target.value)}
                />
                {label}
              </label>
            ))}
          </div>
        )
      case 'checkbox':
        return (
          <input
            id={fieldKey}
            type="checkbox"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={e => onChange(fieldKey, e.target.checked)}
          />
        )
      case 'checkboxes':
        return (
          <div id={fieldKey}>
            {Object.entries(options).map(([key, label]) => {
              const checked = Array.isArray(value) && (value as string[]).includes(key)
              return (
                <label key={key}>
                  <input
                    type="checkbox"
                    value={key}
                    checked={checked}
                    disabled={disabled}
                    onChange={e => {
                      const current = Array.isArray(value) ? (value as string[]) : []
                      onChange(
                        fieldKey,
                        e.target.checked ? [...current, key] : current.filter(v => v !== key)
                      )
                    }}
                  />
                  {label}
                </label>
              )
            })}
          </div>
        )
      case 'webform_image_file':
      case 'managed_file': {
        const existingFileId = typeof value === 'string' && value ? value : null
        return (
          <div>
            {existingFileId && (
              <div>
                <FileAttachment fileId={existingFileId} />
              </div>
            )}
            {!disabled && (
              <>
                <input
                  id={existingFileId ? undefined : fieldKey}
                  type="file"
                  required={!existingFileId && field['#required']}
                  onChange={e => onChange(fieldKey, e.target.files?.[0] ?? null)}
                />
                {existingFileId && <small> Select a file to replace the existing attachment</small>}
              </>
            )}
          </div>
        )
      }
      default:
        console.warn(`WebformField: unknown field type "${field['#type']}", rendering as text`)
        return (
          <input
            id={fieldKey}
            type="text"
            value={(value as string) ?? ''}
            disabled={disabled}
            onChange={e => onChange(fieldKey, e.target.value)}
          />
        )
    }
  }

  return (
    <div>
      <label htmlFor={fieldKey}>
        {field['#title']}
        {field['#required'] && ' *'}
      </label>
      {renderInput()}
    </div>
  )
}
