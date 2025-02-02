# prediction export utilities
# handles json formatting for api responses
import pandas as pd
import json
from datetime import datetime

def export_predictions_to_json_in_memory(predictions_df, probability_threshold=0.90):
   """formats predictions for api response - keeps everything in memory"""
   
   # only keep the risky ones
   high_risk = predictions_df[predictions_df['fire_probability'] >= probability_threshold].copy()

   # ensure timestamps are datetime
   high_risk['timestamp'] = pd.to_datetime(high_risk['timestamp'])

   # setup the json structure 
   predictions_json = {
       "predictions": {}
   }

   # group by date for better organization
   for date, group in high_risk.groupby(high_risk['timestamp'].dt.date.astype(str)):
       predictions_json["predictions"][date] = []

       # format each prediction nicely
       for _, row in group.iterrows():
           prediction = {
               "time": row['timestamp'].strftime('%H:%M:%S'),
               # location details
               "location": {
                   "latitude": float(row['latitude']),
                   "longitude": float(row['longitude'])
               },
               # all the risk indicators
               "risk_factors": {
                   "fire_probability": float(row['fire_probability']),
                   "temperature": float(row.get('temperature', 0.0)),
                   "humidity": float(row.get('humidity', 0.0)), 
                   "wind_speed": float(row.get('wind_speed', 0.0)),
                   "fwi": float(row.get('FWI', 0.0)),     # fire weather index
                   "dsr": float(row.get('DSR', 0.0))      # daily severity rating
               }
           }
           predictions_json["predictions"][date].append(prediction)

   return predictions_json