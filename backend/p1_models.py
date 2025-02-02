# core data models for wildfire system 
# might add more severity levels later!
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from enum import Enum

class Severity(Enum):
   LOW = "low"
   MEDIUM = "medium" 
   HIGH = "high"
   
   def priority(self) -> int:
       # maps severity to priority number
       return {
           Severity.LOW: 1,
           Severity.MEDIUM: 2,
           Severity.HIGH: 3
       }[self]

@dataclass
class ResourceType:
   name: str
   deployment_time: timedelta
   cost: float
   total_units: int
   used_units: int = 0  # tracks currently deployed units

   @classmethod
   def from_dict(cls, name: str, config: Dict):
       # helper to create from config dictionary
       return cls(
           name=name,
           deployment_time=timedelta(minutes=config.get('deployment_time_minutes', 0)),
           cost=float(config.get('cost', 0)),
           total_units=int(config.get('total_units', 0)),
           used_units=int(config.get('used_units', 0))
       )

   def to_dict(self):
       # converts to dict format for storage/api
       return {
           "name": self.name,
           "deployment_time_minutes": self.deployment_time.total_seconds() / 60,
           "cost": self.cost,
           "total_units": self.total_units,
           "used_units": self.used_units,
           "available_units": self.available_units
       }

   @property
   def available_units(self) -> int:
       # calculates remaining available units
       return self.total_units - self.used_units

@dataclass
class WildfireEvent:
   timestamp: datetime
   fire_start_time: datetime
   location: tuple   # stores lat/long coordinates 
   severity: Severity
   handled: bool = False     # tracks if event is addressed
   assigned_resource: Optional[str] = None  # tracks assigned resource type

   def to_dict(self):
       # converts event to dictionary format
       return {
           "timestamp": self.timestamp.isoformat(),
           "fire_start_time": self.fire_start_time.isoformat(),
           "location": self.location,
           "severity": self.severity.value,
           "handled": self.handled,
           "assigned_resource": self.assigned_resource
       }

   def __lt__(self, other):
       # prioritizes by timestamp then severity
       # used for sorting events queue
       if self.timestamp != other.timestamp:
           return self.timestamp < other.timestamp
       return self.severity.priority() > other.severity.priority()