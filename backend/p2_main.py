# main script for training & running wildfire prediction model
# threshold set to 0.90 for high confidence predictions only
import pandas as pd
import json
from datetime import datetime
from p2_data_prep import prepare_data
from p2_model import WildfirePredictor
import warnings
warnings.filterwarnings('ignore')  # suppress sklearn warnings

def export_predictions_to_json(predictions_df, output_file='predictions.json', probability_threshold=0.90):
   """formats predictions as json & saves to file"""
   # only keep high risk predictions
   high_risk = predictions_df[predictions_df['fire_probability'] >= probability_threshold].copy()
   high_risk['timestamp'] = pd.to_datetime(high_risk['timestamp'])
   
   # setup json structure
   predictions_json = {
       "predictions": {}
   }
   
   # group by date for readability
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
                   "fire_probability": float(row['fire_probability']),  # main risk score
                   "temperature": float(row['temperature']),           # supporting env data 
                   "humidity": float(row['humidity']),
                   "wind_speed": float(row['wind_speed']),
                   "fwi": float(row['FWI']),      # fire weather index
                   "dsr": float(row['DSR'])       # daily severity
               }
           }
           predictions_json["predictions"][date].append(prediction)
   
   # save the results
   with open(output_file, 'w') as f:
       json.dump(predictions_json, f, indent=2)
   
   print(f"Predictions exported to {output_file}")
   return predictions_json

def train_model():
   """train new model on historical data"""
   # training data locations
   env_data_path = 'data/historical_environmental_data.csv'
   fire_data_path = 'data/historical_wildfiredata.csv'
   
   predictor = WildfirePredictor()
   
   print("Preparing training data...")
   env_df = prepare_data(env_data_path, fire_data_path)
   
   print("Training model...")
   predictor.train(env_df, probability_threshold=0.90)
   
   print("Saving model...")
   predictor.save_model('models')
   
   return predictor

def make_predictions(predictor=None):
   """generate predictions w/ trained model"""
   # load model if not provided
   if predictor is None:
       predictor = WildfirePredictor()
       print("Loading model...")
       predictor.load_model('models')
   
   # get latest env data
   future_data_path = 'data/future_environmental_data.csv'
   
   print("Preparing prediction data...")
   future_df = prepare_data(future_data_path, None)
   
   print("Making predictions...")
   predictions = predictor.predict(future_df, probability_threshold=0.90)
   
   return predictions

def print_predictions(predictions_df, probability_threshold=0.90):
   """display predictions in readable format"""
   predictions_df['date'] = pd.to_datetime(predictions_df['timestamp']).dt.date
   
   # only show high risk areas
   high_risk = predictions_df[predictions_df['fire_probability'] >= probability_threshold].sort_values('timestamp')
   
   if len(high_risk) > 0:
       print(f"\nPredicted Wildfire Risks (Fire Probability >= {probability_threshold*100}%):")
       print("="*70)
       
       # group by date for organization
       for date, group in high_risk.groupby('date'):
           print(f"\nDate: {date}")
           print("-"*70)
           
           for _, row in group.iterrows():
               print(f"Time: {row['timestamp'].strftime('%H:%M:%S')}")
               print(f"Location: ({row['latitude']:.4f}, {row['longitude']:.4f})")
               print(f"Fire Probability: {row['fire_probability']:.1%}")
               print(f"Temperature: {row['temperature']}°C")
               print(f"Humidity: {row['humidity']}%")
               print(f"Wind Speed: {row['wind_speed']} km/h")
               print(f"FWI: {row['FWI']:.2f}")
               print("-"*50)
   else:
       print("\nNo wildfire risks predicted above the threshold.")

def main_train():
   """entry point for training new model"""
   print("\n=== Training Model ===")
   predictor = train_model()
   
   print("\n=== Making Predictions ===")
   predictions = make_predictions(predictor)
   
   print("\n=== Prediction Results ===")
   print_predictions(predictions, probability_threshold=0.90)
   
   print("\n=== Exporting Predictions ===")
   predictions.to_csv('predictions.csv', index=False)
   export_predictions_to_json(predictions, 'predictions.json', probability_threshold=0.90)

def main_predict():
   """entry point for running predictions only"""
   print("\n=== Loading Model and Making Predictions ===")
   predictor = WildfirePredictor()
   predictor.load_model('models')
   
   predictions = make_predictions(predictor)
   
   print("\n=== Prediction Results ===")
   print_predictions(predictions, probability_threshold=0.90)
   
   print("\n=== Exporting Predictions ===")
   predictions.to_csv('output/p2_predictions.csv', index=False)
   export_predictions_to_json(predictions, 'output/p2_predictions.json', probability_threshold=0.90)

if __name__ == "__main__":
   main_predict()  # just run predictions by default
   # main_train()  # uncomment to retrain model (takes time)