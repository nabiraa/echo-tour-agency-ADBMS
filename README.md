# ECHO - World Tour Management Agency

An Advanced NoSQL Database application built using MongoDB Atlas, Node.js, Express, and React to manage global K-pop concert logistics, ticket booking concurrency, and live tour analytics.

## 🚀 Features
- **Flexible Schema Design:** Handles complex artist data (solos/groups) and embedded concert timelines.
- **Concurrency Control:** Utilizes MongoDB multi-document transactions to prevent ticket overselling.
- **Analytics Dashboard:** Uses advanced Aggregation Pipelines to track total revenue and attendance metrics.

## 📦 Prerequisites
Before running this project, ensure you have **Node.js** and **npm** installed.

## 🛠️ Installation & Setup

### 1. ENV Configuration File
   1. Navigate to the backend folder
        cd backend
   2. Create a new file named ".env"
   3. Paste the shared MongoDB connection string
      PORT=5000
      (string provided)
      
### 2. Backend Setup in a Seperate Terminal
1. Navigate to the backend directory:
   Run the following commands:
      1. cd backend
      2. npm install
      3. node seedMore.js
      4. node server.js
### 3. Frontend Setup in a Seperate Terminal
1. Navigate to the frontend directory:
   Run the following commands:
      1. cd frontend
      2. npm start
   
