import WebSocket from "ws";
import {
  addToHistory,
  updateOpenMissions,
  saveMission,
  closeMission,
  rejectSave,
} from "./openMissionsFunctions.js";
import { verifyToken } from "./verify.js";
import baseUrl from "./url.js";
import {  taskDone } from "./closeMissionsFunction.js";

class Server {
  constructor() {
    this.clientsSend = new Set();
    this.clientsGet = new Set();
    this.server = new WebSocket.Server({ port: 8888 });

    this.server.on("connection", async (socket, req) => {
      const isvalid = await verifyToken(req, connectUser)
      if(!isvalid){console.log('err'); socket.close();return}
      function connectUser(userVerify) {
        console.log('user:',userVerify);
        console.log(`Client try connect: ${socket._socket.remoteAddress}`);
        return true
      }
      socket.once("message", (event) => {
        try {
          const clientData = JSON.parse(event);
          const existingClientSend = [...this.clientsSend].find(
            (client) => client.id === clientData.id
          );
          const existingClientGet = [...this.clientsGet].find(
            (client) => client.id === clientData.id
          );
          if (existingClientGet || existingClientSend) {
            socket.send(
              JSON.stringify({ type: "note", message: "already connected" })
            );
            return;
          }
          console.log("Client details:", clientData.id, "connected");
          console.log("new connection");
          if (clientData.send) {
            this.clientsSend.add({
              group: clientData.group,
              id: clientData.id,
              socket: socket,
            });
            socket.addEventListener("message", async (event) => {
              //event listners for new task from sender and to confirm saving
              const data = JSON.parse(event.data);
              if (data.type) {
                //cofirm saving task and send massage to delivery guy
                if (data.type === "confirm") {
                  const client = [...this.clientsGet].find(
                    (client) => client.id === data.client
                  );
                  const res = await closeMission(data.missionId);
                  if (res === "succes-close") {
                    try {
                      client.socket.send(
                        JSON.stringify({
                          type: "close",
                          mission: data.missionId,
                        })
                      );
                    } catch (e) {
                      console.log(
                        "error while tryng send the close message to client:",
                        e
                      );
                    }
                  } else {
                    client.socket.send(
                      JSON.stringify({
                        type: "unsuccess",
                        message: "the mission is on hold try later",
                      })
                    );
                  }
                }
                //handle reject save from sender
                else if(data.type==='reject'){
                  const client = [...this.clientsGet].find(
                    (client) => client.id === data.client
                  );
                  const res = await rejectSave(data.missionId)
                  if(res==='ok'){
                  try {
                    client.socket.send(
                      JSON.stringify({
                        type: "reject",
                        address:data.address,
                        sender:data.sender
                      })
                    );
                  } catch (e) {
                    console.log(
                      "error while tryng send the close message to client:",
                      e
                    );
                  }}
                  else {
                    console.log('error try reject task saving:',res);
                  }
                }
                
                else if (data.type === "privet") {
                  updateOpenMissions(data.newTask);
                  this.broadcast(
                    JSON.stringify(data.newTask),
                    data.newTask.sender
                  );
                }
              } else {
                updateOpenMissions(data); //update the new task in the map of task in the http server
                this.broadcast(JSON.stringify(data), null);
              }
            });
          } else if (!clientData.send) {
            this.clientsGet.add({ id: clientData.id, socket: socket });
            socket.addEventListener("message", async (event) => {
              //event listner to save mission - massage from delivery guy.
              const data = JSON.parse(event.data);
              if (data.type === "save") {
                const res = await saveMission(
                  data.missionId,
                  data.userDetailes
                );
                if (!res) {
                  return;
                } else if (res === "already-in-hold") {
                  socket.send(
                    JSON.stringify({
                      type: "unsuccess",
                      message: "the mission is on hold try later",
                    })
                  );
                  return;
                } else if (res === "unsucces-close") {
                  socket.send(
                    JSON.stringify({
                      type: "error",
                      message: "mission already taken",
                    })
                  );
                  return;
                } else if (res.message === "hold-success") {
                  const updateMission = res.mission;
                  const sender = [...this.clientsSend].find(
                    (client) => client.id === updateMission.sender
                  );
                  if (!sender || !sender.socket) {
                    console.log("error sender disconnect");
                    socket.send(
                      JSON.stringify({
                        type: "error",
                        message: "mission hold but sender disconnect",
                      })
                    );
                    return;
                  } else {
                    socket.send(
                      JSON.stringify({
                        type: "success",
                        message:
                          "masseges sent to the sender wait for his answer",
                      })
                    );
                    sender.socket.send(
                      JSON.stringify({
                        mission: updateMission.id,
                        client: data.userDetailes,
                        address:updateMission.address
                      })
                    );
                    this.broadcast(JSON.stringify(updateMission));
                    socket.send(JSON.stringify(updateMission));
                  }
                }
              } else if (data.type === "done") {
                const sender = [...this.clientsSend].find(
                  (client) => client.id === data.sender
                );
                if (sender) {
                  sender.socket.send(
                    JSON.stringify({
                      type: "done",
                      missionId: data.missionId,
                      client: data.userDetailes,
                      address:data.address
                    })
                  );
                } else {
                  console.log("sender disconnect");
                  socket.send(
                    JSON.stringify({
                      type: "success",
                      message: "sender cant be reach try to inform",
                    })
                  );
                }
                taskDone(data.missionId, clientData.id);
              }
            });
          }

          socket.addEventListener("close", () => {
            console.log(`Client disconnected: ${clientData.id}`);
            const sendClient = [...this.clientsSend].find(
              (client) =>
                client.id === clientData.id && client.socket === socket
            );
            if (sendClient) {
              this.clientsSend.delete(sendClient);
            }
            const getClient = [...this.clientsGet].find(
              (client) =>
                client.id === clientData.id && client.socket === socket
            );
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
  async broadcast(wholeMessage, userSend) {
    const {
      id,
      type,
      open,
      saved,
      close,
      senderAddress,
      address,
      sender,
      price,
      wehicleType,
    } = JSON.parse(wholeMessage);
    const message = JSON.stringify({
      id,
      type,
      open,
      saved,
      close,
      senderAddress,
      address,
      sender,
      price,
      wehicleType,
    });
    if (userSend) {
      const sender = [...this.clientsSend].find(
        (client) => client.id === userSend
      );
      try {
        this.clientsGet.forEach((client) => {
          if (
            client.socket.readyState === WebSocket.OPEN &&
            sender.group.includes(client.id)
          ) {
            client.socket.send(message);
          }
        });
      } catch (err) {
        console.log(console.log("error try post task to team:", err));
      }
    } else {
      try {
        this.clientsGet.forEach((client) => {
          if (client.socket.readyState === WebSocket.OPEN) {
            client.socket.send(message);
          }
        });
      } catch (err) {
        console.log("error try post task to all:", err);
      }
    }
  }
}

function startServer() {
  const server = new Server();
  console.log(`WebSocket server is running on ip:${baseUrl} port 8888`);
}

export default startServer;
