# Cloud's Bane

**ML-assisted network intrusion detection and security operations dashboard.**

## Releases

**[Open Cloud's Bane v1 on Vercel](https://cloudsbanev1.vercel.app)**

The link above is the project's hosted frontend. Backend availability and model health are reported separately inside the application. A hosted page alone does not establish that every AWS integration is healthy.

| Release | Application | Source |
| --- | --- | --- |
| Hosted v1 | [cloudsbanev1.vercel.app](https://cloudsbanev1.vercel.app) | [GitHub repository](https://github.com/DHARANEESWARAN08/clouds-bane) |

This section links to the hosted application; it does not imply a tagged GitHub Release has been published.

## Why this project exists

Network traffic can contain suspicious connections and attack patterns that are difficult to review manually. Cloud's Bane provides an interface for inspecting model results and prioritizing alerts. Its goal is to help a reviewer or security operator understand what was classified, how confident the classifier was, and what information is available for investigation.

The project combines three views of security information: individual prediction results, persistent alert history, and operational monitoring. Keeping these views distinct prevents misleading conclusions, such as interpreting zero recent inference requests as proof that there have never been attacks.

## How a user works with Cloud's Bane

1. Open Command center to review the available operational counters, alert severity distribution, and service checks.
2. Open Threat detection to submit network-flow features to the backend prediction endpoint.
3. Use Alerts / SOC to search stored records, filter by severity, sort results, and open an investigation panel.
4. Review the record's timestamp, reported endpoints, probability, and model information. Missing values remain explicitly unavailable.
5. Use Network activity for historical dataset trends and Monitoring for the backend's operational view.

The application supports investigation and demonstration of classification results. It does not claim to automatically block connections or continuously capture the host computer's network traffic.

Investigate stored alerts, submit network-flow predictions, explore historical analytics, and review AWS service checks in a React and TypeScript interface.

This repository contains the frontend. AWS backend resources, model training, private datasets, and infrastructure deployment are maintained separately.

Cloud’s Bane is an ML-powered network intrusion detection and security operations frontend built with React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide, and Wouter. It is designed to sit on top of the existing AWS API Gateway → Lambda → ML model → DynamoDB → CloudWatch architecture.

## Run locally

Use Node.js 22.12 or newer and the pnpm version declared in `package.json`. Clone this repository, copy `.env.example` to `.env.local`, and set your approved backend URL. On Windows Command Prompt, use `copy .env.example .env.local`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Set the deployment/runtime variable `VITE_API_BASE_URL` to the approved API Gateway base URL. The frontend uses it for `/predict`, `/alerts`, `/metrics`, `/health`, and `/dataset-analytics`. AWS credentials, DynamoDB credentials, IAM tokens, and session tokens must never be placed in the frontend. When no API base URL is configured, the interface shows explicit unavailable states; it does not fabricate operational data.

Open the URL printed by Vite. It starts at port 3000 and selects another available port if necessary. `VITE_API_BASE_URL` is embedded at build time for production; changing it requires rebuilding.

## API integration

### AWS service responsibilities

| Component | Role in the documented architecture |
| --- | --- |
| Vercel | Hosts the built frontend and serves the browser application |
| API Gateway | Exposes the HTTP endpoints used by the frontend |
| Lambda | Handles backend request processing and integration logic |
| ML classifier | Evaluates submitted flow features and produces a classification result |
| DynamoDB | Persists security alerts for later retrieval and investigation |
| CloudWatch | Provides backend operational monitoring information |
| IAM | Controls backend permissions to access AWS resources |

The browser calls the API; it does not access DynamoDB or CloudWatch using embedded AWS credentials. This frontend repository does not provision these services or prove how the deployed model is packaged.

### Request and response flow

For prediction, a user submits the expected flow features, the API processes the request, and the frontend displays the returned result. For investigation, the browser retrieves previously stored alerts. For monitoring, it requests metrics and health checks independently.

Alert retrieval accepts an array or the backend envelope `{ count, alerts }`. The client maps backend field names such as `alert_id`, `attack_probability`, `risk_level`, and `l4_dst_port` into the UI's alert representation. Null or malformed alert payloads are rejected instead of being displayed as a successful empty list.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/predict` | POST | Classify submitted network-flow features |
| `/alerts` | GET | Retrieve stored alert history |
| `/metrics` | GET | Operational counters and stored-alert severity summary |
| `/health` | GET | Backend-reported service checks |
| `/dataset-analytics` | GET | Historical offline analytics |

The local development server proxies `/api/*` requests to the configured API. Production builds call the API directly. The Vite proxy is development-only.

## Product routes

- `/` — command center dashboard
- `/detection` — Top-30 network-flow prediction form
- `/alerts` — alert inventory with filtering and sorting
- `/network` — traffic activity analysis
- `/model` — model metadata and offline evaluation information
- `/mlops` — model lifecycle overview and available release information
- `/monitoring` — operational counters and reported service health
- `/settings` — API and system configuration boundary

## Data behavior

| Information | Meaning | Interpretation |
| --- | --- | --- |
| Operational inference counters | Activity in the backend-reported time window | A zero is a returned counter value, not proof of a threat-free network |
| Stored alert distribution | Severity of retained alert records | May include records older than the monitoring window |
| Dataset analytics | Analysis of historical dataset rows | Does not represent current network capture |
| Health status | Checks supplied by `/health` | An omitted check remains unknown |
| Model metadata | Configured model and offline evaluation information | Does not certify current deployment health |

For example, an alert with a destination port of 80 but no destination address is displayed as `IP unavailable (Port 80)`. An absent address is never replaced with a guessed IP.

## Machine-learning context

The frontend metadata identifies the model as **HistGradientBoosting Top-30**, with 30 selected features, version `1.0.0`, and a configured decision threshold of `0.49`. Feature names include transport ports, TCP flags, packet-size statistics, time-to-live values, and timing measurements.

Histogram-based gradient boosting combines decision trees to learn relationships between input features and a target class. The prediction interface sends the required measurements to the backend; the frontend does not train the classifier.

The model screen contains offline evaluation metadata, including accuracy, precision, recall, F1, and ROC-AUC. These are configured values in `client/src/types/index.ts`, not measurements calculated from current production requests. Reproducing those results requires the separately maintained dataset, training procedure, and evaluation split.

An attack probability is a model score, not certainty that a real intrusion occurred. Review the supporting record and model limitations before treating a classification as a confirmed incident.

Live cybersecurity values are never fabricated. If the configured API is unavailable or an endpoint has not been implemented, the UI shows an explicit pending, loading, or error state. Verified static model information is sourced from the Cloud’s Bane product specification.

Operational metrics, stored alerts, and offline dataset analytics represent different data sources and time windows. Zero recent operational counters do not imply an empty historical alert inventory or a threat-free environment. Missing addresses remain unavailable while reported ports are retained. Model deployment health is unavailable when the backend does not report it.

## Verification

```bash
pnpm exec vitest run client/src/services/api.test.ts
pnpm check
pnpm build
```

The API tests include a real `/health` connectivity check requiring `VITE_API_BASE_URL` and network access. This is not a comprehensive AWS integration test. For offline response-normalization tests, run:

```sh
pnpm exec vitest run client/src/services/api.test.ts -t "alerts response normalization"
```

## Build and hosting

### Vercel application

Visit **https://cloudsbanev1.vercel.app** for the hosted frontend. Typical project settings for this repository are:

| Setting | Value |
| --- | --- |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output directory | `dist/public` |
| Public build variable | `VITE_API_BASE_URL` |

Client-side routes require the SPA rewrite included in `vercel.json`. The API must permit the frontend origin `https://cloudsbanev1.vercel.app` through its CORS configuration. Requests using JSON require the appropriate `Content-Type` allowance; GET, POST, and OPTIONS handling should match the actual API integration. This documentation does not assert that deployed CORS has been verified.

`pnpm build` generates static assets in `dist/public`; `pnpm preview` serves the build locally. Configure static hosting with that output directory and an SPA fallback to `index.html`. A Vercel rewrite is included in `vercel.json`.

The current build does not compile `server/index.ts`, so `pnpm start` is not a complete production build workflow. Set the public API base URL before building. Never put credentials in `VITE_*` variables because they are exposed to the browser.

Production browser access requires API CORS configured for the intended hosting origin, used methods and headers, and applicable error responses. Verify this with the deployed frontend; the development proxy does not resolve production CORS.

## Structure

```text
client/src/components/   Layout and reusable UI components
client/src/pages/        Application screens
client/src/services/     API client and response tests
client/src/types/        Types and model metadata
server/                 Optional static-server source
shared/                 Shared constants
patches/                Dependency patches used by pnpm
```

## Suggested demonstration

1. Open the [hosted application](https://cloudsbanev1.vercel.app) and explain the difference between recent counters and historical alerts.
2. Open Alerts / SOC, search for a visible record, select a severity, and change sorting.
3. Open an alert and explain its probability, risk, timestamp, and reported ports. Show how missing IP addresses are handled.
4. Open Monitoring and identify which checks the backend reports and which are unavailable.
5. Open ML model and distinguish offline evaluation information from current deployment state.

Use the counts visible at demonstration time. Do not present a fixed historical alert count as a permanent property of the application.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Live data unavailable | Configure the API base URL and inspect the failed endpoint response |
| Local development works but hosted fetch fails | Inspect browser Network and Console for CORS or network failures; the local proxy is absent in production |
| A direct route returns a hosting 404 | Confirm the SPA fallback/rewrite and output directory |
| ML health is unknown | Check whether `/health` actually reports an ML check |
| Operational counters are zero | Check the backend reporting window and metric publication; compare stored alerts separately |
| API test fails without configuration | Set the approved API URL or run only offline normalization tests |

## Limitations and future work

This interface does not establish automatic live packet capture, attack blocking, continuous retraining, or verified model production health. Those capabilities require backend implementation and evidence. Static model evaluation values are distinct from live operational telemetry.

## Contributing and security

Keep changes focused, preserve API contracts, and run the validation commands before submitting a change. Document loading, empty, error, and unavailable states for new features. Environment files, generated review reports, logs, private datasets, and build outputs belong outside version control. Never commit AWS credentials, private keys, or sensitive alert exports.
