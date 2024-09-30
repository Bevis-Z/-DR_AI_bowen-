import os
from flask import Flask, request, jsonify
from langchain_community.embeddings import SentenceTransformerEmbeddings
from huggingface_hub import snapshot_download
import torch
import openai
from langchain_openai.embeddings import OpenAIEmbeddings
__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
import sqlite3
print(sqlite3.sqlite_version)
# Set environment variable for PyTorch memory management
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:128'
openai_api_key = os.getenv('OPENAI_API_KEY')
# Initialize Flask app
app = Flask(__name__)

class EmbeddingModel:
    def __init__(self, use_openai=False, openai_api_key=None):
        self.use_openai = use_openai
        if self.use_openai:
            assert openai_api_key is not None, "OpenAI API key is required for OpenAI embeddings."
            openai.api_key = openai_api_key
            self.embeddings=OpenAIEmbeddings()
        else:
            model_dir = '/home/lou/Data/Liang_13060835/projects/llmops/servers/all-MiniLM-L6-v2'
            snapshot_location = snapshot_download(repo_id="sentence-transformers/all-MiniLM-L6-v2", local_dir=model_dir)
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            self.embeddings = SentenceTransformerEmbeddings(model_name=snapshot_location, model_kwargs={'device': device})

    def get_embedding(self, text):
        return self.embeddings.embed_query(text)

# Initialize the embedding model (set use_openai=True to use OpenAI embeddings)
embedding_model = EmbeddingModel(use_openai=True, openai_api_key=openai_api_key)

@app.route('/get_embedding', methods=['POST'])
def get_embedding():
    try:
        # Get the input data from the request
        data = request.get_json()
        text = data['text']

        # Generate the embedding
        query_result = embedding_model.get_embedding(text)
        # Return the embedding as a JSON response
        return jsonify({"embedding": query_result})
    
    except Exception as e:
        # Handle any errors that occur during the process
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    # Run the Flask app
    app.run(host='0.0.0.0', port=8001)


# curl -X POST http://localhost:8001/get_embedding -H "Content-Type: application/json" -d '{"text": "Your sample text here"}'