### Server Code

This folder contains the code for server. It can be configured using the environment variables. Check `src/config.ts` for possible configurations.

`ALLOWED_JOBS`: This environment variable must contain comma-separated values of the jobs that will be allowed to added to new forms for running. It will also control which jobs will be processed by this server instance. If, it is changed in the future then, some old responses might not get processed completely. Example: `"sheets,mail"`

`JOB_CONFIGURATION`: A JSON describing the jobs processed by this server. It contains job names as key with configuration as value to the key. The job configuration will control: how the job is processed and retried in case of failure. It can be tweaked to meet the needs of the particular job.

Example:

```json
{
  "sheets": { "redisURL": "redis://127.0.0.1:6379" },
  "mail": { "redisURL": "redis://127.0.0.1:6379" }
}
```

Possible Configurations:

```json
{
  "redisURL": "<redis_url_instance>",
  "backoffStrategy": "immediate | fixed | exponential",
  "backoffDelay": "<delay_time_ms_number>",
  "retries": "<max_retries_before_job_fails_number>",
  "timeout": "<max_duration_before_job_times_out_ms>"
}
```

### Explanations

A single instance of server will use a single Redis instance for queuing a job of particular type. This is not required strictly and can be changed easily with minimum code changes. Though different Redis instance can be used for different jobs. Also, same instance can also be used for different jobs. One of the drawbacks of our architecture is that each server must know about all the possible jobs in the whole system. This can easily be fixed by making a "super job" which will just queue responses for processing (server only needs to know about the "super job").

### SHARD ID

Each server must have a unique number (Possible values: 0 - 2^13) assigned to it. This number combined with an auto-increasing sequence number is used to identify new responses that this server instance processes. The sequence number can be from 0 to 2^50. These numbers are hard coded and can be changed to meet the requirements of deployment. A server will be responsible for processing the responses falling under it's shard. So, to remove a shard id from system it is necessary to check that it has already processed all posssible responses it recieved.

The sequence number is calculated by the code and isn't explicitly stored. It is not necessary to track that value and server auto calculates it on the basis of stored responses in the database.

### Job Params

When creating a new form, owner can add params for jobs. These will be passed to worker process. This can be used for form specific configuration of the jobs. For example, the Google Sheet ID to add responses to.
