# Chat App Example with React Native, Socket.io and webhook service

Example of a simple texting-style chat with webhook service

![Chat Demo GIF](https://github.com/zainozzaini/RNChatSocket/blob/master/ChatApps.gif "Chat Demo GIF")

## Goal
Same motivations as my goal for simple example on chat application that I have found from [ChatUiExample by Keith Kurak](https://github.com/llamaluvr/ChatUIExample)
 , then I extended the project with server supports to simulate real chat environment. 
 
 Many examples are using Socket.io with mongoDB to do crenditial checking hence stored the chat's message directly to database. Its is recommended especially for chat application to use NoSQL database. But there are some cases that you don't want use NoSQL based and dont want too many variations system that can be messy you to control your existing database. One of another method is use socket service as middleware of our existing system that communicates via http API. 
 
## What it does
  - React Native as Chat Ui on client Side
  - PHP to simulate API service 
  - Socket.io as a middleware to handle live chat between API service (PHP) and client (RN)

## How do I try?
API Server
```bash
cd server
php -S 127.0.0.1:8090
```
Socket Server
- change IP of your API Server's ip.
```bash
cd server
node socket.js
```

Chat Client
- change ip of ioServerURL in ChatView.js to your socket.js's ip.
```bash
cd ChatClient && npm install
react-native run-android
```

### Credits
- [ChatUiExample by Keith Kurak](https://github.com/llamaluvr/ChatUIExample)


 