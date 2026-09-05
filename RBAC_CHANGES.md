# Role & Permission Changes

Implemented owner-controlled staff access.

## Owner
- Create manager, supervisor, or accountant accounts.
- Set the initial password.
- Edit staff role and permissions.
- Activate/deactivate staff accounts.
- Reset a staff member's password.
- Company settings remain owner-only.

## Labourer permissions
- `labourers.view`
- `labourers.create`
- `labourers.update`
- `labourers.delete` (deactivation; labour history is preserved)

## Attendance permissions
- `attendance.view`
- `attendance.create`
- `attendance.update`

Attendance writes are checked on the backend. Creating a new entry requires `attendance.create`; overwriting existing attendance requires `attendance.update`.

## Defaults
Existing users without an explicit permissions array continue to use safe role defaults:
- Manager: labourer management + attendance + selected operational views.
- Supervisor: view labourers + view/mark attendance.
- Accountant: payroll + payments + reports.
- Owner: full access.

## Security
User-management API routes are owner-only. Staff password resets use a dedicated endpoint and passwords are never returned or logged.

Do not commit `.env` files. The delivered archive intentionally excludes local `.env` files, `.git`, `node_modules`, and build output.
