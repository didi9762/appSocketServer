import axios from "axios";

const url = "https://app-http-server.vercel.app";
async function updateOpenMissions(newtask) {
  try {
    const response = await axios.post(`${url}/server/newtask`, {newtask:newtask});
    console.log("update open missions:", response.status);
  } catch (err) {
    console.log("error try post new task:", err);
  }
}
// /////////////////////////////////
async function updateMissionFunc(task) {
  try {
    const response = await axios.put(`${url}/server/changetask`, task);
    console.log("update mission:", response.status);
  } catch (err) {
    console.log("error try update mission:", err);
  }
}
// ////////////////////////////////
async function saveMission(id){
    try{
        const response = await axios.put(`${url}/server/save`,{missionId:id})
        return response.data
    }catch(err){console.log('error try to hold task',err);}
}


export { updateMissionFunc, updateOpenMissions,saveMission};
