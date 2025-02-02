# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from p1_system import WildfireResponseSystem
from p1_models import Severity
import pandas as pd
import io

app = Flask(__name__)
CORS(app)

@app.route('/api/p1/get_final_report', methods=['POST'])
def get_final_report():
    """
    Expects a JSON body with:
      {
        "rawData": [ {...}, {...}, ... ],
        "customResources": { ... } (optional),
        "customDamageCosts": { ... } (optional)
      }
    Returns JSON with the final report fields.
    """
    data = request.get_json()
    
    # 1) Extract rawData, customResources, customDamageCosts from POST body
    raw_data = data.get('rawData', [])
    custom_resources = data.get('customResources', None)
    custom_damage_costs = data.get('customDamageCosts', None)

    # 2) Create the WildfireResponseSystem with custom options
    wildfire_system = WildfireResponseSystem(
        custom_resources=custom_resources,
        custom_damage_costs=custom_damage_costs,
        enable_console_print=False  # or True if you want to see logs in console
    )
    
    # 3) Convert rawData (list of dicts) -> DataFrame -> CSV in-memory OR pass directly
    # Option A: Make a temp CSV-like string
    csv_buffer = io.StringIO()
    if raw_data:
        # Convert list-of-dicts to DataFrame
        df = pd.DataFrame(raw_data)
        # Ensure columns exist & match the server's expectations (timestamp, fire_start_time, etc.)
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
    else:
        return jsonify({"error": "No raw data provided"}), 400
    
    # 4) Load that CSV content into the system
    wildfire_system.load_data(csv_buffer)
    
    # 5) Process & generate the final report
    wildfire_system.process_events()
    final_report = wildfire_system.generate_report()

    # 6) Return the final report as JSON
    return jsonify(final_report), 200

if __name__ == '__main__':
    # For local dev
    app.run(host='0.0.0.0', port=5000, debug=True)
