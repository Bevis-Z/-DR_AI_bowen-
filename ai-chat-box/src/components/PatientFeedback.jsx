import React from 'react';
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardTitle } from "../components/ui/Card";

const PatientFeedback = ({ 
  feedback, 
  onRatingChange, 
  onCommentChange, 
  showBackground, 
  messages,
  background,
  setBackground
}) => {
  return (
    <div className="w-1/4 p-4 border-l bg-red-100 flex flex-col">
      {!showBackground && <CardTitle>Patient AI Feedback</CardTitle>}
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.length === 0 && showBackground ? (
          <div className="mb-4">
            <CardTitle>Patient context info</CardTitle>
            <textarea
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Please enter your background information..."
              className="w-full p-1 border rounded-md resize-none focus:ring-blue-500"
              rows="3"
            />
          </div>
        ) : feedback.suggestions.length > 0 ? (
          feedback.suggestions.map((suggestion, index) => (
            <div key={index} className="flex justify-between mb-2 p-2 bg-white rounded-lg shadow">
              <p className="font-semibold mb-1 mr-1">{index + 1}: {suggestion}</p>
              <div className="flex items-center space-x-2">
                <ThumbsUp
                  size={20}
                  className={`cursor-pointer ${feedback.ratings[index + 1] === true ? "text-green-500" : "text-gray-300"}`}
                  onClick={() => onRatingChange(index + 1, true)}
                />
                <ThumbsDown
                  size={20}
                  className={`cursor-pointer ${feedback.ratings[index + 1] === false ? "text-red-500" : "text-gray-300"}`}
                  onClick={() => onRatingChange(index + 1, false)}
                />
              </div>
            </div>
          ))
        ) : null}
      </div>
      {!showBackground && (
        <textarea
          value={feedback.comment}
          onChange={onCommentChange}
          placeholder="Add comment for this suggestion set..."
          className="w-full p-2 border rounded resize-none"
          rows="3"
        />
      )}
    </div>
  );
};

export default PatientFeedback;
