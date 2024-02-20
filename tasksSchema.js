import mongoose from "mongoose";

const tasksSchema = new mongoose.Schema({
    id: String,
    type:{type:String,enum:['privet','public'],default:'public'},
    open: Boolean,
    saved: Boolean,
    close: Boolean,
    senderAddress:String,
    address:String,
    sender: String,
    price: Number,
    deliveryGuy:String,
    notes:String,
    targetPhone:String,
    wehicleType:{type:String,enum:['station','motor','car',''],default:''}
})

const Tasks = mongoose.model('alltasks',tasksSchema)

export default Tasks