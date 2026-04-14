from flask import Flask, jsonify
from flask_cors import CORS
from routes import groq_bp
import traceback
import os

app = Flask(__name__)

# CORS: allow all origins (no cookie-based auth used)
CORS(app)

app.register_blueprint(groq_bp)

@app.route('/health', methods=['GET'])
def health():
    return {"status": "ok", "service": "TravelView Groq Backend"}

@app.errorhandler(500)
def handle_500(e):
    """Global error handler that logs full tracebacks."""
    traceback.print_exc()
    return jsonify({"error": str(e)}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    """Catch-all for unhandled exceptions."""
    traceback.print_exc()
    return jsonify({"error": f"{type(e).__name__}: {str(e)}"}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("TravelView Groq Backend starting...")
    print("Server: http://127.0.0.1:5001")
    print("Health: http://127.0.0.1:5001/health")
    print("=" * 50)
    app.run(debug=True, port=5001, host='0.0.0.0')
