# fire weather index (FWI) calculation module
# formulas based on canadian FWI standards
# added vectorization for better performance
import pandas as pd
import p2_fwi as fwi

def create_fwi_features(df):
   """handles sequential FWI system calculations for dataset"""
   
   # need timestamp order for proper calcs
   df = df.sort_values('timestamp')
   
   # init starting conditions from standard values
   df['FFMC'] = 85.0  # fine fuel moisture code
   df['DMC'] = 6.0    # duff moisture code  
   df['DC'] = 15.0    # drought code
   
   # need months for seasonal adjustments
   months = df['timestamp'].dt.month
   
   # gotta do these ones in order since they depend on prev values
   for i in range(1, len(df)):
       # fine fuel moisture - fast response
       df.iloc[i, df.columns.get_loc('FFMC')] = fwi.calculate_ffmc_vectorized(
           df.iloc[i]['temperature'], 
           df.iloc[i]['humidity'],
           df.iloc[i]['wind_speed'],
           df.iloc[i]['precipitation'],
           df.iloc[i-1]['FFMC']
       )
       
       # duff layer moisture - medium response
       df.iloc[i, df.columns.get_loc('DMC')] = fwi.calculate_dmc_vectorized(
           df.iloc[i]['temperature'],
           df.iloc[i]['humidity'],
           df.iloc[i]['precipitation'],
           df.iloc[i-1]['DMC'],
           months.iloc[i]
       )
       
       # deep soil moisture - slow response
       df.iloc[i, df.columns.get_loc('DC')] = fwi.calculate_dc_vectorized(
           df.iloc[i]['temperature'],
           df.iloc[i]['precipitation'],
           df.iloc[i-1]['DC'],
           months.iloc[i]
       )
   
   # these ones can be done all at once - no dependencies
   df['ISI'] = fwi.calculate_isi(df['FFMC'], df['wind_speed'])  # spread index
   df['BUI'] = fwi.calculate_bui(df['DMC'], df['DC'])          # buildup index 
   df['FWI'] = fwi.calculate_fwi(df['ISI'], df['BUI'])         # fire weather idx
   df['DSR'] = fwi.calculate_dsr(df['FWI'])                    # daily severity
   
   return df

def prepare_data(env_data_path, fire_data_path):
   """preps environmental and fire data for modeling"""
   # load the env data first
   env_df = pd.read_csv(env_data_path)
   env_df['timestamp'] = pd.to_datetime(env_df['timestamp'])
   
   if fire_data_path:
       # merge in historical fire data if we have it
       fire_df = pd.read_csv(fire_data_path)
       fire_df['timestamp'] = pd.to_datetime(fire_df['timestamp'])
       
       # need unique id for each location-time combo
       env_df['location_time'] = env_df['timestamp'].dt.strftime('%Y-%m-%d %H:00:00') + '_' + \
                                env_df['latitude'].round(4).astype(str) + '_' + \
                                env_df['longitude'].round(4).astype(str)
       
       fire_df['location_time'] = fire_df['timestamp'].dt.strftime('%Y-%m-%d %H:00:00') + '_' + \
                                 fire_df['latitude'].round(4).astype(str) + '_' + \
                                 fire_df['longitude'].round(4).astype(str)
       
       # mark where fires happened
       fire_locations = fire_df[['location_time']].drop_duplicates()
       fire_locations['fire_occurred'] = 1
       
       # join it all together
       env_df = env_df.merge(fire_locations[['location_time', 'fire_occurred']], 
                            on='location_time', 
                            how='left')
       env_df['fire_occurred'] = env_df['fire_occurred'].fillna(0)
   
   # add the FWI system features
   env_df = create_fwi_features(env_df)
   
   return env_df