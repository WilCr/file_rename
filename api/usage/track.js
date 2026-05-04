/**
 * Usage is recorded automatically when calling POST /api/rename-suggest.
 * This endpoint exists for API symmetry / future batch reporting.
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS')
    return res.status(204).end()
  }
  return res.status(405).json({
    error: 'Method not allowed',
    hint: 'Usage is tracked when you use AI rename via POST /api/rename-suggest',
  })
}
