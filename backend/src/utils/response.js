export function ok(res, data = {}, message = "Success", status = 200) {
  return res.status(status).json({ success: true, message, data });
}
export function fail(res, message = "Request failed", status = 400, details) {
  return res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}
