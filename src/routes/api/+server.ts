import { json } from '@sveltejs/kit';

export function GET() {
	return json({ message: 'API endpoint placeholder' });
}

export function POST({ request }: { request: Request }) {
	return json({ message: 'API endpoint placeholder' });
}