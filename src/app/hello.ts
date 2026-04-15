export const helloHandler = {
  get: () =>
    new Response("Hello, world!", {
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    }),
}
