var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:parallel2020@cluster0-cegct.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
client.connect();

http.listen(3000, function(){
	console.log('Hello Parallel');
  	console.log('listening on *:3000');
});

app.get('/', function(req, res){
  //res.sendFile(__dirname + '/index.html');
  res.send('Project is running on port 3000');
});

app.get('/ChatRoom', function(req, res) {
  //return all chatroom
});

io.on('connection', function(socket){

  socket.on('new-user', async function(name) {
    var user = {username:name,};
    //if user not in db then create {
    await newUser(user);
    //}

  });

  socket.on('new-group', async function(groupName) {
    var group = {name:groupName}
    var groupId = await newGroup(group);
    socket.join(groupName);
  });

  socket.on('join-group', function(msg) {
    // msg : userId, groupId
    //if user not in group: 
    socket.join(msg.groupId);
    io.to(msg.groupId).emit('join-group', msg.name);
  });

  socket.on('send-message', async function(msg){
    //msg มี text, groupId, username, timestamp
    //เก็บใส่db group ละก้เอา chatId มา ส่งไปให้ client
    //Insert chat in to group
    // var chat = {chatidจากdb,msg} ละก็ส่ง send-messageไปให้ทุกclientในgroup
    await insertChat(msg.groupId,msg.username,msg.text);
    socket.to(msg.groupId).broadcast.emit('deliver-message', msg);
  });

  socket.on('read-message', function(obj) {
    // obj ประกอบไปด้วย userId กับ chatId, groupId
    // ยัดใส่ว่า lastreadในgroup คือ chatไหน
  });

});

async function newUser(user) {
  user.currentGroup = []
  client.db("Parallel").collection("Users").insertOne(user, function(err, res) {
    if (err) throw err;
    console.log("new user inserted");
  });
}

async function newGroup(group, username) {
  group.chats = []
  group.members = [username]
  client.db("Parallel").collection("Groups").insertOne(group, function(err, res) {
    if (err) throw err;
    console.log("new group inserted");
  });
}

async function getGroup(group, username) {
  client.db("Parallel").collection("Groups").insertOne(group, function(err, res) {
    if (err) throw err;
    console.log("new group inserted");
  });
}

async function insertChat(groupId, username,msg){
  try{
    const find =await client.db("Parallel").collection("Groups").findOne({_id:groupId})
    
    chat = {
      "_id":ObjectId(),
      "user":username,
      "msg":msg,
    }
    client.db("Parallel").collection("Groups").updateOne({_id:groupId},{$push:{chats:chat}}, function(err, res) {
      if (err) throw err;
      console.log("chat inserted",res);
    });
  }catch(e){
    console.error(e)
  }
}