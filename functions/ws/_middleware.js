export async function onRequest(context) {
    const url = new URL(context.request.url);
    
    // If the path is /ws, handle it with the WebSocket handler
    if (url.pathname === '/ws') {
      return context.env.WEBSOCKET.fetch(context.request);
    }
    
    // Otherwise, continue with the normal request
    return context.next();
  }