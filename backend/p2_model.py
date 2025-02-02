# ml model for wildfire prediction
# uses xgboost w/ environmental features & FWI components
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
       # features we care about - env conditions + fire indices
       self.feature_cols = [
           'temperature', 'humidity', 'wind_speed', 'precipitation',
           'vegetation_index', 'human_activity_index', 'latitude', 'longitude',
           'FFMC', 'DMC', 'DC', 'ISI', 'BUI', 'FWI', 'DSR'
       ]
       
   def train(self, env_df, probability_threshold=0.90):
       """train model on historical env data w/ FWI features"""
       # keep time order for train/test split
       env_df = env_df.sort_values('timestamp')
       
       # use 60/40 chronological split
       split_idx = int(len(env_df) * 0.6)
       split_date = env_df.iloc[split_idx]['timestamp']
       
       print(f"\nTraining on data before: {split_date}")
       print(f"Testing on data from: {split_date}")
       
       # split the data
       train_df = env_df[env_df['timestamp'] < split_date]
       test_df = env_df[env_df['timestamp'] >= split_date]
       
       X_train = train_df[self.feature_cols]
       y_train = train_df['fire_occurred']
       X_test = test_df[self.feature_cols]
       y_test = test_df['fire_occurred']
       
       # scale features for better training
       self.scaler = StandardScaler()
       X_train_scaled = self.scaler.fit_transform(X_train)
       X_test_scaled = self.scaler.transform(X_test)
       
       # handle class imbalance
       pos_weight = len(y_train[y_train==0])/len(y_train[y_train==1])
       
       # setup xgboost w/ tuned params
       self.model = XGBClassifier(
           scale_pos_weight=pos_weight,    # balance rare events
           learning_rate=0.001,            # slow & steady
           n_estimators=2000,              # lots of trees
           max_depth=6,                    # prevent overfitting
           min_child_weight=6,
           subsample=0.6,                  # reduce variance
           colsample_bytree=0.6,
           random_state=42                 # reproducible
       )
       
       self.model.fit(X_train_scaled, y_train)
       
       # check how we did
       self._evaluate_model(X_test_scaled, y_test, probability_threshold)
       
       return self
   
   def _evaluate_model(self, X_test_scaled, y_test, probability_threshold):
       """check model performance metrics"""
       y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
       y_pred_high_conf = (y_pred_proba >= probability_threshold).astype(int)
       
       print(f"\nModel Performance (Threshold: {probability_threshold*100}%):")
       print(classification_report(y_test, y_pred_high_conf))
       
       # see what features matter most
       importance_df = pd.DataFrame({
           'feature': self.feature_cols,
           'importance': self.model.feature_importances_
       }).sort_values('importance', ascending=False)
       
       print("\nFeature Importance Rankings:")
       print(importance_df)
       
       # look at high confidence predictions
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
       """generate predictions for new data"""
       if self.model is None or self.scaler is None:
           raise ValueError("Model not trained. Call train() first or load a saved model.")
           
       X_future = future_df[self.feature_cols]
       X_future_scaled = self.scaler.transform(X_future)
       
       # get probabilities and threshold
       probabilities = self.model.predict_proba(X_future_scaled)[:, 1]
       predictions = (probabilities >= probability_threshold).astype(int)
       
       # add to results df
       future_df['fire_predicted'] = predictions
       future_df['fire_probability'] = probabilities
       
       return future_df
   
   def save_model(self, model_dir='models'):
       """save model & scaler for later use"""
       if self.model is None or self.scaler is None:
           raise ValueError("No model to save. Train a model first.")
           
       # make sure we have somewhere to save
       Path(model_dir).mkdir(parents=True, exist_ok=True)
       
       # save both components
       model_path = os.path.join(model_dir, 'wildfire_model.joblib')
       scaler_path = os.path.join(model_dir, 'scaler.joblib')
       
       joblib.dump(self.model, model_path)
       joblib.dump(self.scaler, scaler_path)
       
       print(f"Model saved to {model_path}")
       print(f"Scaler saved to {scaler_path}")
   
   def load_model(self, model_dir='models'):
       """load previously trained model"""
       model_path = os.path.join(model_dir, 'wildfire_model.joblib')
       scaler_path = os.path.join(model_dir, 'scaler.joblib')
       
       if not os.path.exists(model_path) or not os.path.exists(scaler_path):
           raise FileNotFoundError("Model or scaler file not found. Train a model first.")
           
       self.model = joblib.load(model_path)
       self.scaler = joblib.load(scaler_path)
       
       print("Model and scaler loaded successfully")