import axios from "axios";
import baseUrl from "./url.js";

const url = `http://${baseUrl}`;

async function addCloseMission(task){
    try{
        const response = await axios.post(`${url}/server/closetask`,{task:task})
        console.log('update close task status:',response.status);
    }catch(e){console.log('error try add close task:',e);}
}

async function taskDone(taskId){
    try{
        const response = await axios.delete(`${url}/server/closetask/${taskId}`)
        console.log('task is done status:',response.status);
        return response.status
    }catch(e){console.log('error try delete task:',e);}
}

export {addCloseMission,taskDone}