import { json } from '@sveltejs/kit';
import { getUsersCollection } from '$lib/server/db';
import bcrypt from 'bcryptjs';

export async function POST({ request, cookies }) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return json({ error: 'Email and password are required.' }, { status: 400 });
    }

    console.log(`>>> Login attempt for: ${email}`);
    const users = await getUsersCollection();
    const user = await users.findOne({ email: email.toLowerCase() });

    if (!user || !user.password) {
      console.log(`>>> Login failed: User not found (${email})`);
      return json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    console.log(`>>> Comparing password for: ${email}`);
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log(`>>> Login failed: Invalid password (${email})`);
      return json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    console.log(`>>> Login success: ${email}`);

    // Set simple session cookie
    cookies.set('session', email.toLowerCase(), {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: 'Login failed.', details: message }, { status: 500 });
  }
}
