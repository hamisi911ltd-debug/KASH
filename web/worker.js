/* One Worker for both KASH front ends. The website lives under /site and the
   ERP under /erp inside the same asset bundle; the hostname picks which one
   a visitor gets. The data API stays in its own Worker (kash-api-live). */
const ERP_PREFIX = /^erp\./;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const erp = ERP_PREFIX.test(url.hostname);
    const root = erp ? "/erp" : "/site";
    const asset = (path) => env.ASSETS.fetch(new Request(new URL(root + path, url), request));

    let res = await asset(url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname);
    // The ERP is a single-page app: any path that is not a real file opens the app.
    if (erp && res.status === 404 && request.method === "GET" && !/\.[a-z0-9]+$/i.test(url.pathname)) {
      res = await asset("/index.html");
    }
    // Never let a missing file be cached as if it were permanent.
    if (res.status === 404) {
      res = new Response(res.body, res);
      res.headers.set("Cache-Control", "no-store");
    }
    return res;
  },
};
