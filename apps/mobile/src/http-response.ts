export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/** Retain HTTP status even when a proxy responds with HTML or malformed JSON. */
export async function readMobileResponse(response: Response): Promise<unknown> {
  let body: unknown = null;
  try { body = await response.json(); }
  catch (error) { if (!(error instanceof SyntaxError)) throw error; }
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error : response.status === 401 ? "Please sign in again." : response.status === 404 ? "This service needs a server update. Please contact your platform administrator." : "The request could not be completed. Please try again.";
    throw new ApiError(message, response.status);
  }
  if (body === null) throw new ApiError("The server returned an unexpected response. Please try again.", 502);
  return body;
}
