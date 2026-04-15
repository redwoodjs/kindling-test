export function versionHandler(): Response {
  return Response.json({ version: "1.0.0" });
}
