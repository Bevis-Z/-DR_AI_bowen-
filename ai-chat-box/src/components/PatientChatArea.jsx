import React from 'react';
import { Card, CardContent } from "./ui/Card";
import Button from "./ui/Button";
import { Send } from "lucide-react";

const PatientChatArea = ({
  messages,
  patientSuggestions,
  patientInputMessage,
  setPatientInputMessage,
  handleSendMessage,
  messagesEndRef
}) => {
  return (
    <div className="w-1/4 p-4 border-r bg-red-50 flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4">
        {/* Display all messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 flex ${message.role === "patient"
                ? "justify-end"
                : "justify-start"
              }`}
          >
            <Card
              className={`max-w-xs ${message.role === "patient"
                  ? "bg-green-100"
                  : "bg-white"
                }`}
            >
              <CardContent className="p-2 flex justify-start">
                <p className="text-left">
                  {message.content}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {patientSuggestions.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {patientSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              onClick={() =>
                handleSendMessage(suggestion, "patient")
              }
              className="text-left bg-blue-100 hover:bg-blue-200 text-blue-800"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
      <div className="relative">
        <textarea
          value={patientInputMessage}
          onChange={(e) =>
            setPatientInputMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(
                patientInputMessage,
                "patient"
              );
            }
          }}
          placeholder="Type a message as patient..."
          className="w-full p-2 pr-10 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
        />
        <button
          onClick={() =>
            handleSendMessage(
              patientInputMessage,
              "patient"
            )
          }
          className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600"
        >
          <Send size={24} />
        </button>
      </div>
    </div>
  );
};

export default PatientChatArea;
