import React, { useRef, useEffect } from "react";
import Header from './components/ui/Header';
import { useChatState } from './hooks/useChatState';
import { sendBackend } from './api/chatApi';
import PatientFeedback from './components/PatientFeedback';
import DoctorFeedback from './components/DoctorFeedback';
import LoadingPopup from "./components/LoadingPopup";
import PatientChatArea from './components/PatientChatArea';
import DoctorChatArea from './components/DoctorChatArea';
import HistoryAndDiagnosis from './components/HistoryAndDiagnosis';

const NewChat = () => {
  const {
    messages, setMessages,
    consultationHistory, setConsultationHistory,
    diagnosis, setDiagnosis,
    patientSuggestions, setPatientSuggestions,
    doctorSuggestions, setDoctorSuggestions,
    patientFeedback, setPatientFeedback,
    doctorFeedback, setDoctorFeedback,
    apiData, setApiData,
    patientInputMessage, setPatientInputMessage,
    doctorInputMessage, setDoctorInputMessage,
    conversationId, setConversationId,
    lastDoctorMessage, setLastDoctorMessage,
    tempComment, setTempComment,
    isLoading, setIsLoading,
    hoveredDiagnosis, setHoveredDiagnosis,
    background, setBackground,
    showBackground, setShowBackground,
    dataCollection, setDataCollection,
  } = useChatState();

  const messagesEndRef = useRef(null);

  const handleSendBackend = async ({ patientMessage, doctorMessage }) => {
    setIsLoading(true);
    try {
      const responseData = await sendBackend({ patientMessage, doctorMessage, conversationId });

      setShowBackground(false);
      setApiData(responseData);
      console.log("API response:", responseData);

      if (responseData.conversationId) {
        setConversationId(responseData.conversationId);
      }

      // Handle consultation history
      if (responseData.health_issue_summarization) {
        try {
          const parsedSummary = String(
            responseData.health_issue_summarization
          );
          setConsultationHistory(parsedSummary);
        } catch (error) {
          console.error(
            "Failed to parse health_issue_summarization:",
            error
          );
          setConsultationHistory(
            responseData.health_issue_summarization
          );
        }
      }

      if (responseData.diagnosis) {
        setDiagnosis(responseData.diagnosis);
      }

      if (responseData.question_to_clarify) {
        const questions = Object.entries(
          responseData.question_to_clarify
        ).map(([key, item]) => ({
          question: item.question,
          number: parseInt(key, 10),
          selective_answers: item.selective_answers,
        }));
        setDoctorSuggestions(questions);
        setDoctorFeedback({
          suggestions: questions,
          comment: "",
          ratings: questions.reduce((acc, q) => {
            acc[q.number] = null;
            return acc;
          }, {}),
        });
      }
    } catch (error) {
      console.error("Failed to fetch the response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (content, role) => {
    if (!content.trim()) return;

    const newMessage = { id: Date.now(), content, role };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    console.log("newMessage", messages);
    if (role === "patient") {
      setPatientInputMessage("");
      setPatientSuggestions([]);

      const messageWithBackground = showBackground
        ? `Background: ${background}\n\nMessage: ${content}`
        : content;

      handleSendBackend({
        patientMessage: messageWithBackground,
        doctorMessage: lastDoctorMessage,
      });

      setDataCollection(prevData => ({
        messages: [newMessage],
      }));

      if (patientFeedback.suggestions.length > 0) {
        setDataCollection(prevData => ({
          ...prevData,
          patientFeedback: patientFeedback,
          doctorFeedback: doctorFeedback,
          diagnosis: diagnosis,
          conversationId: conversationId,
        }))
        // For Adam.
        console.log("dataCollection", dataCollection);
        setPatientFeedback({
          suggestions: "",
          comment: "",
          ratings: {},
        });
      }

      setShowBackground(false);

      setLastDoctorMessage(null);
    } else if (role === "doctor") {
      console.log("doctorInputMessage", doctorInputMessage);
      setDoctorInputMessage("");
      setDoctorSuggestions([]);
      setDataCollection(prevData => ({
        ...prevData,
        messages: [...(prevData.messages || []), newMessage],
        conversationId: conversationId,
      }));
      if (patientSuggestions.length > 0) {
        setPatientFeedback({
          suggestions: [],
          comment: "",
          ratings: {},
        });
        setPatientSuggestions([]);
      }
      // Store the doctor's message in lastDoctorMessage
      setLastDoctorMessage(content);
    }
  };

  const handleDoctorQuestionSelect = (selectedQuestion) => {
    const questionObj = Object.entries(
      apiData.question_to_clarify || {}
    ).find(([, item]) => item.question === selectedQuestion);

    if (questionObj) {
      const [, item] = questionObj;
      const selective_answers = item.selective_answers;
      setPatientSuggestions(selective_answers);
      
      selective_answers.forEach((answer, index) => {
        patientFeedback.ratings[index + 1] = null; 
    });

      const newPatientFeedback = {
        suggestions: selective_answers,
        comment: "",
        ratings: patientFeedback.ratings,
      };
  
      // Update state
      setPatientFeedback(newPatientFeedback);
      
      setTempComment("");
      setDoctorSuggestions([]);

      const newMessage = {
        id: Date.now(),
        content: selectedQuestion,
        role: "doctor",
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);

      // For Adam, you probable want to the use the data stored in the doctorFeedback variable
      console.log('Bowen test for doctor', doctorFeedback);
      setDataCollection(prevData => ({
        ...prevData,
        messages: [...(prevData.messages || []), newMessage],
        patientFeedback: patientFeedback,
        doctorFeedback: doctorFeedback,
        conversationId: conversationId,
      }))
      setDoctorFeedback({ suggestions: [], comment: "", ratings: {} });
    
      setLastDoctorMessage(selectedQuestion);

    } else {
      console.error("Selected question not found in question_to_clarify");
    }
  };

  const handleRatingChange = (suggestionNumber, isPositive) => {
    setDoctorFeedback((prevFeedback) => {
      const updatedRatings = {
        ...prevFeedback.ratings,
        [suggestionNumber]: isPositive === prevFeedback.ratings[suggestionNumber] ? null : isPositive,
      };
      const updatedFeedback = {
        ...prevFeedback,
        ratings: updatedRatings,
      };
      return updatedFeedback;
    });
  };

  const handleRatingChangePatient = (suggestionNumber, isPositive) => {
    setPatientFeedback((prevFeedback) => {
      const updatedRatings = {
        ...prevFeedback.ratings,
        [suggestionNumber]: isPositive === prevFeedback.ratings[suggestionNumber] ? null : isPositive,
      };
      const updatedFeedback = {
        ...prevFeedback,
        ratings: updatedRatings,
      };
      setDataCollection(prevData => ({
        ...prevData,
        messages: [...(prevData.messages || [])],
        patientFeedback: updatedFeedback,
      }));
      return updatedFeedback;
    });
  };

  const handleCommentChange = (e) => {
    const newComment = e.target.value;
    setTempComment(newComment);
    setDoctorFeedback((prevFeedback) => ({
      ...prevFeedback,
      comment: newComment,
    }));
  };

  const handlePatientCommentChange = (e) => {
    const newComment = e.target.value;
    setPatientFeedback(prevFeedback => {
      const updatedFeedback = {...prevFeedback, comment: newComment};
      setDataCollection(prevData => ({
        ...prevData,
        patientFeedback: updatedFeedback
      }));
      return updatedFeedback;
    });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen w-screen bg-white">
      {isLoading && <LoadingPopup />}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <PatientFeedback
          feedback={patientFeedback}
          onRatingChange={handleRatingChangePatient}
          onCommentChange={handlePatientCommentChange}
          showBackground={showBackground}
          messages={messages}
          background={background}
          setBackground={setBackground}
        />

        <PatientChatArea
          messages={messages}
          patientSuggestions={patientSuggestions}
          patientInputMessage={patientInputMessage}
          setPatientInputMessage={setPatientInputMessage}
          handleSendMessage={handleSendMessage}
          messagesEndRef={messagesEndRef}
        />

        <DoctorChatArea
          messages={messages}
          doctorSuggestions={doctorSuggestions}
          doctorInputMessage={doctorInputMessage}
          setDoctorInputMessage={setDoctorInputMessage}
          handleSendMessage={handleSendMessage}
          handleDoctorQuestionSelect={handleDoctorQuestionSelect}
          messagesEndRef={messagesEndRef}
        />

        <DoctorFeedback
          feedback={doctorFeedback}
          onRatingChange={handleRatingChange}
          onCommentChange={handleCommentChange}
        />
      </div>

      <HistoryAndDiagnosis
        consultationHistory={consultationHistory}
        diagnosis={diagnosis}
        hoveredDiagnosis={hoveredDiagnosis}
        setHoveredDiagnosis={setHoveredDiagnosis}
      />
    </div>
  );
};

export default NewChat;
