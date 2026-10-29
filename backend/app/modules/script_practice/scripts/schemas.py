from pydantic import BaseModel, ConfigDict, Field, model_validator




class RoleCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    
class LineCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    role_index: int = Field(ge=0)
    text: str = Field(min_length=1)
    spoken_text: str | None = None


class ScriptCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=255)
    roles: list[RoleCreate] = Field(min_length=1)
    lines: list[LineCreate] = Field(min_length=1)
    
    @model_validator(mode="after")
    def check_role_indexes(self):
        for line in self.lines:
            if line.role_index >= len(self.roles):
                raise ValueError(
                    f"Role index {line.role_index} does not exist."
                )
        return self
    
    @model_validator(mode="after")
    def check_role_names(self):
        noRepeat = set()
        for role in self.roles:
            name = role.name.lower()
            
            if name in noRepeat:
                raise ValueError(f"Duplicate role name: {role.name}")
            
            noRepeat.add(name)
            
        return self
    

