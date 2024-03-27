import broadcast from "./boardcastFunc.js";
import { clientsGet } from "./clientsOnlineSet.js";
import {
  updateOpenMissions,
  closeMission,
  rejectSave,
} from "./openMissionsFunctions.js";

export default function sendEventListners(data,socket) {
  if (data.type === "privet" || data.type === "public") handleNewTask(data);
  else if (data.type === "confirm") handleConfirm(data,socket);
  else if (data.type === "reject") handleReject(data);
}

//function to handle new task and than call boardast function to post the task

function handleNewTask(data) {
    data.newTask.blockedUsers = []
    updateOpenMissions(data.newTask);
    broadcast(JSON.stringify(data.newTask));
  }

//function to handle confirm massage to associate task with delivery guy

async function handleConfirm(data,socket) {
  const client = Array.from(clientsGet).filter((client) => client.id === data.client);
  if (client.length===0) {
    console.log("client disconected");
    socket.send(JSON.stringify({
        type:'note',
        massage:`delivery - ${data.client} is not online `//****  think about what the operation in this case **** */
    }))                                                   //       if will reopen the mission to everyone are save to 
    return                                                //       the delivery guy and inform hom later 
  }
  const res = await closeMission(data.missionId);
  if (res === "succes-close") {
    try {
      client[0].socket.send(
        JSON.stringify({
          type: "close",
          mission: data.missionId,
          sender: data.sender,
          address: data.address,
        })
      );
    } catch (e) {
      console.log("error while tryng send the close message to client:", e);
    }
  } else {
    client[0].socket.send(
      JSON.stringify({
        type: "unsuccess",
        message: "the mission is on hold try later",
      })
    );
  }
}

//function to handle reject massage to delete the saving task from the delivery guy
//* important to make the task blocked from the delivery guy *

async function handleReject(data) {
  const client = Array.from(clientsGet).filter((client) => client.id === data.client);
  if (client.length===0) {
    console.log("client disconnected");
  }
  const res = await rejectSave(data.missionId,data.client);
  if (res === "ok") {
    try {
      client[0]?.socket.send(
        JSON.stringify({
          type: "reject",
          address: data.address,
          sender: data.sender,
        })
      );                               // ** check whats the best way to inform all users on the reopen task//
    } catch (e) {
      console.log("error while trying send the close message to client:", e);
    }
  } else {
    console.log("error try reject task saving:", res);
  }
}
