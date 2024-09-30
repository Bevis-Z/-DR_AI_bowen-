export const sendBackend = async ({ patientMessage, doctorMessage, conversationId }) => {
  try {
    const response = await fetch("http://localhost:5001/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientMessage,
        doctorMessage,
        conversationId,
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch the response:", error);
    throw error;
  }
};
