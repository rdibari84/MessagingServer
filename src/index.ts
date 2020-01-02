import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import * as httpImport from "http";
import socketIo from "socket.io";
import { SocketData } from "./data";
import { User } from "./user";

const app = express();
app.use(bodyParser.json());

app.use(cors());
app.set("port", process.env.PORT || 3000);
const httpServer = new httpImport.Server(app);
const io = socketIo(httpServer);
const clients = new Map<string, socketIo.Socket>();

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
            console.log(k);
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
            console.log(k);
            users.push(k);
        }
        console.log("emitting all users", users);
        io.emit("users", users);
    });

    socket.on("message", (msg: {username: string, message: string}) => {
        console.log("message: ", msg);
        // const userSocket = clients.get(msg.username);
        // userSocket.emit("message", msg.message);
        socket.emit("message", msg.message);
    });

    const userslist = [];
    for (const k of clients.keys()) {
        console.log(k);
        userslist.push(k);
    }
    console.log("emitting all users", userslist);
    io.emit("users", userslist);
});

const server = httpServer.listen(3000, () => {
    console.log("listening on *:3000");
});
