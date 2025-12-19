import { Hono } from 'hono';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  contactFilterSchema,
  createContactSchema,
  updateContactSchema,
  type CreateContactInput,
  type UpdateContactInput,
} from '../modules/contact/contact.schema';
import { createContact, getContactById, listContacts, softDeleteContact, updateContact } from '../modules/contact/contact.service';
import type { AppEnv } from '../types/runtime';
import { getValidatedBody, requireUser } from '../utils/context';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.use('*', authenticate());

router.get('/', async (c) => {
  const parsed = contactFilterSchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw createError(422, 'Validation error', { details: parsed.error.flatten() });
  }
  const result = await listContacts(parsed.data);
  return c.json(successResponse(result.data, result.meta));
});

router.get('/:id', async (c) => {
  const { id } = c.req.param();
  const contact = await getContactById(id);
  return c.json(successResponse(contact));
});

router.post('/', validateBody(createContactSchema), async (c) => {
  const payload = getValidatedBody<CreateContactInput>(c);
  const user = requireUser(c);
  const contact = await createContact(payload, user.id);
  return c.json(successResponse(contact), 201);
});

router.put('/:id', validateBody(updateContactSchema), async (c) => {
  const { id } = c.req.param();
  const payload = getValidatedBody<UpdateContactInput>(c);
  const user = requireUser(c);
  const contact = await updateContact(id, payload, user.id);
  return c.json(successResponse(contact));
});

router.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await softDeleteContact(id, requireUser(c));
  return c.body(null, 204);
});

export default router;
