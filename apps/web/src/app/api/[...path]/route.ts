const DEFAULT_API_URL = 'http://localhost:3001/api';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function getApiBaseUrl(): string {
  return (process.env.API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');
}

async function proxyRequest(request: Request, method: string, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const targetUrl = new URL(`${getApiBaseUrl()}/${path.join('/')}`);
  const requestUrl = new URL(request.url);
  targetUrl.search = requestUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const init: RequestInit = {
    method,
    headers,
  };

  if (method !== 'GET' && method !== 'HEAD') {
    const body = await request.text();
    if (body) {
      init.body = body;
    }
  }

  const response = await fetch(targetUrl.toString(), init);

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return proxyRequest(request, 'GET', context);
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return proxyRequest(request, 'POST', context);
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  return proxyRequest(request, 'PUT', context);
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return proxyRequest(request, 'PATCH', context);
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return proxyRequest(request, 'DELETE', context);
}

export async function OPTIONS(request: Request, context: RouteContext): Promise<Response> {
  return proxyRequest(request, 'OPTIONS', context);
}
