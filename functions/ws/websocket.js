export async function onRequest(context) {
    // Check if the request is a WebSocket upgrade request
    if (context.request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }
  
    // Create the WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
  
    // Accept the WebSocket connection
    server.accept();
  
    // Set up a broadcast mechanism using Durable Objects
    server.addEventListener("message", async (event) => {
      try {
        // Broadcast the message to all connected clients
        const message = event.data;
        context.waitUntil(broadcast(message, server, context));
      } catch (err) {
        console.error("Error processing message:", err);
      }
    });
  
    // Handle connection closure
    server.addEventListener("close", async () => {
      console.log("Connection closed");
    });
  
    // Return the client socket
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
  
  async function broadcast(message, sender, context) {
    // For now, just echo back to the sender
    // In a full implementation, you'd want to maintain a list of connections
    // and broadcast to all except the sender
    sender.send(message);
  }