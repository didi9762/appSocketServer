import mongoose from 'mongoose';

const usersSendSchema = new mongoose.Schema({
    firstName:String,
    lastName:String,
    userName:String,
    password:String,
    address:String,
    group:Array,
    phone:String,
    requests:Array,
    tasksInProgress:[],
    tasksOpen:[],
    tasksHistory:[]
})
const UsersSend = mongoose.model('userssends',usersSendSchema)

export default UsersSend