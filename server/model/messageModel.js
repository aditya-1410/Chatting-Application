const mongoose=require("mongoose");

const messageSchema=new mongoose.Schema({
    iv:String,
    message:{
        text:{
            type:String,
            required:true
        },
    },
    users:Array,
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    isLiked:{
      type:Boolean,
      default:false,
    },
    isSaved:{
      type:Boolean,
      default:false,
    }
  },
  {
    timestamps:true,
  },
)

module.exports=mongoose.model("Messages",messageSchema)