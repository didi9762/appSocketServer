import { clientsSend } from "./clientsOnlineSet.js";
import { taskDone } from "./closeMissionsFunction.js";
import { saveMission } from "./openMissionsFunctions.js";
import broadcast from "./boardcastFunc.js";

export default async function getEventListner(data,socket) {
  if (data.type === "save") handleSave(data,socket);
  else if (data.type === "done") handleDone(data,socket);
}

//function to save task for delivery guy

async function handleSave(data,socket) {
  const res = await saveMission(data.missionId, data.userDetailes);
  if (!res) {
    return;
  } else if (res === "already-in-hold") {
    socket.send(
      JSON.stringify({
        type: "note",
        message: "the mission is on hold\n you can check on ithold try later",
      })
    );
    return;
  } else if (res === "unsucces-close") {
    socket.send(
      JSON.stringify({
        type: "note",
        message: "mission already taken",
      })
    );
    return;
  } else if (res.message === "hold-success") {
    const updateMission = res.mission;
    const sender = Array.from(clientsSend).filter(
      (client) =>client.id === updateMission.sender)
    if (sender.length===0 || !sender[0].socket) {
      console.log("error sender disconnect");
      socket.send(
        JSON.stringify({
          type: "note",
          message: "mission hold but sender disconnect\nhe'll get it when he will be online again",
        })
      );
      return;
    } else {
      socket.send(
        JSON.stringify({
          type: "success",
          message: "masseges sent to the sender wait for his answer",
        })
      );
      sender[0].socket.send(
        JSON.stringify({
          mission: updateMission._id,
          client: data.userDetailes,
          address: updateMission.destination,
        })
      );
      broadcast(JSON.stringify(updateMission)); //*****try change it to push notification *****/
    }
  }
}

//function to inform sender that task acomplish

function handleDone(data,socket) {
  const sender = Array.from(clientsSend).filter((client) => client.id === data.sender);
  if (sender.length>0) {
    sender[0].socket.send(
      JSON.stringify({
        type: "done",
        missionId: data.missionId,
        client: data.userDetailes,
        address: data.address,
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
  taskDone(data.missionId, data.userDetailes);
}
