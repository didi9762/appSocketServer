import { verifyToken } from "./verify.js";
import { clientsGet, clientsSend } from "./clientsOnlineSet.js";
import sendEventListners from "./sendEventListners.js";
import getEventListner from "./GetsEventListners.js";
import handleClose from "./closefunc.js";
// function to accept new connection if goes well - next function to add evvent listeners

export default async function handleNewConnection(socket, req) {
  if (
    !(await verifyToken(req,async (userName) => {
      console.log("client try connect:", userName);
      try {
        const exist =
          Array.from(clientsSend).some(client => client.id === userName) ||
          Array.from(clientsGet).some(client => client.id === userName);
        if (exist) {
          console.log(
            "client: ",
            userName,
            " is already connected, closing the new connection"
          );
          socket.close(1008,'user already connected');
        } else {
         await socket.once("message", (event) => {
            const clientData = JSON.parse(event);
            const newClient = {
              id: clientData.id,
              group: clientData.group,
              socket: socket,
            };

            if (clientData.send) {
              clientsSend.add(newClient);
              socket.addEventListener("message", (event) => {
                const data = JSON.parse(event.data);
                sendEventListners(data,socket);
              });
            } else if (clientData.get) {
              clientsGet.add(newClient);
              socket.addEventListener("message", (event) => {
                const data = JSON.parse(event.data);
                getEventListner(data,socket);
              });
            }
            console.log('new connection:',clientData.id);
            socket.addEventListener('close',(event)=>{handleClose(clientData,socket,event)})
          });
          
          return true
        }
      } catch (e) {
        console.log("error try connect new user:", e);
        return false;
      }
    }))
  ) {
    socket.close();
    console.log("not verify");
    return false;
  }
}
