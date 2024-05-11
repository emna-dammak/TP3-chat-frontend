import logo from "./logo.svg";
import "./App.css";
import { io } from "socket.io-client";
import { useEffect } from "react";
import { useState } from "react";

const socket = io("http://localhost:3000");
function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [commentInput, setCommentInput] = useState({});
  const [activeMessage, setActiveMessage] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState({});
  const [clientID, setClientID] = useState(null);

  const messageListener = (message) => {
    setMessages((prev) => [
      ...prev,
      {
        text: message.message,
        comments: [],
        likes: 0,
        emojis: [],
        clientID: message.client,
      },
    ]);
  };

  const commentListener = (data) => {
    const updatedMessages = messages.map((msg, index) => {
      if (index === data.msgIndex) {
        return {
          ...msg,
          comments: [...msg.comments, data.comment],
        };
      }
      return msg;
    });
    setMessages(updatedMessages);
  };

  const likeListener = ({ msgId, likes }) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg, index) => {
        if (index === msgId) {
          return { ...msg, likes: likes };
        }

        return msg;
      })
    );
  };

  const emojiListener = ({ msgId, emoji }) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg, index) => {
        if (index === msgId) {
          return { ...msg, emojis: [...msg.emojis, emoji] };
        }
        return msg;
      })
    );
  };

  useEffect(() => {
    // Listen for incoming messages
    socket.on("message", messageListener);

    // Listen for incoming comments
    socket.on("comment-message", commentListener);

    socket.on("like-message", likeListener);

    socket.on("emoji-message", emojiListener);

    socket.on("user-joined", ({ text }) => {
      const client = text.split(": ")[1];
      setClientID(client);
      console.log("clientID", client);
    });

    // socket.on('user-left', (data) => messageListener(data.text));

    // socket.on('connect', (data) => messageListener('Connected'));

    return () => {
      socket.off("message", messageListener);
      socket.off("comment-message", commentListener);
      socket.off("like-message", likeListener);
      socket.off("emoji-message", emojiListener);
    };
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() != "") {
      socket?.emit("message", input);
      setInput("");
    }
  };

  const handleInputChange = (event, index) => {
    const newInputs = { ...commentInput };
    newInputs[index] = event.target.value; // Make sure event and event.target are defined
    setCommentInput(newInputs);
  };

  const handleCommentSubmit = (e, msgIndex) => {
    e.preventDefault();
    const comment = commentInput[msgIndex];
    if (comment && comment.trim() !== "") {
      socket?.emit("comment-message", {
        msgIndex,
        comment: commentInput[msgIndex],
      });
      const newCommentInput = { ...commentInput };
      newCommentInput[msgIndex] = "";
      setCommentInput(newCommentInput);
    }
  };

  const handleLike = (msgId, likes) => {
    likes = likes + 1;
    socket.emit("like-message", { msgId, likes });
  };

  const handleEmoji = (msgId, emoji) => {
    socket.emit("emoji-message", { msgId, emoji });
  };

  const showComment = (index) => {
    setShowCommentForm((prevState) => ({
      ...prevState,
      [index]: !prevState[index], // Toggle visibility for the specific index
    }));
  };

  return (
    <div className="container">
      <ul>
        {messages.map((msg, index) => (
          <li
            key={index}
            style={{
              color: clientID === msg.clientID ? "blue" : "green",
              textAlign: clientID === msg.clientID ? "right" : "left",
            }}
          >
            <div
              className="message-controls"
              style={{
                display: "flex",
                flexDirection:
                  clientID === msg.clientID ? "row-reverse" : "row",
                justifyContent: clientID === "flex-start",
              }}
            >
              <span> {msg.text}</span> <br />
              <span>
                <button onClick={() => handleLike(index, msg.likes)}>
                  Like ({msg.likes})
                </button>
                <button onClick={() => showComment(index)}>commenter</button>
                <button
                  className="emoji-button"
                  onClick={() => handleEmoji(index, "😁")}
                >
                  😁
                </button>
                <button
                  className="emoji-button"
                  onClick={() => handleEmoji(index, "🤪")}
                >
                  🤪
                </button>
                <button
                  className="emoji-button"
                  onClick={() => handleEmoji(index, "❤️")}
                >
                  ❤️
                </button>
              </span>
            </div>

            <ul>
              {msg.comments.map((comment, commentIndex) => (
                <li key={commentIndex}>{comment}</li>
              ))}
              {showCommentForm[index] && (
                <li>
                  <form onSubmit={(e) => handleCommentSubmit(e, index)}>
                    <input
                      value={commentInput[index] || ""}
                      onChange={(e) => handleInputChange(e, index)}
                    />
                    <button type="submit">Send Comment</button>
                  </form>
                </li>
              )}
            </ul>

            <ul>
              {msg.emojis.map((emoji, emojiIndex) => (
                <li key={emojiIndex}>{emoji}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
