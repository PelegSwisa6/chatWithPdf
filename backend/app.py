import json
import os
from flask import Flask, request, jsonify
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from dotenv import load_dotenv
from flask_cors import CORS 
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads/files'
DEFAULT_FOLDER = 'uploads/defaultfile'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['DEFAULT_FOLDER'] = DEFAULT_FOLDER
USER_TIMEOUT_MINUTES  = 10
conversations = {}  

def init():
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    if not os.path.exists(DEFAULT_FOLDER):
        os.makedirs(DEFAULT_FOLDER)

init()

USER_TIMEOUT_MINUTES = 1  # 10 minutes timeout

def init_pdf(name, user_id):
    # Load PDFs, create vector store, and initialize conversation chain
    if(name == '7.10.2023.pdf'):
        pdf_docs = [os.path.join(app.config['DEFAULT_FOLDER'], name)]
    else:    
        pdf_docs = [os.path.join(app.config['UPLOAD_FOLDER'], name)]
    raw_text = get_pdf_text(pdf_docs)
    text_chunks = get_text_chunks(raw_text)
    vectorstore = get_vectorstore(text_chunks)
    conversation = get_conversation_chain(vectorstore)
    conversations[user_id] = {'conversation': conversation, 'chat_history': None, 'last_activity': datetime.now()}
    return "server run"

@app.route('/chat', methods=['POST'])
def chat():
    user_id = request.json.get('user_id')
    user_question = request.json.get('question')
    
    if user_id not in conversations:
           return jsonify({'question': user_question, 'answer': "Add your pdf file please or click the default button" }), 200


    conversation_data = conversations[user_id]
    conversation_data['last_activity'] = datetime.now() 

    # Process user question
    response = handle_user_input(conversation_data['conversation'], conversation_data['chat_history'], user_question)

    # Return the chat history as JSON
    question = response['question']
    question = question.replace("Answer only according to the pdf files if I ask for information: ", "")
    result = {'question': question, 'answer': response['answer']}
    conversation_data['chat_history'] = response['chat_history']

    return json.dumps(result, indent=2)

@app.route('/add-pdf', methods=['POST'])
def add_pdf():
    user_id = request.form['user_id']

    if 'default' in request.form:
        init_pdf("7.10.2023.pdf", user_id)
        return jsonify({'message': 'File uploaded successfully'}), 200

    if 'pdf' not in request.files or 'user_id' not in request.form:
        return jsonify({'error': 'Invalid request'}), 400

    pdf_file = request.files['pdf']
    

    if pdf_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if pdf_file:
        filename = os.path.join(app.config['UPLOAD_FOLDER'], pdf_file.filename)
        pdf_file.save(filename)
        init_pdf(pdf_file.filename, user_id)

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

def handle_user_input(conversation, chat_history, user_question):
    # Check if the user's question is relevant to the PDF content
    prompt = "Answer only according to the pdf files if I ask for information: " + user_question
    response = conversation({'question': prompt, 'chat_history': chat_history})
    return response

def remove_inactive_users():
    current_time = datetime.now()
    inactive_users = [user_id for user_id, data in conversations.items() if (current_time - data['last_activity']).total_seconds() > USER_TIMEOUT_MINUTES * 60]
    for user_id in inactive_users:
        del conversations[user_id]

if __name__ == "__main__":
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=remove_inactive_users, trigger="interval", seconds=60)  # Check for inactive users every minute
    scheduler.start()

    atexit.register(lambda: scheduler.shutdown())

    app.run(debug=True)
