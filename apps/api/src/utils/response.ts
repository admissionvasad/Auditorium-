export function success(data: unknown, requestId = 'REQ-000000') {
  return { success: true, data, requestId };
}

export function failure(code: string, message: string, requestId = 'REQ-000000') {
  return {
    success: false,
    error: { code, message },
    requestId,
  };
}
