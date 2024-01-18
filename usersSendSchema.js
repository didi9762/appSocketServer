import mongoose from 'mongoose';

const usersGetsSchema = new mongoose.Schema({
firstName:String,
lastName:String,
userName:String,
password:String,
group:Array,
})
const Users = mongoose.Model('userssends',usersGetsSchema)

export default UsersSend