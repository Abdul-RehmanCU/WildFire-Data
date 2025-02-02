import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
import joblib
import os
from pathlib import Path

class WildfirePredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_cols = [
            'temperature', 'humidity', 'wind_speed', 'precipitation',
            'vegetation_index', 'human_activity_index', 'latitude', 'longitude',
            'FFMC', 'DMC', 'DC', 'ISI', 'BUI', 'FWI', 'DSR'
        ]
        
    def train(self, env_df, probability_threshold=0.90):
        """Train XGBoost model with enhanced FWI features."""
        # Sort data chronologically
        env_df = env_df.sort_values('timestamp')
        
        # Calculate split point (60% train, 40% test)
        split_idx = int(len(env_df) * 0.6)
        split_date = env_df.iloc[split_idx]['timestamp']
        
        print(f"\nTraining on data before: {split_date}")
        print(f"Testing on data from: {split_date}")
        
        # Split data chronologically
        train_df = env_df[env_df['timestamp'] < split_date]
        test_df = env_df[env_df['timestamp'] >= split_date]
        
        X_train = train_df[self.feature_cols]
        y_train = train_df['fire_occurred']
        X_test = test_df[self.feature_cols]
        y_test = test_df['fire_occurred']
        
        # Initialize and fit scaler
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Calculate class weights
        pos_weight = len(y_train[y_train==0])/len(y_train[y_train==1])
        
        # Initialize and train model
        self.model = XGBClassifier(
            scale_pos_weight=pos_weight,
            learning_rate=0.001,
            n_estimators=2000,
            max_depth=6,
            min_child_weight=6,
            subsample=0.6,
            colsample_bytree=0.6,
            random_state=42
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        self._evaluate_model(X_test_scaled, y_test, probability_threshold)
        
        return self
    
    def _evaluate_model(self, X_test_scaled, y_test, probability_threshold):
        """Evaluate model performance."""
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        y_pred_high_conf = (y_pred_proba >= probability_threshold).astype(int)
        
        print(f"\nModel Performance (Threshold: {probability_threshold*100}%):")
        print(classification_report(y_test, y_pred_high_conf))
        
        # Feature importance
        importance_df = pd.DataFrame({
            'feature': self.feature_cols,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nFeature Importance Rankings:")
        print(importance_df)
        
        # High confidence analysis
        high_conf_mask = y_pred_proba >= probability_threshold
        if high_conf_mask.any():
            n_high_conf = high_conf_mask.sum()
            n_correct = (y_test[high_conf_mask] == 1).sum()
            print(f"\nHigh Confidence Analysis (>={probability_threshold*100}%):")
            print(f"Total high confidence predictions: {n_high_conf}")
            print(f"Correct high confidence predictions: {n_correct}")
            print(f"High confidence precision: {n_correct/n_high_conf:.2%}")
        else:
            print("\nNo predictions met the high confidence threshold")
    
    def predict(self, future_df, probability_threshold=0.90):
        """Make predictions on new data."""
        if self.model is None or self.scaler is None:
            raise ValueError("Model not trained. Call train() first or load a saved model.")
            
        X_future = future_df[self.feature_cols]
        X_future_scaled = self.scaler.transform(X_future)
        
        # Make predictions
        probabilities = self.model.predict_proba(X_future_scaled)[:, 1]
        predictions = (probabilities >= probability_threshold).astype(int)
        
        # Add predictions to dataframe
        future_df['fire_predicted'] = predictions
        future_df['fire_probability'] = probabilities
        
        return future_df
    
    def save_model(self, model_dir='models'):
        """Save the trained model and scaler."""
        if self.model is None or self.scaler is None:
            raise ValueError("No model to save. Train a model first.")
            
        # Create directory if it doesn't exist
        Path(model_dir).mkdir(parents=True, exist_ok=True)
        
        # Save model and scaler
        model_path = os.path.join(model_dir, 'wildfire_model.joblib')
        scaler_path = os.path.join(model_dir, 'scaler.joblib')
        
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        
        print(f"Model saved to {model_path}")
        print(f"Scaler saved to {scaler_path}")
    
    def load_model(self, model_dir='models'):
        """Load a trained model and scaler."""
        model_path = os.path.join(model_dir, 'wildfire_model.joblib')
        scaler_path = os.path.join(model_dir, 'scaler.joblib')
        
        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            raise FileNotFoundError("Model or scaler file not found. Train a model first.")
            
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        
        print("Model and scaler loaded successfully")