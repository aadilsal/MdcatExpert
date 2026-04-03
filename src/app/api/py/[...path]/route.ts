import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PYTHON_BACKEND = "http://0.0.0.0:8000";

async function proxy(
  request: Request,
  resolvedParams: { path: string[] }
) {
  const pathSegment = resolvedParams.path?.join("/") ?? "";
  const url = `${PYTHON_BACKEND}/api/py/${pathSegment}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  let body: undefined | ArrayBuffer;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  try {
    const backendResponse = await fetch(url, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.delete("content-length");

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Proxy error for ${url}:`, error);
    return NextResponse.json(
      {
        error: "Failed to reach Python backend.",
        details: (error as Error).message,
      },
      { status: 502 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxy(request, resolvedParams);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxy(request, resolvedParams);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxy(request, resolvedParams);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxy(request, resolvedParams);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxy(request, resolvedParams);
}
