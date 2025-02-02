import pandas as pd
import json
from datetime import datetime
from p2_data_prep import prepare_data
from p2_model import WildfirePredictor
import warnings
warnings.filterwarnings('ignore')

def export_predictions_to_json(predictions_df, output_file='predictions.json', probability_threshold=0.90):
    """Export predictions to JSON format, grouped by date."""
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
                    "temperature": float(row['temperature']),
                    "humidity": float(row['humidity']),
                    "wind_speed": float(row['wind_speed']),
                    "fwi": float(row['FWI']),
                    "dsr": float(row['DSR'])
                }
            }
            predictions_json["predictions"][date].append(prediction)
    
    # Save to file
    with open(output_file, 'w') as f:
        json.dump(predictions_json, f, indent=2)
    
    print(f"Predictions exported to {output_file}")
    return predictions_json

def train_model():
    """Train and save the model"""
    # Define data paths
    env_data_path = 'data/historical_environmental_data.csv'
    fire_data_path = 'data/historical_wildfiredata.csv'
    
    # Initialize predictor
    predictor = WildfirePredictor()
    
    print("Preparing training data...")
    env_df = prepare_data(env_data_path, fire_data_path)
    
    print("Training model...")
    predictor.train(env_df, probability_threshold=0.90)
    
    print("Saving model...")
    predictor.save_model('models')
    
    return predictor

def make_predictions(predictor=None):
    """Make predictions using trained model"""
    if predictor is None:
        predictor = WildfirePredictor()
        print("Loading model...")
        predictor.load_model('models')
    
    # Define path for future data
    future_data_path = 'data/future_environmental_data.csv'
    
    print("Preparing prediction data...")
    future_df = prepare_data(future_data_path, None)
    
    print("Making predictions...")
    predictions = predictor.predict(future_df, probability_threshold=0.90)
    
    return predictions

def print_predictions(predictions_df, probability_threshold=0.90):
    """Print predictions grouped by date."""
    # Convert timestamp to date string for grouping
    predictions_df['date'] = pd.to_datetime(predictions_df['timestamp']).dt.date
    
    # Filter for predictions above threshold and sort
    high_risk = predictions_df[predictions_df['fire_probability'] >= probability_threshold].sort_values('timestamp')
    
    if len(high_risk) > 0:
        print(f"\nPredicted Wildfire Risks (Fire Probability >= {probability_threshold*100}%):")
        print("="*70)
        
        # Group by date
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
    """Main function for training the model and making predictions"""
    # Train the model
    print("\n=== Training Model ===")
    predictor = train_model()
    
    # Make predictions
    print("\n=== Making Predictions ===")
    predictions = make_predictions(predictor)
    
    # Print predictions
    print("\n=== Prediction Results ===")
    print_predictions(predictions, probability_threshold=0.90)
    
    # Export results
    print("\n=== Exporting Predictions ===")
    predictions.to_csv('predictions.csv', index=False)
    export_predictions_to_json(predictions, 'predictions.json', probability_threshold=0.90)

def main_predict():
    """Main function for loading existing model and making predictions"""
    print("\n=== Loading Model and Making Predictions ===")
    predictor = WildfirePredictor()
    predictor.load_model('models')
    
    # Make predictions
    predictions = make_predictions(predictor)
    
    # Print predictions
    print("\n=== Prediction Results ===")
    print_predictions(predictions, probability_threshold=0.90)
    
    # Export results
    print("\n=== Exporting Predictions ===")
    predictions.to_csv('output/p2_predictions.csv', index=False)
    export_predictions_to_json(predictions, 'output/p2_predictions.json', probability_threshold=0.90)

if __name__ == "__main__":
    main_predict()
    # main_train()