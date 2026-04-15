// __tests__/mocks/drupal-handlers.ts
import { http, HttpResponse } from 'msw'

export const DRUPAL_BASE = 'http://drupal.test'

export const MOCK_QUEUE_ITEM = {
  id: 'test-token-abc123',
  type: 'maestro_queue--maestro_queue',
  attributes: {
    drupal_internal__id: 1614,
    task_label: 'Issue With Your Receipt',
    task_class_name: 'MaestroWebform',
    started_date: 1774298042,
    task_data: {
      webform_machine_name: 'simple_expense_report_example',
      show_edit_form: false,
    },
  },
  relationships: {
    process_id: { data: { id: 'process-uuid-1', type: 'maestro_process--maestro_process' } },
  },
}

export const MOCK_PROCESS = {
  id: 'process-uuid-1',
  type: 'maestro_process--maestro_process',
  attributes: {
    drupal_internal__process_id: 102,
    process_name: 'Expense Report Workflow',
  },
}

export const MOCK_WEBFORM_FIELDS = {
  date: {
    '#type': 'date',
    '#title': 'Date',
    '#required': true,
    '#webform_key': 'date',
  },
  expense_total: {
    '#type': 'textfield',
    '#title': 'Expense Total',
    '#required': false,
    '#webform_key': 'expense_total',
  },
  notes: {
    '#type': 'textarea',
    '#title': 'Notes',
    '#required': false,
    '#webform_key': 'notes',
  },
  receipt_upload: {
    '#type': 'webform_image_file',
    '#title': 'Receipt Upload',
    '#required': false,
    '#webform_key': 'receipt_upload',
  },
}

export const drupalHandlers = [
  // Auth
  http.post(`${DRUPAL_BASE}/user/login`, async ({ request }) => {
    const body = await request.json() as { name: string; pass: string }
    if (body.name === 'admin' && body.pass === 'correct') {
      return HttpResponse.json(
        {
          current_user: { uid: '1', name: 'admin', roles: ['authenticated', 'administrator'] },
          csrf_token: 'test-csrf-token',
          logout_token: 'test-logout-token',
        },
        { headers: { 'Set-Cookie': 'SESSabc=xyz; Path=/; HttpOnly' } }
      )
    }
    return HttpResponse.json({ message: 'Sorry, unrecognized username or password.' }, { status: 403 })
  }),

  http.post(`${DRUPAL_BASE}/user/logout`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Queue list
  http.get(`${DRUPAL_BASE}/jsonapi/maestro_queue/maestro_queue`, () => {
    return HttpResponse.json({
      data: [MOCK_QUEUE_ITEM],
      included: [MOCK_PROCESS],
    })
  }),

  // Single queue item by token
  http.get(`${DRUPAL_BASE}/jsonapi/maestro_queue/maestro_queue/:token`, ({ params }) => {
    if (params.token === MOCK_QUEUE_ITEM.id) {
      return HttpResponse.json({ data: MOCK_QUEUE_ITEM, included: [MOCK_PROCESS] })
    }
    return HttpResponse.json({ errors: [{ status: '404', title: 'Not found' }] }, { status: 404 })
  }),

  // Webform fields
  http.get(`${DRUPAL_BASE}/webform_rest/simple_expense_report_example/fields`, () => {
    return HttpResponse.json(MOCK_WEBFORM_FIELDS)
  }),

  // Webform submit
  http.post(`${DRUPAL_BASE}/webform_rest/submit`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    if (!body['maestro[queue_id]'] || !body['maestro[process_id]'] || !body['maestro[type]']) {
      return HttpResponse.json({ message: 'Missing maestro fields' }, { status: 400 })
    }
    return HttpResponse.json({ sid: 99 }, { status: 201 })
  }),

  // File upload
  http.post(`${DRUPAL_BASE}/file/upload/webform_submission/:bundle/:field`, () => {
    return HttpResponse.json({ fid: [{ value: 7 }] })
  }),
]
