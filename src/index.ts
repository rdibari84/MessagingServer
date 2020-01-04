import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import * as httpImport from "http";
import socketIo from "socket.io";
import uuid from "uuid";
import { Message } from "./data";
import { User } from "./user";

const app = express();
app.use(bodyParser.json());

app.use(cors());
app.set("port", process.env.PORT || 3000);
const httpServer = new httpImport.Server(app);
const io = socketIo(httpServer);
const clients = new Map<string, socketIo.Socket>();
const messageRoom = new Map<string, string>();
const messages = new Map<string, Message[]>();
const messageLimit = 10;

const validUsers = [
    new User("sheepppl", "plus"),
    new User("backinblack", "socool"),
    new User("corgibutt", "corgibutt")
];

function containsUser(obj: User, list: any) {
    let i;
    for (i = 0; i < list.length; i++) {
        console.log("obj", obj, "list[i]", list[i]);
        if (obj.equals(list[i])) {
            return true;
        }
    }
    return false;
}

function determineMessageRoom(toUsername: string, fromUsername: string): string {
    const key1 = toUsername + "&" + fromUsername;
    const key2 = fromUsername + "&" + toUsername;
    if (!messageRoom.get(key1) || !messageRoom.get(key2)) {
        const roomId = uuid.v1();
        messageRoom.set(key1, roomId);
        messageRoom.set(key2, roomId);
    }
    return messageRoom.get(key1);
}

app.post("/login", (req: any, res: any) => {
    if (!containsUser(new User(req.body.username, req.body.password), validUsers)) {
        res.sendStatus(403);
    } else {
        res.status(200).send({ username: req.body.username });
    }
});

io.on("connection", (socket) => {
    console.log("a user connected.");

    socket.on("register", (userId: string) => {
        console.log("register request", userId);
        clients.set(userId, socket);
        const users = [];
        for (const k of clients.keys()) {
            users.push(k);
        }
        console.log("emitting all users", users);
        io.emit("users", users);
    });

    socket.on("logout", (userId: string) => {
        console.log("logout request", userId);
        if (clients.get(userId)) {
            clients.delete(userId);
        }
        const users = [];
        for (const k of clients.keys()) {
            users.push(k);
        }
        console.log("emitting all users", users);
        io.emit("users", users);
    });

    socket.on("message-history", (msg: Message) => {
        console.log("received message-history request: ", msg);
        const toUserSocket = clients.get(msg.toUsername);
        const fromUserSocket = clients.get(msg.fromUsername);

        const roomId = determineMessageRoom(msg.fromUsername, msg.toUsername);
        const messageList = messages.get(roomId) ? messages.get(roomId) : [];

        const messageListToSend = messageList.slice(-messageLimit);
        console.log(`sending a list of the last ${messageLimit} messages:`, messageListToSend);
        toUserSocket.emit("message-history", messageListToSend);
        fromUserSocket.emit("message-history", messageListToSend);
    });

    socket.on("message", (msg: Message) => {
        console.log("received message: ", msg);
        const toUserSocket = clients.get(msg.toUsername);
        const fromUserSocket = clients.get(msg.fromUsername);

        const roomId = determineMessageRoom(msg.fromUsername, msg.toUsername);

        const messageList = messages.get(roomId) ? messages.get(roomId) : [];
        messageList.push(msg);
        messages.set(roomId, messageList);
        messages.set(roomId, messageList);

        const messageListToSend = messageList.slice(-messageLimit);
        console.log(`sending a list of the last ${messageLimit} messages:`, messageListToSend);
        toUserSocket.emit("message", messageListToSend);
        fromUserSocket.emit("message", messageListToSend);
    });

    const userslist = [];
    for (const k of clients.keys()) {
        userslist.push(k);
    }
    console.log("emitting all users", userslist);
    io.emit("users", userslist);
});

const server = httpServer.listen(3000, () => {
    console.log("listening on *:3000");
});
