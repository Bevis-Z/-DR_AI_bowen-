import os
import sys
import requests
from flask import Flask, request, jsonify
from langchain_community.vectorstores import Chroma
sys.path.insert(0, 'src')
from utils.APIs import APIEmbedding
# Ensure pysqlite3 is used for sqlite3
__import__('pysqlite3')
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
embedding_model=APIEmbedding("http://localhost:8001/get_embedding")
# Initialize the Chroma vector store
vector_store = Chroma(
    collection_name="conDB",
    embedding_function=embedding_model,
    persist_directory="./consultation_db"
)
# Initialize Flask app
app = Flask(__name__)

@app.route('/query', methods=['POST'])
def query_vector_store():
    try:
        # Get the input data from the request
        data = request.get_json()
        query_text = data['text']
        # Retrieve nearest neighbors from the vector store
        results = vector_store.similarity_search_with_score(query_text, k=3)
        scores=[]
        docs=[]
        for doc, score in results:
            page_content = doc.page_content
            docs.append(page_content)
            scores.append(score)

        ouputs={"contexts":docs,"scores":scores}
        # Prepare the results to return
        # retrieved_texts = [result.page_content for result in results]
        return jsonify(ouputs)
    
    except Exception as e:
        # Handle any errors that occur during the process
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    # Run the Flask app
    app.run(host='0.0.0.0', port=8002)

# Example curl command to test the API:
# curl -X POST http://localhost:8002/query -H 'Content-Type: application/json' -d '{"text":"This is a query text."}'
