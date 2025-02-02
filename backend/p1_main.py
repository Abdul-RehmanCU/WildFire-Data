# p1_main.py
from p1_system import WildfireResponseSystem

def main():
    # Example of using custom configurations
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
    
    # Initialize with custom configurations and enable printing
    system = WildfireResponseSystem(
        custom_resources=custom_resources,
        custom_damage_costs=custom_damage_costs,
        enable_console_print=True  # This will show all console output
    )
    
    # Or use default configurations
    system = WildfireResponseSystem(enable_console_print=True)

    system.load_data("data/current_wildfiredata.csv")
    system.process_events()
    system.generate_report()

if __name__ == "__main__":
    main()