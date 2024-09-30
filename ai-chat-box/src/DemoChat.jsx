import React, { useState, useEffect, useRef } from 'react';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/Card";
import { Send } from 'lucide-react';

// Mocked API functions
const mockFetchSuggestions = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(['How are you feeling today?', 'Any new symptoms?', 'Have you taken your medication?']);
    }, 500);
  });
};

const mockFetchMedicalHistory = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 500);
  });
};

const mockFetchPotentialDiagnoses = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 500);
  });
};

// ChatInterface Component
const ChatInterface = () => {
  const [questions, setQuestions] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false); // New state to control the display of question boxes
  const [selectedQuestion, setSelectedQuestion] = useState(0); // Track the selected question index
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [potentialDiagnoses, setPotentialDiagnoses] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMedicalHistory();
    fetchPotentialDiagnoses();
  }, []);

  const fetchSuggestions = async () => {
    const data = await mockFetchSuggestions();
    setQuestions(data);
    setShowQuestions(true); // Show questions after fetching them
  };

  const fetchMedicalHistory = async () => {
    const data = await mockFetchMedicalHistory();
    setMedicalHistory(data);
  };

  const fetchPotentialDiagnoses = async () => {
    const data = await mockFetchPotentialDiagnoses();
    setPotentialDiagnoses(data);
  };

  // Handle the user message sending
  const sendMessage = async (content) => {
    if (!content.trim()) {
      return;
    }

    const newMessage = { id: Date.now(), content, sender: 'user', selectedQuestion: selectedQuestion };
    setMessages([...messages, newMessage]);
    setInputMessage('');

    try {
      const response = await fetch('http://localhost:5001/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: content,
          selectedQuestion: selectedQuestion, // Send the selected question index (0 if none)
        }),
      });

      const data = await response.json();
      console.log("response data", data);

      if (response.ok && data.questions && data.diagnosis) {
        setQuestions(Object.values(data.questions));
        setPotentialDiagnoses(Object.values(data.diagnosis.Diagnoses));
        setShowQuestions(true); // Show questions after receiving them
        const botResponse = { id: Date.now() + 1, content: data.diagnosis.Brief_Response, sender: 'bot' };
        setMessages((prevMessages) => [...prevMessages, botResponse]);
        console.log("medical history", data.medical_history.medical_history);
        setMedicalHistory(Object.values(data.medical_history.medical_history));
        // Reset selectedQuestion index to 0 after receiving API response
        setSelectedQuestion(0);
      } else if (response.ok && !data.questions) {
        setPotentialDiagnoses(Object.values([data.diagnosis]));
        setShowQuestions(false); // Hide questions when final response is received
        const botResponse = { id: Date.now() + 1, content: 'Please see the AI suggestions under "Potential Diagnoses"', sender: 'bot' };
        setMessages((prevMessages) => [...prevMessages, botResponse]);
        setMedicalHistory(Object.values(data.medical_history.medical_history));
        console.log("medical history", data.medical_history.medical_history);
      } else {
        console.error('API error:', data);
      }
    } catch (error) {
      console.error("Failed to fetch the bot's response:", error);
    }
  };

  // Handle question box click: allow only one question to be selected
  const handleQuestionClick = (index) => {
    setSelectedQuestion((prevIndex) => (prevIndex === index ? 0 : index)); // Toggle the selection
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-white">
      <div className="h-14 bg-white flex justify-between items-center border-b px-4 py-6">
        <img src="https://13sick.com.au/wp-content/uploads/2023/04/13sick-logo-mark-full-color-rgb.svg" alt="13sick logo" className="h-8" />
        <p className="text text-[#00006e] font-bold">AI ChatBox</p>
        <img src="https://13sick.com.au/wp-content/uploads/2023/04/13sick-logo-full-color-rgb.svg" alt="13sick logo" className="h-8" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                <Card className={`max-w-[70%] ${message.sender === 'bot' ? 'bg-[#252568]/10' : 'bg-green-100'}`}>
                  <CardContent className="p-4">
                    <p>{message.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Questions Section */}
          {showQuestions && questions.length > 0 && ( // Only show questions if showQuestions is true
            <div className="flex justify-between p-4">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className={`cursor-pointer w-1/4 mx-1 p-4 text-center border rounded ${
                    selectedQuestion === index + 1 ? 'bg-green-200' : 'bg-blue-100'
                  }`}
                  onClick={() => handleQuestionClick(index + 1)} // Set the selected question's index (starting from 1)
                >
                  {question}
                </div>
              ))}
            </div>
          )}

          <div className="p-6 border-t flex-shrink-0 h-1/6 min-h-[150px]">
            <div className="flex gap-2 h-full w-full">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 resize-none"
                style={{ height: '100%', width: '100%' }}
              />
              <Button
                onClick={() => sendMessage(inputMessage)}
                className="ml-2 self-end"
                disabled={!inputMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="w-1/3 p-4 border-l flex flex-col h-full">
          <Card className="mb-4 h-[60%]">
            <CardHeader className="h-[60px]">
              <CardTitle className="text-left px-4">Medical History</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)] overflow-y-auto text-left px-4">
              {medicalHistory.length > 0 ? (
                <ul className="space-y-2">
                  {medicalHistory.map((item, index) => (
                    <li key={index} className="bg-gray-100 p-2 rounded">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">No Content</span>
              )}
            </CardContent>
          </Card>
          <Card className="h-[40%]">
            <CardHeader className="h-[60px]">
              <CardTitle className="text-left px-4">Potential Diagnoses</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)] overflow-y-auto text-left px-4">
              {potentialDiagnoses.length > 0 ? (
                <ul className="list-disc pl-8">
                  {potentialDiagnoses.map((diagnosis, index) => (
                    <li key={index}>{diagnosis}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">No Content</span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;