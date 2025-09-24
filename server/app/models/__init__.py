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
    UnlinkedTeam,
    PublicTeam,
    ModifyTeam,
    CreateTeam,
)

from app.models.players import (
        DBPlayer,
        AdminPlayer,
        ModifyPlayer,
        CreatePlayer,
    )

from app.models.news import DBNews, AdminNews, PublicNews, ModifyNews, CreateNews

from app.models.scores import (
    DBScore,
    AdminScore,
    PublicScore,
    ModifyScore,
    CreateScore,
)

from app.models.app_settings import (
    DBAppSettings,
    PublicAppSettings,
    ModifyAppSettings,
)

from app.models.photos import (
    PhotoTagLink,
    BasePhoto,
    DBPhoto,
    PublicPhoto,
    BaseTag,
    DBTag,
    PublicTag,
    CreateTag
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
    DBNews,
    AdminNews,
    PublicNews,
    ModifyNews,
    CreateNews,
    DBScore,
    AdminScore,
    PublicScore,
    ModifyScore,
    CreateScore,
    DBAppSettings,
    PublicAppSettings,
    ModifyAppSettings,
    DBPlayer,
    AdminPlayer,
    ModifyPlayer,
    CreatePlayer,
    PhotoTagLink,
    BasePhoto,
    DBPhoto,
    PublicPhoto,
    BaseTag,
    DBTag,
    PublicTag,
    CreateTag
]:
    model.model_rebuild()

__all__ = [
    "DBUser",
    "DBAdventure",
    "DBCheckpoint",
    "DBTeam",
    "DBPushSubscription",
    "DBNews",
    "DBScore",
    "DBAppSettings",
    "DBPlayer",
    "DBPhoto",
    "DBTag"
]
