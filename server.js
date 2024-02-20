import WebSocket from "ws";
import {updateOpenMissions,saveMission,closeMission} from './openMissionsFunctions.js'
import {verifyToken} from "./verify.js";
import baseUrl from "./url.js";
import { addCloseMission, taskDone } from "./closeMissionsFunction.js";


class Server {
  constructor() {
    this.clientsSend = new Set();
    this.clientsGet = new Set();
    this.server = new WebSocket.Server({port: 8888 });

    this.server.on("connection", async (socket, req) => {
      await verifyToken(req, connectUser);
      function connectUser(userVerify) {
        if (!userVerify) {
          socket.close();
          return;
        }
        console.log(`Client try connect: ${socket._socket.remoteAddress}`);
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
            socket.send(JSON.stringify({type:'note', message: "already connected" }));
            return;
          }
          console.log("Client details:", clientData, "connected");
          if (clientData.send) {
            console.log('new connection');
            this.clientsSend.add({ id: clientData.id, socket: socket });
            socket.addEventListener("message",async (event) => {//event listners for new task from sender and to confirm saving
              const data = JSON.parse(event.data);
              if(data.type){//cofirm saving task and send massage to delivery guy
                if(data.type==='confirm'){
                  const client = [...this.clientsGet].find(client => client.id === data.client);
                  const res = await closeMission(data.missionId)
                  if(res=== 'succes-close'){
                  client.socket.send(JSON.stringify({type:'close',mission:data.missionId}))
                  }
                  else{console.log('response from try close :',res);
                  client.socket.send( JSON.stringify({type:'unsuccess',
                  message: "the mission is on hold try later",}))
                }

                }
              }
              else{
              updateOpenMissions(data)//update the new task in the map of task in the http server
              this.broadcast(JSON.stringify(data));}
            });
            
          } else if (!clientData.send) {
            this.clientsGet.add({ id: clientData.id, socket: socket });
            socket.addEventListener("message", async(event) => {//event listner to save mission - massage from delivery guy.
              const data = JSON.parse(event.data);
              if (data.type === "save") {
                const res =await saveMission(data.missionId,data.userDetailes)
                if (!res) {
                  return;
                } else if (res === 'already-in-hold') {
                  socket.send(
                    JSON.stringify({type:'unsuccess',
                      message: "the mission is on hold try later",
                    })
                  );
                  return;
                } 
                else if (res==='unsucces-close') {
                  socket.send(
                    JSON.stringify({type:'error', message: "mission already taken" })
                  );
                  return;
                } else if (res.message ==='hold-success') {
                  const updateMission = res.mission
                  const sender = [...this.clientsSend].find(client => client.id === updateMission.sender);
                if(!sender||!sender.socket){console.log('error sender disconnect');socket.send(JSON.stringify({type:'error',message:'mission hold but sender disconnect'}));return}
                
                else{
                  socket.send(JSON.stringify({type:'success',message:'masseges sent to the sender wait for his answer'}))
                sender.socket.send(JSON.stringify({'mission':updateMission.id,'client':data.userDetailes}))
                this.broadcast(JSON.stringify(updateMission)); 
                socket.send(JSON.stringify(updateMission));}}
              }
              else if(data.type==='done'){
                const sender = [...this.clientsSend].find(client => client.id === data.sender);
                if(sender){
                  sender.socket.send(JSON.stringify({type:'done',missionId:data.missionId,message:'mission is done',client:data.userDetailes}))
                }
                else{console.log('sender disconnect');socket.send(JSON.stringify({type:'success',message:'sender cant be reach try to inform'}))}
                taskDone(data.missionId)
                
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
  console.log(`WebSocket server is running on ip:${baseUrl} port 8888`);
}


export default startServer;
