import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get('session');

  if (!session) {
    event.locals.user = null;
  } else {
    // In a real app, you would verify this session in the DB or via JWT
    // For this lightweight implementation, we'll trust the cookie presence
    // but we could also do: const user = await db.users.findOne({ email: session });
    event.locals.user = { email: session };
  }

  const response = await resolve(event);
  return response;
};
