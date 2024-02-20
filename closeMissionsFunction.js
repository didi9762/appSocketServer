import axios from "axios";
import baseUrl from "./url.js";

const url = `http://${baseUrl}:12345`;



async function taskDone(taskId,userId){
    try{
        const response = await axios.delete(`${url}/server/closetask/${taskId}/${userId}`,)
        console.log('task is done status:',response.status);
        return response.status
    }catch(e){console.log('error try delete task:',e);}
}

export {taskDone}