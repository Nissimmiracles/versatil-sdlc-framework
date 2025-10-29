"""
Time-Series Feature Engineering Processor
Handles resampling, windowing, lag features, and seasonal decomposition
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class TimeSeriesProcessorConfig:
    """Configuration for time-series processing"""
    timestamp_col: str = "timestamp"
    target_col: str = "value"
    freq: Optional[str] = None  # Frequency (e.g., 'H', 'D', 'W')
    fill_method: str = "linear"  # linear, ffill, bfill, mean
    window_sizes: List[int] = None  # Rolling window sizes
    lag_features: List[int] = None  # Lag periods
    seasonal_decompose: bool = False
    remove_outliers: bool = True
    normalize: bool = True


class TimeSeriesProcessor:
    """Time-series feature engineering processor"""

    def __init__(self, config: TimeSeriesProcessorConfig):
        self.config = config
        if self.config.window_sizes is None:
            self.config.window_sizes = [7, 14, 30]
        if self.config.lag_features is None:
            self.config.lag_features = [1, 7, 14]
        self.fitted = False
        self.mean = None
        self.std = None

    def resample(
        self,
        df: pd.DataFrame,
        freq: str,
        aggregation: str = "mean"
    ) -> pd.DataFrame:
        """
        Resample time series to different frequency

        Args:
            df: Input dataframe with timestamp index
            freq: Target frequency ('H', 'D', 'W', 'M', etc.)
            aggregation: Aggregation method

        Returns:
            Resampled dataframe
        """
        if not isinstance(df.index, pd.DatetimeIndex):
            df = df.set_index(self.config.timestamp_col)

        if aggregation == "mean":
            resampled = df.resample(freq).mean()
        elif aggregation == "sum":
            resampled = df.resample(freq).sum()
        elif aggregation == "min":
            resampled = df.resample(freq).min()
        elif aggregation == "max":
            resampled = df.resample(freq).max()
        elif aggregation == "first":
            resampled = df.resample(freq).first()
        elif aggregation == "last":
            resampled = df.resample(freq).last()
        else:
            raise ValueError(f"Unknown aggregation: {aggregation}")

        return resampled

    def create_lag_features(
        self,
        df: pd.DataFrame,
        lags: Optional[List[int]] = None
    ) -> pd.DataFrame:
        """
        Create lag features

        Args:
            df: Input dataframe
            lags: List of lag periods

        Returns:
            Dataframe with lag features
        """
        if lags is None:
            lags = self.config.lag_features

        df_lags = df.copy()

        for lag in lags:
            df_lags[f'{self.config.target_col}_lag_{lag}'] = df[self.config.target_col].shift(lag)

        return df_lags

    def create_rolling_features(
        self,
        df: pd.DataFrame,
        windows: Optional[List[int]] = None
    ) -> pd.DataFrame:
        """
        Create rolling window features

        Args:
            df: Input dataframe
            windows: List of window sizes

        Returns:
            Dataframe with rolling features
        """
        if windows is None:
            windows = self.config.window_sizes

        df_rolling = df.copy()

        for window in windows:
            # Rolling mean
            df_rolling[f'{self.config.target_col}_roll_mean_{window}'] = \
                df[self.config.target_col].rolling(window=window).mean()

            # Rolling std
            df_rolling[f'{self.config.target_col}_roll_std_{window}'] = \
                df[self.config.target_col].rolling(window=window).std()

            # Rolling min
            df_rolling[f'{self.config.target_col}_roll_min_{window}'] = \
                df[self.config.target_col].rolling(window=window).min()

            # Rolling max
            df_rolling[f'{self.config.target_col}_roll_max_{window}'] = \
                df[self.config.target_col].rolling(window=window).max()

        return df_rolling

    def create_expanding_features(
        self,
        df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Create expanding window features

        Args:
            df: Input dataframe

        Returns:
            Dataframe with expanding features
        """
        df_expanding = df.copy()

        # Expanding mean
        df_expanding[f'{self.config.target_col}_expanding_mean'] = \
            df[self.config.target_col].expanding().mean()

        # Expanding std
        df_expanding[f'{self.config.target_col}_expanding_std'] = \
            df[self.config.target_col].expanding().std()

        return df_expanding

    def create_time_features(
        self,
        df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Extract time-based features from timestamp

        Args:
            df: Input dataframe

        Returns:
            Dataframe with time features
        """
        df_time = df.copy()

        if not isinstance(df.index, pd.DatetimeIndex):
            df_time = df_time.set_index(self.config.timestamp_col)

        # Extract time features
        df_time['hour'] = df_time.index.hour
        df_time['day_of_week'] = df_time.index.dayofweek
        df_time['day_of_month'] = df_time.index.day
        df_time['month'] = df_time.index.month
        df_time['quarter'] = df_time.index.quarter
        df_time['year'] = df_time.index.year
        df_time['is_weekend'] = (df_time.index.dayofweek >= 5).astype(int)

        # Cyclical encoding
        df_time['hour_sin'] = np.sin(2 * np.pi * df_time['hour'] / 24)
        df_time['hour_cos'] = np.cos(2 * np.pi * df_time['hour'] / 24)
        df_time['day_of_week_sin'] = np.sin(2 * np.pi * df_time['day_of_week'] / 7)
        df_time['day_of_week_cos'] = np.cos(2 * np.pi * df_time['day_of_week'] / 7)
        df_time['month_sin'] = np.sin(2 * np.pi * df_time['month'] / 12)
        df_time['month_cos'] = np.cos(2 * np.pi * df_time['month'] / 12)

        return df_time

    def create_difference_features(
        self,
        df: pd.DataFrame,
        periods: List[int] = [1, 7]
    ) -> pd.DataFrame:
        """
        Create difference features for stationarity

        Args:
            df: Input dataframe
            periods: List of difference periods

        Returns:
            Dataframe with difference features
        """
        df_diff = df.copy()

        for period in periods:
            df_diff[f'{self.config.target_col}_diff_{period}'] = \
                df[self.config.target_col].diff(periods=period)

        return df_diff

    def seasonal_decomposition(
        self,
        df: pd.DataFrame,
        model: str = "additive",
        period: Optional[int] = None
    ) -> Dict[str, pd.Series]:
        """
        Perform seasonal decomposition

        Args:
            df: Input dataframe
            model: 'additive' or 'multiplicative'
            period: Seasonal period

        Returns:
            Dictionary with trend, seasonal, and residual components
        """
        from statsmodels.tsa.seasonal import seasonal_decompose

        if not isinstance(df.index, pd.DatetimeIndex):
            df = df.set_index(self.config.timestamp_col)

        # Auto-detect period if not provided
        if period is None:
            period = self._detect_period(df)

        # Decompose
        decomposition = seasonal_decompose(
            df[self.config.target_col],
            model=model,
            period=period,
            extrapolate_trend='freq'
        )

        return {
            'trend': decomposition.trend,
            'seasonal': decomposition.seasonal,
            'residual': decomposition.resid
        }

    def _detect_period(self, df: pd.DataFrame) -> int:
        """Auto-detect seasonal period using FFT"""
        from scipy import fft

        # Use FFT to detect dominant frequency
        signal = df[self.config.target_col].fillna(method='ffill').values
        fft_vals = fft.fft(signal)
        power = np.abs(fft_vals) ** 2

        # Find peak frequency (excluding DC component)
        peak_idx = np.argmax(power[1:len(power)//2]) + 1
        period = len(signal) // peak_idx

        return max(2, min(period, len(signal) // 2))

    def handle_missing_values(
        self,
        df: pd.DataFrame,
        method: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Handle missing values in time series

        Args:
            df: Input dataframe
            method: Fill method (linear, ffill, bfill, mean)

        Returns:
            Dataframe with filled values
        """
        if method is None:
            method = self.config.fill_method

        df_filled = df.copy()

        if method == "linear":
            df_filled = df_filled.interpolate(method='linear')
        elif method == "ffill":
            df_filled = df_filled.fillna(method='ffill')
        elif method == "bfill":
            df_filled = df_filled.fillna(method='bfill')
        elif method == "mean":
            df_filled = df_filled.fillna(df_filled.mean())
        else:
            raise ValueError(f"Unknown fill method: {method}")

        return df_filled

    def remove_outliers(
        self,
        df: pd.DataFrame,
        method: str = "iqr",
        threshold: float = 1.5
    ) -> pd.DataFrame:
        """
        Remove outliers from time series

        Args:
            df: Input dataframe
            method: Outlier detection method (iqr, zscore)
            threshold: Threshold for outlier detection

        Returns:
            Dataframe with outliers removed
        """
        df_clean = df.copy()
        col = self.config.target_col

        if method == "iqr":
            Q1 = df_clean[col].quantile(0.25)
            Q3 = df_clean[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - threshold * IQR
            upper_bound = Q3 + threshold * IQR

            # Replace outliers with median
            median = df_clean[col].median()
            mask = (df_clean[col] < lower_bound) | (df_clean[col] > upper_bound)
            df_clean.loc[mask, col] = median

        elif method == "zscore":
            mean = df_clean[col].mean()
            std = df_clean[col].std()
            z_scores = np.abs((df_clean[col] - mean) / std)

            # Replace outliers with median
            median = df_clean[col].median()
            mask = z_scores > threshold
            df_clean.loc[mask, col] = median

        return df_clean

    def fit(self, df: pd.DataFrame) -> 'TimeSeriesProcessor':
        """
        Fit processor on training data

        Args:
            df: Input dataframe

        Returns:
            self
        """
        # Calculate normalization parameters
        if self.config.normalize:
            self.mean = df[self.config.target_col].mean()
            self.std = df[self.config.target_col].std()

        self.fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transform time series with all feature engineering

        Args:
            df: Input dataframe

        Returns:
            Transformed dataframe
        """
        df_transformed = df.copy()

        # Ensure datetime index
        if not isinstance(df_transformed.index, pd.DatetimeIndex):
            df_transformed = df_transformed.set_index(self.config.timestamp_col)

        # Handle missing values
        df_transformed = self.handle_missing_values(df_transformed)

        # Remove outliers
        if self.config.remove_outliers:
            df_transformed = self.remove_outliers(df_transformed)

        # Normalize
        if self.config.normalize and self.fitted:
            df_transformed[self.config.target_col] = \
                (df_transformed[self.config.target_col] - self.mean) / self.std

        # Create features
        df_transformed = self.create_lag_features(df_transformed)
        df_transformed = self.create_rolling_features(df_transformed)
        df_transformed = self.create_expanding_features(df_transformed)
        df_transformed = self.create_time_features(df_transformed)
        df_transformed = self.create_difference_features(df_transformed)

        # Seasonal decomposition
        if self.config.seasonal_decompose:
            components = self.seasonal_decomposition(df_transformed)
            df_transformed['trend'] = components['trend']
            df_transformed['seasonal'] = components['seasonal']
            df_transformed['residual'] = components['residual']

        # Drop NaN values created by lag/rolling features
        df_transformed = df_transformed.dropna()

        return df_transformed

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fit and transform in one step"""
        self.fit(df)
        return self.transform(df)

    def create_sequences(
        self,
        df: pd.DataFrame,
        sequence_length: int,
        prediction_length: int = 1
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create sequences for supervised learning

        Args:
            df: Input dataframe
            sequence_length: Length of input sequence
            prediction_length: Length of prediction

        Returns:
            X (sequences) and y (targets)
        """
        data = df[self.config.target_col].values
        X, y = [], []

        for i in range(len(data) - sequence_length - prediction_length + 1):
            X.append(data[i:i + sequence_length])
            y.append(data[i + sequence_length:i + sequence_length + prediction_length])

        return np.array(X), np.array(y)

    def to_vertex_ai_format(
        self,
        df: pd.DataFrame,
        sequence_length: int = 30
    ) -> Dict:
        """
        Convert to Vertex AI training format

        Args:
            df: Input dataframe
            sequence_length: Sequence length

        Returns:
            Dictionary in Vertex AI format
        """
        X, y = self.create_sequences(df, sequence_length)

        instances = []
        for i in range(len(X)):
            instances.append({
                "sequence": X[i].tolist(),
                "target": y[i].tolist()
            })

        return {"instances": instances}


# Forecasting utilities

def evaluate_forecast(
    y_true: np.ndarray,
    y_pred: np.ndarray
) -> Dict[str, float]:
    """
    Calculate forecast evaluation metrics

    Args:
        y_true: True values
        y_pred: Predicted values

    Returns:
        Dictionary of metrics
    """
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)

    # MAPE (Mean Absolute Percentage Error)
    mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-7))) * 100

    return {
        'mse': mse,
        'rmse': rmse,
        'mae': mae,
        'r2': r2,
        'mape': mape
    }


def detect_anomalies(
    df: pd.DataFrame,
    target_col: str,
    method: str = "isolation_forest",
    contamination: float = 0.1
) -> np.ndarray:
    """
    Detect anomalies in time series

    Args:
        df: Input dataframe
        target_col: Target column name
        method: Anomaly detection method
        contamination: Expected proportion of outliers

    Returns:
        Binary array (1 = anomaly, 0 = normal)
    """
    from sklearn.ensemble import IsolationForest

    X = df[[target_col]].values

    if method == "isolation_forest":
        clf = IsolationForest(contamination=contamination, random_state=42)
        predictions = clf.fit_predict(X)
        # Convert to binary (1 = anomaly)
        anomalies = (predictions == -1).astype(int)

    else:
        raise ValueError(f"Unknown method: {method}")

    return anomalies
