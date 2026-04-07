from typing import Literal, Union

from pydantic import BaseModel


class SurfaceUpdateMessage(BaseModel):
    type: Literal["surfaceUpdate"]
    surfaceId: str
    components: list


class DataModelUpdateMessage(BaseModel):
    type: Literal["dataModelUpdate"]
    surfaceId: str
    data: dict


class BeginRenderingMessage(BaseModel):
    type: Literal["beginRendering"]
    surfaceId: str


A2UIMessage = Union[SurfaceUpdateMessage, DataModelUpdateMessage, BeginRenderingMessage]
