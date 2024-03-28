import UsersSend from "./usersSendSchema.js";
import { clientsGet,clientsSend } from "./clientsOnlineSet.js";
import WebSocket from "ws";


//function to send short task view to all the online delivery guy
//if task is privet - send only to group else send public

export default async function broadcast(fulltask) {
    const {
     sender,type } = JSON.parse(fulltask)
    if (type==='privet') {
      let taskSender = Array.from(clientsSend).filter(
        (client) => client.id === sender
      );
      if(taskSender.length===0){
        taskSender =await UsersSend.findOne({userName:sender})
      }
      if(!taskSender){console.log('error try find sender group in boardcast function'); return false}
     if(Array.isArray(taskSender)) {taskSender=taskSender[0]}
        clientsGet.forEach((client) => {
            try {
                 if (
            client.socket.readyState === WebSocket.OPEN &&
            
            taskSender.group.includes(client.id)&&client.group.includes(sender)
          ) {
            client.socket.send(fulltask);
          }
        
      } catch (err) {
        console.log("error try post task to team:", err,"\nerror when send task to :",client);
      }
    });
    } else {
     
        this.clientsGet.forEach((client) => {
            try {
          if (client.socket.readyState === WebSocket.OPEN) {
            client.socket.send(taskToPost);
          }
        
      } catch (err) {
        console.log("error try post task to all:", err,"\nerror when send task to :",client);
      }});
    }
  }
