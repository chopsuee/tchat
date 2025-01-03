"use client";

import React, { useState, useRef, useEffect } from "react";
import { BsFillSendFill } from "react-icons/bs";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/chat";  // Updated endpoint

interface Message {
  content: string;
  type: "sent" | "received";
}

function ChatSystem() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle user input in the textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Max height of 200px
    setMessage(textarea.value);
  };

  // Handle keyboard submit
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Send a message to the backend and update the chat
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    try {
      setIsLoading(true);
      
      // Add the user's message to the chat
      const userMessage = message.trim();
      setMessages(prev => [...prev, { content: userMessage, type: "sent" }]);
      setMessage("");

      // Send the message to the backend
      const response = await axios.post(API_URL, { 
        message: userMessage 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.reply) {
        setMessages(prev => [...prev, { 
          content: response.data.reply, 
          type: "received" 
        }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error message in chat
      setMessages(prev => [...prev, { 
        content: "Sorry, there was an error sending your message. Please try again.", 
        type: "received" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center w-full relative top-10 p-4">
      <div className="flex flex-col justify-between h-[80vh] w-full max-w-3xl shadow-lg rounded-lg">
        {/* Chat Messages */}
        <div className="flex flex-col h-full mb-5 p-4 text-sm overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`${
                msg.type === "sent"
                  ? "self-end bg-blue-500 text-white"
                  : "self-start bg-gray-200 text-black"
              } px-4 py-2 rounded-lg max-w-[70%] mb-2 break-words`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          className="w-full flex items-end p-4 border-t"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <textarea
            name="chatbox"
            title="chatbox"
            value={message}
            placeholder="Type your message..."
            rows={1}
            className=" leading-6 border border-gray-300 outline-none text-black rounded p-2 w-full resize-none max-h-[6.75rem] overflow-y-hidden" // Max height for 3 lines
            onChange={handleInput}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />

          <button
            type="submit"
            title="Send Message"
            className={`ml-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isLoading || !message.trim()}
          >
            <BsFillSendFill className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatSystem;