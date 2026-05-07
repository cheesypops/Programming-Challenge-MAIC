from typing import Any, Dict, List

from pydantic import BaseModel


class ChartSuggestion(BaseModel):
    title: str
    chart_type: str
    parameters: Dict[str, Any]
    insight: str


class SuggestResponse(BaseModel):
    dataset_id: str
    suggestions: List[ChartSuggestion]


class ChartDataRequest(BaseModel):
    dataset_id: str
    parameters: Dict[str, Any]


class ChartDataResponse(BaseModel):
    data: List[Dict[str, Any]]
