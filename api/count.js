import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    const { rows } = await sql`SELECT count FROM counters WHERE id = 1;`;
    const count = rows[0]?.count || 0;
    return response.status(200).json({ count });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
