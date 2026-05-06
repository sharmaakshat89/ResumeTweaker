import { json } from '@sveltejs/kit';
import { getUsersCollection } from '$lib/server/db';
import bcrypt from 'bcryptjs';

export async function POST({ request, cookies }) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return json({ error: 'Email and password are required.' }, { status: 400 });
    }

    console.log(`>>> Registration attempt for: ${email}`);
    const users = await getUsersCollection();
    
    // Check user limit
    const userCount = await users.countDocuments();
    console.log(`>>> Current user count: ${userCount}`);
    if (userCount >= 5) {
      console.log(`>>> Registration failed: Limit reached (${userCount}/5)`);
      return json({ error: 'System is currently at maximum capacity (5 users). Please contact admin.' }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`>>> Registration failed: User exists (${email})`);
      return json({ error: 'User already exists. Please log in.' }, { status: 409 });
    }

    console.log(`>>> Hashing password and creating user: ${email}`);
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await users.insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    });

    console.log(`>>> Registration success: ${email}`);

    // Set simple session cookie (email for now, can be JWT/Token later)
    cookies.set('session', email.toLowerCase(), {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: 'Registration failed.', details: message }, { status: 500 });
  }
}
