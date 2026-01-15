import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;

export const connectSocket = (onMessage) => {

  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    reconnectDelay: 5000,

    onConnect: () => {
      console.log("✅ Socket Connected");

      stompClient.subscribe("/topic/admin", (msg) => {
        const data = JSON.parse(msg.body);
        onMessage(data);
      });
    }
  });

  stompClient.activate();
};

export const disconnectSocket = () => {
  stompClient?.deactivate();
};
