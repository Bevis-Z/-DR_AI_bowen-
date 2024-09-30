# LLM Solutions Experiment Repository

This repository is dedicated to experiments with Large Language Models (LLMs). It includes various components for managing data, evaluating models, and running chatbot servers. Below is an overview of the directory structure and functionalities.

This repository is built with python3.11.5

## Directory Structure

- **`src/`**: Contains all source code files.

  - **`src/datasets/`**: Manages the vector database and data warehouse for the LLM chatbot.

  - **`src/evaluations/`**: Includes scripts for evaluating the Retrieval-Augmented Generation (RAG) system. Currently, it contains the Giskard evaluation script.

  - **`src/servers/`**: Hosts the chatbot server components. For example, you can start the embedding server with the following command:
    ```bash
    python src/servers/embedding_server.py
    ```
    Use RESTful requests to obtain embeddings for your queries.
  - **`src/apps/`**: Hosts the wrapped up applications. For example, you can start the pre-consultation app with the following command:
    ```bash
    python src/apps/dialog.py 
    ```
    Use RESTful requests to obtain embeddings for your queries.

## Contributing

Feel free to contribute to this repository by submitting pull requests or opening issues for any improvements or bugs.