from .users import DBUser

from app.models.adventures import (
    DBAdventure,
    PublicAdventure,
    LinkedAdventure,
    ModifyAdventure,
    CreateAdventure,
)
from app.models.checkpoints import (
    DBCheckpoint,
    AdminCheckpoint,
    PublicCheckpoint,
    ModifyCheckpoint,
    CreateCheckpoint,
)

# Rebuild AFTER everything is imported
for model in [
    LinkedAdventure,
    PublicAdventure,
    ModifyAdventure,
    CreateAdventure,
    DBAdventure,
    AdminCheckpoint,
    PublicCheckpoint,
    ModifyCheckpoint,
    CreateCheckpoint,
    DBCheckpoint,
]:
    model.model_rebuild()

__all__ = ["DBUser", "DBAdventure", "DBCheckpoint"]
