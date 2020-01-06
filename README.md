# MessagingApp
This project is messaging application server written in node/express typescript application. It uses REST and websocker for its communication with the UI. The UI is a separate project, located at https://github.com/rdibari84/MessagingClient

## To Run
PreReqs: 
- Docker and docker-compose are installed

`docker-compose up -d --build`
- application will start up at http://localhost:300

## To Stop
`docker-compose down`

## Hard Coded Users:
```
username: sheepppl, password: sheepppl
username: corgibutt, password: corgibutt
username: nightowl, password: nightowl
```

## Design Considerations
- Picked typescript node/express server because it's lightwight, matches the language of the frontend (no context swtiching) and has a popular socket.io websocket library 
- In lieu of setting up a persistence layer, three in memory maps form the crux of the application
    - clients: map username to websocket information
    - messageRoom: map toUsername and fromUsername to a messageRoomId
    - messages: map messageRoomId to a list of messages
- A message limit is set to return the most recent x number of messages; wanted to consider the size of chat history the to send

## Limitations
- Users are hardcoded.
- This application IS NOT SCALABLE. In memory maps need to be persisted to a DB (postgres)
- Figure out how to handle message limit; don't want to send too much data if chat history is long but hardcoding and limiting to 10 is not the solution
- Unit tests need to be written

## Routes
- REST `/login`
- websocket listeners for:
    - `connection`
    - `register`
    - `get-all-users`
    - `logout`
    - `message-history`
    - `message`
- websocket emitters for:
    - `get-all-users`
    - `message-history`
    - `message`

## Spectulative postgres schema
- User Table: 
    - username, userid, password
- MessageRoom Table:
    - roomId, roomName, toUsername, fromUsername 
    - fk constraint on User Table
- Messages Table:
    - id, roomId, toUsername, fromUsername, message, timestamp
    - fk constraint on MessageRoom Table     
    
## Descripton of Functionality
- On a register event
    - clients map is updated to save the username and websocket 
    - this is used to determine what client to send information back to
- On a get-all-users event
    - the clients map is consulted to get a list of all "registered" users
- On a message-history event
    - the messageRoom is determined (an entry is made if it does not exist) and the messages map is consulted to see if any message history exists for the two users
    - A list of messages is returned
- On a message event
    - the messageRoom is determined (an entry is made if it does not exist) and the messages map is appended to with the message. 
    - A list of messages is returned
