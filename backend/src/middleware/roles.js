import { fail } from "../utils/response.js";
export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return fail(res, "You are not authorized for this resource", 403);
  }
  next();
};
