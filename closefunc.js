import { clientsGet, clientsSend } from "./clientsOnlineSet.js";

export default function handleClose(clientData,socket,errEvent) {
  console.log(`Client disconnected: ${clientData.id}`);
  console.log('closeing code:',errEvent.code);
  errEvent.reason!==''?console.log('reason:',errEvent.reason):null
  const sendClient = Array.from(clientsSend).filter(
    (client) => client.id === clientData.id && client.socket === socket
  );
  if (sendClient.length>0) {
    clientsSend.delete(sendClient[0]);
  }
  const getClient = Array.from(clientsGet).filter(
    (client) => client.id === clientData.id && client.socket === socket
  );
  if (getClient.length>0) {
    clientsGet.delete(getClient[0]);
  }
}
