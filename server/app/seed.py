import os
from sqlmodel import Session, select
from app.core.db import engine
from app.models.users import DBUser, Role
from app.core.security import hash_password


def seed_admin():
    admin_username = os.environ.get("ADMIN_USERNAME")
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")

    if not all([admin_username, admin_email, admin_password]):
        print("Admin seed skipped: Missing env vars.")
        return

    with Session(engine) as session:
        # Check if an admin with this username already exists
        existing = session.exec(
            select(DBUser).where(DBUser.username == admin_username)
        ).one_or_none()

        if existing:
            print(f"Admin user '{admin_username}' already exists.")
            return

        # Create new admin
        admin = DBUser(
            username=admin_username,
            email=admin_email,
            hash=hash_password(admin_password),
            role=Role.admin,
            active=True,
        )
        session.add(admin)
        session.commit()
        print(f"Admin user '{admin_username}' created.")


if __name__ == "__main__":
    seed_admin()
