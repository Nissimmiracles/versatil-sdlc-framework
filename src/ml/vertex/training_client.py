"""
Vertex AI Training Client
Python client for submitting and monitoring training jobs
"""

from google.cloud import aiplatform
from google.cloud.aiplatform import gapic as aip
from typing import Dict, List, Optional, Any
import time
from datetime import datetime


class VertexTrainingClient:
    """Client for Vertex AI Custom Training Jobs"""

    def __init__(
        self,
        project_id: str,
        location: str = "us-central1",
        staging_bucket: Optional[str] = None
    ):
        """
        Initialize Vertex AI Training Client

        Args:
            project_id: GCP project ID
            location: GCP region
            staging_bucket: GCS bucket for staging artifacts
        """
        self.project_id = project_id
        self.location = location
        self.staging_bucket = staging_bucket or f"gs://{project_id}-ml-training-dev"

        # Initialize Vertex AI
        aiplatform.init(
            project=project_id,
            location=location,
            staging_bucket=self.staging_bucket
        )

    def submit_training_job(
        self,
        display_name: str,
        container_uri: str,
        args: List[str],
        machine_type: str = "n1-standard-4",
        accelerator_type: Optional[str] = None,
        accelerator_count: int = 0,
        replica_count: int = 1,
        environment_variables: Optional[Dict[str, str]] = None,
        service_account: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Submit custom container training job

        Args:
            display_name: Job display name
            container_uri: Container image URI
            args: Command line arguments
            machine_type: Machine type (e.g., n1-standard-4)
            accelerator_type: GPU type (e.g., NVIDIA_TESLA_T4)
            accelerator_count: Number of GPUs
            replica_count: Number of replicas
            environment_variables: Environment variables
            service_account: Service account email

        Returns:
            Job information dictionary
        """
        # Create custom job
        job = aiplatform.CustomContainerTrainingJob(
            display_name=display_name,
            container_uri=container_uri,
            command=None,  # Use ENTRYPOINT from container
            model_serving_container_image_uri=None,  # Not deploying immediately
        )

        # Configure machine specs
        machine_spec = {
            "machine_type": machine_type,
        }

        if accelerator_type and accelerator_count > 0:
            machine_spec["accelerator_type"] = accelerator_type
            machine_spec["accelerator_count"] = accelerator_count

        # Submit job
        model = job.run(
            args=args,
            replica_count=replica_count,
            machine_type=machine_type,
            accelerator_type=accelerator_type,
            accelerator_count=accelerator_count,
            environment_variables=environment_variables,
            service_account=service_account,
            sync=False,  # Don't wait for completion
        )

        return {
            "job_id": job.resource_name,
            "job_name": job.display_name,
            "state": job.state.name,
            "create_time": job.create_time.isoformat() if job.create_time else None,
        }

    def submit_python_package_job(
        self,
        display_name: str,
        python_package_gcs_uri: str,
        python_module_name: str,
        args: List[str],
        requirements: Optional[List[str]] = None,
        machine_type: str = "n1-standard-4",
        accelerator_type: Optional[str] = None,
        accelerator_count: int = 0
    ) -> Dict[str, Any]:
        """
        Submit Python package training job

        Args:
            display_name: Job display name
            python_package_gcs_uri: GCS URI to Python package (.tar.gz)
            python_module_name: Python module to execute
            args: Command line arguments
            requirements: Python package requirements
            machine_type: Machine type
            accelerator_type: GPU type
            accelerator_count: Number of GPUs

        Returns:
            Job information dictionary
        """
        job = aiplatform.CustomPythonPackageTrainingJob(
            display_name=display_name,
            python_package_gcs_uri=python_package_gcs_uri,
            python_module_name=python_module_name,
            container_uri=f"gcr.io/cloud-aiplatform/training/tf-cpu.2-12:latest",
            requirements=requirements or [],
        )

        model = job.run(
            args=args,
            replica_count=1,
            machine_type=machine_type,
            accelerator_type=accelerator_type,
            accelerator_count=accelerator_count,
            sync=False,
        )

        return {
            "job_id": job.resource_name,
            "job_name": job.display_name,
            "state": job.state.name,
        }

    def get_job_status(self, job_name: str) -> Dict[str, Any]:
        """
        Get training job status

        Args:
            job_name: Job resource name

        Returns:
            Job status dictionary
        """
        job = aiplatform.CustomJob(job_name)

        return {
            "job_id": job.resource_name,
            "display_name": job.display_name,
            "state": job.state.name,
            "create_time": job.create_time.isoformat() if job.create_time else None,
            "start_time": job.start_time.isoformat() if job.start_time else None,
            "end_time": job.end_time.isoformat() if job.end_time else None,
            "error": str(job.error) if job.error else None,
        }

    def cancel_job(self, job_name: str) -> Dict[str, Any]:
        """
        Cancel running training job

        Args:
            job_name: Job resource name

        Returns:
            Cancellation result
        """
        job = aiplatform.CustomJob(job_name)
        job.cancel()

        return {
            "job_id": job.resource_name,
            "state": "CANCELLING",
            "cancelled_at": datetime.now().isoformat(),
        }

    def list_jobs(
        self,
        filter_str: Optional[str] = None,
        order_by: str = "create_time desc",
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        List training jobs

        Args:
            filter_str: Filter string (e.g., "state=JOB_STATE_RUNNING")
            order_by: Sort order
            limit: Maximum number of results

        Returns:
            List of job dictionaries
        """
        jobs = aiplatform.CustomJob.list(
            filter=filter_str,
            order_by=order_by,
        )

        results = []
        for job in jobs[:limit]:
            results.append({
                "job_id": job.resource_name,
                "display_name": job.display_name,
                "state": job.state.name,
                "create_time": job.create_time.isoformat() if job.create_time else None,
            })

        return results

    def wait_for_completion(
        self,
        job_name: str,
        timeout: int = 3600,
        poll_interval: int = 30
    ) -> Dict[str, Any]:
        """
        Wait for job completion

        Args:
            job_name: Job resource name
            timeout: Timeout in seconds
            poll_interval: Polling interval in seconds

        Returns:
            Final job status
        """
        job = aiplatform.CustomJob(job_name)

        start_time = time.time()
        while time.time() - start_time < timeout:
            status = self.get_job_status(job_name)

            if status["state"] in ["JOB_STATE_SUCCEEDED", "JOB_STATE_FAILED", "JOB_STATE_CANCELLED"]:
                return status

            time.sleep(poll_interval)

        raise TimeoutError(f"Job {job_name} did not complete within {timeout} seconds")

    def get_job_logs(self, job_name: str) -> List[str]:
        """
        Get job logs (requires Cloud Logging API)

        Args:
            job_name: Job resource name

        Returns:
            List of log entries
        """
        from google.cloud import logging_v2

        client = logging_v2.Client(project=self.project_id)

        # Extract job ID from resource name
        job_id = job_name.split("/")[-1]

        # Query logs
        filter_str = f'resource.type="ml_job" AND resource.labels.job_id="{job_id}"'

        logs = []
        for entry in client.list_entries(filter_=filter_str, max_results=100):
            logs.append(entry.payload)

        return logs


# Hyperparameter tuning

class VertexHyperparameterTuningClient:
    """Client for Vertex AI Hyperparameter Tuning"""

    def __init__(self, project_id: str, location: str = "us-central1"):
        self.project_id = project_id
        self.location = location
        aiplatform.init(project=project_id, location=location)

    def create_tuning_job(
        self,
        display_name: str,
        container_uri: str,
        metric_spec: Dict[str, str],
        parameter_spec: Dict[str, Dict],
        max_trial_count: int = 10,
        parallel_trial_count: int = 2,
        machine_type: str = "n1-standard-4"
    ) -> Dict[str, Any]:
        """
        Create hyperparameter tuning job

        Args:
            display_name: Job display name
            container_uri: Training container URI
            metric_spec: Metric to optimize (e.g., {"accuracy": "maximize"})
            parameter_spec: Parameter search space
            max_trial_count: Maximum number of trials
            parallel_trial_count: Parallel trials
            machine_type: Machine type

        Returns:
            Tuning job information
        """
        from google.cloud.aiplatform import hyperparameter_tuning as hpt

        # Create job
        job = aiplatform.HyperparameterTuningJob(
            display_name=display_name,
            custom_job=aiplatform.CustomJob.from_local_script(
                display_name=f"{display_name}_trial",
                script_path="train.py",
                container_uri=container_uri,
                machine_type=machine_type,
            ),
            metric_spec=metric_spec,
            parameter_spec=parameter_spec,
            max_trial_count=max_trial_count,
            parallel_trial_count=parallel_trial_count,
        )

        job.run(sync=False)

        return {
            "job_id": job.resource_name,
            "display_name": job.display_name,
            "state": job.state.name,
        }

    def get_best_trial(self, job_name: str) -> Dict[str, Any]:
        """Get best trial from tuning job"""
        job = aiplatform.HyperparameterTuningJob(job_name)

        trials = job.trials

        # Find best trial
        best_trial = max(trials, key=lambda t: t.final_measurement.metrics[0].value)

        return {
            "trial_id": best_trial.id,
            "parameters": {p.parameter_id: p.value for p in best_trial.parameters},
            "final_metric": best_trial.final_measurement.metrics[0].value,
        }
