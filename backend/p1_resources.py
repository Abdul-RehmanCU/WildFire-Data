# manages resource pool and assignments for wildfire response
# tweak default values based on field testing feedback
from typing import Dict, Optional
from p1_models import ResourceType, Severity

class ResourcePool:
   # default resource configs - numbers from current deployment guidelines
   DEFAULT_RESOURCES = {
       "smoke_jumpers": {
           "deployment_time_minutes": 30, 
           "cost": 5000,
           "total_units": 5
       },
       "fire_engines": {
           "deployment_time_minutes": 60,   
           "cost": 2000,
           "total_units": 10
       },
       "helicopters": {
           "deployment_time_minutes": 45,   
           "cost": 8000,
           "total_units": 3
       },
       "tanker_planes": {
           "deployment_time_minutes": 120, 
           "cost": 15000,
           "total_units": 2
       },
       "ground_crews": {
           "deployment_time_minutes": 90,
           "cost": 3000,
           "total_units": 8
       }
   }

   def __init__(self, custom_resources: Optional[Dict] = None):
       self.resources = {}
       resources_config = self.DEFAULT_RESOURCES.copy()
       
       # override defaults w custom configs if provided
       if custom_resources:
           resources_config.update(custom_resources)
       
       # init all resource types
       for name, config in resources_config.items():
           self.resources[name] = ResourceType.from_dict(name, config)

   def to_dict(self):
       # converts pool to dict format for storage
       return {name: resource.to_dict() for name, resource in self.resources.items()}

   def get_best_available_resource(self, severity: Severity) -> Optional[str]:
       # finds cheapest available resource for given severity
       available_resources = [
           (name, resource) for name, resource in self.resources.items()
           if resource.available_units > 0
       ]

       if not available_resources:
           return None

       sorted_resources = sorted(available_resources, key=lambda x: x[1].cost)
       return sorted_resources[0][0]

   def assign_resource(self, resource_name: str) -> bool:
       # tries to assign a resource, returns success status
       resource = self.resources[resource_name]
       if resource.available_units > 0:
           resource.used_units += 1
           return True
       return False

   def get_resource_status(self) -> Dict[str, Dict]:
       # gets current status of all resources
       return {
           name: {
               "total": resource.total_units,
               "used": resource.used_units,
               "available": resource.available_units
           }
           for name, resource in self.resources.items()
       }