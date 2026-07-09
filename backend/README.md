# Dovite Journal Backend

This is the FastAPI backend for the Dovite Journal submission system. It provides APIs for manuscript submission, file uploads, and Stripe payment intents.

## Prerequisites

- Python 3.8+
- [Stripe Account](https://dashboard.stripe.com/register) (for Test API Keys)

## Setup Instructions

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**
   Set your Stripe test secret key in your environment before running the server:
   
   *Windows (PowerShell)*
   ```powershell
   $env:STRIPE_SECRET_KEY="sk_test_..."
   ```
   
   *macOS/Linux*
   ```bash
   export STRIPE_SECRET_KEY="sk_test_..."
   ```

5. **Run the Server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   
   The API will be available at `http://localhost:8000`. You can view the interactive documentation at `http://localhost:8000/docs`.

## API Endpoints

- `GET /api/submissions` - List all submissions
- `POST /api/submissions` - Create a new submission
- `GET /api/submissions/{id}` - Get submission details
- `PATCH /api/submissions/{id}` - Update a submission status
- `POST /api/uploads` - Upload a manuscript file (multipart/form-data)
- `POST /api/payments/create-intent` - Create a Stripe PaymentIntent

## Notes

- Files are stored locally in the `uploads/` directory.
- The SQLite database is created automatically at `./dovite_journal.db`.
