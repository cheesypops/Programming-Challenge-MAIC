import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.charts import ChartDataRequest, ChartDataResponse, ChartSuggestion, SuggestResponse
from app.services import charts_service, state

router = APIRouter(prefix="/charts", tags=["charts"])


@router.post("/suggest", response_model=SuggestResponse)
def suggest_charts(file: UploadFile = File(...)) -> SuggestResponse:
    df = charts_service.load_dataframe(file)
    dataset_id = str(uuid.uuid4())
    state.set_dataset(dataset_id, df)
    summary = charts_service.dataset_summary(df)
    suggestions_raw = charts_service.call_llm(summary)
    suggestions = [ChartSuggestion(**item) for item in suggestions_raw]
    return SuggestResponse(dataset_id=dataset_id, suggestions=suggestions)


@router.post("/data", response_model=ChartDataResponse)
def chart_data(request: ChartDataRequest) -> ChartDataResponse:
    dataset_id, df = state.get_dataset()
    if dataset_id is None or df is None:
        raise HTTPException(status_code=400, detail="No dataset available")
    if request.dataset_id != dataset_id:
        raise HTTPException(status_code=400, detail="Dataset ID not found")

    data = charts_service.build_chart_data(df, request.parameters)
    return ChartDataResponse(data=data)
