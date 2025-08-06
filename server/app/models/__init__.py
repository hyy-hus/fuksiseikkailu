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

from app.models.news import DBNews, AdminNews, PublicNews, ModifyNews, CreateNews

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
    DBNews,
    AdminNews,
    PublicNews,
    ModifyNews,
    CreateNews,
]:
    model.model_rebuild()

__all__ = [
    "DBUser",
    "DBAdventure",
    "DBCheckpoint",
    "DBTeam",
    "DBPushSubscription",
    "DBNews",
]
