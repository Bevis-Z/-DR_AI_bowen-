import { useState } from 'react';

export const useChatState = () => {
  const [messages, setMessages] = useState([]);
  const [consultationHistory, setConsultationHistory] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [doctorSuggestions, setDoctorSuggestions] = useState([]);
  const [patientFeedback, setPatientFeedback] = useState({
    suggestions: [],
    comment: "",
    ratings: {},
  });
  const [doctorFeedback, setDoctorFeedback] = useState({
    suggestions: [],
    comment: "",
    ratings: {},
  });
  const [apiData, setApiData] = useState({});
  const [patientInputMessage, setPatientInputMessage] = useState("");
  const [doctorInputMessage, setDoctorInputMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [lastDoctorMessage, setLastDoctorMessage] = useState("");
  const [tempComment, setTempComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredDiagnosis, setHoveredDiagnosis] = useState(null);
  const [background, setBackground] = useState("");
  const [showBackground, setShowBackground] = useState(true);
  const [dataCollection, setDataCollection] = useState({
    messages: [],  // Initialize as an empty array
    patientFeedback: {},
    doctorFeedback: {},
    diagnosis: {},
    conversationId: '',
  });
  return {
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
  };
};
