export class DisplayController {
    constructor(state, env) {
      this.state = state;
      this.sessions = new Set();
    }
  
    async handleConnection(webSocket) {
      this.sessions.add(webSocket);
      
      webSocket.addEventListener('message', async (msg) => {
        const message = msg.data;
        this.broadcast(message, webSocket);
      });
  
      webSocket.addEventListener('close', async () => {
        this.sessions.delete(webSocket);
      });
    }
  
    broadcast(message, exclude) {
      this.sessions.forEach((session) => {
        if (session !== exclude && session.readyState === 1) {
          session.send(message);
        }
      });
    }
  }
  
  export default {
    async fetch(request, env, ctx) {
      if (request.headers.get('Upgrade') === 'websocket') {
        const [client, server] = Object.values(new WebSocketPair());
        const controller = new DisplayController(null, env);
        
        controller.handleConnection(server);
        
        return new Response(null, {
          status: 101,
          webSocket: client
        });
      }
  
      return new Response('Expected WebSocket', { status: 400 });
    }
  };