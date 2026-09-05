export function ok(res, data = {}, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function created(res, data = {}, message = 'Created') {
  return ok(res, data, message, 201);
}

export function fail(res, message = 'Something went wrong', status = 400, errors = []) {
  return res.status(status).json({ success: false, message, errors });
}
