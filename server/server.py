from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama
from typing import Dict, Any
import logging
from functools import wraps
import time

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
MODEL = 'llama3.2'  # Changed to llama2 as it's more commonly available
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds

def retry_on_error(max_retries: int = MAX_RETRIES, delay: int = RETRY_DELAY):
    """Decorator to retry functions on failure"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:  # Last attempt
                        raise  # Re-raise the last exception
                    logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

@retry_on_error()
def get_model_response(message: str) -> Dict[str, Any]:
    """Get response from the Ollama model with error handling"""
    response = ollama.chat(
        model=MODEL,
        messages=[{'role': 'user', 'content': message}]
    )
    return response

class ChatError(Exception):
    """Custom exception for chat-related errors"""
    pass

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Get and validate request data
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({
                'error': 'Invalid request. Message is required.'
            }), 400

        message = data['message'].strip()
        if not message:
            return jsonify({
                'error': 'Message cannot be empty.'
            }), 400

        # Log incoming request
        logger.info(f"Received message request: {message[:50]}...")

        # Get model response
        response = get_model_response(message)
        
        if not response or 'message' not in response:
            raise ChatError("Failed to get valid response from model")

        # Return successful response
        return jsonify({
            'reply': response['message']['content'],
            'status': 'success'
        }), 200

    except ChatError as ce:
        logger.error(f"Chat error: {str(ce)}")
        return jsonify({
            'error': str(ce),
            'status': 'error'
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'error': 'An unexpected error occurred',
            'status': 'error'
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host='127.0.0.1', port=5000)