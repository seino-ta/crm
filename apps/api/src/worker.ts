import type { ExecutionContext } from '@cloudflare/workers-types';

import app from './app';
import { ensureRuntimeConfigFromBindings } from './config/cloudflare';
import { bindEdgeBindings } from './lib/prisma';
import type { AppBindings } from './types/runtime';

export default {
  fetch(request: Request, env: AppBindings, ctx: ExecutionContext) {
    ensureRuntimeConfigFromBindings(env);
    bindEdgeBindings(env);
    return app.fetch(request, env, ctx);
  },
};
