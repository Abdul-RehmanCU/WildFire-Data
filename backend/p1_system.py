# main wildfire response system implementation
# handles event processing, resource management & reporting
# using default costs for now - update based on 2024 data
import pandas as pd
import json
from pathlib import Path
from typing import Dict, Optional
from p1_models import Severity, WildfireEvent 
from p1_resources import ResourcePool

class WildfireResponseSystem:
   def __init__(self, custom_resources: Optional[Dict] = None, custom_damage_costs: Optional[Dict] = None, enable_console_print: bool = True):
       self.enable_console_print = enable_console_print
       self.resource_pool = ResourcePool(custom_resources)
       
       # starting damage costs - can override w/ custom values
       default_damage_costs = {
           Severity.LOW: 50000,      # baseline damage estimate
           Severity.MEDIUM: 100000,   # 2x low severity
           Severity.HIGH: 200000     # 4x low severity
       }
       
       if custom_damage_costs:
           for severity in Severity:
               if severity.value in custom_damage_costs:
                   default_damage_costs[severity] = custom_damage_costs[severity.value]
       
       # tracking vars for system state
       self.damage_costs = default_damage_costs
       self.operational_costs = 0  # running total of resource costs
       self.missed_response_costs = 0  # damage from unhandled fires
       self.statistics = {
           "addressed": {sev.value: 0 for sev in Severity},  # successful responses
           "missed": {sev.value: 0 for sev in Severity}     # failed responses
       }
       self.events = []  # queue of fire events
       self.event_log = []  # history of responses
       
       # setup output directory
       self.output_dir = Path("output")
       self.output_dir.mkdir(exist_ok=True)

   def save_event_log(self):
       # saves full event history to json
       output_path = self.output_dir / "event_log.json"
       with open(output_path, 'w') as f:
           json.dump(self.event_log, f, indent=2)
       if self.enable_console_print:
           print(f"\nEvent log saved to: {output_path}")

   def save_system_state(self):
       # snapshots current system state
       system_state = {
           "resources": self.resource_pool.to_dict(),
           "events": [event.to_dict() for event in self.events],
           "damage_costs": {sev.value: cost for sev, cost in self.damage_costs.items()},
           "operational_costs": self.operational_costs,
           "missed_response_costs": self.missed_response_costs,
           "statistics": self.statistics
       }
       
       output_path = self.output_dir / "system_state.json"
       with open(output_path, 'w') as f:
           json.dump(system_state, f, indent=2)
       if self.enable_console_print:
           print(f"System state saved to: {output_path}")

   def save_final_report(self, report_data: Dict):
       # writes final analysis to file
       output_path = self.output_dir / "final_report.json"
       with open(output_path, 'w') as f:
           json.dump(report_data, f, indent=2)
       if self.enable_console_print:
           print(f"Final report saved to: {output_path}")

   def load_data(self, filepath: str):
       # reads events from csv into system
       df = pd.read_csv(filepath)
       for _, row in df.iterrows():
           event = WildfireEvent(
               timestamp=pd.to_datetime(row['timestamp']),
               fire_start_time=pd.to_datetime(row['fire_start_time']),
               location=(row['location']),
               severity=Severity(row['severity'].lower())
           )
           self.events.append(event)
       
       self.events.sort()  # sort by priority order

   def process_events(self):
       # main event processing loop
       if self.enable_console_print:
           print("\nReal-time Event Processing Log:")
           print("=" * 50)
       
       for i, event in enumerate(self.events, 1):
           if self.enable_console_print:
               print(f"\nEvent {i} at {event.timestamp}:")
               print(f"Severity: {event.severity.value.upper()}")
               print(f"Location: {event.location}")
               print("\nCurrent Resource Status:")
           
           self._print_resource_status()
           
           # try to find best available resource
           resource_name = self.resource_pool.get_best_available_resource(event.severity)
           self._handle_event(event, resource_name)
           
           if self.enable_console_print:
               print("\n" + "-" * 50)
           
           # save updates
           self.save_event_log()
           self.save_system_state()

   def _print_resource_status(self):
       # helper to show resource availability
       if not self.enable_console_print:
           return
           
       status = self.resource_pool.get_resource_status()
       for resource_name, stats in status.items():
           print(f"  {resource_name.replace('_', ' ').title()}:")
           print(f"    Available: {stats['available']}/{stats['total']}")
           print(f"    Used: {stats['used']}")

   def _handle_event(self, event, resource_name):
       # processes single fire event
       if resource_name and self.resource_pool.assign_resource(resource_name):
           self._handle_successful_response(event, resource_name)
       else:
           self._handle_missed_response(event)

   def _handle_successful_response(self, event, resource_name):
       # handles case where resources available
       resource = self.resource_pool.resources[resource_name]
       event.handled = True
       event.assigned_resource = resource_name
       
       self.statistics["addressed"][event.severity.value] += 1
       self.operational_costs += resource.cost
       
       self.event_log.append({
           "timestamp": event.timestamp.isoformat(),
           "severity": event.severity.value,
           "response": "SUCCESS", 
           "resource": resource.name,
           "cost": resource.cost
       })
       
       if self.enable_console_print:
           print(f"\nResponse Decision:")
           print(f"[SUCCESS] Fire addressed using {resource.name}")
           print(f"  Deployment Time: {resource.deployment_time}")
           print(f"  Operational Cost: ${resource.cost:,}")

   def _handle_missed_response(self, event):
       # handles case where no resources available
       event.handled = False
       self.statistics["missed"][event.severity.value] += 1
       damage_cost = self.damage_costs[event.severity]
       self.missed_response_costs += damage_cost
       
       self.event_log.append({
           "timestamp": event.timestamp.isoformat(),
           "severity": event.severity.value,
           "response": "MISSED",
           "damage_cost": damage_cost
       })
       
       if self.enable_console_print:
           print(f"\nResponse Decision:")
           print(f"[FAILED] No resources available - MISSED RESPONSE")
           print(f"  Estimated Damage Cost: ${damage_cost:,}")

   def generate_report(self):
       # creates final analysis report
       total_addressed = sum(self.statistics["addressed"].values())
       total_missed = sum(self.statistics["missed"].values())
       
       if self.enable_console_print:
           self._print_summary_report(total_addressed, total_missed)
       
       report_data = self._generate_report_data(total_addressed, total_missed)
       self.save_final_report(report_data)
       
       return report_data

   def _print_summary_report(self, total_addressed, total_missed):
       # prints readable summary stats
       if not self.enable_console_print:
           return
       
       print("\nWildfire Response System Summary Report")
       print("=====================================")
       print(f"Total Events Processed: {total_addressed + total_missed}")
       print(f"Fires Addressed: {total_addressed}")
       print(f"Fires Missed: {total_missed}")
       
       self._print_resource_utilization()
       self._print_cost_analysis()
       self._print_severity_breakdown(total_addressed)

   def _generate_report_data(self, total_addressed, total_missed):
       # formats data for final report
       status = self.resource_pool.get_resource_status()
       return {
           "total_events": total_addressed + total_missed,
           "fires_addressed": total_addressed,
           "fires_missed": total_missed,
           "operational_costs": self.operational_costs,
           "damage_costs": self.missed_response_costs,
           "severity_report": self.statistics,
           "resource_utilization": status,
           "efficiency_metrics": {
               "avg_cost_per_response": self.operational_costs / total_addressed if total_addressed > 0 else 0
           }
       }

   def _print_resource_utilization(self):
       # shows how resources were used
       if not self.enable_console_print:
           return
       status = self.resource_pool.get_resource_status()
       for resource_name, stats in status.items():
           utilization = (stats['used'] / stats['total']) * 100
           print(f"  {resource_name.replace('_', ' ').title()}:")
           print(f"    Used: {stats['used']}/{stats['total']} ({utilization:.1f}%)")

   def _print_cost_analysis(self):
       # shows financial impact breakdown
       if not self.enable_console_print:
           return
       print(f"\nCost Analysis:")
       print(f"Operational Costs: ${self.operational_costs:,.2f}")
       print(f"Damage Costs from Missed Responses: ${self.missed_response_costs:,.2f}") 
       print(f"Total Combined Costs: ${(self.operational_costs + self.missed_response_costs):,.2f}")

   def _print_severity_breakdown(self, total_addressed):
       # shows response rates by severity level
       if not self.enable_console_print:
           return
       print("\nResponse Breakdown by Severity:")
       print("-----------------------------")
       for severity in Severity:
           addressed = self.statistics["addressed"][severity.value]
           missed = self.statistics["missed"][severity.value]
           total = addressed + missed
           if total > 0:
               success_rate = (addressed / total) * 100
               print(f"\n{severity.value.upper()} Severity Fires:")
               print(f"  Addressed: {addressed}")
               print(f"  Missed: {missed}")
               print(f"  Success Rate: {success_rate:.1f}%")