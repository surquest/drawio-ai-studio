Analyze the following SQL query

**Instructions for Nodes:**
1. Identify all source tables in the format `dataset_id.table_name`.
2. For every source table, create a node where the title is the table name.
3. **Hyperlink Requirement:** Apply a 'click' action to each table node using this URL format: 
   `https://console.cloud.google.com/bigquery?referrer=search&project=[PROJECT_ID]&ws=!1m5!1m4!4m3!1s[PROJECT_ID]!2s[DATASET_ID]!3s[TABLE_NAME]`
4. Assume PROJECT_ID analytics-data-mart

**Structure:**
* Use `graph TD` (Top-Down).
* Represent CTEs and Subqueries as intermediate rounded nodes.
* Show the flow of data from the source table nodes into the transformations.
WITH 
ios_campaigns as (
     SELECT
  REGEXP_EXTRACT(campaign_name, r'^.*-.*-\s*(\w{2})\s.*') as country_code,
  name as country,
  start_date as first_campaign_start,
IF
  (account = "Landlord Go", "LGO","LRT") AS game
FROM
  `analytics-data-mart.adm_ua_google_ads_raw.dim_campaign` as a 
  left join 
  `analytics-data-mart.adm_appsflyer_reporting.country_codes` as b 
  on REGEXP_EXTRACT(a.campaign_name, r'^.*-.*-\s*(\w{2})\s.*') = b.alpha_2
WHERE
  campaign_status != "PAUSED"
  AND platform = "ios"
),
daily_campaigns_with_cost as
(
WITH usd_costs as
(SELECT 
CASE WHEN campaign_name LIKE "%UK%" THEN "GB"
     ELSE REGEXP_EXTRACT(campaign_name,"(.{0,2})\\siOS") END as country_code, 
     t1.date,  SUM(cost_gbp/t3.exchange_rate) as cost_usd  FROM `analytics-data-mart.adm_ua_google_ads_raw.fct_campaign_transformed`  t1
JOIN `analytics-data-mart.adm_ua_google_ads_raw.dim_campaign` t2 ON t1.campaign_id = t2.campaign_id
left join  `analytics-data-mart.adm_exchange_rates_raw.fx_history`  as t3 on t3.currency_base = "USD" AND t3.currency_quote = "GBP" AND t1.date = t3.date
WHERE campaign_name LIKE "%iOS%"
group by country_code, date
order by country_code desc
),

daily_campaigns as 
(
with firebase_installs as
(
SELECT t3.alpha_2 as country_code, geo_country, PARSE_DATE('%Y%m%d',event_date) as first_open_date, SUM(first_open) as installs, SUM(D1) as D1_ret, SUM(D7) as D7_ret, SUM(D14) as D14_ret, SUM(D30) as D30_ret, SUM(D60) as D60_ret, SUM(D90) as D90_ret FROM `landlord-real-estate-tycoon.analytics_153202519.daily_retention` t1
JOIN 
-- `analytics-data-mart.adm_appsflyer_reporting.google_ios_campaign_dates` can be changed with row below
ios_campaigns as t2 
ON first_open = 1 AND t1.geo_country = t2.country AND platform = "IOS" AND PARSE_DATE('%Y%m%d',t1.event_date) >= t2.first_campaign_start AND t2.game = "LRT"
LEFT JOIN `analytics-data-mart.sandbox_user_robert_kruszewski.country_codes` t3 ON t1.geo_country = t3.name
group by 1,2,3
),

firebase_revenue as
(
SELECT country_code, geo_country, first_open_date, SUM(D1_revenue) as D1_Gross_Rev, SUM(D7_revenue) as D7_Gross_Rev, SUM(D14_revenue) D14_Gross_Rev, SUM(D30_revenue) as D30_Gross_Rev, SUM(D60_revenue) as D60_Gross_Rev, SUM(D90_revenue) as D90_Gross_Rev, SUM(D120_revenue) as D120_Gross_Rev, SUM(D150_revenue) as D150_Gross_Rev, SUM(D180_revenue) as D180_Gross_Rev, SUM(D270_revenue) as D270_Gross_Rev FROM
(
SELECT t1.country_code, geo_country, first_open_date, D1_revenue, D7_revenue, D14_revenue, D30_revenue, D60_revenue, D90_revenue, D120_revenue, D150_revenue, D180_revenue, D270_revenue FROM `landlord-real-estate-tycoon.analytics_153202519.daily_iap_arpu_new` t1
JOIN `analytics-data-mart.adm_appsflyer_reporting.google_ios_campaign_dates` t2 ON  t1.geo_country = t2.country AND platform = "IOS" AND  first_open_date >= t2.first_campaign_start AND t2.game = "LRT"
UNION ALL
SELECT t1.country_code, geo_country, first_open_date, D1_revenue, D7_revenue, D14_revenue, D30_revenue, D60_revenue, D90_revenue, D120_revenue, D150_revenue, D180_revenue, D270_revenue FROM `landlord-real-estate-tycoon.analytics_153202519.daily_ads_arpu_new` t1
JOIN `analytics-data-mart.adm_appsflyer_reporting.google_ios_campaign_dates` t2 ON  t1.geo_country = t2.country AND platform = "IOS" AND t1.first_open_date >= t2.first_campaign_start AND t2.game = "LRT"
) group by 1,2,3
)
SELECT firebase_installs.*, D1_Gross_Rev, D7_Gross_Rev, D14_Gross_Rev, D30_Gross_Rev, D60_Gross_Rev, D90_Gross_Rev, D120_Gross_Rev, D150_Gross_Rev, D180_Gross_Rev, D270_Gross_Rev FROM firebase_installs
LEFT JOIN firebase_revenue ON firebase_installs.country_code = firebase_revenue.country_code AND firebase_installs.first_open_date = firebase_revenue.first_open_date
)

SELECT COALESCE(daily_campaigns.country_code, usd_costs.country_code) as country_code, t3.name as new_campaign_name,  COALESCE(daily_campaigns.first_open_date, usd_costs.date) as install_date, installs, usd_costs.cost_usd, D1_Gross_Rev, D7_Gross_Rev, D14_Gross_Rev, D30_Gross_Rev, D60_Gross_Rev, D90_Gross_Rev, D120_Gross_Rev, D150_Gross_Rev, D180_Gross_Rev, D1_ret, D7_ret, D14_ret, D30_ret,D60_ret, D90_ret FROM daily_campaigns 
FULL OUTER JOIN usd_costs ON daily_campaigns.country_code = usd_costs.country_code AND daily_campaigns.first_open_date = usd_costs.date
LEFT JOIN `analytics-data-mart.sandbox_user_robert_kruszewski.country_codes` t3 ON daily_campaigns.country_code = t3.alpha_2
WHERE t3.name is not null
),


D180 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev,SUM(D14_Gross_Rev) as D14_Gross_Rev,SUM(D30_Gross_Rev) as D30_Gross_Rev,SUM(D60_Gross_Rev) as D60_Gross_Rev,SUM(D90_Gross_Rev) as D90_Gross_Rev, SUM(D120_Gross_Rev) as D120_Gross_Rev, SUM(D150_Gross_Rev) as D150_Gross_Rev, SUM(D180_Gross_Rev) as D180_Gross_Rev, SUM(D1_ret) as D1_ret, SUM(D7_ret) as D7_ret, SUM(D14_ret) as D14_ret, SUM(D30_ret) as D30_ret, SUM(D60_ret) as D60_ret, SUM(D90_ret) as D90_ret
FROM daily_campaigns_with_cost 
WHERE install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 181 DAY)
GROUP BY new_campaign_name
),


D150 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev,SUM(D14_Gross_Rev) as D14_Gross_Rev,SUM(D30_Gross_Rev) as D30_Gross_Rev,SUM(D60_Gross_Rev) as D60_Gross_Rev,SUM(D90_Gross_Rev) as D90_Gross_Rev, SUM(D120_Gross_Rev) as D120_Gross_Rev, SUM(D150_Gross_Rev) as D150_Gross_Rev, SUM(D1_ret) as D1_ret, SUM(D7_ret) as D7_ret, SUM(D14_ret) as D14_ret, SUM(D30_ret) as D30_ret, SUM(D60_ret) as D60_ret, SUM(D90_ret) as D90_ret
FROM daily_campaigns_with_cost 
WHERE install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 151 DAY)
GROUP BY new_campaign_name
),

D120 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev,SUM(D14_Gross_Rev) as D14_Gross_Rev,SUM(D30_Gross_Rev) as D30_Gross_Rev,SUM(D60_Gross_Rev) as D60_Gross_Rev,SUM(D90_Gross_Rev) as D90_Gross_Rev, SUM(D120_Gross_Rev) as D120_Gross_Rev, SUM(D1_ret) as D1_ret, SUM(D7_ret) as D7_ret, SUM(D14_ret) as D14_ret, SUM(D30_ret) as D30_ret, SUM(D60_ret) as D60_ret, SUM(D90_ret) as D90_ret
FROM daily_campaigns_with_cost 
WHERE install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 121 DAY)
GROUP BY new_campaign_name
),


D90 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev,SUM(D14_Gross_Rev) as D14_Gross_Rev,SUM(D30_Gross_Rev) as D30_Gross_Rev,SUM(D60_Gross_Rev) as D60_Gross_Rev,SUM(D90_Gross_Rev) as D90_Gross_Rev,SUM(D1_ret) as D1_ret, SUM(D7_ret) as D7_ret, SUM(D14_ret) as D14_ret, SUM(D30_ret) as D30_ret, SUM(D60_ret) as D60_ret, SUM(D90_ret) as D90_ret
FROM daily_campaigns_with_cost 
WHERE install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 91 DAY)
GROUP BY new_campaign_name
),

D60 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev,SUM(D14_Gross_Rev) as D14_Gross_Rev,SUM(D30_Gross_Rev) as D30_Gross_Rev,SUM(D60_Gross_Rev) as D60_Gross_Rev, SUM(D1_ret) as D1_ret, SUM(D7_ret) as D7_ret, SUM(D14_ret) as D14_ret, SUM(D30_ret) as D30_ret, SUM(D60_ret) as D60_ret
FROM daily_campaigns_with_cost 
WHERE install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 61 DAY)
GROUP BY new_campaign_name
),

D30 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev,SUM(D14_Gross_Rev) as D14_Gross_Rev,SUM(D30_Gross_Rev) as D30_Gross_Rev, SUM(D1_ret) as D1_ret, SUM(D7_ret) as D7_ret, SUM(D14_ret) as D14_ret, SUM(D30_ret) as D30_ret
FROM daily_campaigns_with_cost 
WHERE install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY)
GROUP BY new_campaign_name
),

D14 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev,SUM(D14_Gross_Rev) as D14_Gross_Rev, SUM(D1_ret) as D1_ret, SUM(D7_ret) as D7_ret, SUM(D14_ret) as D14_ret
FROM daily_campaigns_with_cost 
WHERE install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 15 DAY)
GROUP BY new_campaign_name
),

D7 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev, SUM(D1_ret) as D1_ret, SUM(D7_ret) as D7_ret
FROM daily_campaigns_with_cost 
WHERE install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY)
GROUP BY new_campaign_name
),

D1 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D1_ret) as D1_ret
FROM daily_campaigns_with_cost 
WHERE install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
GROUP BY new_campaign_name
),

daily_D1 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D1_ret) as D1_ret
FROM daily_campaigns_with_cost 
WHERE install_date = DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
GROUP BY new_campaign_name
),

weekly_D1 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D1_ret) as D1_ret
FROM daily_campaigns_with_cost 
WHERE install_date > DATE_SUB(CURRENT_DATE(), INTERVAL 9 DAY) AND install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
GROUP BY new_campaign_name
),

weekly_D7 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev, SUM(D7_ret) as D7_ret
FROM daily_campaigns_with_cost 
WHERE install_date > DATE_SUB(CURRENT_DATE(), INTERVAL 15 DAY) AND install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY)
GROUP BY new_campaign_name
),

weekly_D14 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev, SUM(D14_Gross_Rev) as D14_Gross_Rev, SUM(D14_ret) as D14_ret
FROM daily_campaigns_with_cost 
WHERE install_date > DATE_SUB(CURRENT_DATE(), INTERVAL 22 DAY) AND install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 15 DAY)
GROUP BY new_campaign_name
),

weekly_D30 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev, SUM(D14_Gross_Rev) as D14_Gross_Rev, SUM(D30_Gross_Rev) as D30_Gross_Rev, SUM(D30_ret) as D30_ret
FROM daily_campaigns_with_cost 
WHERE install_date > DATE_SUB(CURRENT_DATE(), INTERVAL 38 DAY) AND install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY)
GROUP BY new_campaign_name
),

monthly_D30 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev, SUM(D14_Gross_Rev) as D14_Gross_Rev, SUM(D30_Gross_Rev) as D30_Gross_Rev
FROM daily_campaigns_with_cost 
WHERE install_date > DATE_SUB(CURRENT_DATE(), INTERVAL 61 DAY) AND install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY)
GROUP BY new_campaign_name
),

monthly_D60 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev, SUM(D14_Gross_Rev) as D14_Gross_Rev, SUM(D30_Gross_Rev) as D30_Gross_Rev, SUM(D60_Gross_Rev) as D60_Gross_Rev
FROM daily_campaigns_with_cost 
WHERE install_date > DATE_SUB(CURRENT_DATE(), INTERVAL 91 DAY) AND install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 61 DAY)
GROUP BY new_campaign_name
),


monthly_D90 as
(
SELECT new_campaign_name, SUM(installs) as installs, SUM(cost_usd) as cohort_cost, SUM(D1_Gross_Rev) as D1_Gross_Rev, SUM(D7_Gross_Rev) as D7_Gross_Rev, SUM(D14_Gross_Rev) as D14_Gross_Rev, SUM(D30_Gross_Rev) as D30_Gross_Rev, SUM(D60_Gross_Rev) as D60_Gross_Rev, SUM(D90_Gross_Rev) as D90_Gross_Rev
FROM daily_campaigns_with_cost 
WHERE install_date > DATE_SUB(CURRENT_DATE(), INTERVAL 121 DAY) AND install_date <= DATE_SUB(CURRENT_DATE(), INTERVAL 91 DAY)
GROUP BY new_campaign_name
)

SELECT
D1.new_campaign_name,
daily_D1.installs,daily_D1.cohort_cost,daily_D1.D1_Gross_Rev as daily_D1_Rev, daily_D1.D1_Gross_Rev / NULLIF(daily_D1.cohort_cost,0) as daily_D1_ROAS, daily_D1.D1_ret / NULLIF(daily_D1.installs,0) as daily_D1_ret,
weekly_D1.installs,weekly_D1.cohort_cost,weekly_D1.D1_Gross_Rev as weekly_D1_Rev,weekly_D1.D1_Gross_Rev / NULLIF(weekly_D1.cohort_cost,0) as weekly_D1_ROAS, weekly_D1.D1_ret / NULLIF(weekly_D1.installs,0) as weekly_D1_ret,
weekly_D7.installs,weekly_D7.cohort_cost,weekly_D7.D7_Gross_Rev as weekly_D7_Rev, weekly_D7.D7_Gross_Rev / NULLIF(weekly_D7.cohort_cost,0) as weekly_D7_ROAS, weekly_D7.D7_ret / NULLIF(weekly_D7.installs,0) as weekly_D7_ret,
weekly_D14.installs,weekly_D14.cohort_cost,weekly_D14.D14_Gross_Rev as weekly_D14_Rev,weekly_D14.D14_Gross_Rev / NULLIF(weekly_D14.cohort_cost,0) as weekly_D14_ROAS, weekly_D14.D14_ret / NULLIF(weekly_D14.installs,0) as weekly_D14_ret,
weekly_D30.installs,weekly_D30.cohort_cost,weekly_D30.D30_Gross_Rev as weekly_D30_Rev,weekly_D30.D30_Gross_Rev / NULLIF(weekly_D30.cohort_cost,0) as weekly_D30_ROAS, weekly_D30.D30_ret / NULLIF(weekly_D30.installs,0) as weekly_D30_ret,
monthly_D30.installs,monthly_D30.cohort_cost,monthly_D30.D30_Gross_Rev as monthly_D30_Rev,monthly_D30.D30_Gross_Rev / NULLIF(monthly_D30.cohort_cost,0) as monthly_D30_ROAS,
monthly_D60.installs,monthly_D60.cohort_cost,monthly_D60.D60_Gross_Rev as monthly_D60_Rev,monthly_D60.D60_Gross_Rev / NULLIF(monthly_D60.cohort_cost,0) as monthly_D60_ROAS,
monthly_D90.installs,monthly_D90.cohort_cost,monthly_D90.D90_Gross_Rev as monthly_D90_Rev, monthly_D90.D90_Gross_Rev / NULLIF(monthly_D90.cohort_cost,0) as monthly_D90_ROAS,
D1.installs,D1.cohort_cost, D1.D1_Gross_Rev, D1.D1_Gross_Rev / NULLIF(D1.cohort_cost,0) as D1_D1_ROAS,
D7.installs,D7.cohort_cost, D7.D1_Gross_Rev, D7.D7_Gross_Rev, D7.D1_Gross_Rev / NULLIF(D7.cohort_cost,0) as D7_D1_ROAS, D7.D7_Gross_Rev / NULLIF(D7.cohort_cost,0) as D7_D7_ROAS,
D14.installs,D14.cohort_cost, D14.D1_Gross_Rev, D14.D7_Gross_Rev, D14.D14_Gross_Rev, D14.D1_Gross_Rev / NULLIF(D14.cohort_cost,0) as D14_D1_ROAS, D14.D7_Gross_Rev / NULLIF(D14.cohort_cost,0) as D14_D7_ROAS, D14.D14_Gross_Rev / NULLIF(D14.cohort_cost,0) as D14_D14_ROAS, 
D30.installs,D30.cohort_cost, D30.D1_Gross_Rev, D30.D7_Gross_Rev, D30.D14_Gross_Rev, D30.D30_Gross_Rev, D30.D1_Gross_Rev / NULLIF(D30.cohort_cost,0) as D30_D1_ROAS, D30.D7_Gross_Rev / NULLIF(D30.cohort_cost,0) as D30_D7_ROAS, D30.D14_Gross_Rev / NULLIF(D30.cohort_cost,0) as D30_D14_ROAS, D30.D30_Gross_Rev / NULLIF(D30.cohort_cost,0) as D30_D30_ROAS,
D60.installs,D60.cohort_cost, D60.D1_Gross_Rev, D60.D7_Gross_Rev, D60.D14_Gross_Rev, D60.D30_Gross_Rev, D60.D60_Gross_Rev, D60.D1_Gross_Rev / NULLIF(D60.cohort_cost,0) as D60_D1_ROAS, D60.D7_Gross_Rev / NULLIF(D60.cohort_cost,0) as D60_D7_ROAS, D60.D14_Gross_Rev / NULLIF(D60.cohort_cost,0) as D60_D14_ROAS, D60.D30_Gross_Rev / NULLIF(D60.cohort_cost,0) as D60_D30_ROAS, D60.D60_Gross_Rev / NULLIF(D60.cohort_cost,0) as D60_D60_ROAS,
D90.installs,D90.cohort_cost, D90.D1_Gross_Rev, D90.D7_Gross_Rev, D90.D14_Gross_Rev, D90.D30_Gross_Rev, D90.D60_Gross_Rev, D90.D90_Gross_Rev, D90.D1_Gross_Rev / NULLIF(D90.cohort_cost,0) as D90_D1_ROAS, D90.D7_Gross_Rev / NULLIF(D90.cohort_cost,0) as D90_D7_ROAS, D90.D14_Gross_Rev / NULLIF(D90.cohort_cost,0) as D90_D14_ROAS, D90.D30_Gross_Rev / NULLIF(D90.cohort_cost,0) as D90_D30_ROAS, D90.D60_Gross_Rev / NULLIF(D90.cohort_cost,0) as D90_D60_ROAS, D90.D90_Gross_Rev / NULLIF(D90.cohort_cost,0) as D90_D90_ROAS,
D120.installs,D120.cohort_cost, D120.D1_Gross_Rev, D120.D7_Gross_Rev, D120.D14_Gross_Rev, D120.D30_Gross_Rev, D120.D60_Gross_Rev, D120.D90_Gross_Rev, D120.D120_Gross_Rev, D120.D1_Gross_Rev / NULLIF(D120.cohort_cost,0) as D120_D1_ROAS, D120.D7_Gross_Rev / NULLIF(D120.cohort_cost,0) as D120_D7_ROAS, D120.D14_Gross_Rev / NULLIF(D120.cohort_cost,0) as D120_D14_ROAS, D120.D30_Gross_Rev / NULLIF(D120.cohort_cost,0) as D120_D30_ROAS, D120.D60_Gross_Rev / NULLIF(D120.cohort_cost,0) as D120_D60_ROAS, D120.D90_Gross_Rev / NULLIF(D120.cohort_cost,0) as D120_D90_ROAS, D120.D120_Gross_Rev / NULLIF(D120.cohort_cost,0) as D120_D120_ROAS,
D150.installs,D150.cohort_cost, D150.D1_Gross_Rev, D150.D7_Gross_Rev, D150.D14_Gross_Rev, D150.D30_Gross_Rev, D150.D60_Gross_Rev, D150.D90_Gross_Rev, D150.D120_Gross_Rev, D150.D150_Gross_Rev, D150.D1_Gross_Rev / NULLIF(D150.cohort_cost,0) as D150_D1_ROAS, D150.D7_Gross_Rev / NULLIF(D150.cohort_cost,0) as D150_D7_ROAS, D150.D14_Gross_Rev / NULLIF(D150.cohort_cost,0) as D150_D14_ROAS, D150.D30_Gross_Rev / NULLIF(D150.cohort_cost,0) as D150_D30_ROAS, D150.D60_Gross_Rev / NULLIF(D150.cohort_cost,0) as D150_D60_ROAS, D150.D90_Gross_Rev / NULLIF(D150.cohort_cost,0) as D150_D90_ROAS, D150.D120_Gross_Rev / NULLIF(D150.cohort_cost,0) as D150_D120_ROAS, D150.D150_Gross_Rev / NULLIF(D150.cohort_cost,0) as D150_D150_ROAS,
D180.installs,D180.cohort_cost, D180.D1_Gross_Rev, D180.D7_Gross_Rev, D180.D14_Gross_Rev, D180.D30_Gross_Rev, D180.D60_Gross_Rev, D180.D90_Gross_Rev, D180.D120_Gross_Rev, D180.D150_Gross_Rev, D180.D180_Gross_Rev, D180.D1_Gross_Rev / NULLIF(D180.cohort_cost,0) as D180_D1_ROAS, D180.D7_Gross_Rev / NULLIF(D180.cohort_cost,0) as D180_D7_ROAS, D180.D14_Gross_Rev / NULLIF(D180.cohort_cost,0) as D180_D14_ROAS, D180.D30_Gross_Rev / NULLIF(D180.cohort_cost,0) as D180_D30_ROAS, D180.D60_Gross_Rev / NULLIF(D180.cohort_cost,0) as D180_D60_ROAS, D180.D90_Gross_Rev / NULLIF(D180.cohort_cost,0) as D180_D90_ROAS, D180.D120_Gross_Rev / NULLIF(D180.cohort_cost,0) as D180_D120_ROAS, D180.D150_Gross_Rev / NULLIF(D180.cohort_cost,0) as D180_D150_ROAS, D180.D180_Gross_Rev / NULLIF(D180.cohort_cost,0) as D180_D180_ROAS,
D1.installs,D1.D1_ret / NULLIF(D1.installs,0) as D1_ret,
D7.installs,D7.D1_ret / NULLIF(D7.installs,0) as D1_ret, D7.D7_ret / NULLIF(D7.installs,0) as D7_ret,
D14.installs,D14.D1_ret / NULLIF(D14.installs,0) as D1_ret, D14.D7_ret / NULLIF(D14.installs,0) as D7_ret, D14.D14_ret / NULLIF(D14.installs,0) as D14_ret,
D30.installs,D30.D1_ret / NULLIF(D30.installs,0) as D1_ret, D30.D7_ret / NULLIF(D30.installs,0) as D7_ret, D30.D14_ret / NULLIF(D30.installs,0) as D14_ret, D30.D30_ret / NULLIF(D30.installs,0) as D30_ret,
D60.installs,D60.D1_ret / NULLIF(D60.installs,0) as D1_ret, D60.D7_ret / NULLIF(D60.installs,0) as D7_ret, D60.D14_ret / NULLIF(D60.installs,0) as D14_ret, D60.D30_ret / NULLIF(D60.installs,0) as D30_ret, D60.D60_ret / NULLIF(D60.installs,0) as D60_ret,
D90.installs,D90.D1_ret / NULLIF(D90.installs,0) as D1_ret, D90.D7_ret / NULLIF(D90.installs,0) as D7_ret, D90.D14_ret / NULLIF(D90.installs,0) as D14_ret, D90.D30_ret / NULLIF(D90.installs,0) as D30_ret, D90.D60_ret / NULLIF(D90.installs,0) as D60_ret, D90.D90_ret / NULLIF(D90.installs,0) as D90_ret,

FROM D1
LEFT JOIN D7 on D1.new_campaign_name = D7.new_campaign_name
LEFT JOIN D14 on D1.new_campaign_name = D14.new_campaign_name
LEFT JOIN D30 on D1.new_campaign_name = D30.new_campaign_name
LEFT JOIN D60 on D1.new_campaign_name = D60.new_campaign_name
LEFT JOIN D90 on D1.new_campaign_name = D90.new_campaign_name
LEFT JOIN D120 on D1.new_campaign_name = D120.new_campaign_name
LEFT JOIN D150 on D1.new_campaign_name = D150.new_campaign_name
LEFT JOIN D180 on D1.new_campaign_name = D180.new_campaign_name
LEFT JOIN daily_D1 on D1.new_campaign_name = daily_D1.new_campaign_name
LEFT JOIN weekly_D1 on D1.new_campaign_name = weekly_D1.new_campaign_name
LEFT JOIN weekly_D7 on D1.new_campaign_name = weekly_D7.new_campaign_name
LEFT JOIN weekly_D14 on D1.new_campaign_name = weekly_D14.new_campaign_name
LEFT JOIN weekly_D30 on D1.new_campaign_name = weekly_D30.new_campaign_name
LEFT JOIN monthly_D30 on D1.new_campaign_name = monthly_D30.new_campaign_name
LEFT JOIN monthly_D60 on D1.new_campaign_name = monthly_D60.new_campaign_name
LEFT JOIN monthly_D90 on D1.new_campaign_name = monthly_D90.new_campaign_name

ORDER BY weekly_D1.cohort_cost DESC