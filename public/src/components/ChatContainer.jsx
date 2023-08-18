import { ToastContainer, toast } from 'react-toastify'
import React,{useState,useEffect, useRef} from 'react'
import styled from 'styled-components'
import Logout from './Logout';
import Input from './Input';
import axios from "axios"
import {sendMessageRoute,getMessagesRoute,delMessagesRoute,likeMessagesRoute,saveMessagesRoute,getSavedMessagesRoute} from "../utils/APIRoutes"
import {v4 as uuidv4} from "uuid"
import {BsSave} from "react-icons/bs"
import {FcLike} from "react-icons/fc"
import { MdDelete } from 'react-icons/md';


function ChatContainer({currentChat,currentUser,socket}) {
  const scrollRef=useRef()
  const [messages,setMessages] = useState([])
  const [arrivalMessage,setArrivalMessage]=useState(null)
  const [afterDeleteMsg,setAfterDeleteMsg]=useState(null)
  const [afterLikeMsg,setAfterLikeMsg] = useState(null)

  const successMessage=(message)=>{
    toast.success(message,{
      position:"top-center",
      autoClose:1000,
      pauseOnHover:true,
      draggable:true,
      theme:"dark"
    });
  }


  useEffect(()=>{
    const onChanegCurrentChat=async()=>{
      if(currentChat){
        const response=await axios.post(`${getMessagesRoute}`,{
          from:currentUser._id,
          to:currentChat._id,
        })
        setMessages(response.data)
      }
    }
    onChanegCurrentChat();
  },[currentChat])

  const handleSendMsg=async(msg)=>{
    const data=await axios.post(`${sendMessageRoute}`,{
      from:currentUser._id,
      to:currentChat._id,
      message:msg,
    })
    successMessage("Message Sent")
    socket.current.emit("send-msg",{
      id:data.data.id,
      isLiked:data.data.isLiked,
      to:currentChat._id,
      from:currentUser._id,
      message:msg,
      isSaved:data.data.isSaved
    })
    const msgs=[...messages]
    msgs.push({fromSelf:true,message:msg,id:data.data.id,isLiked:data.data.isLiked,isSaved:data.data.isSaved})
    setMessages(msgs)
  }

  useEffect(()=>{
    if(socket.current){
      socket.current.on("msg-recieve",(msg)=>{
        setArrivalMessage({fromSelf:false,message:msg.message,id:msg.id,isLiked:msg.isLiked,isSaved:msg.isSaved})
      })
    }
  },[])


  useEffect(()=>{
    arrivalMessage && setMessages((prev)=>[...prev,arrivalMessage])
  },[arrivalMessage])

  useEffect(()=>{
    scrollRef.current?.scrollIntoView({behaviour:"smooth"})
  },[messages])


  const handleDelete=async (msg)=>{
    const data=await axios.delete(`${delMessagesRoute}/${msg.id}`)
    if(data.data.success){
      successMessage("Message Deleted")
    }
    else{
      successMessage("Message Deletion Failed")
    }
    const newMessages=messages.filter((m)=>{
      if(m.id!==msg.id){
        return(m)
      }
    })
    setMessages(newMessages)
    const m1=newMessages.map((m)=>{
      return({
        isSaved:m.isSaved,
        to:currentChat._id,
        from:currentUser._id,
        fromSelf:!m.fromSelf,
        isLiked:m.isLiked,
        id:m.id,
        message:m.message
      })
    })
    if(m1.length==0){
      const newM1=[{
                  to:currentChat._id,
                  from:currentUser._id,
                  message:null,
      }]
      socket.current.emit("delete-event",{
        data:newM1,
      })  
    }
    else{
      socket.current.emit("delete-event",{
        data:m1,
      })
    }
  }

  useEffect(()=>{
    if(socket.current){
      socket.current.on("after-delete-event",(msg)=>{
        if(msg[0].message===null){
          setAfterDeleteMsg([])
        }
        else{
          setAfterDeleteMsg(msg)
        }
      })
    }
  },[])

  useEffect(()=>{
    afterDeleteMsg && setMessages(afterDeleteMsg)
  },[afterDeleteMsg])

  const handleLike=async (msg)=>{
    const data=await axios.put(`${likeMessagesRoute}/${msg.id}`)
    const afterLikeData=messages.map((m)=>{
        if(msg.id===m.id){
          const updatedMsg={
            isLiked:true,
            isSaved:m.isSaved,
            fromSelf:m.fromSelf,
            id:m.id,
            message:m.message,
          }
          return updatedMsg
        }
        else{
          return(
            m
          )
        }
      })
    setMessages(afterLikeData)
    successMessage("Message Liked")
    socket.current.emit("like-event",{
      data:msg,
      to:currentChat._id,
      from:currentUser._id,
    })
  }
  useEffect(()=>{
    if(socket.current){
      socket.current.on("after-like-event",(data)=>{
        const newdata={...data,fromSelf:true,isLiked:true}
        setAfterLikeMsg(newdata)
      })
    }
  },[])

  useEffect(()=>{
    if(afterLikeMsg){
      const afterLikeData=messages.map((msg)=>{
        if(msg.id===afterLikeMsg.id){
          return afterLikeMsg
        }
        else{
          return(
            msg
          )
        }
      })
      setMessages(afterLikeData)
    } 
  },[afterLikeMsg])

  const handleSave=async(msg)=>{
    console.log(msg)
    let to=null
    let from=null
    if(msg.fromSelf){
      from=currentUser._id
      to=currentChat._id
    }
    else{
      from=currentChat._id
      to=currentUser._id
    }
    const data=await axios.post(`${saveMessagesRoute}/${msg.id}`,{
        to:to,
        from:from,
        id:msg.id,
        message:msg.message,
    })
    const newMsg=messages.map((m)=>{
      if(m.id===msg.id){
        m.isSaved=true;
        return m;
      }
      else{
        return m;
      }
    })
    setMessages(newMsg)
  }

  return (
    <div>
    <Container>
      <div id="contentBlurToogle">
        <div className="chat-header">
          <div className="user-details">
            <div className="avatar">
              <img src={`data:image/svg+xml;base64,${currentChat.avatarPhoto}`} alt="avatar" />
            </div>
            <div className="username">
              <h3>{currentChat.username}</h3>
            </div>
          </div>
          <Logout></Logout>
        </div>
          <div className="chat-messages">
            {
              messages.map((message)=>{
                return(
                  <div ref={scrollRef} key={uuidv4()}>
                    <div className={`message ${message.fromSelf ? 'sended' : 'recieved '}`}>
                      <div className="content" id={`${message.isLiked ? "liked" : ""}`}>
                        <p>
                          {message.message}
                        </p>
                        <div className="options">
                          <div className={`del_button ${message.fromSelf ? 'visible' : 'disable'}`}>
                            <button type='button' onClick={()=>handleDelete(message)}><MdDelete></MdDelete></button>
                          </div>
                          <div className={`like_button ${!message.fromSelf && !message.isLiked ? 'visible' : 'disable'}`}>
                            <button type='button' onClick={()=>handleLike(message)}><FcLike></FcLike></button>
                          </div>
                          <div className={`save_button ${!message.isSaved ? 'visible' : 'disable'}`}>
                            <button type='button' onClick={()=>handleSave(message)}><BsSave></BsSave></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </div>
      </div>
    </Container>
    <Input handleSendMsg={handleSendMsg} currentUser={currentUser} currentChat={currentChat}></Input>
    <ToastContainer></ToastContainer>
    </div>
  )
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  #contentBlurToogle{
    transition:ease-in 1s;
    .chat-header {
      margin-top:1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      .user-details {
        display: flex;
        align-items: center;
        gap: 1rem;
        .avatar {
          img {
            height: 3rem;
          }
        }
        .username {
          h3 {
            color: white;
          }
        }
      }
    }
    .chat-messages {
      height:75vh;
      padding: 1rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow: auto;
      &::-webkit-scrollbar {
        width: 0.2rem;
        &-thumb {
          background-color: #ffffff39;
          width: 0.1rem;
          border-radius: 1rem;
        }
      }
      .message {
        display: flex;
        align-items: center;
        .content {
          display:flex;
          max-width: max-content;
          overflow-wrap: break-word;
          padding: 1rem;
          font-size: 1.1rem;
          border-radius: 1rem;
          color: #d1d1d1;
          @media screen and (min-width: 720px) and (max-width: 1080px) {
            max-width: 70%;
          }
          .options{
            margin:0 0.5rem;
            width:max-content;
            flex:1;
            display:flex;
            flex-direction:row;
            .del_button{
              width:100%;
              justify-content: flex-end;
              button{
                border:none;
                color:#c41664;
                background-color: transparent;
                &::hover{
                  color:blue;
                }
              }
            }
            .like_button{
              padding-left:0.3rem;
              button{
                border:none;
                background-color: transparent;
              }
            }
            .save_button{
              margin-left:0.3rem;
              button{
                border:none;
                color:#d95585;
                background-color: transparent;
              }
            }
          }
          p{
            flex:1;
          }
        }
      }
      .sended {
        justify-content: flex-end;
        .content {
          background-color: #4f04ff21;
        }
      }
      .recieved {
        justify-content: flex-start;
        .content {
          background-color: #9900ff20;
        }
      }
      .visible{
        visibility: visible;
      }
      .disable{
        width:0;
        visibility: hidden;
      }
      #liked{
        border:5px solid green;
      }
    }
  }
`;
export default ChatContainer


/*
  useEffect(()=>{
    const likeMessage=async()=>{
      if(isLiked && likeMsg.id!==undefined){
        const data=await axios.put(`${likeMessagesRoute}/${likeMsg.id}`)
        if(data.data.success){
          console.log("liked the message");
        }
        else{
          console.log("unable to like the message")
        }
        setIsLiked(false);
        setLikeMsg({
          id:undefined,
        })
      }
    }
    likeMessage();
  },[likeMsg,isLiked])


  useEffect(()=>{
    if(socket.current){
      socket.current.on("after-delete-event",(data)=>{
        console.log("from client ",data)
        const updates=data.map((dt)=>{
          return({
            fromSelf:dt.fromSelf,
            isLiked:dt.isLiked,
            id:dt.id,  
            message:dt.message
          })
        })
        setMessages(updates)
      })
    }
  },[delMsg,isClickedDel])

  useEffect(()=>{
    const deleteMsg=async()=>{
      console.log("i ran again")
      if(isClickedDel && delMsg.id!==undefined){
        const data=await axios.delete(`${delMessagesRoute}/${delMsg.id}`)
        if(data.data.msg){
          console.log("messages deleted")
        }
        else{
          console.log("unable to delete the message")
        }
        const newMsgs=messages.filter((msg)=>{
          if(msg.id!==delMsg.id){
            return msg
          }
        })
        setMessages(newMsgs)
        setIsClickedDel(false)
        setDelMsg({
          id:undefined,
        })
      }
    }
    deleteMsg();
    const m1=messages.map((m)=>{
      return({
        to:currentChat._id,
        from:currentUser._id,
        fromSelf:!m.fromSelf,
        isLiked:m.isLiked,
        id:m.id,
        message:m.message
      })
    })
    socket.current.emit("delete-event",{
      data:m1,
    })
  },[isClickedDel,delMsg])
  


  const handleDelete=async(msg)=>{
    setIsClickedDel(true);
    setDelMsg({
      id:msg.id,
    })
  }

  const handleLike=async(msg)=>{
    setIsLiked(true)
    setLikeMsg({
      id:msg.id,
    })
  }*/