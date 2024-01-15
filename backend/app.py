import json
import os
from flask import Flask, request, jsonify
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings, HuggingFaceInstructEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from dotenv import load_dotenv
from flask_cors import CORS 

load_dotenv()

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads/files'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def init():
    global my_global_variable
    my_global_variable = False
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
init()


def init_pdf(name):
    # Load PDFs, create vector store, and initialize conversation chain
    pdf_docs = [os.path.join(app.config['UPLOAD_FOLDER'], name)]
    raw_text = get_pdf_text(pdf_docs)
    text_chunks = get_text_chunks(raw_text)
    vectorstore = get_vectorstore(text_chunks)
    app.config['conversation'] = get_conversation_chain(vectorstore)
    app.config['chat_history'] = None
    global my_global_variable
    my_global_variable = True
    return "server run"

@app.route('/chat', methods=['POST'])
def chat():  
    user_question = request.json.get('question')
    global my_global_variable
    if my_global_variable == False:
        result = {'question': user_question , 'answer': "Add your pdf file please"}
        json_result = json.dumps(result, indent=2)
        return json_result
    # Process user question
    response = handle_user_input(user_question)
    # Return the chat history as JSON
    question = response['question']
    question = question.replace("Answer only according to the pdf files if I ask for information: ", "")
    result = {'question': question , 'answer': response['answer']}
    json_result = json.dumps(result, indent=2)
    return json_result


@app.route('/add-pdf', methods=['POST'])
def add_pdf():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    pdf_file = request.files['pdf']

    if pdf_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if pdf_file:
        filename = os.path.join(app.config['UPLOAD_FOLDER'], pdf_file.filename)
        pdf_file.save(filename)
        init_pdf(pdf_file.filename)

        return jsonify({'message': 'File uploaded successfully'}), 200
     
def get_pdf_text(pdf_docs):
    text = ""
    for pdf in pdf_docs:
        pdf_reader = PdfReader(pdf)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text

def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks

def get_vectorstore(text_chunks):
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore

def get_conversation_chain(vectorstore):
    llm = ChatOpenAI()
    memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)
    conversation_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        memory=memory
    )
    return conversation_chain

def handle_user_input(user_question):
    # Check if the user's question is relevant to the PDF content
    prompt = "Answer only according to the pdf files if I ask for information: " + user_question
    response = app.config['conversation']({'question': prompt})
    app.config['chat_history'] = response['chat_history']
    return response
  
       

if __name__ == "__main__":
    app.run(debug=True)
