"""
Tabular Data Feature Engineering Processor
Handles scaling, encoding, imputation, and feature engineering for tabular datasets
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Any
from dataclasses import dataclass
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.preprocessing import OneHotEncoder, LabelEncoder, OrdinalEncoder
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.feature_selection import mutual_info_classif, mutual_info_regression
from sklearn.decomposition import PCA
import joblib


@dataclass
class TabularProcessorConfig:
    """Configuration for tabular data processing"""
    scaling_method: str = "standard"  # standard, minmax, robust, none
    encoding_method: str = "onehot"  # onehot, label, ordinal
    imputation_method: str = "mean"  # mean, median, mode, knn
    handle_outliers: bool = True
    outlier_method: str = "iqr"  # iqr, zscore
    feature_selection: bool = False
    n_features: Optional[int] = None
    pca_components: Optional[int] = None


class TabularProcessor:
    """Tabular feature engineering processor"""

    def __init__(self, config: TabularProcessorConfig):
        self.config = config
        self.scaler = None
        self.encoder = None
        self.imputer = None
        self.feature_selector = None
        self.pca = None
        self.fitted = False

    def fit(
        self,
        df: pd.DataFrame,
        target_col: Optional[str] = None,
        categorical_cols: Optional[List[str]] = None,
        numerical_cols: Optional[List[str]] = None
    ) -> 'TabularProcessor':
        """
        Fit processor on training data

        Args:
            df: Input dataframe
            target_col: Target column name
            categorical_cols: List of categorical column names
            numerical_cols: List of numerical column names

        Returns:
            self
        """
        # Auto-detect column types if not provided
        if categorical_cols is None:
            categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        if numerical_cols is None:
            numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()

        # Remove target from feature columns
        if target_col:
            categorical_cols = [c for c in categorical_cols if c != target_col]
            numerical_cols = [c for c in numerical_cols if c != target_col]

        self.categorical_cols = categorical_cols
        self.numerical_cols = numerical_cols
        self.target_col = target_col

        # Fit imputer
        self._fit_imputer(df)

        # Fit scaler
        self._fit_scaler(df)

        # Fit encoder
        self._fit_encoder(df)

        # Fit feature selector
        if self.config.feature_selection and target_col:
            self._fit_feature_selector(df, target_col)

        # Fit PCA
        if self.config.pca_components:
            self._fit_pca(df)

        self.fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transform data using fitted processors

        Args:
            df: Input dataframe

        Returns:
            Transformed dataframe
        """
        if not self.fitted:
            raise ValueError("Processor must be fitted before transform")

        df_transformed = df.copy()

        # Impute missing values
        df_transformed = self._impute(df_transformed)

        # Handle outliers
        if self.config.handle_outliers:
            df_transformed = self._handle_outliers(df_transformed)

        # Encode categorical variables
        df_transformed = self._encode(df_transformed)

        # Scale numerical variables
        df_transformed = self._scale(df_transformed)

        # Feature selection
        if self.config.feature_selection and self.feature_selector:
            df_transformed = self._select_features(df_transformed)

        # PCA
        if self.config.pca_components and self.pca:
            df_transformed = self._apply_pca(df_transformed)

        return df_transformed

    def fit_transform(
        self,
        df: pd.DataFrame,
        target_col: Optional[str] = None,
        categorical_cols: Optional[List[str]] = None,
        numerical_cols: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """Fit and transform in one step"""
        self.fit(df, target_col, categorical_cols, numerical_cols)
        return self.transform(df)

    def _fit_imputer(self, df: pd.DataFrame) -> None:
        """Fit imputer for missing values"""
        if self.config.imputation_method == "knn":
            self.imputer = KNNImputer(n_neighbors=5)
        else:
            strategy = self.config.imputation_method  # mean, median, most_frequent
            self.imputer = SimpleImputer(strategy=strategy)

        # Fit on numerical columns
        if self.numerical_cols:
            self.imputer.fit(df[self.numerical_cols])

    def _impute(self, df: pd.DataFrame) -> pd.DataFrame:
        """Impute missing values"""
        df_imputed = df.copy()

        if self.numerical_cols and self.imputer:
            df_imputed[self.numerical_cols] = self.imputer.transform(df[self.numerical_cols])

        # Fill categorical missing values with mode
        for col in self.categorical_cols:
            if df_imputed[col].isnull().any():
                mode_value = df_imputed[col].mode()[0] if not df_imputed[col].mode().empty else "unknown"
                df_imputed[col].fillna(mode_value, inplace=True)

        return df_imputed

    def _fit_scaler(self, df: pd.DataFrame) -> None:
        """Fit scaler for numerical columns"""
        if self.config.scaling_method == "none" or not self.numerical_cols:
            return

        if self.config.scaling_method == "standard":
            self.scaler = StandardScaler()
        elif self.config.scaling_method == "minmax":
            self.scaler = MinMaxScaler()
        elif self.config.scaling_method == "robust":
            self.scaler = RobustScaler()
        else:
            raise ValueError(f"Unknown scaling method: {self.config.scaling_method}")

        # Impute first
        df_imputed = self._impute(df)
        self.scaler.fit(df_imputed[self.numerical_cols])

    def _scale(self, df: pd.DataFrame) -> pd.DataFrame:
        """Scale numerical columns"""
        if not self.scaler or not self.numerical_cols:
            return df

        df_scaled = df.copy()
        df_scaled[self.numerical_cols] = self.scaler.transform(df[self.numerical_cols])
        return df_scaled

    def _fit_encoder(self, df: pd.DataFrame) -> None:
        """Fit encoder for categorical columns"""
        if not self.categorical_cols:
            return

        if self.config.encoding_method == "onehot":
            self.encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        elif self.config.encoding_method == "label":
            self.encoder = {col: LabelEncoder() for col in self.categorical_cols}
        elif self.config.encoding_method == "ordinal":
            self.encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
        else:
            raise ValueError(f"Unknown encoding method: {self.config.encoding_method}")

        # Fit encoder
        df_imputed = self._impute(df)

        if self.config.encoding_method == "onehot":
            self.encoder.fit(df_imputed[self.categorical_cols])
        elif self.config.encoding_method == "label":
            for col in self.categorical_cols:
                self.encoder[col].fit(df_imputed[col])
        elif self.config.encoding_method == "ordinal":
            self.encoder.fit(df_imputed[self.categorical_cols])

    def _encode(self, df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical columns"""
        if not self.encoder or not self.categorical_cols:
            return df

        df_encoded = df.copy()

        if self.config.encoding_method == "onehot":
            # OneHot encoding
            encoded = self.encoder.transform(df[self.categorical_cols])
            feature_names = self.encoder.get_feature_names_out(self.categorical_cols)

            # Create dataframe with encoded features
            encoded_df = pd.DataFrame(encoded, columns=feature_names, index=df.index)

            # Drop original categorical columns and add encoded ones
            df_encoded = df_encoded.drop(columns=self.categorical_cols)
            df_encoded = pd.concat([df_encoded, encoded_df], axis=1)

        elif self.config.encoding_method == "label":
            # Label encoding
            for col in self.categorical_cols:
                df_encoded[col] = self.encoder[col].transform(df[col])

        elif self.config.encoding_method == "ordinal":
            # Ordinal encoding
            df_encoded[self.categorical_cols] = self.encoder.transform(df[self.categorical_cols])

        return df_encoded

    def _handle_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle outliers in numerical columns"""
        if not self.numerical_cols:
            return df

        df_clean = df.copy()

        for col in self.numerical_cols:
            if self.config.outlier_method == "iqr":
                # IQR method
                Q1 = df_clean[col].quantile(0.25)
                Q3 = df_clean[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR

                # Clip outliers
                df_clean[col] = df_clean[col].clip(lower_bound, upper_bound)

            elif self.config.outlier_method == "zscore":
                # Z-score method
                mean = df_clean[col].mean()
                std = df_clean[col].std()
                z_scores = np.abs((df_clean[col] - mean) / std)

                # Clip values with |z-score| > 3
                mask = z_scores > 3
                if mask.any():
                    median = df_clean[col].median()
                    df_clean.loc[mask, col] = median

        return df_clean

    def _fit_feature_selector(self, df: pd.DataFrame, target_col: str) -> None:
        """Fit feature selector using mutual information"""
        df_processed = self._impute(df)
        df_processed = self._encode(df_processed)
        df_processed = self._scale(df_processed)

        X = df_processed.drop(columns=[target_col])
        y = df_processed[target_col]

        # Compute mutual information
        if y.dtype in ['int64', 'object', 'category']:
            # Classification
            mi_scores = mutual_info_classif(X, y)
        else:
            # Regression
            mi_scores = mutual_info_regression(X, y)

        # Get top n features
        n_features = self.config.n_features or len(X.columns) // 2
        self.selected_features = X.columns[np.argsort(mi_scores)[-n_features:]].tolist()

    def _select_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Select features based on mutual information"""
        if not self.selected_features:
            return df

        # Keep only selected features (and target if present)
        cols_to_keep = self.selected_features.copy()
        if self.target_col and self.target_col in df.columns:
            cols_to_keep.append(self.target_col)

        return df[cols_to_keep]

    def _fit_pca(self, df: pd.DataFrame) -> None:
        """Fit PCA for dimensionality reduction"""
        df_processed = self._impute(df)
        df_processed = self._encode(df_processed)
        df_processed = self._scale(df_processed)

        if self.target_col:
            X = df_processed.drop(columns=[self.target_col])
        else:
            X = df_processed

        self.pca = PCA(n_components=self.config.pca_components)
        self.pca.fit(X)

    def _apply_pca(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply PCA transformation"""
        if not self.pca:
            return df

        if self.target_col:
            X = df.drop(columns=[self.target_col])
            y = df[self.target_col]
        else:
            X = df
            y = None

        # Transform
        X_pca = self.pca.transform(X)

        # Create dataframe
        pca_cols = [f"PC{i+1}" for i in range(X_pca.shape[1])]
        df_pca = pd.DataFrame(X_pca, columns=pca_cols, index=df.index)

        if y is not None:
            df_pca[self.target_col] = y

        return df_pca

    def save(self, filepath: str) -> None:
        """Save fitted processor to file"""
        joblib.dump({
            'config': self.config,
            'scaler': self.scaler,
            'encoder': self.encoder,
            'imputer': self.imputer,
            'feature_selector': self.feature_selector,
            'pca': self.pca,
            'categorical_cols': self.categorical_cols,
            'numerical_cols': self.numerical_cols,
            'target_col': self.target_col,
            'fitted': self.fitted,
        }, filepath)

    @classmethod
    def load(cls, filepath: str) -> 'TabularProcessor':
        """Load fitted processor from file"""
        data = joblib.load(filepath)
        processor = cls(data['config'])
        processor.scaler = data['scaler']
        processor.encoder = data['encoder']
        processor.imputer = data['imputer']
        processor.feature_selector = data['feature_selector']
        processor.pca = data['pca']
        processor.categorical_cols = data['categorical_cols']
        processor.numerical_cols = data['numerical_cols']
        processor.target_col = data['target_col']
        processor.fitted = data['fitted']
        return processor

    def get_feature_importance(self, df: pd.DataFrame, target_col: str) -> pd.DataFrame:
        """
        Calculate feature importance using mutual information

        Args:
            df: Input dataframe
            target_col: Target column name

        Returns:
            Dataframe with feature importance scores
        """
        df_processed = self.transform(df.drop(columns=[target_col]))
        y = df[target_col]

        # Compute mutual information
        if y.dtype in ['int64', 'object', 'category']:
            mi_scores = mutual_info_classif(df_processed, y)
        else:
            mi_scores = mutual_info_regression(df_processed, y)

        # Create dataframe
        importance_df = pd.DataFrame({
            'feature': df_processed.columns,
            'importance': mi_scores
        }).sort_values('importance', ascending=False)

        return importance_df

    def to_vertex_ai_format(
        self,
        df: pd.DataFrame,
        target_col: Optional[str] = None
    ) -> Dict:
        """
        Convert to Vertex AI training format

        Args:
            df: Input dataframe
            target_col: Target column name

        Returns:
            Dictionary in Vertex AI format
        """
        df_processed = self.transform(df)

        instances = []
        for _, row in df_processed.iterrows():
            instance = row.to_dict()

            # Separate features and label
            if target_col and target_col in instance:
                label = instance.pop(target_col)
                instance['label'] = label

            instances.append(instance)

        return {"instances": instances}


# Utility functions

def create_train_test_split(
    df: pd.DataFrame,
    target_col: str,
    test_size: float = 0.2,
    stratify: bool = True
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Create train/test split

    Args:
        df: Input dataframe
        target_col: Target column name
        test_size: Proportion of test set
        stratify: Whether to stratify split

    Returns:
        Train and test dataframes
    """
    from sklearn.model_selection import train_test_split

    stratify_col = df[target_col] if stratify else None

    train_df, test_df = train_test_split(
        df,
        test_size=test_size,
        stratify=stratify_col,
        random_state=42
    )

    return train_df, test_df


def detect_data_drift(
    train_df: pd.DataFrame,
    prod_df: pd.DataFrame,
    numerical_cols: List[str]
) -> pd.DataFrame:
    """
    Detect data drift using Kolmogorov-Smirnov test

    Args:
        train_df: Training dataframe
        prod_df: Production dataframe
        numerical_cols: List of numerical columns

    Returns:
        Dataframe with drift statistics
    """
    from scipy import stats

    results = []

    for col in numerical_cols:
        # KS test
        statistic, pvalue = stats.ks_2samp(train_df[col], prod_df[col])

        # Mean shift
        mean_train = train_df[col].mean()
        mean_prod = prod_df[col].mean()
        mean_shift = (mean_prod - mean_train) / mean_train

        results.append({
            'feature': col,
            'ks_statistic': statistic,
            'p_value': pvalue,
            'drift_detected': pvalue < 0.05,
            'mean_shift_pct': mean_shift * 100
        })

    return pd.DataFrame(results)
