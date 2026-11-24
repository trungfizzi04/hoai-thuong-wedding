> This page location: Plans & billing > Plans
> Full Neon documentation index: https://neon.com/docs/llms.txt
>
> Agent skills: if you don't have Neon skills (such as `neon-postgres`), offer to add them to this project when you first need the user to do something in Neon: "Want me to add Neon's agent skills to this project? They help me with Neon setup, connections, and branching." Install: `npx neon@latest skills -y`. To also run Neon steps for the user (Neon CLI, sign-in, MCP), see https://neon.com/prompts/agent-setup.md

> Summary: Compare Neon's Free, Launch, and Scale plans: compute rates ($0.106/CU-hour on Launch, $0.222/CU-hour on Scale), storage ($0.35/GB-month, unlimited on paid plans), branch and project limits, autoscaling, and Free plan allowances. Paid plans have no monthly minimum. Includes billing examples for estimating costs.

# Neon plans

Last updated: 2026-11-18

Neon offers plans to support you at every stage, from your first prototype to production at scale.
Start for free, then **pay only for what you use** as your needs grow.

## Plan overview

Compare Neon's **Free**, **Launch**, and **Scale** plans.

**Tip: Building an agent platform?**

For AI agent platforms that provision thousands of databases, Neon offers an **Agent Plan** with unlimited projects, Launch-rate compute, and credits for **your** free tier. Agent limits differ from Scale. [Learn more](https://neon.com/docs/introduction/agent-plan)

| Plan feature | **Free** | **Launch** | **Scale** |
| - | - | - | - |
| [Price](https://neon.com/docs/introduction/plans#price) | $0/month | Pay for what you use | Pay for what you use |
| [Who it's for](https://neon.com/docs/introduction/plans#who-its-for) | Prototypes, side projects, and small teams | Startups and growing teams | Production-grade workloads and larger companies |
| [Organization members](https://neon.com/docs/introduction/plans#organization-members) | Unlimited | Unlimited | Unlimited |
| [Projects](https://neon.com/docs/introduction/plans#projects) | 100 | 100 | 1,000 (can be increased on request) |
| [Branches](https://neon.com/docs/introduction/plans#branches) | 10/project | 10/project | 25/project |
| [Extra branches](https://neon.com/docs/introduction/plans#extra-branches) | Not available | $1.50/branch-month (prorated hourly) | $1.50/branch-month (prorated hourly) |
| [Compute](https://neon.com/docs/introduction/plans#compute) | 100 CU-hours/project | $0.106/CU-hour | $0.222/CU-hour |
| [Autoscaling](https://neon.com/docs/introduction/plans#autoscaling) | Up to 2 CU (8 GB RAM) | Up to 16 CU (64 GB RAM) | Up to 16 CU autoscaling, or fixed sizes up to 56 CU (224 GB RAM) |
| [Scale to zero](https://neon.com/docs/introduction/plans#scale-to-zero) | After 5 min | After 5 min, can be disabled | Configurable (1 minute to always on) |
| [Read replicas](https://neon.com/docs/introduction/plans#read-replicas) | 3/project | 6/branch | 6/branch |
| [Storage](https://neon.com/docs/introduction/plans#storage) | 1 GB/project, 20 GB account total | $0.35/GB-month | $0.35/GB-month |
| [Public network transfer](https://neon.com/docs/introduction/plans#public-network-transfer) | 5 GB per project included | 500 GB per project included, then $0.10/GB | 500 GB per project included, then $0.10/GB |
| [Monitoring](https://neon.com/docs/introduction/plans#monitoring) | 1 day | 3 days | 14 days |
| [Metrics/logs export](https://neon.com/docs/introduction/plans#metricslogs-export) | Not available | Not available | ✅ |
| [Spending notifications](https://neon.com/docs/introduction/plans#spending-notifications) | Not available | ✅ | ✅ |
| [Instant restore](https://neon.com/docs/introduction/plans#instant-restore) | No charge, up to 6 hours | $0.20/GB-month | $0.20/GB-month |
| [History window](https://neon.com/docs/introduction/plans#history-window) | 6 hours, up to 1 GB of changes | Up to 7 days | Up to 30 days |
| [Snapshots](https://neon.com/docs/introduction/plans#snapshots) | 1 manual snapshot | 100 manual snapshots, $0.09/GB-month | 100 manual snapshots, $0.09/GB-month |
| [Auth](https://neon.com/docs/introduction/plans#auth) | Up to 60k MAU/project | Up to 1M MAU/project | Up to 1M MAU/project |
| [Object Storage](https://neon.com/docs/introduction/plans#object-storage) | 5 GB/project | $0.023/GB-month | $0.023/GB-month |
| [Functions](https://neon.com/docs/introduction/plans#functions) | 10 active / 400 waiting Capacity-Hours, 1M invocations per project | $0.10/$0.025/Capacity-Hour, $0.60/M | $0.12/$0.03/Capacity-Hour, $0.60/M |
| [AI Gateway](https://neon.com/docs/introduction/plans#ai-gateway) | Prepaid credits | Prepaid credits | Prepaid credits |
| [Data API](https://neon.com/docs/introduction/plans#data-api) | No separate charge | No separate charge | No separate charge |
| [Realtime](https://neon.com/docs/introduction/plans#realtime) | Free during beta | Free during beta | Free during beta |
| [Private network transfer](https://neon.com/docs/introduction/plans#private-network-transfer) | Not available | Not available | $0.01/GB |
| [Compliance and security](https://neon.com/docs/introduction/plans#compliance-and-security) | Not available | Protected branches | SOC 2, ISO, GDPR, [HIPAA](https://neon.com/docs/security/hipaa), Protected branches, IP Allow, Private Networking |
| [Uptime SLA](https://neon.com/docs/introduction/plans#uptime-sla) | Not available | Not available | ✅ |
| [Support](https://neon.com/docs/introduction/plans#support) | Community | Billing support | Standard (additional options for higher-volume customers) |

To upgrade or downgrade, go to **Billing** > **Change plan** in the [Neon Console](https://console.neon.tech/app/billing#change_plan). See [Change your plan](https://neon.com/docs/introduction/manage-billing#change-your-plan) for what happens to your resources when you switch.

## Plan features

This section describes the features listed in the [Plan overview](https://neon.com/docs/introduction/plans#plan-overview) table.

**Tip: Optimize your costs**

Learn how to manage your Neon costs effectively with our [cost optimization guide](https://neon.com/docs/introduction/cost-optimization), which covers strategies for compute, storage, branches, and data transfer.

### Price

On **Launch** and **Scale** plans, you pay only for what you use; there's no minimum monthly fee. Usage for compute, storage, extra branches, and other features is billed at the published rates (see the [Plan overview](https://neon.com/docs/introduction/plans#plan-overview) table).

Higher-volume customers may qualify for annual commits. [Contact sales](https://neon.com/contact-sales) to learn more.

**Note:** Invoices under $0.50 are not collected.

On the **Free** plan, there is no monthly cost. You get usage allowances for projects, branches, compute, storage, and more, for $0/month.

### Who it's for

- **Free**: Prototypes, side projects, and small teams. Includes 100 projects, 100 CU-hours/project, 1 GB Postgres storage per project (up to 20 GB total across all projects), and 5 GB of egress per project. Upgrade if you need more resources or features.
- **Launch**: Startups and growing teams needing more resources, features, and flexibility. Pay only for what you use.
- **Scale**: Production-grade workloads and large teams. Higher limits, advanced features, full support, compliance, additional security, and SLAs. Pay only for what you use.

### Organization members

You can invite teammates to your organization and they'll have access to all projects within it. To invite members, go to the **People** page in your organization and click **Invite member**. See [Invite members](https://neon.com/docs/manage/orgs-manage#invite-members) for details.

### Projects

A project is a container for your backend. It includes your database, branches, computes, and backend services like object storage and functions. Similar to a Git repository that contains code, artifacts, and branches, a project contains all your resources. Learn more about [Neon's object model](https://neon.com/docs/concepts/the-object-model).

> For most use cases, create a project for each app or customer to isolate data and manage resources.

Included per plan:

- **Free**: 100 projects
- **Launch**: 100 projects
- **Scale**: 1,000 projects (soft limit; you can [request more](https://neon.com/docs/introduction/support#request-a-limit-increase) from the console)

### Branches

Each Neon project is created with a [root branch](https://neon.com/docs/reference/glossary#root-branch), like the `main` branch in Git.  
Postgres objects (databases, schemas, tables, records, indexes, roles) are created on a branch.

You can create [child branches](https://neon.com/docs/reference/glossary#child-branch) for testing, previews, or development.

Included per plan, counting the root branch:

- **Free**: 10 branches/project
- **Launch**: 10 branches/project
- **Scale**: 25 branches/project

See [Extra branches](https://neon.com/docs/introduction/plans#extra-branches) for overage costs and [Storage](https://neon.com/docs/introduction/plans#storage) for how branch storage is billed.

> Projects can have multiple root branches, with limits based on your plan. See [Branch types: Root branch](https://neon.com/docs/manage/branches#root-branch) for details.

### Extra branches

On paid plans, you can create extra child branches. Extra branches beyond your plan's branch allowance (outlined [above](https://neon.com/docs/introduction/plans#branches)) are billed in **branch-months**, metered hourly.

1 extra branch × 1 month = 1 branch-month

Cost: **$1.50/branch-month** (~$0.002/hour).

Example: The Launch plan includes 10 branches/project. You create 2 extra branches for 5 hours each → 10 extra branch-hours × $0.002/hour = ~$0.02 total.

> Extra branches are not available on the Free plan. Delete branches or upgrade if you need more.

The maximum number of branches you can have per project:

- **Launch**: 5,000 branches/project
- **Scale**: 5,000 branches/project

If you need more, [request an increase in the feedback form in console](https://console.neon.tech/app/settings?modal=feedback\&modalparams=%22Branch%20limit%20increase%22).

### Compute

Compute usage depends on compute size and runtime.

- Measured in **CU-hours** (Compute Unit hours)
- Each Compute Unit (CU) allocates approximately 4 GB of RAM, along with associated CPU and local SSD resources
- Compute sizes up to 56 CU (plan-dependent)

| Compute Unit | RAM |
| - | - |
| .25 | 1 GB |
| .5 | 2 GB |
| 1 | 4 GB |
| 2 | 8 GB |
| 3 | 12 GB |
| ... | ... |
| 56 | 224 GB |

Formula:

```
compute size × hours running = CU-hours
```

Examples:

- 0.25 CU for 4 hours = 1 CU-hour
- 2 CU for 3 hours = 6 CU-hours
- 8 CU for 2 hours = 16 CU-hours

**Free**: 100 CU-hours/project/month (enough to run a 0.25 CU compute in a project for 400 hours/month).  
**Launch**: $0.106/CU-hour  
**Scale**: $0.222/CU-hour

> All computes in your project count toward usage. Each branch has a read-write compute by default; [read replicas](https://neon.com/docs/reference/glossary#read-replica) add read-only computes.

#### Compute with autoscaling

Autoscaling changes compute size between a defined min and max. Estimate usage as:

```
average compute size × hours running = CU-hours
```

#### Compute with scale to zero

Scale to zero suspends computes after inactivity to reduce compute usage and cost.

### Autoscaling

Adjusts compute size between defined limits based on demand.

- **Free**: Up to 2 CU (8 GB RAM)
- **Launch**: Up to 16 CU (64 GB RAM)
- **Scale**: Up to 16 CU for autoscaling; fixed sizes up to 56 CU (224 GB RAM)

> Autoscaling is capped at 16 CU. Scale supports fixed computes above 16 CU.

### Scale to zero

Suspends computes after inactivity.

- **Free**: 5 min inactivity; cannot disable
- **Launch**: 5 min inactivity; can disable
- **Scale**: Fully configurable; 1 minute to always on

### Read replicas

[Read replicas](https://neon.com/docs/introduction/read-replicas) are read-only computes that serve reads from the same storage as your branch's primary compute. Each read replica is billed as compute.

All plans are limited to 6 read replicas per branch. The Free plan is also limited to 3 read replica computes per project, and the [Agent plan](https://neon.com/docs/introduction/agent-plan) allows up to 3 read replicas per project.

### Storage

Storage is your data size, billed on actual usage in **GB-months**, measured hourly.

- **Launch**/**Scale plan storage cost**: $0.35/GB-month
- **[Root branches](https://neon.com/docs/reference/glossary#root-branch)**: billed on actual data size (_logical data size_)
- **[Child branches](https://neon.com/docs/reference/glossary#child-branch)**: billed on the minimum of the data changes since creation or the logical data size

When a child branch is created, it initially consumes no storage. As you make changes (inserts, updates, or deletes) to the child branch, a delta is recorded from the point of branch creation. This delta, a log of all write operations, grows over time and counts toward your storage usage.

Importantly, **child branch storage is capped at your actual data size**: you're billed for the minimum of accumulated changes or logical data size, whichever is lower.

**Important: Manage child branches to control storage costs**

Even though child branch storage is capped at your logical data size, it's still important to manage branches effectively to minimize storage costs:

- Set a [time to live](https://neon.com/docs/guides/branch-expiration) on development and preview branches
- Delete child branches when they're no longer needed
- For production workloads, use a [root branch](https://neon.com/docs/manage/branches#root-branch) instead; root branches are billed on your actual data size with no delta tracking overhead.

> **Free** plan users get 1 GB of Postgres storage per project, up to 20 GB total across all projects

#### Unlimited storage

**Storage is unlimited on paid plans (Launch and Scale): there's no hard per-branch size limit, and your storage grows with your usage.** The Free plan is limited to 1 GB of Postgres storage per project, and to 20 GB in total across all your projects. These two limits are enforced independently: the total Postgres storage across all your Free projects can't exceed 20 GB, even though each project is also individually capped at 1 GB. This limit applies to Postgres storage and is separate from [Object Storage](https://neon.com/docs/introduction/plans#object-storage), which has its own Free allowance.

### Public network transfer

Public network transfer (egress) is the total volume of data sent over the public internet during the monthly billing period. It includes data sent from your databases, from [Object Storage](https://neon.com/docs/storage/overview), and from [Neon Functions](https://neon.com/docs/compute/functions/overview), and the allowance is shared across all three in each project.

> Public network transfer includes data sent via [logical replication](https://neon.com/docs/reference/glossary#logical-replication) to any destination, including other Neon databases.

Allowances per plan:

- **Free**: 5 GB per project per month
- **Launch**: 500 GB per project per month, then $0.10/GB
- **Scale**: 500 GB per project per month, then $0.10/GB

> On all plans, the network transfer allowance is per project and shared across all products in that project, including Postgres, [Object Storage](https://neon.com/docs/introduction/plans#object-storage), and [Functions](https://neon.com/docs/introduction/plans#functions).

### Monitoring

View metrics such as RAM, CPU, connections, and database size in the **Monitoring** dashboard in the Neon Console.

Retention of metrics data differs by plan:

- **Free**: 1 day
- **Launch**: 3 days
- **Scale**: 14 days

See [Monitoring dashboard](https://neon.com/docs/introduction/monitoring-page) for details.

### Metrics/logs export

Export metrics and Postgres logs to [Datadog](https://neon.com/docs/guides/datadog) or any [OTel-compatible platform](https://neon.com/docs/guides/opentelemetry).  
Available only on the **Scale** plan.

### Spending notifications

Get email alerts when your organization's monthly Neon charges reach 80% and 100% of a threshold you set, so you can act before the bill grows. Available on the **Launch** and **Scale** plans.

See [Spending notifications](https://neon.com/docs/introduction/spending-notifications) for how to set a threshold.

### Instant restore

Neon stores a change history to support point-in-time restore (instant restore). You can only point-in-time restore from **root branches**, so PITR storage is charged only for root branches. Child branches do not add to this charge.

- **Free**: No charge, up to 6 hours, limited to 1 GB of change history per project
- **Launch**: Up to 7 days, billed at $0.20/GB-month
- **Scale**: Up to 30 days, billed at $0.20/GB-month

You can change your [history window](https://neon.com/docs/introduction/plans#history-window) to control how much change history you retain for **instant restore**. See [Instant restore](https://neon.com/docs/introduction/branch-restore) for how to use the feature.

> The change history is a log of write operations in the form of Postgres [Write-Ahead Logs](https://neon.com/docs/reference/glossary#write-ahead-logging-wal).

### History window

How far back **instant restore** can reach (and how much change history is retained) for your project.

The maximum history window per plan:

- **Free**: Up to 6 hours, limited to 1 GB of change history per project
- **Launch**: Up to 7 days
- **Scale**: Up to 30 days

> The history window defaults are 6 hours for Free plan projects and 1 day for paid plan projects.

Shortening the history window can reduce [instant restore](https://neon.com/docs/introduction/plans#instant-restore) storage costs but limits how far back you can restore. See [History window](https://neon.com/docs/introduction/history-window) for configuration details and more information.

### Snapshots

Snapshots capture the state of your branch at a point in time. You can create snapshots manually or schedule automated backups.

The per-plan snapshot limit applies to **manual snapshots only**. On paid plans, snapshots created by backup schedules do not count toward this limit (scheduled backups are not available on the Free plan).

Manual snapshot limits per plan:

- **Free**: 1 manual snapshot
- **Launch**: 100 manual snapshots
- **Scale**: 100 manual snapshots

**Pricing**: Snapshot storage is billed at $0.09/GB-month.

For billing, manual snapshots are charged as full snapshots. Scheduled snapshots are charged as full snapshots for the first snapshot in a schedule, then as incremental (delta) storage for subsequent snapshots in that schedule.

Automated backup schedules are available on paid plans. On the Agent plan, they are available upon request. See [Backup & restore](https://neon.com/docs/guides/backup-restore) for details.

### Auth

Managed Better Auth is a managed authentication service built on [Better Auth](https://www.better-auth.com/), fully integrated into the Neon platform.

Monthly Active User (MAU) limits per project:

- **Free**: Up to 60,000 MAU per project
- **Launch**: Up to 1M MAU per project ([request an increase in console](https://console.neon.tech/app/settings?modal=feedback\&modalparams=%22Neon%20auth%20limit%20increase%22) if you need more)
- **Scale**: Up to 1M MAU per project ([request an increase in console](https://console.neon.tech/app/settings?modal=feedback\&modalparams=%22Neon%20auth%20limit%20increase%22) if you need more)

> An MAU (Monthly Active User) is a unique user who authenticates at least once during a monthly billing period.

See [Managed Better Auth](https://neon.com/docs/auth/overview) for more information.

### Object Storage

Neon Object Storage is S3-compatible object storage that branches with your Neon project. It's available on all plans, including Free.

On paid plans, the following rates apply ([usage limits](https://neon.com/docs/storage/overview#limits) also apply):

- **Storage**: $0.023/GB-month. Only stored volume is metered; there's no per-operation charge.
- **Egress**: Data transferred out counts toward your [public network transfer](https://neon.com/docs/introduction/plans#public-network-transfer) allowance, which is shared across all products, and is billed at the same rate once you exceed it.

On the **Free** plan, you get 5 GB of Object Storage per project.

See [Neon Object Storage](https://neon.com/docs/storage/overview) for more information.

### Functions

Neon Functions are serverless Node.js compute you deploy onto a Neon branch, so your backend code runs next to your database. They're available on all plans, including Free.

You're billed for compute only while a request is being processed. Billing starts when a request triggers the function and continues until processing finishes, either by returning a response or by completing any background [`waitUntil`](https://neon.com/docs/compute/functions/reference/runtime-limits#timeouts) work it started. You aren't billed between requests.

Compute is measured in **Capacity-Hours**. Functions run at a fixed size, so one hour of function runtime equals one Capacity-Hour. That runtime is billed at two rates, and a single request usually incurs both:

- **Active compute**: billed while your code is actively using the CPU.
- **Waiting compute**: billed at a lower rate when your code isn't using much CPU, typically while it waits on the network, a timer, or other I/O.

**Invocations** are counted separately: each time your function is called counts as one invocation, regardless of how long it runs. Billed per million.

[Usage limits](https://neon.com/docs/compute/functions/reference/runtime-limits) apply. On paid plans, Functions are billed at the following rates:

| Metric | **Launch** | **Scale** |
| - | - | - |
| Active compute | $0.10/Capacity-Hour | $0.12/Capacity-Hour |
| Waiting compute | $0.025/Capacity-Hour | $0.03/Capacity-Hour |
| Invocations | $0.60/M | $0.60/M |

On the **Free** plan, you get 10 active Capacity-Hours, 400 waiting Capacity-Hours, and 1 million invocations per project per month. Each project gets its own allowance, and it isn't shared with your other projects. The [concurrency limit](https://neon.com/docs/compute/functions/reference/runtime-limits#concurrency) is separate: it caps in-flight invocations across your account to prevent abuse and isn't a usage allowance.

Egress (data a function sends out) counts toward the project's [public network transfer](https://neon.com/docs/introduction/plans#public-network-transfer) allowance, which is also per project and shared across all products in that project.

See [Neon Functions](https://neon.com/docs/compute/functions/overview) for what's included and current limitations.

### AI Gateway

Neon AI Gateway provides access to open-weight and foundation models from multiple providers through a single Neon credential. It's available on all plans, including Free. On the Free plan, you add a payment card and buy prepaid credits without upgrading. Any account with prepaid credits can use every model in the catalog; see [Model access](https://neon.com/docs/ai-gateway/models#model-access) for details.

Prices match each provider's published list prices, with no additional markup, and draw down a prepaid credit balance you buy from the **Billing** page in the Neon Console.

See [AI Gateway prepaid credits](https://neon.com/docs/ai-gateway/prepaid-credits) for pricing details, buying credits, and usage limits.

### Data API

The [Neon Data API](https://neon.com/docs/data-api/overview) lets you query your database over HTTP. It's available on all plans with no separate charge. The queries it runs use your database compute, so they count toward your [compute](https://neon.com/docs/introduction/plans#compute) usage like any other query. Responses count toward your [public network transfer](https://neon.com/docs/introduction/plans#public-network-transfer) allowance.

### Realtime

[Neon Realtime](https://neon.com/docs/realtime/overview) is free to use during the beta. Neon doesn't charge for the live query engine or the Live SQL API service. Your workload can still generate usage that's billed by your plan:

- **Database compute**: starting a live query can wake your compute, which counts toward your [compute](https://neon.com/docs/introduction/plans#compute) usage.
- **Network transfer**: data sent to clients counts toward your [public network transfer](https://neon.com/docs/introduction/plans#public-network-transfer) allowance.

### Private network transfer

Bi-directional data transfer to and from your databases over private networking.

Private networking is available on the **Scale** plan. It uses [AWS PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/concepts.html) to bypass the public internet.

Billed at $0.01/GB for network transferred to and from Neon. You'll only see this on your bill if you enable this feature.

### Compliance and security

Compliance certifications available on **Scale**:

- SOC 2
- SOC 3
- ISO 27001
- ISO 27701
- GDPR
- CCPA
- HIPAA ([additional charge](https://neon.com/docs/security/hipaa))

Security features:

- [Protected branches](https://neon.com/docs/guides/protected-branches): safeguards for critical data (available on **Launch** and **Scale**)
- [IP Allow](https://neon.com/docs/introduction/ip-allow): restricts access to trusted IPs (available on **Scale**)
- [Private Networking](https://neon.com/docs/guides/neon-private-networking): secure private connections via AWS PrivateLink (available on **Scale**)

### Uptime SLA

Guaranteed service availability is offered on the **Scale** plan. For uptime commitments, Service Credits, and exclusions, see the [Neon Service Level Agreement](https://neon.com/docs/legal/sla).

### Support

Support level by plan:

- **Free**: Community support
- **Launch**: Billing support
- **Scale**: Standard support

Higher-volume customers may qualify for annual commits and additional support options aligned with [Databricks Support](https://www.databricks.com/support). [Contact sales](https://neon.com/contact-sales) to learn more.

See [Support](https://neon.com/docs/introduction/support) for details.

## Usage metrics

The Neon Console displays usage in a simplified view on the [Projects page](https://console.neon.tech/app/), while your invoice shows a detailed breakdown.

![Usage metrics on the Projects page in the Neon Console](https://neon.com/docs/introduction/usage_metrics_console.png)

Use the table below to understand how Console metrics map to invoice line items.

| Console metric | Invoice line item(s) |
| - | - |
| **Compute** | Database compute, CU-hour |
| **Storage** | Database storage (root branches), GB-month <br/> Database storage (child branches), GB-month |
| **History** | Database storage (instant restore), GB-month <br/> Database storage (snapshots), GB-month |
| **Network transfer** | Public network transfer, GB <br/> Private network transfer, GB (if [Private Networking](https://neon.com/docs/guides/neon-private-networking) is enabled) |
| Not shown | Database extra branches, branch-month |
| Not shown | Function compute (active), capacity-hour <br/> Function compute (waiting), capacity-hour <br/> Function invocations, million |
| Not shown | Object storage, GB-month |

**Note:** **Extra branches**, **Neon Functions**, and **Object Storage** don't appear in the Console usage summary but can appear on your invoice. AI Gateway usage draws down your [prepaid credit balance](https://neon.com/docs/ai-gateway/prepaid-credits) rather than appearing as a usage line item.

## Invoice metrics

The following metrics may appear on your Neon invoice. Each metric represents a specific type of usage that contributes to your monthly bill.

| **Metric** | **Description** |
| - | - |
| **Database compute, CU-hour** | Total compute usage in **CU-hours** (Compute Unit hours). [Learn more](https://neon.com/docs/introduction/plans#compute). |
| **Database extra branches, branch-month** | Number of extra branches beyond your plan allowance, metered hourly. [Learn more](https://neon.com/docs/introduction/plans#extra-branches). |
| **Database storage (instant restore), GB-month** | Storage used for **instant restore**, billed per GB-month. [Learn more](https://neon.com/docs/introduction/plans#instant-restore). |
| **Database storage (child branches), GB-month** | Data storage for child branches (minimum of delta or logical size), billed per GB-month. [Learn more](https://neon.com/docs/introduction/plans#storage). |
| **Database storage (root branches), GB-month** | Data storage for root branches, billed per GB-month. [Learn more](https://neon.com/docs/introduction/plans#storage). |
| **Database storage (snapshots), GB-month** | Storage used for branch snapshots, billed per GB-month. [Learn more](https://neon.com/docs/introduction/plans#snapshots). |
| **Private network transfer, GB** | Bi-directional data transfer to and from your databases over private networking (for example, AWS PrivateLink). [Learn more](https://neon.com/docs/introduction/plans#private-network-transfer). |
| **Public network transfer, GB** | Outbound data transfer (egress) from your databases to the public internet. [Learn more](https://neon.com/docs/introduction/plans#public-network-transfer). |
| **Function compute (active), capacity-hour** | Neon Functions compute for time your code is actively using the CPU. [Learn more](https://neon.com/docs/introduction/plans#functions). |
| **Function compute (waiting), capacity-hour** | Neon Functions compute for time your code waits on I/O, billed at a lower rate. [Learn more](https://neon.com/docs/introduction/plans#functions). |
| **Function invocations, million** | Number of times your functions are called. [Learn more](https://neon.com/docs/introduction/plans#functions). |
| **Object storage, GB-month** | Stored Object Storage volume. [Learn more](https://neon.com/docs/introduction/plans#object-storage). |

## Usage-based cost examples

The following examples show what your monthly bill might look like on the **Launch** and **Scale** plans at different levels of usage. Each example includes compute, storage (root and child branches), and instant restore history. Your actual costs will depend on your specific workload, usage patterns, and configuration.

> **Note:** The "billable days" shown below refer to **active compute time** (the total hours your compute is actively running) in a month. Computes can scale to zero when idle, so you may accumulate these hours in shorter periods of usage throughout the month rather than running continuously.

### Launch plan

- **Example 1 (light usage)**
  - Compute: ~10 CU-hours = 1 CU × 10 hours: **$1.06**  
    _(10 CU-hours × $0.106/CU-hour)_
  - Root branch storage: 2 GB: **$0.70**  
    _(2 GB × $0.35/GB-month)_
  - Child branch storage: 1 GB: **$0.35**  
    _(1 GB × $0.35/GB-month)_
  - Instant restore history: 1 GB: **$0.20**  
    _(1 GB × $0.20/GB-month)_

    **Amount due:** **$2.31**

- **Example 2**
  - Compute: ~120 CU-hours = 1 CU × 120 hours (about 5 billable days): **$12.72**  
    _(120 CU-hours × $0.106/CU-hour)_
  - Root branch storage: 20 GB: **$7.00**  
    _(20 GB × $0.35/GB-month)_
  - Child branch storage: 5 GB: **$1.75**  
    _(5 GB × $0.35/GB-month)_
  - Instant restore history: 10 GB: **$2.00**  
    _(10 GB × $0.20/GB-month)_

    **Amount due:** **$23.47**

- **Example 3**
  - Compute: ~250 CU-hours = 2 CU × 125 hours (about 5.2 billable days): **$26.50**  
    _(250 CU-hours × $0.106/CU-hour)_
  - Root branch storage: 40 GB: **$14.00**  
    _(40 GB × $0.35/GB-month)_
  - Child branch storage: 10 GB: **$3.50**  
    _(10 GB × $0.35/GB-month)_
  - Instant restore history: 20 GB: **$4.00**  
    _(20 GB × $0.20/GB-month)_

    **Amount due:** **$48.00**

---

### Scale plan

- **Example 1**
  - Compute: ~1,700 CU-hours = 4 CU × 425 hours (about 17.7 billable days): **$377.40**  
    _(1,700 CU-hours × $0.222/CU-hour)_
  - Root branch storage: 100 GB: **$35.00**  
    _(100 GB × $0.35/GB-month)_
  - Child branch storage: 25 GB: **$8.75**  
    _(25 GB × $0.35/GB-month)_
  - Instant restore history: 50 GB: **$10.00**  
    _(50 GB × $0.20/GB-month)_

    **Amount due:** **$431.15**

- **Example 2**
  - Compute: ~2,600 CU-hours = 8 CU × 325 hours (about 13.5 billable days): **$577.20**  
    _(2,600 CU-hours × $0.222/CU-hour)_
  - Root branch storage: 150 GB: **$52.50**  
    _(150 GB × $0.35/GB-month)_
  - Child branch storage: 40 GB: **$14.00**  
    _(40 GB × $0.35/GB-month)_
  - Instant restore history: 75 GB: **$15.00**  
    _(75 GB × $0.20/GB-month)_

    **Amount due:** **$658.70**

## Frequently asked questions

### What is a CU?

A CU (Compute Unit) is Neon's measure of compute size. Each CU allocates approximately 4 GB of RAM to the database instance, along with associated CPU and local SSD resources. Scaling up increases these resources linearly. For example, a 2 CU compute has 8 GB RAM.

### How is compute usage measured in Neon?

Compute usage is measured in **CU-hours**:  
CU-hours = compute size (in CU) × hours running  
Examples:  
• 0.25 CU for 4 hours = 1 CU-hour  
• 2 CU for 3 hours = 6 CU-hours  
Your plan's compute price per CU-hour depends on whether you are on Launch or Scale. On the Free plan, each project includes 100 CU-hours per month.

### How is storage usage billed in Neon?

Storage is billed based on actual usage, measured in **GB-months**:  
1 GB-month = 1 GB stored for 1 month  
Storage usage is metered hourly and summed over the month. For child branches, you're billed for the minimum of accumulated changes or logical data size; capped at your actual data size. On the Free plan, you get 1 GB of Postgres storage per project, up to 20 GB total across all projects.

### How do branches affect storage?

Your root branch contains your main data. Child branches share data with the root until changes are made. Child branches are billed for the minimum of accumulated changes or logical data size; you never pay more than your actual data size. Delete unused branches to control storage costs.

### How is extra branch usage billed?

Paid plans include a set number of branches per project. Additional branches are billed at **$1.50/branch-month**, prorated hourly (about $0.002/hour).  
Example: If your plan includes 10 branches and you run 2 extra branches for 5 hours each, that's 10 branch-hours (~$0.02).

### How are instant restores billed?

Neon charges for PITR (point-in-time restore) storage only for branches you can point-in-time restore from: root branches. The charge is based on the amount of change history retained on those branches, not the number of restores you perform. Child branches do not add to PITR storage charges.  
• Free: Up to 6 hours of history, limited to 1 GB of changes per project, no charge.  
• Launch: Up to 7 days of history, billed at $0.20/GB-month.  
• Scale: Up to 30 days of history, billed at $0.20/GB-month.  
Change history is stored as Postgres WAL records.

### Is instant restore history accumulated at the project or branch level?

You can only point-in-time restore from root branches, so only root branches contribute to your billed PITR storage. You set a single **history window** (for example, 7 days or 30 days) for the entire project for **instant restore**. You cannot enable, disable, or configure the history window per branch.

### Can I disable scale-to-zero?

Free: No, it's always enabled (5 min idle timeout).  
Launch: Yes, you can disable it.  
Scale: Yes, fully configurable (1 minute to always-on). Learn more: [Scale to zero](https://neon.com/docs/introduction/scale-to-zero)

### What is autoscaling and how does it work?

Autoscaling adjusts compute size based on load, between your set min/max limits. All plans support it, but maximum CU differs: Free up to 2 CU, Launch and Scale up to 16 CU. Scale supports up to 56 CU for fixed-size computes. Learn more: [Autoscaling](https://neon.com/docs/introduction/autoscaling)

### How are read replicas billed?

Each read replica is its own compute and contributes to CU-hours.

### Do public network transfer limits reset each month?

Yes. Free includes 5 GB per project per month. Launch and Scale include 500 GB per project per month, then $0.10/GB.

### How is private network transfer billed?

Only available on Scale: $0.01/GB, bidirectional, between Neon and private network services.

### What are the limits and quotas for the Free plan?

The Free plan costs $0/month and includes 100 projects, 10 branches per project, 100 CU-hours of compute per project per month, autoscaling up to 2 CU (≈8 GB RAM), 1 GB of Postgres storage per project (up to 20 GB total across all projects), and 5 GB of public network transfer per project per month. It also includes a 6-hour instant restore history (up to 1 GB of changes per project), 1 manual snapshot, up to 60,000 Managed Better Auth MAU per project, 1 day of monitoring history, and community support. Scale to zero is always enabled (computes suspend after 5 minutes of inactivity) and can't be disabled. Compute (CU-hours) and network transfer reset each monthly billing period; projects, branches, and storage are continuous limits. For the full row-by-row breakdown, see the [Plan overview](https://neon.com/docs/introduction/plans#plan-overview) table.

### What happens if I exceed my Free plan limits?

On the Free plan, when you run out of CU-hours, your compute is suspended until the next billing period or until you upgrade. The 5 GB of public network transfer is shared by Postgres, Object Storage, and Neon Functions in the project. When the project uses it up, all three are restricted until the next billing period or until you upgrade, and your compute is suspended. Exceeding the 1 GB per-project storage cap, or the 20 GB total cap across all your projects, causes operations that increase storage (inserts, updates, and deletes) to fail until you free space or upgrade. Branch creation fails once you reach 10 branches per project. None of these limits delete your data.

### How do I restore or export a Free plan project that hit its limits?

It depends on which limit you hit. If you hit the storage limit, your compute stays available. You can still query the project or export it with [pg_dump](https://neon.com/docs/import/migrate-from-postgres), but writes fail until you free space or upgrade.

If you ran out of CU-hours or public network transfer, the compute is suspended until the next billing period, and connections, including `pg_dump`, fail with SQLSTATE `53000`. To restore access sooner, upgrade the organization that contains the project to Launch (**Billing** > **Change plan** in the Neon Console). Launch has no minimum monthly fee and invoices under $0.50 are not collected, so if you only restore access or export your data and then downgrade, the round trip usually costs nothing. When you downgrade back to Free, the plan change resets the Free plan's monthly compute and network transfer allowances. If you plan to export your data, do it before you downgrade, because `pg_dump` counts toward network transfer. If you ran out of network transfer, check what's using it so the project doesn't hit the limit again. See [Reduce network transfer costs](https://neon.com/docs/introduction/network-transfer).

You can load a dump into a new project in another Free organization, as long as the data fits within the Free plan's 1 GB per-project storage limit. You can't use [project transfer](https://neon.com/docs/manage/orgs-project-transfer) to move a project from a Launch organization to a Free one, because the destination organization must be on the same plan or higher.

### How do I upgrade or downgrade my plan?

In the Neon Console, go to **Billing** and select **Change plan**. After an upgrade, a compute picks up the new plan limits (such as maximum compute size) the next time it restarts. Before you downgrade, remove any projects, branches, or data that exceed the new plan's allowances. See [Change your plan](https://neon.com/docs/introduction/manage-billing#change-your-plan).

### Do you charge for idle computes?

If scale-to-zero is enabled, no. Computes that are suspended do not accrue CU-hours.

### What is the difference between root and child branch storage billing?

Root branches are billed for their full logical data size. Child branches are billed for the minimum of accumulated changes since creation or logical data size; ensuring you never pay more than your actual data size.

### Can I get more than the listed project limit?

Yes, on Scale you can request increases for projects beyond the listed limit.

### Why is the compute rate higher on Scale than Launch?

Scale includes higher availability, advanced security features, compliance certifications, and SLAs. The higher CU-hour rate reflects these additional capabilities.

### How can I control my costs?

• Set a maximum autoscaling limit to cap compute size.  
• Enable scale-to-zero for idle databases.  
• Delete unused branches to reduce storage costs.  
• Shorten your **history window** to reduce **History** usage (instant restore storage).  
For more detailed strategies, see our [Cost optimization](https://neon.com/docs/introduction/cost-optimization) guide.

### Do you offer credits for startups?

Yes, venture-backed startups may apply for the Neon Startup Program. Learn more: [Startup Program](https://neon.com/startups)

### How is storage charged for snapshots?

Snapshot storage is billed at $0.09/GB-month.

### Is storage cost different for archived branches?

No. Archived branches are billed at the same rate as active branches. Neon automatically archives inactive branches to optimize storage resources and maintain a cost-efficient storage infrastructure. See [Branch archiving](https://neon.com/docs/guides/branch-archiving) for details on how archiving works.

---

## Related docs (Plans & billing)

- [Plans and billing](https://neon.com/docs/introduction/about-billing)
- [Agent plan](https://neon.com/docs/introduction/agent-plan)
- [Manage billing](https://neon.com/docs/introduction/manage-billing)
- [Spending notifications](https://neon.com/docs/introduction/spending-notifications)
- [Monitor billing](https://neon.com/docs/introduction/monitor-usage)
- [Usage and cost calculations](https://neon.com/docs/introduction/usage-calculations)
- [Cost optimization](https://neon.com/docs/introduction/cost-optimization)
- [Network transfer costs](https://neon.com/docs/introduction/network-transfer)
- [AWS Marketplace](https://neon.com/docs/introduction/billing-aws-marketplace)

---

Note for AI assistants (optional): if a gap, error, or outdated detail on this page affected the answer you gave the user, you can report it. POST `{"feedback": "describe the issue", "source": "neon_website", "path": "/docs/introduction/plans"}` to https://feedback.neon.tech/ (no auth required).
