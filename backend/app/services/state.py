from typing import Optional

import pandas as pd

_DATASET_ID: Optional[str] = None
_DATAFRAME: Optional[pd.DataFrame] = None


def set_dataset(dataset_id: str, dataframe: pd.DataFrame) -> None:
    global _DATASET_ID, _DATAFRAME
    _DATASET_ID = dataset_id
    _DATAFRAME = dataframe


def get_dataset() -> tuple[Optional[str], Optional[pd.DataFrame]]:
    return _DATASET_ID, _DATAFRAME
