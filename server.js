import WebSocket from "ws";
import openMissions from "./openMissions.js";
import {verifyToken} from "./verify.js";

class Server {
  constructor() {
    this.clientsSend = new Set();
    this.clientsGet = new Set();
    this.server = new WebSocket.Server({port: 8888 });

    this.server.on("connection", async (socket, req) => {
      console.log('try to cnnect');
      await verifyToken(req, connectUser);

      function connectUser(userVerify) {
        console.log(userVerify);
        if (!userVerify) {
          socket.close();
          return;
        }
        console.log(`Client connected: ${socket._socket.remoteAddress}`);
      }
      socket.once("message", (event) => {
        try {
          const clientData = JSON.parse(event);
          console.log("Client details:", clientData, "connected");
          const existingClientSend = [...this.clientsSend].find(
            (client) => client.id === clientData.id
          );
          const existingClientGet = [...this.clientsGet].find(
            (client) => client.id === clientData.id
          );
          if (existingClientGet || existingClientSend) {
            socket.send(JSON.stringify({type:'note', message: "already connected" }));
            return;
          }
          if (clientData.send) {
            this.clientsSend.add({ id: clientData.id, socket: socket });
            socket.addEventListener("message", (event) => {
              const data = JSON.parse(event.data);
              openMissions.set(data.id, data);
              console.log("open:", openMissions);
              this.broadcast(JSON.stringify(data));
            });
          } else if (!clientData.send) {
            this.clientsGet.add({ id: clientData.id, socket: socket });
            socket.addEventListener("message", (event) => {
              const data = JSON.parse(event.data);
              if (data.type === "save") {
                console.log('try save');
                const updateMission = openMissions.get(data.missionId);
                if (!updateMission) {
                  return;
                } else if (updateMission.save) {
                  socket.send(
                    JSON.stringify({type:'unsuccess',
                      message: "the mission is on hold try later",
                    })
                  );
                  return;
                } 
                else if (updateMission.close) {
                  socket.send(
                    JSON.stringify({type:'error', message: "mission already taken" })
                  );
                  return;
                } else if (updateMission.open) {
                  const sender = [...this.clientsSend].find(client => client.id === updateMission.sender);
                if(!sender||!sender.socket){console.log('error sender');socket.send(JSON.stringify({type:'error',message:'cant hold mission, sender disconnect'}))}
                
                else{
                  socket.send(JSON.stringify({type:'success',message:'masseges sent to the sender wait for his answer'}))
                  updateMission.save = true;
                  updateMission.open = false;
                  openMissions.set(data.missionId, updateMission);
                
                console.log("update mission:", updateMission);
                sender.socket.send(JSON.stringify({'mission':updateMission.id,'client':clientData.detailes}))
                this.broadcast(JSON.stringify(updateMission)); 
                socket.send(JSON.stringify(updateMission));}}
              }
            });
          }

          socket.addEventListener("close", () => {
            console.log(`Client disconnected: ${clientData.id}`);
            const sendClient = [...this.clientsSend].find((client) => client.id === clientData.id && client.socket === socket);
            if (sendClient) {
              this.clientsSend.delete(sendClient);
            }
            const getClient = [...this.clientsGet].find((client) => client.id === clientData.id && client.socket === socket);
            if (getClient) {
              this.clientsGet.delete(getClient);
            }
          });
        } catch (e) {
          console.log(e);
        }
      });
    });
  }
  async broadcast(message) {
    try {
      console.log();
      this.clientsGet.forEach((client) => {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(message);
        }
      });
    } catch (err) {
      console.log(err);
    }
  }
}

function startServer() {
  const server = new Server();
  console.log("WebSocket server is running on port 8888");
}


export default startServer;
