import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  // This function only accepts POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Increment the counter and return the new value in one step
    const { rows } = await sql`
      UPDATE counters
      SET count = count + 1
      WHERE id = 1
      RETURNING count;
    `;
    const newCount = rows[0].count;
    return response.status(200).json({ count: newCount });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
