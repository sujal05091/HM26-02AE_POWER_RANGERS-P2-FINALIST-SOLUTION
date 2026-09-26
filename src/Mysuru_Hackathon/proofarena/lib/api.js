// Wraps a route handler: returns JSON, and turns thrown errors into a 400 with a message.
export function handle(fn) {
  return async (request, context) => {
    try {
      const result = await fn(request, context);
      return Response.json(result ?? { ok: true });
    } catch (err) {
      console.error('[api]', err);
      return Response.json({ error: err.message }, { status: 400 });
    }
  };
}

export async function body(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function required(obj, fields) {
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || String(obj[f]).trim() === '') {
      throw new Error(`Please fill in ${f}`);
    }
  }
}
