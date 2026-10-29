from sqlalchemy import insert, select

from app.db.session import get_engine
from app.modules.script_practice.scripts.models import (
    scripts,
    script_roles,
    script_lines,
)
from app.modules.script_practice.scripts.schemas import ScriptCreate

def create_lines(connection, script_id, lines, role_ids):
    for position, line in enumerate(lines, start=1):
        statement = insert(script_lines).values(
            script_id=script_id,
            role_id=role_ids[line.role_index],
            position=position,
            text=line.text,
            spoken_text=line.spoken_text,
        )

        connection.execute(statement)

def create_roles(connection, script_id, roles):
    role_ids = []

    for position, role in enumerate(roles, start=1):
        statement = (
            insert(script_roles)
            .values(
                script_id=script_id,
                name=role.name,
                position=position,
            )
            .returning(script_roles.c.id)
        )

        role_id = connection.execute(statement).scalar_one()
        role_ids.append(role_id)

    return role_ids


def create_script(data: ScriptCreate):
    engine = get_engine()

    with engine.begin() as connection:
        statement = (
            insert(scripts)
            .values(title=data.title)
            .returning(scripts.c.id)
        )

        script_id = connection.execute(statement).scalar_one()
        
        role_ids = create_roles(connection,script_id,data.roles,)
        
        create_lines(connection, script_id, data.lines, role_ids,)
        
    return {"id": script_id, "title": data.title}

## Search script's information
def get_roles(connection, script_id):
    statement = (
        select(script_roles)
        .where(script_roles.c.script_id == script_id)
        .order_by(script_roles.c.position)
    )

    roles = connection.execute(statement).mappings().all()

    return [dict(role) for role in roles]




def get_lines(connection, script_id):
    statement = (
        select(script_lines)
        .where(script_lines.c.script_id == script_id)
        .order_by(script_lines.c.position)
    )

    lines = connection.execute(statement).mappings().all()

    return [dict(line) for line in lines]


def get_script(script_id: int):
    engine = get_engine()

    with engine.connect() as connection:
        statement = select(scripts).where(
            scripts.c.id == script_id
        )

        script = connection.execute(statement).mappings().first()

        if script is None:
            return None

        result = dict(script)
        result["roles"] = get_roles(connection, script_id)
        result["lines"] = get_lines(connection, script_id)

        return result

        



def list_scripts(limit: int = 24, offset: int = 0):
    engine = get_engine()
    with engine.connect() as connection:
        statement = (
            select(scripts.c.id, scripts.c.title, scripts.c.created_at)
            .order_by(scripts.c.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return [dict(row) for row in connection.execute(statement).mappings().all()]
