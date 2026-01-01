import { prisma } from '../prisma';

export interface NetworkRequestData {
  requestUrl: string;
  requestMethod?: string;
  requestBody?: string;
  requestHeaders?: string;
  responseStatus?: number;
  responseBody?: string;
  responseHeaders?: string;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  source: 'arxiv' | 'semantic-scholar';
  arxivPaperId?: string;
}

export async function saveNetworkRequest(data: NetworkRequestData) {
  try {
    const request = await prisma.networkRequest.create({
      data: {
        requestUrl: data.requestUrl,
        requestMethod: data.requestMethod || 'GET',
        requestBody: data.requestBody,
        requestHeaders: data.requestHeaders,
        responseStatus: data.responseStatus,
        responseBody: data.responseBody,
        responseHeaders: data.responseHeaders,
        duration: data.duration,
        success: data.success,
        errorMessage: data.errorMessage,
        source: data.source,
        arxivPaperId: data.arxivPaperId,
      },
    });

    return request;
  } catch (error) {
    console.error('保存网络请求记录失败:', error);
    throw error;
  }
}

export async function recordNetworkRequest(
  source: 'arxiv' | 'semantic-scholar',
  requestUrl: string,
  requestFn: () => Promise<Response>,
  arxivPaperId?: string,
) {
  const startTime = Date.now();

  try {
    const response = await requestFn();
    const duration = Date.now() - startTime;

    const responseHeaders = JSON.stringify(Object.fromEntries(response.headers.entries()));

    await saveNetworkRequest({
      requestUrl,
      requestMethod: 'GET',
      responseStatus: response.status,
      responseHeaders,
      duration,
      success: response.ok,
      errorMessage: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
      source,
      arxivPaperId,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    await saveNetworkRequest({
      requestUrl,
      requestMethod: 'GET',
      duration,
      success: false,
      errorMessage,
      source,
      arxivPaperId,
    });

    throw error;
  }
}
