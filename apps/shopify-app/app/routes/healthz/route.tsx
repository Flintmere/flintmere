export async function loader() {
  return Response.json(
    {
      status: 'ok',
      service: 'flintmere-shopify-app',
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
