# dialog.py

import json
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import yaml
from threading import Lock

from langgraph.graph import MessagesState, START, END, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage

# Load environment variables from the .env file
load_dotenv()

# Access the API keys
openai_api_key = os.getenv('OPENAI_API_KEY')

# Flask App Setup
app = Flask(__name__)
CORS(app)

# AIConversation class
class AIConversation:
    def __init__(self, id, max_loop=10, prompts_file='prompts.yaml') -> None:
        # Get the directory of the current script
        script_dir = os.path.dirname(os.path.realpath(__file__))
        # Construct the full path to prompts.yaml
        self.prompts_file = os.path.join(script_dir, prompts_file)
        self.model = ChatOpenAI(model="gpt-4", api_key=openai_api_key)
        self.config = {"configurable": {"thread_id": str(id)}}
        self.lock = Lock()  # To ensure thread safety when updating prompts

        # Initialize instruction variables with default values
        self.identify_issues_prompt_instruction = """
        As an AI assistant, your task is to add new issues into the "health_issues" by reviewing the conversation history mentioned by the human AI. 
        The output will be an updated health issue dictionary. It will contain the duration and severity of the issue. If no duration or severity is mentioned, you can leave the value empty.
        The output MUST be valid JSON. **Do NOT include any additional text outside of the JSON format.**
        """
        self.medical_history_prompt_instruction = """
        As an AI assistant, your task is to:
        
        - **Review** the entire conversation history, consider questions asked to the patient and their answers.
        - **Objective:** Identify and summarize any **health issues or medical history** mentioned by the human.
        - **Instructions:** Provide a **concise summary** of these health issues in a paragraph.
        - **Important:** If there are no health issues or medical history mentioned, reply with: "No health issues or medical history mentioned."
        """
        self.diagnostic_prompt_instruction = """
        Imagine you are a doctor, based on the identified health issues and medical history, list AT MOST 3 possible causes of the issue, ranked from most likely diagnosis.
        For each diagnosis, provide a brief explanation of why you think it is likely.
        The diagnoses should be based on ICD-10 codes. Provide the link to the ICD-10 code for each diagnosis.
        """
        self.question_to_clarify_issue_prompt_instruction = """
        As an AI assistant, your task is to:
        Review the health_issues, check issues one by one. If duration and severity are not mentioned, include a question that asks the human for the information. If the issue is clear, check the next issue. 
        If the issue may be caused by communicable diseases, include a question that asks the human who and when they were in contact with the person. 
        Consider asking the human about medicines they are taking.
        Do not ask questions that already have been answered in the conversation.
        If no issue is mentioned, question should be asked about the medical history and health issues.
        Prioritize the duration, then severity, then medication history, then contact history, then other information.
        The questions should help make a final diagnosis as soon as possible.
        Also include answers to the questions (selective_answers) in the response.
        """
        self.decision_prompt_instruction = """
        As an AI assistant, your task is to:
        
        - **Review** the entire conversation history, consider all messages, including their answers to your questions.
        - **Objective:** Determine whether you have sufficient information to make a **final diagnosis** based on conversation history.
        - **Instructions:**
        
        - **If you can make a final diagnosis:**
            - Reply with: **'yes'**
        
        - **If you cannot make a final diagnosis:**
            - Reply with: **'no'**
        
        - **Important:**
        
        - **Do not include** any additional information, explanations, or questions in your response.
        - Your response should be **either 'yes' or 'no' only**.
        """
        self.final_summary_prompt_instruction = """
        Conclude the final diagnosis and provide suggestions. Focus only on the top 1 diagnosis and health history.
        Suggestions may include appropriate treatments and medications.
        If the diagnosis doesn't make sense, reply with: "I can't help you based on information provided."
        """

        # # Load initial instructions from YAML
        # self.load_prompts()

        # Define PromptTemplates with hardcoded JSON formatting and {instruction} placeholder
        self.identify_issues_prompt = PromptTemplate(
            input_variables=["instruction", "health_issues"],
            template="""
            Instruction: {instruction}
            Previous_health_issues: {health_issues}
            **The response must strictly follow this structure:**
            {{
                "issue_name": {{"duration": "Duration of the issue", "severity": "Severity of the issue"}},
                "issue_name": {{"duration": {{}}, "severity": {{}}}},
                "issue_name": "... (and so on)"
            }}
            **You will reply only with the JSON itself, and no other descriptive or explanatory text.**
            """
        )

        self.medical_history_prompt = PromptTemplate(
            input_variables=["instruction"],
            template="""
            Instruction: {instruction}

            As an AI assistant, your task is to:
            - **Review** the entire conversation history, consider questions asked to the patient and their answers.
            - **Objective:** Identify and summarize any **health issues or medical history** mentioned by the human.
            - **Instructions:** Provide a **concise summary** of these health issues in a paragraph.
            - **Important:** If there are no health issues or medical history mentioned, reply with: "No health issues or medical history mentioned."
            """
        )

        self.diagnostic_prompt = PromptTemplate(
            input_variables=["instruction", "health_issues", "medical_history"],
            template="""
            Instruction: {instruction}
            health_issues: {health_issues}
            medical_history: {medical_history}

            **The response must strictly follow this structure:**
            {{
            "diagnoses": {{
                "1": {{"name":"Diagnosis 1", "justification": "Explanation of why you think it is likely", "link": "Link to ICD-10 code"}},
                "2": {{"name":"Diagnosis 2", "justification": "Explanation of why you think it is likely", "link": "Link to ICD-10 code"}},
                "3": {{"name":"Diagnosis 3", "justification": "Explanation of why you think it is likely", "link": "Link to ICD-10 code"}}
            }}
            }}

            **Example 1: Non-health-related message**

            *User's message*:

            "Can you tell me a joke?"

            *Assistant's response*:

                {{
                    "diagnoses": {{}}
                }}
                **You will reply only with the JSON itself, and no other descriptive or explanatory text.**
            """
        )

        self.question_to_clarify_issue_prompt = PromptTemplate(
            input_variables=["instruction", "health_issues", "medical_history"],
            template="""
            Instruction: {instruction}

            health_issues: {health_issues}
            medical_history: {medical_history}

            **The response must strictly follow this structure:**
            {{
            "question_to_clarify": {{
                "1": {{"question":"first question", "selective_answers": ["answer1", "answer2"]}},
                "2": {{"question":"second question", "selective_answers": ["answer1", "answer2"]}},
                "3": {{"question":"third question", "selective_answers": ["answer1", "answer2"]}}
            }}
            }}

            **Example 1: Answer to health issues or medical history mentioned **
            {{
            "question_to_clarify": {{
                "1": {{"question":"What health issues are you experiencing?", "selective_answers": ["I had fever", "I am coughing"]}}
            }}
            }}
            **You will reply only with the JSON itself, and no other descriptive or explanatory text.**
            """
        )

        self.decision_prompt = PromptTemplate(
            input_variables=["instruction"],
            template="""
            Instruction: {instruction}

            As an AI assistant, your task is to:

            - **Review** the entire conversation history, consider all messages, including their answers to your questions.
            - **Objective:** Determine whether you have sufficient information to make a **final diagnosis** based on conversation history.
            - **Instructions:**

            - **If you can make a final diagnosis:**
                - Reply with: **'yes'**

            - **If you cannot make a final diagnosis:**
                - Reply with: **'no'**

            - **Important:**

            - **Do not include** any additional information, explanations, or questions in your response.
            - Your response should be **either 'yes' or 'no' only**.
            """
        )

        self.final_summary_prompt = PromptTemplate(
            input_variables=["instruction", "diagnosis", "medical_history"],
            template="""
            Instruction: {instruction}

            Diagnosis: {diagnosis}
            Health history: {medical_history}
            """
        )

        # Define a new graph
        workflow = StateGraph(MessagesState)

        # Define the nodes
        workflow.add_node("identify_issue", self.identify_issues)
        workflow.add_node("question_to_clarify_issue", self.question_to_clarify_issue)
        workflow.add_node("doctor_message", self.doctor_message)
        workflow.add_node("patient_message", self.patient_message)
        workflow.add_node("diagnosis", self.diagnosis)
        workflow.add_node("final_conclusion", self.final_conclusion)

        # Set the edges
        workflow.add_edge(START, "doctor_message")
        workflow.add_edge("doctor_message", "patient_message")
        workflow.add_edge("patient_message", "identify_issue")
        workflow.add_edge("identify_issue", "diagnosis")

        # Conditional edges
        workflow.add_conditional_edges(
            "diagnosis",
            self.should_continue,
            {
                "continue": "question_to_clarify_issue",
                "end": "final_conclusion",
            },
        )

        workflow.add_edge("question_to_clarify_issue", "doctor_message")
        workflow.add_edge("final_conclusion", END)

        # Initialize variables
        self.health_issues = None
        self.current_diagnose = ""
        self.medical_history = ""
        self.questions = {}
        self.loop_num = 0
        self.max_loop = max_loop

        # Initialize memory and compile workflow
        memory = MemorySaver()
        self.app = workflow.compile(checkpointer=memory, interrupt_before=["doctor_message", "patient_message"])

    def load_prompts(self):
        """Load instruction variables from the YAML file."""
        try:
            with open(self.prompts_file, 'r') as file:
                prompts = yaml.safe_load(file)
        except yaml.YAMLError as e:
            print(f"Error parsing YAML file: {e}")
            raise
        except FileNotFoundError:
            print(f"YAML file '{self.prompts_file}' not found.")
            raise

        # Update Instruction variables
        try:
            self.identify_issues_prompt_instruction = prompts['identify_issues_prompt_instruction']
            self.medical_history_prompt_instruction = prompts['medical_history_prompt_instruction']
            self.diagnostic_prompt_instruction = prompts['diagnostic_prompt_instruction']
            self.question_to_clarify_issue_prompt_instruction = prompts['question_to_clarify_issue_prompt_instruction']
            self.decision_prompt_instruction = prompts['decision_prompt_instruction']
            self.final_summary_prompt_instruction = prompts['final_summary_prompt_instruction']
        except KeyError as e:
            print(f"Missing key in YAML file: {e}")
            raise

    def update_prompts(self):
        """Update instruction variables by reloading the YAML configuration."""
        with self.lock:
            self.load_prompts()
            print("Instructions have been updated from the YAML file.")

    def identify_issues(self, state):
        self.loop_num += 1
        formatted_prompt=self.identify_issues_prompt.invoke({"instruction": self.identify_issues_prompt_instruction, "health_issues": self.health_issues if self.health_issues else "" })
        messages = state["messages"]
        messages[0].content = formatted_prompt.text
        health_issues_response = self.model.invoke(messages)
        self.health_issues = health_issues_response.content

    def question_to_clarify_issue(self, state):
        formatted_prompt = self.question_to_clarify_issue_prompt.invoke(
            {
                "instruction": self.question_to_clarify_issue_prompt_instruction,
                "health_issues": self.health_issues if self.health_issues else "",
                "medical_history": self.medical_history if self.medical_history else ""
            }
        )
        messages = state["messages"]
        messages[0].content = formatted_prompt.text
        questions_response = self.model.invoke(messages)
        self.questions = questions_response.content

    def should_continue(self, state):
        formatted_prompt = self.decision_prompt.invoke({"instruction": self.decision_prompt_instruction})
        messages = state["messages"]
        messages[0].content = formatted_prompt.text
        response = self.model.invoke(messages).content.strip().lower()
        if response == 'yes' or self.loop_num >= self.max_loop:
            return "end"
        else:
            return "continue"

    def diagnosis(self, state):
        # Update medical history
        formatted_medical_history_prompt = self.medical_history_prompt.invoke({"instruction": self.medical_history_prompt_instruction})
        messages = state["messages"]
        messages[0].content = formatted_medical_history_prompt.text
        medical_history_response = self.model.invoke(messages)
        self.medical_history = medical_history_response.content

        # Generate diagnosis
        formatted_prompt = self.diagnostic_prompt.invoke(
            {
                "instruction": self.diagnostic_prompt_instruction,
                "health_issues": self.health_issues if self.health_issues else "",
                "medical_history": self.medical_history if self.medical_history else ""
            }
        )
        messages[0].content = formatted_prompt.text
        diagnosis_response = self.model.invoke(messages)
        self.current_diagnose = diagnosis_response.content

    def doctor_message(self, state):
        pass  # Implement as needed

    def patient_message(self, state):
        pass  # Implement as needed

    def final_conclusion(self, state):
        formatted_final_summary = self.final_summary_prompt.invoke(
            {
                "instruction": self.final_summary_prompt_instruction,
                "diagnosis": self.current_diagnose,
                "medical_history": self.medical_history
            }
        )
        final_answer = self.model.invoke({"messages": [{"content": formatted_final_summary.text, "role": "system"}]})
        return {"messages": [final_answer]}

    def invoke(self):
        mes = {"messages": [{"content": "Start conversation", "role": "system"}]}
        self.app.invoke(mes, config=self.config)


# Initialize the conversation instance and a lock for thread safety
conv = None
conv_lock = Lock()

# Function to load or create a new conversation instance
def get_conversation(conversation_id=None):
    global conv
    with conv_lock:
        if conv is None or (conversation_id and conv.config.get("configurable") != conversation_id):
            uuid1 = uuid.uuid1()
            conv = AIConversation(uuid1, max_loop=10)
            conv.invoke()
        return conv

# API endpoint to receive the human's message
@app.route('/api/ask', methods=['POST'])
def receive_human_answer():
    global conv

    data = request.json

    # Extract data from the request
    doctor_message_content = data.get('doctorMessage', "")
    patient_message_content = data.get('patientMessage', "")
    conversation_id = data.get('conversationId')

    # Get or create a conversation instance
    conv = get_conversation(conversation_id)

    # Define messages with roles
    doctor_message = HumanMessage(
        content=doctor_message_content,
        additional_kwargs={"role": "doctor"}
    ) if doctor_message_content else HumanMessage(
        content="",
        additional_kwargs={"role": "doctor"}
    )

    patient_message = HumanMessage(
        content=patient_message_content,
        additional_kwargs={"role": "patient"}
    ) if patient_message_content else HumanMessage(
        content="",
        additional_kwargs={"role": "patient"}
    )

    # Update instructions from YAML before processing
    conv.update_prompts()

    # Process doctor message
    for event in conv.app.stream({"messages": [doctor_message]}, conv.config, stream_mode="values"):
        event["messages"][-1].pretty_print()
    conv.app.update_state(conv.config, {"messages": doctor_message}, as_node="doctor_message")

    # Process patient message
    for event in conv.app.stream({"messages": [patient_message]}, conv.config, stream_mode="values"):
        event["messages"][-1].pretty_print()
    conv.app.update_state(conv.config, {"messages": patient_message}, as_node="patient_message")

    # Stream the next steps
    for event in conv.app.stream(None, conv.config, stream_mode="values"):
        event["messages"][-1].pretty_print()
    feedbackFromAI = event["messages"][-1].content

    if 'question_to_clarify' in conv.questions:
        try:
            # Combine JSON data
            diagnosis = json.loads(conv.current_diagnose).get("diagnoses", {})
            questions = json.loads(conv.questions).get("question_to_clarify", {})
            response_data = {
                "diagnosis": diagnosis,
                "heath_issue_summarization": conv.medical_history,
                "question_to_clarify": questions,
                "conversationId": conv.config.get("configurable"),
            }
            print("response_data",response_data)
            return jsonify(response_data)
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON format in AI response."}), 500
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        try:
            # Combine JSON data
            response_data = {
                "diagnosis": feedbackFromAI,
                "health_issue_summarization": conv.medical_history,
                "question_to_clarify": {},
                "conversationId": conv.config.get("configurable"),
            }
            with conv_lock:
                del conv  # Remove the old instance
                conv = None  # Reset to allow new conversation
            return jsonify(response_data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# Removed the /api/update_prompts endpoint since prompts.yaml is updated manually

if __name__ == "__main__":
    # Run the Flask app
    app.run(host='0.0.0.0', port=5001)