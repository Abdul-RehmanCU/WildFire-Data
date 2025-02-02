from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import pandas as pd
import json
from pathlib import Path

# P1 imports
from p1_system import WildfireResponseSystem
from p1_models import WildfireEvent, Severity

# P2 imports
from p2_model import WildfirePredictor
from p2_data_prep import prepare_data

app = Flask(__name__)
CORS(app)

OUTPUT_DIR = Path("output")
MODEL_DIR = Path("models")
OUTPUT_DIR.mkdir(exist_ok=True)

# Global predictor instance for P2
predictor = None

def initialize_predictor():
    """Initialize the predictor if not already initialized"""
    global predictor
    if predictor is None:
        predictor = WildfirePredictor()
        try:
            predictor.load_model(MODEL_DIR)
        except FileNotFoundError:
            return False
    return True

# P1 Routes
@app.route('/api/p1/get_system_state', methods=['GET'])
def get_system_state():
    try:
        with open(OUTPUT_DIR / "system_state.json", 'r') as f:
            system_state = json.load(f)
        return jsonify(system_state), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/p1/final_report', methods=['GET'])
def get_final_report():
    try:
        with open(OUTPUT_DIR / "final_report.json", 'r') as f:
            report = json.load(f)
        return jsonify(report), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/p1/process_uploaded_data', methods=['POST'])
def process_uploaded_data():
    try:
        data = request.json
        if not data or 'events' not in data:
            return jsonify({"error": "No data provided"}), 400

        # Create a new system instance for processing only (no file saving)
        custom_system = WildfireResponseSystem(enable_console_print=False)
        
        # Convert the JSON data to WildfireEvent objects
        for event_data in data['events']:
            event = WildfireEvent(
                timestamp=datetime.fromisoformat(event_data['timestamp']),
                fire_start_time=datetime.fromisoformat(event_data['fire_start_time']),
                location=event_data['location'],
                severity=Severity(event_data['severity'].lower())
            )
            custom_system.events.append(event)
        
        # Sort and process events
        custom_system.events.sort()
        custom_system.process_events()
        
        # Generate responses directly (without saving)
        response = {
            "system_state": {
                "resources": custom_system.resource_pool.to_dict(),
                "events": [event.to_dict() for event in custom_system.events],
                "damage_costs": {sev.value: cost for sev, cost in custom_system.damage_costs.items()},
                "operational_costs": custom_system.operational_costs,
                "missed_response_costs": custom_system.missed_response_costs,
                "statistics": custom_system.statistics
            },
            "final_report": custom_system.generate_report()
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# P2 Routes
@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """Get predictions from the predictions.json file"""
    try:
        prediction_file = OUTPUT_DIR / "predictions.json"
        if not prediction_file.exists():
            return jsonify({"error": "No predictions available"}), 404
            
        with open(prediction_file, 'r') as f:
            predictions = json.load(f)
        return jsonify(predictions), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def make_prediction():
    """Make predictions based on input environmental data"""
    try:
        # Check if model is initialized
        if not initialize_predictor():
            return jsonify({"error": "Model not found. Please train the model first."}), 500

        # Get data from request
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Convert JSON to DataFrame
        env_df = pd.DataFrame(data['environmental_data'])
        
        # Prepare data and make predictions
        prepared_df = prepare_data(env_df, None)
        predictions_df = predictor.predict(prepared_df)
        
        # Filter high-risk predictions
        high_risk = predictions_df[predictions_df['fire_probability'] >= 0.90].copy()
        high_risk['timestamp'] = pd.to_datetime(high_risk['timestamp'])
        
        # Format response
        response = {"predictions": {}}
        
        # Group predictions by date
        for date, group in high_risk.groupby(high_risk['timestamp'].dt.date.astype(str)):
            response["predictions"][date] = []
            
            for _, row in group.iterrows():
                prediction = {
                    "time": row['timestamp'].strftime('%H:%M:%S'),
                    "location": {
                        "latitude": float(row['latitude']),
                        "longitude": float(row['longitude'])
                    },
                    "risk_factors": {
                        "fire_probability": float(row['fire_probability']),
                        "temperature": float(row['temperature']),
                        "humidity": float(row['humidity']),
                        "wind_speed": float(row['wind_speed']),
                        "fwi": float(row['FWI']),
                        "dsr": float(row['DSR'])
                    }
                }
                response["predictions"][date].append(prediction)
        
        # Save predictions to file
        with open(OUTPUT_DIR / "predictions.json", 'w') as f:
            json.dump(response, f, indent=2)
        
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)