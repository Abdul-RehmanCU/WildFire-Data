import pandas as pd
import p2_fwi as fwi

def create_fwi_features(df):
    """Create FWI system components as features - Vectorized"""
    
    # Sort by timestamp
    df = df.sort_values('timestamp')
    
    # Initialize columns with default values
    df['FFMC'] = 85.0
    df['DMC'] = 6.0
    df['DC'] = 15.0
    
    # Get timestamps as month numbers
    months = df['timestamp'].dt.month
    
    # Calculate FFMC, DMC, and DC sequentially
    for i in range(1, len(df)):
        df.iloc[i, df.columns.get_loc('FFMC')] = fwi.calculate_ffmc_vectorized(
            df.iloc[i]['temperature'], 
            df.iloc[i]['humidity'],
            df.iloc[i]['wind_speed'],
            df.iloc[i]['precipitation'],
            df.iloc[i-1]['FFMC']
        )
        
        df.iloc[i, df.columns.get_loc('DMC')] = fwi.calculate_dmc_vectorized(
            df.iloc[i]['temperature'],
            df.iloc[i]['humidity'],
            df.iloc[i]['precipitation'],
            df.iloc[i-1]['DMC'],
            months.iloc[i]
        )
        
        df.iloc[i, df.columns.get_loc('DC')] = fwi.calculate_dc_vectorized(
            df.iloc[i]['temperature'],
            df.iloc[i]['precipitation'],
            df.iloc[i-1]['DC'],
            months.iloc[i]
        )
    
    # Calculate remaining indices all at once
    df['ISI'] = fwi.calculate_isi(df['FFMC'], df['wind_speed'])
    df['BUI'] = fwi.calculate_bui(df['DMC'], df['DC'])
    df['FWI'] = fwi.calculate_fwi(df['ISI'], df['BUI'])
    df['DSR'] = fwi.calculate_dsr(df['FWI'])
    
    return df

def prepare_data(env_data_path, fire_data_path):
    """Prepare and merge environmental and fire data with FWI features."""
    # Load data
    env_df = pd.read_csv(env_data_path)
    
    # Convert timestamps to datetime
    env_df['timestamp'] = pd.to_datetime(env_df['timestamp'])
    
    if fire_data_path:
        fire_df = pd.read_csv(fire_data_path)
        fire_df['timestamp'] = pd.to_datetime(fire_df['timestamp'])
        
        # Create location-time identifier for merging
        env_df['location_time'] = env_df['timestamp'].dt.strftime('%Y-%m-%d %H:00:00') + '_' + \
                                 env_df['latitude'].round(4).astype(str) + '_' + \
                                 env_df['longitude'].round(4).astype(str)
        
        fire_df['location_time'] = fire_df['timestamp'].dt.strftime('%Y-%m-%d %H:00:00') + '_' + \
                                  fire_df['latitude'].round(4).astype(str) + '_' + \
                                  fire_df['longitude'].round(4).astype(str)
        
        # Create fire occurrence indicator
        fire_locations = fire_df[['location_time']].drop_duplicates()
        fire_locations['fire_occurred'] = 1
        
        # Merge with environmental data
        env_df = env_df.merge(fire_locations[['location_time', 'fire_occurred']], 
                             on='location_time', 
                             how='left')
        env_df['fire_occurred'] = env_df['fire_occurred'].fillna(0)
    
    # Add FWI features
    env_df = create_fwi_features(env_df)
    
    return env_df