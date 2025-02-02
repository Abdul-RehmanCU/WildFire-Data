from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io

from p1_system import WildfireResponseSystem
from p1_models import Severity

from p2_data_prep import prepare_data, create_fwi_features
from p2_model import WildfirePredictor
from p2_export import export_predictions_to_json_in_memory

import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Cache a global predictor to avoid loading model each time
WILDFIRE_PREDICTOR = None

@app.route('/api/p1/get_final_report', methods=['POST'])
def get_final_report():
    """
    Expects JSON:
      { "rawData": [ {...}, {...}, ... ],
        "customResources": { ... } (optional),
        "customDamageCosts": { ... } (optional)
      }
    Returns final stats from WildfireResponseSystem
    """
    data = request.get_json() or {}
    
    raw_data = data.get('rawData', [])
    custom_resources = data.get('customResources', None)
    custom_damage_costs = data.get('customDamageCosts', None)

    # Create the system
    wildfire_system = WildfireResponseSystem(
        custom_resources=custom_resources,
        custom_damage_costs=custom_damage_costs,
        enable_console_print=False
    )
    
    # Convert rawData -> CSV in memory
    if raw_data:
        csv_buffer = io.StringIO()
        pd.DataFrame(raw_data).to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
    else:
        return jsonify({"error": "No raw data provided"}), 400
    
    wildfire_system.load_data(csv_buffer)
    wildfire_system.process_events()
    final_report = wildfire_system.generate_report()

    return jsonify(final_report), 200


@app.route('/api/p2/get_predictions', methods=['POST'])
def get_predictions():
    """
    Expects JSON:
      { "rawData": [ {...}, {...}, ... ],
        "probability_threshold": 0.90 (optional)
      }
    Returns:
      {
        "predictions": {
          "YYYY-MM-DD": [ { ... }, ... ]
        }
      }
    """
    global WILDFIRE_PREDICTOR
    
    data = request.get_json(silent=True) or {}
    raw_data = data.get('rawData', [])
    probability_threshold = float(data.get('probability_threshold', 0.90))

    if not raw_data:
        return jsonify({"error": "No rawData provided"}), 400

    # Convert list-of-dicts -> CSV -> DataFrame
    csv_buffer = io.StringIO()
    pd.DataFrame(raw_data).to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    future_df = pd.read_csv(csv_buffer)
    future_df['timestamp'] = pd.to_datetime(future_df['timestamp'], errors='coerce')
    
    # Create FWI features if needed
    future_df = create_fwi_features(future_df)

    # If the model isn't loaded yet, load it once
    if WILDFIRE_PREDICTOR is None:
        WILDFIRE_PREDICTOR = WildfirePredictor()
        WILDFIRE_PREDICTOR.load_model('models')

    # Predict
    predictions = WILDFIRE_PREDICTOR.predict(future_df, probability_threshold=probability_threshold)

    # Convert to JSON
    predictions_json = export_predictions_to_json_in_memory(
        predictions,
        probability_threshold=probability_threshold
    )

    return jsonify(predictions_json), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
