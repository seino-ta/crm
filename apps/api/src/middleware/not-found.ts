import type { AppContext } from '../types/runtime';
import { errorResponse } from '../utils/response';

export function handleNotFound(c: AppContext) {
  return c.json(errorResponse(`Route ${c.req.method} ${c.req.path} not found`), 404);
}
