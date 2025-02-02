# quick n dirty implementation of the main system
from p1_system import WildfireResponseSystem

def main():
   #custom stuff - can add if needed
   custom_resources = {
       "rapid_response_team": {
           "deployment_time_minutes": 15,
           "cost": 10000,
           "total_units": 3
       },
       "fire_engines": {
           "deployment_time_minutes": 45,
           "cost": 2500,
           "total_units": 15
       }
   }
   
   custom_damage_costs = {
       "low": 75000,
       "medium": 150000,
       "high": 300000
   }
   
   # init system w/ our configs + printing enabled cuz debugging is a pain otherwise
   system = WildfireResponseSystem(
       custom_resources=custom_resources,
       custom_damage_costs=custom_damage_costs,
       enable_console_print=True  # helps w/debugging
   )
   
   # fallback to defaults (overwrite the code above)
   system = WildfireResponseSystem(enable_console_print=True)

   system.load_data("data/current_wildfiredata.csv")
   system.process_events()
   system.generate_report()

if __name__ == "__main__":
   main()