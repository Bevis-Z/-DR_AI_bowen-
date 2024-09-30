import os
import sys
import requests
from flask import Flask, request, jsonify
from langchain_community.vectorstores import Chroma
# Ensure pysqlite3 is used for sqlite3
__import__('pysqlite3')
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')

# Custom APIEmbedding class
class APIEmbedding:
    def __init__(self, api_url):
        self.api_url = api_url

    def embed_query(self, text):
        return self._get_embedding(text)

    def embed_documents(self, texts):
        return [self._get_embedding(text) for text in texts]

    def _get_embedding(self, text):
        headers = {"Content-Type": "application/json"}
        data = {"text": text}
        response = requests.post(self.api_url, json=data, headers=headers)
        if response.status_code == 200:
            return response.json()["embedding"]
        else:
            raise Exception(f"Error: {response.status_code}, {response.text}")
        
class API_retriever:
    def __init__(self, api_url):
        self.api_url = api_url
    def invoke(self, text):
        headers = {"Content-Type": "application/json"}
        data = {"text": text}
        response = requests.post(self.api_url, json=data, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error: {response.status_code}, {response.text}")
