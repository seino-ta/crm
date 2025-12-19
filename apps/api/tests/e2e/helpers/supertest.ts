import { getRequestListener } from '@hono/node-server';
import request from 'supertest';

import app from '../../../src/app';
import { initNodeRuntimeConfig } from '../../../src/config/node';

initNodeRuntimeConfig();

const listener = getRequestListener(app.fetch);

export const api = () => request(listener);
