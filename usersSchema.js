import mongoose from 'mongoose';

const usersGetsSchema = new mongoose.Schema({
    firstName:String,
    lastName:String,
    userName:String,
    password:String,
    group:Array,
    phone:String,
    requests:Array,
    tasksInProgress:[],
    tasksHistory:[]
})
const Users = mongoose.model('userssends',usersGetsSchema)

export default Users