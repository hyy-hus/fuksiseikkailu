from .users import DBUser
from .push import DBPushSubscription

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

from app.models.teams import (
    DBTeam,
    AdminTeam,
    PublicTeam,
    ModifyTeam,
    CreateTeam,
)

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
    DBTeam,
    AdminTeam,
    PublicTeam,
    ModifyTeam,
    CreateTeam,
]:
    model.model_rebuild()

__all__ = ["DBUser", "DBAdventure", "DBCheckpoint", "DBTeam", "DBPushSubscription"]
