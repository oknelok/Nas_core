# NAS Workflow Specs

This directory holds business specification documents for Maestro workflow modules built on the NAS stack.

## How specs are created

Specs are produced through the Superpowers brainstorming process:

1. Describe the workflow need in natural language (images of flow diagrams are also accepted)
2. Superpowers brainstorming refines the intent through clarifying questions
3. The resulting spec is saved here as `{workflow-name}.md`
4. Superpowers writing-plans produces an implementation plan
5. Run `nas_workflow_build` to build the module into the running stack
   → See `NAS/CLAUDE.md` — nas_workflow_build tool for the full sequence

Specs can also be started inline in chat and saved here during the brainstorming session.

---

## Spec file format

Every spec file must follow this structure:

```markdown
# {Workflow Name} Spec

## Business Purpose
What problem this workflow solves and who it serves.

## Actors and Roles
List every human actor involved. For each: their Drupal role/username and what they do in the workflow.

## Workflow Steps
Natural language description of every step in sequence. Include branching logic ("if the manager rejects, the request returns to the submitter").

## Webform Fields
For each webform in the workflow: field label, field type, required/optional, any conditional logic.

## Branching / Conditional Logic
Explicit description of every decision point: what is evaluated, what happens on each branch.

## Process Variables
List every process variable needed: name, initial value, what sets it, what reads it.

## Assignment Rules
For each interactive task: who is assigned and how (fixed username, fixed role, or process variable holding a username/role).

## Success / Completion Criteria
What does "done" look like? What state is the system in when the workflow ends?

## Open Questions / Decisions Made
Track anything unresolved at spec time, and record decisions made during brainstorming with their rationale.
```

---

## One spec per workflow module

Each spec maps 1:1 to a generated custom Drupal module. The spec filename becomes the basis for the module machine name:

| Spec file | Module name | Template ID |
|---|---|---|
| `leave-request.md` | `nas_leave_request` | `nas_leave_request` |
| `expense-approval.md` | `nas_expense_approval` | `nas_expense_approval` |

Rule: replace hyphens with underscores, prepend `nas_`, drop `.md`. Module name and template ID are always identical.

The generated module at `NAS_base/drupal/web/modules/custom/{module_name}/` contains its own `CLAUDE.md` with the original spec embedded, so context is never lost across sessions.
