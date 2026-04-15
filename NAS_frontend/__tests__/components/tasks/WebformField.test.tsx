import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WebformField from '@/components/tasks/WebformField'
import type { WebformFieldDef } from '@/types/maestro'

function field(overrides: Partial<WebformFieldDef>): WebformFieldDef {
  return { '#type': 'textfield', '#title': 'My Field', '#webform_key': 'my_field', ...overrides }
}

describe('WebformField', () => {
  it('renders a text input for textfield', () => {
    render(<WebformField fieldKey="name" field={field({ '#type': 'textfield', '#title': 'Name' })} value="" onChange={jest.fn()} />)
    expect(screen.getByLabelText(/name/i)).toHaveAttribute('type', 'text')
  })

  it('renders a textarea for textarea', () => {
    render(<WebformField fieldKey="notes" field={field({ '#type': 'textarea', '#title': 'Notes' })} value="" onChange={jest.fn()} />)
    expect(screen.getByLabelText(/notes/i).tagName).toBe('TEXTAREA')
  })

  it('renders a date input for date', () => {
    render(<WebformField fieldKey="dt" field={field({ '#type': 'date', '#title': 'Date' })} value="" onChange={jest.fn()} />)
    expect(screen.getByLabelText(/date/i)).toHaveAttribute('type', 'date')
  })

  it('renders a select for select type', () => {
    render(<WebformField fieldKey="color" field={field({ '#type': 'select', '#title': 'Color', '#options': { red: 'Red', blue: 'Blue' } })} value="" onChange={jest.fn()} />)
    expect(screen.getByLabelText(/color/i).tagName).toBe('SELECT')
    expect(screen.getByRole('option', { name: 'Red' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Blue' })).toBeInTheDocument()
  })

  it('renders radio buttons for radios type', () => {
    render(<WebformField fieldKey="size" field={field({ '#type': 'radios', '#title': 'Size', '#options': { sm: 'Small', lg: 'Large' } })} value="" onChange={jest.fn()} />)
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('renders checkboxes for checkboxes type', () => {
    render(<WebformField fieldKey="tags" field={field({ '#type': 'checkboxes', '#title': 'Tags', '#options': { a: 'Alpha', b: 'Beta' } })} value={[]} onChange={jest.fn()} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('renders a file input for webform_image_file', () => {
    render(<WebformField fieldKey="img" field={field({ '#type': 'webform_image_file', '#title': 'Image' })} value={null} onChange={jest.fn()} />)
    expect(screen.getByLabelText(/image/i)).toHaveAttribute('type', 'file')
  })

  it('calls onChange with new value when text input changes', async () => {
    const handleChange = jest.fn()
    render(<WebformField fieldKey="name" field={field({ '#type': 'textfield', '#title': 'Name' })} value="" onChange={handleChange} />)
    await userEvent.type(screen.getByLabelText(/name/i), 'A')
    expect(handleChange).toHaveBeenCalledWith('name', 'A')
  })

  it('calls onChange with File when file input changes', async () => {
    const handleChange = jest.fn()
    render(<WebformField fieldKey="img" field={field({ '#type': 'webform_image_file', '#title': 'Image' })} value={null} onChange={handleChange} />)
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText(/image/i), file)
    expect(handleChange).toHaveBeenCalledWith('img', file)
  })
})
