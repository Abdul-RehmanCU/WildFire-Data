import pandas as pd
import json
from datetime import datetime

def export_predictions_to_json_in_memory(predictions_df, probability_threshold=0.90):
    """
    Similar to export_predictions_to_json, but returns
    a Python dict (for in-memory use) instead of writing to file.
    """
    # Filter predictions based on threshold
    high_risk = predictions_df[predictions_df['fire_probability'] >= probability_threshold].copy()

    # Convert timestamp to datetime if it's not already
    high_risk['timestamp'] = pd.to_datetime(high_risk['timestamp'])

    # Create JSON structure
    predictions_json = {
        "predictions": {}
    }

    # Group predictions by date
    for date, group in high_risk.groupby(high_risk['timestamp'].dt.date.astype(str)):
        predictions_json["predictions"][date] = []

        for _, row in group.iterrows():
            prediction = {
                "time": row['timestamp'].strftime('%H:%M:%S'),
                "location": {
                    "latitude": float(row['latitude']),
                    "longitude": float(row['longitude'])
                },
                "risk_factors": {
                    "fire_probability": float(row['fire_probability']),
                    "temperature": float(row.get('temperature', 0.0)),
                    "humidity": float(row.get('humidity', 0.0)),
                    "wind_speed": float(row.get('wind_speed', 0.0)),
                    "fwi": float(row.get('FWI', 0.0)),
                    "dsr": float(row.get('DSR', 0.0))
                }
            }
            predictions_json["predictions"][date].append(prediction)

    return predictions_json