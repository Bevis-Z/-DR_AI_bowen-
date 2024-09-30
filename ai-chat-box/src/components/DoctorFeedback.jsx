import React from 'react';
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { CardTitle } from "../components/ui/Card";

const DoctorFeedback = ({ feedback, onRatingChange, onCommentChange }) => {
  return (
    <div className="w-1/4 p-4 border-r bg-blue-100 flex flex-col">
      <CardTitle>Doctor AI Feedback</CardTitle>
      <div className="mb-4 flex-grow overflow-y-auto">
        {feedback.suggestions.map((suggestion, index) => (
          <div key={index} className="mb-2 p-2 bg-white rounded-lg flex-grow overflow-y-auto shadow">
            <div className="flex justify-between items-start">
              <p className="font-medium mb-0.5 flex-grow text-left">
                {suggestion.number}: {suggestion.question}
              </p>
              <div className="flex items-center space-x-2 ml-2">
                <ThumbsUp
                  size={20}
                  className={`cursor-pointer ${feedback.ratings[suggestion.number] === true ? "text-green-500" : "text-gray-300"}`}
                  onClick={() => onRatingChange(suggestion.number, true)}
                />
                <ThumbsDown
                  size={20}
                  className={`cursor-pointer ${feedback.ratings[suggestion.number] === false ? "text-red-500" : "text-gray-300"}`}
                  onClick={() => onRatingChange(suggestion.number, false)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <textarea
        value={feedback.comment}
        onChange={onCommentChange}
        placeholder="Add comment for this suggestion set..."
        className="w-full p-2 border rounded resize-none mt-auto"
        rows="3"
      />
    </div>
  );
};

export default DoctorFeedback;
