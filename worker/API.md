### How to add a new job

- Write the code for the new extension
  - Must read a JSON object from stdin
  - Must exit with code 0 on success (Else it will be considered failed)

### Structure of JSON object:

```json
{
  "id": "<job_id_string>",
  "job": {
    "name": "<name_of_the_job_string>",
    "params": {
      "<params_for_the_job_object>": "<values_for_params_any>",
      "<can_be_undefined>": ""
    }
  },
  "response": {
    "id": "<response_id_string>",
    "formId": "<form_id_string>",
    "owner": "<owner_id_string>",
    "creationTime": "<response_creation_time_iso_8601_string>",
    "answers": ["<array_of_answers_number_or_string_or_array>"]
  },
  "form": {
    "id": "<form_id_string>",
    "name": "<form_name_string>",
    "owner": "<owner_id_string>",
    "description": "<string_or_null>",
    "questions": [
      {
        "type": "text|number|choice",
        "text": "question_text_string",
        "description": "<string_or_null>",
        "constraints": { "<constraint_key>": "<constraint_value>" }
      }
    ],
    "jobs": [
      {
        "name": "<name_of_the_job_string>",
        "params": {
          "<params_for_the_job_object>": "<values_for_params_any>"
        }
      }
    ],
    "creationTime": "<form_creation_time_iso_8601_string>"
  },
  "queueTime": "<job_queue_time_iso_8601_string>"
}
```

### Configuration

`JOB_CONFIGURATION` environment variable must be a JSON. It must be a object with all the supported jobs for a worker as key.

```json
{
  "<job_name_string>": {
    "redisURL": "<redis_instance_url>",
    "cmd": "<command_to_run_for_job>",
    "args": ["<args_to_pass_to_cmd_string"],
    "cwd": "<current_working_directory_for_running_command>",
    "concurrency": "<concurrent_jobs_that_can_be_run_number>"
  }
}
```
