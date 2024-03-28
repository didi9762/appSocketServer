
import handleNewConnection from "./newConnectionFunc.js";
import baseUrl from "./url.js";
import WebSocket from "ws";

class Server {
  constructor() {
    this.clientsSend = new Set();
    this.clientsGet = new Set();
    this.server = new WebSocket.Server({ port: 8888 });
    this.server.on("connection", async (socket, req) => {
      await handleNewConnection(socket, req);
    });
  }
}

function startServer() {
  const server = new Server();
  console.log(`WebSocket server is running on ip:${baseUrl.replace(':12345','')} port 8888`);
}

export default startServer;
