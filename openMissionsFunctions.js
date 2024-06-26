import axios from "axios";
import baseUrl from "./url.js";


// const url = "https://app-http-server.vercel.app";
const url = `http://${baseUrl}`;


async function updateOpenMissions(newtask) {
  try {
    const response = await axios.post(`${url}/server/newtask`, {newtask:newtask});
    if(response.status!=200)console.log('bed response try update new mission:',response);
    return response.data
  } catch (err) {
    console.log("error try post new task:", err);
  }
}
// /////////////////////////////////
async function updateMissionFunc(task) {
  try {
    const response = await axios.put(`${url}/server/changetask`, task);
    if(response.status!=200)console.log('bed response try update exist mission:',response);
  } catch (err) {
    console.log("error try update mission:", err);
  }
}
// ////////////////////////////////
async function saveMission(id,userName){
    try{
        const response = await axios.put(`${url}/server/save`,{missionId:id,userName:userName})
        return response.data
    }catch(err){console.log('error try to hold task',err);}
}

async function closeMission(id){
  try{
      const response = await axios.put(`${url}/server/close`,{missionId:id})
      return response.data
  }catch(err){console.log('error try to close task',err);}
}

async function rejectSave(id,userName){
  try{
  const response = await axios.put(`${url}/server/reject`,{missionId:id,deliveryGuy:userName})
  return response.data
}catch(err){console.log('error try to reject task:',err);}
}

async function addToHistory(userId,task){//add also adding task to sender history, right now os only for client
  try{
    const response = await axios.post(`${url}/server/addtasktohistory`,{userId:userId,task:task})
    return response.data
  }catch(err){console.log('error try add task to history:',err);}
}

export { updateMissionFunc, updateOpenMissions,saveMission,closeMission,addToHistory,rejectSave};
